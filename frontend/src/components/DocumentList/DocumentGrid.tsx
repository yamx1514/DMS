import React from "react";
import { useDropzone } from "react-dropzone";
import { useDocumentSelection } from "./SelectionContext";
import { DocumentListItem, UploadProgressItem } from "./DocumentList";

export interface DocumentGridProps {
  documents: DocumentListItem[];
  onOpenDocument?: (id: string) => void;
  onDropFiles?: (files: File[]) => void;
  uploadProgress?: UploadProgressItem[];
}

const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents,
  onOpenDocument,
  onDropFiles,
  uploadProgress = [],
}) => {
  const { state, dispatch } = useDocumentSelection();

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    noClick: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length && onDropFiles) {
        onDropFiles(acceptedFiles);
      }
    },
  });

  return (
    <div className="document-grid" {...getRootProps()}>
      <input {...getInputProps()} />
      <div
        className={`document-grid__dropzone${
          isDragActive ? " document-grid__dropzone--active" : ""
        }`}
      >
        {isDragActive ? "Drop files to upload" : "Drag files here or"}{" "}
        <button type="button" onClick={open}>
          Browse
        </button>
      </div>
      <div className="document-grid__items">
        {documents.map((document) => {
          const selected = state.selectedIds.has(document.id);
          return (
            <div
              key={document.id}
              className={`document-grid__card${selected ? " selected" : ""}`}
            >
              <label className="document-grid__checkbox">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => dispatch({ type: "toggle", id: document.id })}
                  aria-label={`Select ${document.name}`}
                />
                <span className="document-grid__checkbox-visual" />
              </label>
              <button
                type="button"
                className="document-grid__content"
                onClick={() => onOpenDocument?.(document.id)}
              >
                <span className="document-grid__title">{document.name}</span>
                {document.description && (
                  <span className="document-grid__description">
                    {document.description}
                  </span>
                )}
                {document.updatedAt && (
                  <span className="document-grid__meta">{document.updatedAt}</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
      {uploadProgress.length > 0 && (
        <div className="document-grid__uploads" aria-live="polite">
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

export default DocumentGrid;
