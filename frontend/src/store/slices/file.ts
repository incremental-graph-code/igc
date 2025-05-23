import { getFileContent, saveFileContent } from "@/requests";
import { GetState, SetState } from "../store";
import {
	getSyncAdapter,
	registerSyncSystem,
	resetSyncSystems,
    syncFrom
} from "@/utils/syncRegistry";
import { SyncSystem } from "@/adapters/consts";

export type SaveStatus =
	| "none"
	| "saved"
	| "unsaved"
	| "error"
	| "externallyChanged";

export interface FileData {
	filePath: string;
	lastKnownMTime: number;
	initialContent: string;
}

export interface FileSaveState {
	status: SaveStatus;
	error?: string;
}

export interface FileSliceState {
	fileData: FileData | null;
	saveState: FileSaveState;

	setBufferText: (text: string) => void;
	bufferText: string;

	loadFile: (filePath: string) => Promise<void>;
	saveFile: () => Promise<void>;
	commitBuffer: () => void;
}

export const createFileSlice = (
	set: SetState,
	get: GetState,
): FileSliceState => ({
	fileData: null,
	saveState: { status: "none" },

	bufferText: "",
	setBufferText: (text: string) => {
		set(() => ({ bufferText: text }));
	},
	loadFile: async (filePath: string) => {
		const { content, lastModified } = await getFileContent(filePath);

        // Reset all sync system states to avoid stale data
        resetSyncSystems();
        
		const fileData: FileData = {
			filePath,
			lastKnownMTime: lastModified,
			initialContent: content,
		};

		set(() => ({
			fileData: fileData,
			bufferText: content,
			saveState: { status: "saved" },
			selectedNodeId: null,
		}));

		if (!getSyncAdapter(SyncSystem.Text)) {
			registerSyncSystem({
                id: SyncSystem.Text,
				get: () => get().bufferText,
				set: (v) => set(() => ({ bufferText: v })),
				serialize: (v) => v,
				deserialize: (v) => v,
			});
		}

		syncFrom(SyncSystem.Text);
	},

	saveFile: async () => {
		const { fileData, bufferText } = get();
		if (!fileData) return;

		// Check if the file has been modified externally
		const currFileData = await getFileContent(fileData.filePath);

		const externalChanged =
			currFileData.lastModified !== fileData.lastKnownMTime;
		if (externalChanged) {
			set(() => ({ saveState: { status: "externallyChanged" } }));
			return;
		}

		try {
			await saveFileContent(fileData.filePath, bufferText);
			await get().loadFile(fileData.filePath); // resets buffer and metadata
			set(() => ({ saveState: { status: "saved" } }));
		} catch (err) {
			set(() => ({ saveState: { status: "error", error: String(err) } }));
		}
	},

	commitBuffer: () => {
		const { fileData, bufferText } = get();
		if (!fileData) return;

		set(() => ({
			fileData: {
				...fileData,
				initialContent: bufferText,
			},
			saveState: { status: "saved" },
		}));
	},
});
