import React from "react";
import { useDocumentSelection } from "./SelectionContext";

export interface DocumentToolbarProps {
  onDelete?: (ids: string[]) => void;
  onMove?: (ids: string[]) => void;
  onShare?: (ids: string[]) => void;
  isProcessing?: boolean;
}

const DocumentToolbar: React.FC<DocumentToolbarProps> = ({
  onDelete,
  onMove,
  onShare,
  isProcessing = false,
}) => {
  const { selectedIds, dispatch } = useDocumentSelection();
  const hasSelection = selectedIds.length > 0;

  const handleAction = (handler?: (ids: string[]) => void) => () => {
    if (!handler || !hasSelection) {
      return;
    }
    handler(selectedIds);
  };

  return (
    <div className="document-toolbar" aria-label="Document toolbar">
      <div className="document-toolbar__selection">
        {hasSelection ? (
          <>
            <span>{selectedIds.length} selected</span>
            <button
              type="button"
              onClick={() => dispatch({ type: "clear" })}
              className="document-toolbar__clear"
            >
              Clear
            </button>
          </>
        ) : (
          <span>No documents selected</span>
        )}
      </div>
      <div className="document-toolbar__actions">
        <button
          type="button"
          onClick={handleAction(onDelete)}
          disabled={!hasSelection || isProcessing}
        >
          Delete
        </button>
        <button
          type="button"
          onClick={handleAction(onMove)}
          disabled={!hasSelection || isProcessing}
        >
          Move
        </button>
        <button
          type="button"
          onClick={handleAction(onShare)}
          disabled={!hasSelection || isProcessing}
        >
          Share
        </button>
      </div>
    </div>
  );
};

export default DocumentToolbar;
