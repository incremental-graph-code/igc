import { createWithEqualityFn } from "zustand/traditional";
import { GetState, SetState } from "../store";

export type SaveStatus =
	| "saved"
	| "unsaved"
	| "error"
	| "externallyChanged"
	| "none";

interface FileSaveState {
	status: SaveStatus;
	savedContent: string;
	error?: string;
	internalLastSaveTime?: number;
	externalLastSaveTime?: number;
}

export interface FileSliceState {
	fileSaveState: Record<string, FileSaveState>;
	setFileSaveStatus: (
		filePath: string,
		update: Partial<FileSaveState>,
	) => void;
	getFileSaveState: (filePath: string) => FileSaveState | undefined;
}

export const createFileSlice = (
	set: SetState,
	get: GetState,
): FileSliceState => ({
	fileSaveState: {},
	setFileSaveStatus: (filePath, update) => {
		set((state) => ({
			fileSaveState: {
				...state.fileSaveState,
				[filePath]: {
					...state.fileSaveState[filePath],
					...update,
				},
			},
		}));
	},
	getFileSaveState: (filePath) => get().fileSaveState[filePath],
});
