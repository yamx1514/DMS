import clsx from 'clsx';
import { useMemo } from 'react';

import type { DocumentSummary, Visibility } from './types';
import styles from './DocumentGrid.module.css';
import VisibilityBadge from './VisibilityBadge';

export interface DocumentCardProps {
  document: DocumentSummary;
  onPreview?: (document: DocumentSummary) => void;
  onDownload?: (document: DocumentSummary) => void;
  onChangeVisibility?: (document: DocumentSummary, visibility: Visibility) => void;
}

const ICONS: Record<DocumentSummary['category'], string> = {
  id_document: '🪪',
  final_submission: '📄',
  internal_work: '🗂️',
  folder: '📁',
};

const DocumentCard = ({ document, onPreview, onDownload, onChangeVisibility }: DocumentCardProps) => {
  const latestVersion = useMemo(() => document.versions.at(-1), [document.versions]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.icon}>{ICONS[document.category]}</span>
        <div className={styles.title}>{document.name}</div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Visibility</span>
          <div className={styles.visibilityPicker}>
            <VisibilityBadge visibility={document.visibility} />
            <select
              className={styles.select}
              value={document.visibility}
              onChange={(event) =>
                onChangeVisibility?.(document, event.target.value as Visibility)
              }
            >
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
              <option value="account_specific">Account specific</option>
            </select>
          </div>
        </div>
        {document.description && (
          <p className={styles.description}>{document.description}</p>
        )}
        {latestVersion && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Last updated</span>
            <span className={styles.metaValue}>
              {new Date(latestVersion.uploaded_at).toLocaleString()} by {latestVersion.uploaded_by}
            </span>
          </div>
        )}
      </div>
      <div className={styles.cardFooter}>
        <button
          type="button"
          className={clsx(styles.cardButton, styles.previewButton)}
          onClick={() => onPreview?.(document)}
        >
          Preview
        </button>
        <button
          type="button"
          className={clsx(styles.cardButton, styles.downloadButton)}
          onClick={() => onDownload?.(document)}
        >
          Download
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;
