import { DocumentPermissions, Visibility, AccountPermission, DomainRestriction } from '../types/permissions';

type Storage = Map<string, DocumentPermissions>;

const store: Storage = new Map();

function getOrCreate(documentId: string): DocumentPermissions {
  if (!store.has(documentId)) {
    store.set(documentId, {
      documentId,
      visibility: 'restricted',
      domains: [],
      accounts: [],
      auditTrail: []
    });
  }
  return store.get(documentId)!;
}

function updateAudit(documentId: string, changedBy: string, accounts: AccountPermission[]) {
  const permissions = getOrCreate(documentId);
  const timestamp = new Date().toISOString();
  accounts.forEach((account) => {
    permissions.auditTrail.unshift({
      accountId: account.accountId,
      email: account.email,
      permission: account.permission,
      updatedAt: timestamp,
      updatedBy: changedBy
    });
  });
  permissions.auditTrail = permissions.auditTrail.slice(0, 50);
}

export function getPermissions(documentId: string): DocumentPermissions {
  return getOrCreate(documentId);
}

export function setVisibility(documentId: string, visibility: Visibility, actorId: string): DocumentPermissions {
  const permissions = getOrCreate(documentId);
  permissions.visibility = visibility;
  if (visibility === 'public') {
    permissions.domains = [];
    permissions.accounts = [];
  }
  return permissions;
}

export function setDomainRestrictions(
  documentId: string,
  domains: DomainRestriction[],
  actorId: string
): DocumentPermissions {
  const permissions = getOrCreate(documentId);
  permissions.visibility = 'restricted';
  permissions.domains = domains;
  return permissions;
}

export function setAccountPermissions(
  documentId: string,
  accounts: AccountPermission[],
  actorId: string
): DocumentPermissions {
  const permissions = getOrCreate(documentId);
  permissions.visibility = 'account';
  permissions.accounts = accounts;
  updateAudit(documentId, actorId, accounts);
  return permissions;
}

export function removeAccountPermission(
  documentId: string,
  accountId: string,
  actorId: string
): DocumentPermissions {
  const permissions = getOrCreate(documentId);
  permissions.accounts = permissions.accounts.filter((account) => account.accountId !== accountId);
  updateAudit(documentId, actorId, permissions.accounts);
  return permissions;
}
