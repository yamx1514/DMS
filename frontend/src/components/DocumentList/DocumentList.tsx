import React, { useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { useDocumentSelection } from "./SelectionContext";

export interface DocumentListItem {
  id: string;
  name: string;
  updatedAt?: string;
  size?: number;
  description?: string;
}

export interface UploadProgressItem {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
}

export interface DocumentListProps {
  documents: DocumentListItem[];
  onOpenDocument?: (id: string) => void;
  onDropFiles?: (files: File[]) => void;
  uploadProgress?: UploadProgressItem[];
}

const formatSize = (size?: number) => {
  if (size === undefined || size === null) {
    return "-";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onOpenDocument,
  onDropFiles,
  uploadProgress = [],
}) => {
  const { state, dispatch, allSelected } = useDocumentSelection();
  const documentIds = useMemo(() => documents.map((doc) => doc.id), [documents]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    noClick: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length && onDropFiles) {
        onDropFiles(acceptedFiles);
      }
    },
  });

  const handleSelectAll = () => {
    if (allSelected(documentIds)) {
      dispatch({ type: "clear" });
    } else {
      dispatch({ type: "selectAll", ids: documentIds });
    }
  };

  return (
    <div className="document-list" {...getRootProps()}>
      <input {...getInputProps()} />
      <div className="document-list__header">
        <div className="document-list__select">
          <input
            type="checkbox"
            checked={allSelected(documentIds)}
            onChange={handleSelectAll}
            aria-label="Select all documents"
          />
        </div>
        <div className="document-list__name">Name</div>
        <div className="document-list__updated">Last updated</div>
        <div className="document-list__size">Size</div>
      </div>
      <div
        className={`document-list__dropzone${
          isDragActive ? " document-list__dropzone--active" : ""
        }`}
      >
        {isDragActive ? "Drop files to upload" : "Drag and drop files here"}
        <button type="button" onClick={open}>
          Browse
        </button>
      </div>
      <ul className="document-list__items">
        {documents.map((document) => {
          const selected = state.selectedIds.has(document.id);
          return (
            <li key={document.id} className={selected ? "selected" : ""}>
              <div className="document-list__select">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() =>
                    dispatch({ type: "toggle", id: document.id })
                  }
                  aria-label={`Select ${document.name}`}
                />
              </div>
              <button
                type="button"
                className="document-list__name"
                onClick={() => onOpenDocument?.(document.id)}
              >
                <span className="document-list__title">{document.name}</span>
                {document.description && (
                  <span className="document-list__description">
                    {document.description}
                  </span>
                )}
              </button>
              <div className="document-list__updated">
                {document.updatedAt || "-"}
              </div>
              <div className="document-list__size">{formatSize(document.size)}</div>
            </li>
          );
        })}
      </ul>
      {uploadProgress.length > 0 && (
        <div className="document-list__uploads" aria-live="polite">
          <h4>Uploads</h4>
          <ul>
            {uploadProgress.map((upload) => (
              <li key={upload.id} className={`status-${upload.status}`}>
                <span>{upload.name}</span>
                <progress value={upload.progress} max={100} />
                {upload.status === "error" && upload.errorMessage && (
                  <span className="error">{upload.errorMessage}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
