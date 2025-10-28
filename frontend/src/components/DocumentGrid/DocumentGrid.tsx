import clsx from 'clsx';
import { useMemo } from 'react';

import DocumentCard from './DocumentCard';
import { useDocumentBrowser } from './hooks';
import type { DocumentSummary, FolderSummary, Visibility } from './types';
import styles from './DocumentGrid.module.css';

export interface DocumentGridProps {
  accountId?: string;
  onPreview?: (document: DocumentSummary) => void;
  onDownload?: (document: DocumentSummary) => void;
  onChangeVisibility?: (document: DocumentSummary, visibility: Visibility) => void;
}

const DocumentGrid = ({ accountId, onPreview, onDownload, onChangeVisibility }: DocumentGridProps) => {
  const { documents, folders, loading, error, selectedFolder, setFolder } = useDocumentBrowser({
    accountId,
  });

  const folderOptions = useMemo<FolderSummary[]>(() => [{
    id: 'root',
    name: 'All documents',
    visibility: 'public',
    owner_account_id: accountId ?? 'anonymous',
    parent_id: null,
    category: 'folder',
    allowed_account_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, ...folders], [accountId, folders]);

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Documents</h2>
        <div className={styles.folderPicker}>
          <label htmlFor="folder-select" className={styles.metaLabel}>
            Folder
          </label>
          <select
            id="folder-select"
            className={styles.select}
            value={selectedFolder?.id ?? 'root'}
            onChange={(event) => {
              const next = event.target.value;
              setFolder(next === 'root' ? undefined : next);
            }}
          >
            {folderOptions.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {loading && <div className={styles.placeholder}>Loading documents…</div>}
      {error && <div className={clsx(styles.placeholder, styles.error)}>{error}</div>}

      {!loading && !error && documents.length === 0 && (
        <div className={styles.placeholder}>No documents found in this folder.</div>
      )}

      <div className={styles.grid}>
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onPreview={onPreview}
            onDownload={onDownload}
            onChangeVisibility={onChangeVisibility}
          />
        ))}
      </div>
    </section>
  );
};

export default DocumentGrid;
