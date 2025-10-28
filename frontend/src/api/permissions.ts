import { request } from '~/utils/apiClient';

export type Visibility = 'public' | 'restricted' | 'account';
export type PermissionLevel = 'read' | 'comment' | 'edit';

export interface DomainRestriction {
  domain: string;
}

export interface AccountPermission {
  accountId: string;
  email: string;
  permission: PermissionLevel;
}

export interface CollaboratorAuditEntry {
  accountId: string;
  email: string;
  permission: PermissionLevel;
  updatedAt: string;
  updatedBy: string;
}

export interface DocumentPermissionsResponse {
  documentId: string;
  visibility: Visibility;
  domains: DomainRestriction[];
  accounts: AccountPermission[];
  auditTrail: CollaboratorAuditEntry[];
}

export async function fetchDocumentPermissions(documentId: string) {
  return request<DocumentPermissionsResponse>(`/api/permissions/${documentId}`);
}

export async function updateVisibility(documentId: string, visibility: Visibility, actorId: string) {
  return request<DocumentPermissionsResponse>(`/api/permissions/${documentId}/visibility`, {
    method: 'POST',
    body: { visibility, actorId }
  });
}

export async function updateDomainRestrictions(
  documentId: string,
  domains: DomainRestriction[],
  actorId: string
) {
  return request<DocumentPermissionsResponse>(`/api/permissions/${documentId}/domains`, {
    method: 'POST',
    body: { domains, actorId }
  });
}

export async function updateAccountPermissions(
  documentId: string,
  accounts: AccountPermission[],
  actorId: string
) {
  return request<DocumentPermissionsResponse>(`/api/permissions/${documentId}/accounts`, {
    method: 'POST',
    body: { accounts, actorId }
  });
}

export async function removeAccountPermission(documentId: string, accountId: string, actorId: string) {
  return request<DocumentPermissionsResponse>(`/api/permissions/${documentId}/accounts/${accountId}`, {
    method: 'DELETE',
    body: { actorId }
  });
}
