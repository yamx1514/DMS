import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ShareModal, { ShareModalProps } from '../ShareModal';
import {
  DocumentPermissionsResponse,
  updateVisibility,
  updateDomainRestrictions,
  updateAccountPermissions
} from '~/api/permissions';

jest.mock('~/api/permissions', () => {
  const actual = jest.requireActual('~/api/permissions');
  return {
    __esModule: true,
    ...actual,
    updateVisibility: jest.fn(),
    updateDomainRestrictions: jest.fn(),
    updateAccountPermissions: jest.fn(),
    removeAccountPermission: jest.fn()
  };
});

const basePermissions: DocumentPermissionsResponse = {
  documentId: 'doc-1',
  visibility: 'restricted',
  domains: [{ domain: 'example.com' }],
  accounts: [],
  auditTrail: []
};

const setup = (override: Partial<ShareModalProps> = {}) => {
  const props: ShareModalProps = {
    documentId: basePermissions.documentId,
    actorId: 'actor-1',
    isOpen: true,
    initialPermissions: basePermissions,
    mode: 'single',
    onClose: jest.fn(),
    onPermissionsUpdate: jest.fn(),
    ...override
  };

  render(<ShareModal {...props} />);
  return props;
};

describe('ShareModal', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('updates visibility to public when saving the public tab', async () => {
    (updateVisibility as jest.Mock).mockResolvedValue({
      ...basePermissions,
      visibility: 'public'
    });

    setup();

    fireEvent.click(screen.getByRole('button', { name: /public access/i }));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(updateVisibility).toHaveBeenCalledWith('doc-1', 'public', 'actor-1');
    });
  });

  it('validates restricted domain list before submitting', async () => {
    (updateDomainRestrictions as jest.Mock).mockResolvedValue(basePermissions);
    setup({ initialPermissions: { ...basePermissions, domains: [] } });

    fireEvent.click(screen.getByRole('button', { name: /restricted domains/i }));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/add at least one domain/i);
    expect(updateDomainRestrictions).not.toHaveBeenCalled();
  });

  it('applies optimistic account updates while awaiting server confirmation', async () => {
    const optimisticPermissions: DocumentPermissionsResponse = {
      ...basePermissions,
      visibility: 'account',
      accounts: [
        {
          accountId: 'temp-1',
          email: 'test@example.com',
          permission: 'edit'
        }
      ],
      auditTrail: []
    };

    (updateAccountPermissions as jest.Mock).mockImplementation(
      () =>
        new Promise<DocumentPermissionsResponse>((resolve) => {
          setTimeout(() => resolve(optimisticPermissions), 10);
        })
    );

    const props = setup();

    fireEvent.click(screen.getByRole('button', { name: /specific collaborators/i }));

    const emailInput = screen.getByPlaceholderText(/search teammates by email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const permissionSelect = screen.getByDisplayValue(/can view/i);
    fireEvent.change(permissionSelect, { target: { value: 'edit' } });

    fireEvent.click(screen.getByRole('button', { name: '+' }));

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    await waitFor(() => {
      expect(updateAccountPermissions).toHaveBeenCalledWith(
        'doc-1',
        expect.arrayContaining([
          expect.objectContaining({ email: 'test@example.com', permission: 'edit' })
        ]),
        'actor-1'
      );
    });

    await waitFor(() => {
      expect(props.onPermissionsUpdate).toHaveBeenCalledWith(optimisticPermissions);
    });
  });
});
