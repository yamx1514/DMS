export type Visibility = 'public' | 'restricted' | 'account';

export interface DomainRestriction {
  domain: string;
}

export type PermissionLevel = 'read' | 'comment' | 'edit';

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

export interface DocumentPermissions {
  documentId: string;
  visibility: Visibility;
  domains: DomainRestriction[];
  accounts: AccountPermission[];
  auditTrail: CollaboratorAuditEntry[];
}
