import React, { useMemo, useState } from "react";
import {
  DocumentGrid,
  DocumentList,
  DocumentSelectionProvider,
  DocumentToolbar,
  DocumentListItem,
} from "../components/DocumentList";
import { useDocumentUpload } from "../hooks/useDocumentUpload";

export type DocumentViewMode = "list" | "grid";

export interface DocumentsPageProps {
  documents?: DocumentListItem[];
  initialViewMode?: DocumentViewMode;
  onDeleteDocuments?: (ids: string[]) => void;
  onMoveDocuments?: (ids: string[]) => void;
  onShareDocuments?: (ids: string[]) => void;
  onOpenDocument?: (id: string) => void;
  uploadHandler?: (
    file: File,
    onProgress: (progress: number) => void
  ) => Promise<void> | void;
}

const ViewModeToggle: React.FC<{ value: DocumentViewMode; onChange: (mode: DocumentViewMode) => void; }> = ({
  value,
  onChange,
}) => (
  <div className="documents-page__view-toggle" role="radiogroup" aria-label="Toggle document layout">
    <label>
      <input
        type="radio"
        name="view-mode"
        value="list"
        checked={value === "list"}
        onChange={() => onChange("list")}
      />
      List
    </label>
    <label>
      <input
        type="radio"
        name="view-mode"
        value="grid"
        checked={value === "grid"}
        onChange={() => onChange("grid")}
      />
      Grid
    </label>
  </div>
);

const DocumentsPage: React.FC<DocumentsPageProps> = ({
  documents: documentsProp = [],
  initialViewMode = "list",
  onDeleteDocuments,
  onMoveDocuments,
  onShareDocuments,
  onOpenDocument,
  uploadHandler,
}) => {
  const [viewMode, setViewMode] = useState<DocumentViewMode>(initialViewMode);
  const [documents, setDocuments] = useState<DocumentListItem[]>(documentsProp);

  const { uploadFiles, uploadProgress } = useDocumentUpload(uploadHandler);

  const documentIds = useMemo(() => documents.map((doc) => doc.id), [documents]);

  const handleDelete = (ids: string[]) => {
    onDeleteDocuments?.(ids);
    setDocuments((prev) => prev.filter((doc) => !ids.includes(doc.id)));
  };

  const handleMove = (ids: string[]) => {
    onMoveDocuments?.(ids);
  };

  const handleShare = (ids: string[]) => {
    onShareDocuments?.(ids);
  };

  return (
    <div className="documents-page">
      <ViewModeToggle value={viewMode} onChange={setViewMode} />
      <DocumentSelectionProvider documentIds={documentIds}>
        <DocumentToolbar
          onDelete={handleDelete}
          onMove={handleMove}
          onShare={handleShare}
        />
        {viewMode === "list" ? (
          <DocumentList
            documents={documents}
            onOpenDocument={onOpenDocument}
            onDropFiles={uploadFiles}
            uploadProgress={uploadProgress}
          />
        ) : (
          <DocumentGrid
            documents={documents}
            onOpenDocument={onOpenDocument}
            onDropFiles={uploadFiles}
            uploadProgress={uploadProgress}
          />
        )}
      </DocumentSelectionProvider>
    </div>
  );
};

export default DocumentsPage;
