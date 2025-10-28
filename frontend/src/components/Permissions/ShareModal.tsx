import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AccountPermission,
  CollaboratorAuditEntry,
  DocumentPermissionsResponse,
  PermissionLevel,
  Visibility,
  removeAccountPermission as removeAccountPermissionRequest,
  updateAccountPermissions,
  updateDomainRestrictions,
  updateVisibility
} from '~/api/permissions';
import { t } from '~/i18n/strings';

type TabKey = Visibility;

type ShareModalMode = 'single' | 'bulk';

const ALL_TABS: TabKey[] = ['public', 'restricted', 'account'];

const permissionLabels: Record<PermissionLevel, string> = {
  read: t('permissions.shareModal.permission.read'),
  comment: t('permissions.shareModal.permission.comment'),
  edit: t('permissions.shareModal.permission.edit')
};

export interface ShareModalProps {
  documentId: string;
  actorId: string;
  isOpen: boolean;
  mode?: ShareModalMode;
  initialPermissions: DocumentPermissionsResponse;
  onClose: () => void;
  onPermissionsUpdate?: (permissions: DocumentPermissionsResponse) => void;
}

interface LocalState extends DocumentPermissionsResponse {
  optimistic?: boolean;
}

const EMPTY_PERMISSIONS: DocumentPermissionsResponse = {
  documentId: '',
  visibility: 'restricted',
  domains: [],
  accounts: [],
  auditTrail: []
};

const getDefaultState = (
  permissions: DocumentPermissionsResponse | undefined,
  documentId: string
): LocalState => ({
  ...(permissions ?? { ...EMPTY_PERMISSIONS, documentId }),
  documentId
});

const cloneState = (state: LocalState): LocalState => ({
  ...state,
  domains: state.domains.map((domain) => ({ ...domain })),
  accounts: state.accounts.map((account) => ({ ...account })),
  auditTrail: state.auditTrail.map((entry) => ({ ...entry }))
});

const isValidDomain = (value: string) => value.trim().length > 0 && value.includes('.');
const normaliseDomain = (value: string) => value.trim().replace(/^@/, '').toLowerCase();
const isValidEmail = (value: string) => /.+@.+\..+/.test(value);

