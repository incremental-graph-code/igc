import { getFileTree } from "@/requests";
import { GetState, SetState } from "../store";
import { FileNode, FileNodeType } from "shared";
import { NodeApi } from "react-arborist";
import path from "path-browserify";
import { loadSessionData, updateExecutionRelationships } from "@/utils/sessionHandler";

export interface FileNavigatorSliceState {
	fileTree: FileNode[];
	loading: boolean;
	error: string | null;
	refresh: (projectDirectory: string | null) => void;
	clipboard: { path: string; cut: boolean } | null;
	setClipboard: (
		updater: (
			prev: { path: string; cut: boolean } | null,
		) => { path: string; cut: boolean } | null,
	) => void;
	selectedNode: NodeApi<FileNode> | null;
	setSelectedNode: (filePath: NodeApi<FileNode> | null) => void;
	createTempNode: (isDirectory: boolean) => void;
	removeTempNodes: () => void;
}

export const createFileNavigatorSlice = (
	set: SetState,
    get: GetState
): FileNavigatorSliceState => ({
    fileTree: [],
	loading: false,
	error: null,

	/**
	 * Fetches and updates the file tree for the current project directory.
	 * Sets loading and error states accordingly.
	 */
	refresh: (projectDirectory) => {
		if (projectDirectory === null) {
			console.error("Project directory is not set");
			set(() => ({ error: "Project directory not set" }));
			return;
		}

		set(() => ({ loading: true, error: null }));

		getFileTree(projectDirectory)
			.then((response) => {
				set(() => ({ fileTree: response, loading: false }));
			})
			.catch((err: string) => {
				set(() => ({ error: err, loading: false }));
			});
        const fileData = get().fileData;
        if (fileData !== null) {
            loadSessionData(fileData.filePath).then((sessionData) => {
                set(() => ({currentSessionId: sessionData.primarySession}));
                                                                   
                updateExecutionRelationships(
                    fileData.filePath,
                    sessionData,
                );
            });
        }
	},
	clipboard: null,
	setClipboard: (
		updater: (
			prev: { path: string; cut: boolean } | null,
		) => { path: string; cut: boolean } | null,
	) => set((state) => ({ clipboard: updater(state.clipboard) })),
	selectedNode: null,
	setSelectedNode: (node: NodeApi<FileNode> | null) =>
		set(() => ({ selectedNode: node })),
	createTempNode: (isDirectory: boolean) => {
		set((state) => {
			const newId = `__temp__${Date.now()}`; // Unique temporary ID
            // Check where to insert the new node
            let parentPath = state.projectDirectory;
            if(state.selectedNode !== null){
                if(state.selectedNode.data.type === FileNodeType.Directory){
                    parentPath = state.selectedNode.data.fullPath;
                }
                else{
                    parentPath = path.dirname(state.selectedNode.data.fullPath);
                }
            }
			const newNode: FileNode = {
				fullPath: `${parentPath}/${newId}`,
				name: "",
				type: isDirectory ? FileNodeType.Directory : FileNodeType.File,
				isTemporary: true,
			};

			let inserted = false;

			const insert = (nodes: FileNode[]): FileNode[] => {
				return nodes.map((node) => {
					if (
						node.fullPath === parentPath &&
						node.type === FileNodeType.Directory
					) {
						inserted = true;
						return {
							...node,
							children: [...(node.children || []), newNode],
						};
					}
					if (node.children) {
						return {
							...node,
							children: insert(node.children),
						};
					}
					return node;
				});
			};

			const updatedTree = insert(state.fileTree ?? []);

			// If we never found the parent, insert at root
			if (!inserted) {
				updatedTree.push(newNode);
			}

			return { fileTree: updatedTree };
		});
	},
	removeTempNodes: () => {
		set((state) => {
			const remove = (nodes: FileNode[]): FileNode[] =>
				nodes
					.filter((n) => !n.isTemporary)
					.map((n) => ({
						...n,
						children: n.children ? remove(n.children) : undefined,
					}));

			return { fileTree: remove(state.fileTree ?? []) };
		});
	},
});
