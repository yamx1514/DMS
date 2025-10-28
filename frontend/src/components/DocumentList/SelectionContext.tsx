import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  SelectionAction,
  SelectionState,
  areAllSelected,
  createInitialState,
  getSelectedIds,
  selectionReducer,
} from "./selectionReducer";

interface DocumentSelectionContextValue {
  state: SelectionState;
  dispatch: React.Dispatch<SelectionAction>;
  selectedIds: string[];
  allSelected: (ids: string[]) => boolean;
}

const DocumentSelectionContext =
  createContext<DocumentSelectionContextValue | null>(null);

export interface DocumentSelectionProviderProps extends PropsWithChildren {
  documentIds: string[];
  initialSelectedIds?: string[];
}

export const DocumentSelectionProvider: React.FC<
  DocumentSelectionProviderProps
> = ({ documentIds, initialSelectedIds, children }) => {
  const [state, dispatch] = useReducer(
    selectionReducer,
    createInitialState(initialSelectedIds)
  );

  useEffect(() => {
    dispatch({ type: "prune", ids: documentIds });
  }, [documentIds]);

  const value = useMemo<DocumentSelectionContextValue>(
    () => ({
      state,
      dispatch,
      selectedIds: getSelectedIds(state),
      allSelected: (ids: string[]) => areAllSelected(state, ids),
    }),
    [state]
  );

  return (
    <DocumentSelectionContext.Provider value={value}>
      {children}
    </DocumentSelectionContext.Provider>
  );
};

export const useDocumentSelection = (): DocumentSelectionContextValue => {
  const context = useContext(DocumentSelectionContext);
  if (!context) {
    throw new Error(
      "useDocumentSelection must be used within a DocumentSelectionProvider"
    );
  }
  return context;
};
