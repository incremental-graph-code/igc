import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from 'zustand/shallow';
import { createFileSlice, FileSliceState } from "./slices/file";
import { createDefaultSlice, DefaultSliceState } from "./slices/default";
import { createNavIndicatorsSlice, NavIndicatorsSliceState } from "./slices/navIndicators";
import { createFileNavigatorSlice, FileNavigatorSliceState } from "./slices/fileNavigator";

export type State = DefaultSliceState & FileSliceState & NavIndicatorsSliceState & FileNavigatorSliceState;

// Helper types for Zustand's set and get functions
export type SetState = (fn: (state: State) => Partial<State>) => void;
export type GetState = () => State;

const useStore = createWithEqualityFn<State>((set, get) => ({
	...createDefaultSlice(set, get),
    ...createFileSlice(set, get),
    ...createNavIndicatorsSlice(set, get),
    ...createFileNavigatorSlice(set),
}), shallow);

export default useStore;
