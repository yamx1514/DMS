import {
  SelectionState,
  createInitialState,
  selectionReducer,
} from "../selectionReducer";

describe("selectionReducer", () => {
  const buildState = (ids: string[] = []): SelectionState =>
    createInitialState(ids);

  it("toggles a document id", () => {
    const initial = buildState();
    const toggled = selectionReducer(initial, { type: "toggle", id: "1" });
    expect(Array.from(toggled.selectedIds)).toEqual(["1"]);

    const untoggled = selectionReducer(toggled, { type: "toggle", id: "1" });
    expect(Array.from(untoggled.selectedIds)).toEqual([]);
  });

  it("selects all provided ids", () => {
    const initial = buildState();
    const next = selectionReducer(initial, {
      type: "selectAll",
      ids: ["1", "2", "3"],
    });
    expect(Array.from(next.selectedIds)).toEqual(["1", "2", "3"]);
  });

  it("clears selection", () => {
    const initial = buildState(["1", "2"]);
    const next = selectionReducer(initial, { type: "clear" });
    expect(Array.from(next.selectedIds)).toEqual([]);
  });

  it("sets selection to provided ids", () => {
    const initial = buildState(["1"]);
    const next = selectionReducer(initial, {
      type: "set",
      ids: ["2", "3"],
    });
    expect(Array.from(next.selectedIds)).toEqual(["2", "3"]);
  });

  it("prunes selection when ids change", () => {
    const initial = buildState(["1", "2", "3"]);
    const next = selectionReducer(initial, {
      type: "prune",
      ids: ["2", "3", "4"],
    });
    expect(Array.from(next.selectedIds)).toEqual(["2", "3"]);
  });
});
