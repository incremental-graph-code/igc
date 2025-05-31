import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from 'zustand/shallow';
import { createFileSlice, FileSliceState } from "./slices/file";
import { createDefaultSlice, DefaultSliceState } from "./slices/default";
import { createNavIndicatorsSlice, NavIndicatorsSliceState } from "./slices/navIndicators";
import { createFileNavigatorSlice, FileNavigatorSliceState } from "./slices/fileNavigator";
import { createGraphSlice, GraphSliceState } from "./slices/graph";
import { createSnippetSlice, SnippetSliceState } from "./slices/snippet";

export type State = DefaultSliceState & FileSliceState & NavIndicatorsSliceState & FileNavigatorSliceState & GraphSliceState & SnippetSliceState;

// Helper types for Zustand's set and get functions
export type SetState = (fn: (state: State) => Partial<State>) => void;
export type GetState = () => State;

const useStore = createWithEqualityFn<State>((set, get) => ({
	...createDefaultSlice(set, get),
    ...createFileSlice(set, get),
    ...createNavIndicatorsSlice(set, get),
    ...createFileNavigatorSlice(set, get),
    ...createGraphSlice(set, get),
    ...createSnippetSlice(set, get),
}), shallow);

export default useStore;
