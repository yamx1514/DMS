import { Reducer } from "react";

export interface SelectionState {
  selectedIds: Set<string>;
}

export type SelectionAction =
  | { type: "toggle"; id: string }
  | { type: "selectAll"; ids: string[] }
  | { type: "clear" }
  | { type: "set"; ids: string[] }
  | { type: "prune"; ids: string[] };

export const createInitialState = (
  initialSelected: string[] = []
): SelectionState => ({
  selectedIds: new Set(initialSelected),
});

export const selectionReducer: Reducer<SelectionState, SelectionAction> = (
  state,
  action
) => {
  switch (action.type) {
    case "toggle": {
      const next = new Set(state.selectedIds);
      if (next.has(action.id)) {
        next.delete(action.id);
      } else {
        next.add(action.id);
      }
      return { selectedIds: next };
    }
    case "selectAll": {
      return { selectedIds: new Set(action.ids) };
    }
    case "clear": {
      return { selectedIds: new Set() };
    }
    case "set": {
      return { selectedIds: new Set(action.ids) };
    }
    case "prune": {
      const available = new Set(action.ids);
      const next = new Set<string>();
      state.selectedIds.forEach((id) => {
        if (available.has(id)) {
          next.add(id);
        }
      });
      return { selectedIds: next };
    }
    default:
      return state;
  }
};

export const areAllSelected = (state: SelectionState, ids: string[]): boolean => {
  if (ids.length === 0) {
    return false;
  }
  return ids.every((id) => state.selectedIds.has(id));
};

export const getSelectedIds = (state: SelectionState): string[] => {
  return Array.from(state.selectedIds);
};
