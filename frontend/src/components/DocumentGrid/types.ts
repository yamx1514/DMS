export type Visibility = 'public' | 'restricted' | 'account_specific';

export type DocumentCategory =
  | 'id_document'
  | 'final_submission'
  | 'internal_work'
  | 'folder';

export interface DocumentVersion {
  number: number;
  file_path: string;
  file_name: string;
  uploaded_at: string;
  uploaded_by: string;
}

export interface DocumentSummary {
  id: string;
  name: string;
  category: DocumentCategory;
  visibility: Visibility;
  owner_account_id: string;
  file_name: string;
  folder_id?: string | null;
  description?: string | null;
  allowed_account_ids: string[];
  created_at: string;
  updated_at: string;
  versions: DocumentVersion[];
}

export interface FolderSummary {
  id: string;
  name: string;
  visibility: Visibility;
  owner_account_id: string;
  parent_id?: string | null;
  category: DocumentCategory;
  allowed_account_ids: string[];
  created_at: string;
  updated_at: string;
}