export const ShareModal: React.FC<ShareModalProps> = ({
  documentId,
  actorId,
  initialPermissions,
  isOpen,
  mode = 'single',
  onClose,
  onPermissionsUpdate
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('public');
  const [localPermissions, setLocalPermissions] = useState<LocalState>(() =>
    getDefaultState(initialPermissions, documentId)
  );
  const [domainInput, setDomainInput] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPermission, setAccountPermission] = useState<PermissionLevel>('read');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setLocalPermissions(getDefaultState(initialPermissions, documentId));
    setActiveTab(initialPermissions.visibility);
    setError(null);
  }, [documentId, initialPermissions, isOpen]);

  const optimisticUpdate = useCallback((updater: (current: LocalState) => LocalState): void => {
    setLocalPermissions((current) => {
      const next = updater(current);
      return { ...next, optimistic: true };
    });
  }, []);

  const commitUpdate = useCallback(
    (permissions: DocumentPermissionsResponse) => {
      setLocalPermissions({ ...permissions, optimistic: false });
      onPermissionsUpdate?.(permissions);
    },
    [onPermissionsUpdate]
  );

  const rollbackUpdate = useCallback((previous: LocalState) => {
    setLocalPermissions({ ...previous, optimistic: false });
  }, []);

  const handlePublicSubmit = async () => {
    const previous = cloneState(localPermissions);
    const optimistic = { ...localPermissions, visibility: 'public', domains: [], accounts: [] };
    setError(null);
    optimisticUpdate(() => optimistic);
    setIsSaving(true);
    try {
      const updated = await updateVisibility(documentId, 'public', actorId);
      commitUpdate(updated);
    } catch (err) {
      rollbackUpdate(previous);
      setError(t('permissions.shareModal.error.generic'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDomainSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const domains = localPermissions.domains.filter((domain) => domain.domain);
    if (!domains.length) {
      setError(t('permissions.shareModal.validation.domainRequired'));
      return;
    }
    const previous = cloneState(localPermissions);
    const optimistic = { ...localPermissions, visibility: 'restricted', domains };
    setError(null);
    optimisticUpdate(() => optimistic);
    setIsSaving(true);
    try {
      const updated = await updateDomainRestrictions(documentId, domains, actorId);
      commitUpdate(updated);
    } catch (err) {
      rollbackUpdate(previous);
      setError(t('permissions.shareModal.error.generic'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAccountSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!localPermissions.accounts.length) {
      setError(t('permissions.shareModal.validation.accountRequired'));
      return;
    }
    const previous = cloneState(localPermissions);
    const optimistic = { ...localPermissions, visibility: 'account' as Visibility };
    setError(null);
    optimisticUpdate(() => optimistic);
    setIsSaving(true);
    try {
      const updated = await updateAccountPermissions(documentId, localPermissions.accounts, actorId);
      commitUpdate(updated);
    } catch (err) {
      rollbackUpdate(previous);
      setError(t('permissions.shareModal.error.generic'));
    } finally {
      setIsSaving(false);
    }
  };

  const addDomain = useCallback(() => {
    if (!isValidDomain(domainInput)) {
      setError(t('permissions.shareModal.validation.domainRequired'));
      return;
    }
    setError(null);
    const newDomain = normaliseDomain(domainInput);
    setLocalPermissions((current) => {
      const exists = current.domains.some((domain) => domain.domain === newDomain);
      if (exists) {
        return current;
      }
      return {
        ...current,
        domains: [...current.domains, { domain: newDomain }]
      };
    });
    setDomainInput('');
  }, [domainInput]);

  const removeDomain = useCallback((value: string) => {
    setLocalPermissions((current) => ({
      ...current,
      domains: current.domains.filter((domain) => domain.domain !== value)
    }));
  }, []);

  const addAccount = useCallback(() => {
    if (!isValidEmail(accountEmail)) {
      setError(t('permissions.shareModal.validation.accountRequired'));
      return;
    }
    setError(null);
    const email = accountEmail.trim().toLowerCase();
    const accountId = `temp-${Date.now()}`;
    const account: AccountPermission = { accountId, email, permission: accountPermission };
    setLocalPermissions((current) => {
      const existingIndex = current.accounts.findIndex((item) => item.email === email);
      const accounts = [...current.accounts];
      if (existingIndex >= 0) {
        accounts[existingIndex] = account;
      } else {
        accounts.push(account);
      }
      return { ...current, accounts };
    });
    setAccountEmail('');
  }, [accountEmail, accountPermission]);

  const updateAccountPermission = useCallback((accountId: string, permission: PermissionLevel) => {
    setLocalPermissions((current) => ({
      ...current,
      accounts: current.accounts.map((account) =>
        account.accountId === accountId ? { ...account, permission } : account
      )
    }));
  }, []);

  const handleRemoveAccount = useCallback(
    async (accountId: string) => {
      const previous = cloneState(localPermissions);
      const optimistic = {
        ...localPermissions,
        accounts: localPermissions.accounts.filter((account) => account.accountId !== accountId)
      };
      setError(null);
      optimisticUpdate(() => optimistic);
      setIsSaving(true);
      try {
        const updated = await removeAccountPermissionRequest(documentId, accountId, actorId);
        commitUpdate(updated);
      } catch (err) {
        rollbackUpdate(previous);
        setError(t('permissions.shareModal.error.generic'));
      } finally {
        setIsSaving(false);
      }
    },
    [actorId, commitUpdate, documentId, localPermissions, optimisticUpdate, rollbackUpdate]
  );

  const openForAccountEdit = useCallback((account: AccountPermission) => {
    setActiveTab('account');
    setAccountEmail(account.email);
    setAccountPermission(account.permission);
  }, []);

  const auditTrail = useMemo(() => localPermissions.auditTrail, [localPermissions.auditTrail]);

  if (!isOpen) {
    return null;
  }

  const modalTitle = mode === 'bulk'
    ? t('permissions.shareModal.bulkTitle')
    : t('permissions.shareModal.title');

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="share-modal-title" className="share-modal">
      <div className="share-modal__backdrop" onClick={onClose} data-testid="share-modal-backdrop" />
      <div className="share-modal__content">
        <header className="share-modal__header">
          <h2 id="share-modal-title">{modalTitle}</h2>
          <button type="button" onClick={onClose} aria-label={t('permissions.shareModal.cancel')}>
            ×
          </button>
        </header>
        <div className="share-modal__tabs">
          <nav aria-label="Share options">
            <ul>
              {ALL_TABS.map((tab) => (
                <li key={tab}>
                  <button
                    type="button"
                    className={tab === activeTab ? 'active' : ''}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'public' && t('permissions.shareModal.publicTabLabel')}
                    {tab === 'restricted' && t('permissions.shareModal.restrictedTabLabel')}
                    {tab === 'account' && t('permissions.shareModal.accountTabLabel')}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <section className="share-modal__tab-body">
            {activeTab === 'public' && (
              <div>
                <p>{t('permissions.shareModal.publicDescription')}</p>
                <button type="button" onClick={handlePublicSubmit} disabled={isSaving}>
                  {t('permissions.shareModal.save')}
                </button>
              </div>
            )}
            {activeTab === 'restricted' && (
              <form onSubmit={handleDomainSubmit}>
                <p>{t('permissions.shareModal.restrictedDescription')}</p>
                <div>
                  <input
                    placeholder={t('permissions.shareModal.addDomainPlaceholder')}
                    value={domainInput}
                    onChange={(event) => setDomainInput(event.target.value)}
                  />
                  <button type="button" onClick={addDomain}>
                    +
                  </button>
                </div>
                <ul>
                  {localPermissions.domains.map((domain) => (
                    <li key={domain.domain}>
                      {domain.domain}{' '}
                      <button type="button" onClick={() => removeDomain(domain.domain)}>
                        {t('permissions.shareModal.remove')}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="share-modal__actions">
                  <button type="button" onClick={onClose}>
                    {t('permissions.shareModal.cancel')}
                  </button>
                  <button type="submit" disabled={isSaving}>
                    {t('permissions.shareModal.save')}
                  </button>
                </div>
              </form>
            )}
            {activeTab === 'account' && (
              <form onSubmit={handleAccountSubmit}>
                <p>{t('permissions.shareModal.accountDescription')}</p>
                <div className="share-modal__account-form">
                  <input
                    aria-label={t('permissions.shareModal.addAccountPlaceholder')}
                    placeholder={t('permissions.shareModal.addAccountPlaceholder')}
                    value={accountEmail}
                    onChange={(event) => setAccountEmail(event.target.value)}
                  />
                  <select
                    value={accountPermission}
                    onChange={(event) => setAccountPermission(event.target.value as PermissionLevel)}
                  >
                    {Object.entries(permissionLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={addAccount}>
                    +
                  </button>
                </div>
                <ul>
                  {localPermissions.accounts.map((account) => (
                    <li key={account.accountId}>
                      <div className="share-modal__account-row">
                        <span>{account.email}</span>
                        <select
                          aria-label={`${account.email}-permission`}
                          value={account.permission}
                          onChange={(event) =>
                            updateAccountPermission(account.accountId, event.target.value as PermissionLevel)
                          }
                        >
                          {Object.entries(permissionLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <div className="share-modal__account-actions">
                          <button type="button" onClick={() => openForAccountEdit(account)}>
                            {t('permissions.shareModal.edit')}
                          </button>
                          <button type="button" onClick={() => handleRemoveAccount(account.accountId)}>
                            {t('permissions.shareModal.remove')}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="share-modal__actions">
                  <button type="button" onClick={onClose}>
                    {t('permissions.shareModal.cancel')}
                  </button>
                  <button type="submit" disabled={isSaving}>
                    {t('permissions.shareModal.save')}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
        {error && <p role="alert" className="share-modal__error">{error}</p>}
        <section className="share-modal__audit">
          <h3>{t('permissions.shareModal.auditTitle')}</h3>
          {auditTrail.length === 0 ? (
            <p>{t('permissions.shareModal.auditEmpty')}</p>
          ) : (
            <ul>
              {auditTrail.map((entry: CollaboratorAuditEntry) => (
                <li key={`${entry.accountId}-${entry.updatedAt}`}>
                  <span>{entry.email}</span> • <span>{permissionLabels[entry.permission]}</span> •{' '}
                  <span>{new Date(entry.updatedAt).toLocaleString()}</span> •{' '}
                  <span>{entry.updatedBy}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default ShareModal;
