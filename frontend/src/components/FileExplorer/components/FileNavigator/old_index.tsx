import { getFileTree } from "@/requests";
import useStore from "@/store/store";
import React, { useState, useImperativeHandle, forwardRef } from "react";

import { FileNode } from "shared";
import ContextMenu, { ContextMenuState } from "../ContextMenu";

import path from "path-browserify";

// import TreeView from "../TreeView";
import {
	// createEmptyIGCFile,
	createNewDirectory,
	createNewFile,
	// deleteFileOrDirectory,
	// getFileContent,
	// renameFileOrDirectory,
} from "@/requests";
import { isValidIGC } from "@/IGCItems/utils/serialization";
import { Tree } from "react-arborist";

import styles from "./FileNavigator.module.css";
import TreeItem from "../TreeItem";
import { TreeRow } from "../TreeRow";

interface FileNavigatorProps {}

enum FileNodeType {
	File,
	Directory,
}

export interface FileNavigatorRef {
	refreshFileTree: () => void;
	createNewFileHandler: () => void;
	createNewDirectoryHandler: () => void;
}

const FileNavigator = forwardRef<FileNavigatorRef>(
	({}: FileNavigatorProps, ref) => {
		// State
		// *******
		const { setSelectedFile, projectDirectory } = useStore(); // Variables from data store

		const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
		// const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
		const [tree, setTree] = useState<FileNode[]>([]);
		// const [treeItemEditing, setTreeItemEditing] = useState<string | null>(
		// 	null,
		// );
		// const [expandedSet, setExpandedSet] = useState<Set<string>>(
		// 	new Set<string>(),
		// );

		const [loading, setLoading] = useState<boolean>(false);
		const [error, setError] = useState<string | null>(null);

		// Update the file tree
		const refresh = () => {
			if (projectDirectory === null) {
				throw new Error("Project directory is not set");
				return;
			}
			setLoading(true);
			setError(null);
			getFileTree(projectDirectory)
				.then((response: FileNode[]) => {
					setLoading(false);
					setTree(response);
				})
				.catch((error: string) => {
					setError(error);
					setLoading(false);
				});
		};

		const createNew = async (type: FileNodeType) => {
			if (projectDirectory === null) return;
			let dirPath = projectDirectory;
			if (selectedNode !== null) {
				dirPath =
					selectedNode.type === FileNodeType.Directory
						? selectedNode.fullPath
						: path.dirname(selectedNode.fullPath);
			}

			let newPath = "";
			if (type === FileNodeType.File) {
				newPath = path.join(dirPath, "New File");
				await createNewFile(newPath);
			} else if (type === FileNodeType.Directory) {
				newPath = path.join(dirPath, "New Folder");
				await createNewDirectory(newPath);
			}

			refresh();
			// setTreeItemEditing(newPath); // Enable renaming immediately
		};

		// For file explorer
		useImperativeHandle(ref, () => ({
			refreshFileTree: () => {
				refresh();
			},
			createNewFileHandler: () => {
				createNew(FileNodeType.File);
			},
			createNewDirectoryHandler: () => {
				createNew(FileNodeType.Directory);
			},
		}));

		// const handleNodeSelect = (node: FileNode) => {
		// 	setSelectedNode(node);
		// 	if (node.type === FileNodeType.File) {
		// 		setSelectedFile(() => node.fullPath);
		// 	}
		// };

		// const handleNodeRename = async (node: FileNode, newName: string) => {
		// 	if (!selectedNode) return;
		// 	if (newName === "") return;

		// 	const updatedNode = { ...selectedNode, name: newName };
		// 	console.log(`Renaming ${selectedNode.fullPath} to ${newName}`);
		// 	const newPath = path.join(path.dirname(node.fullPath), newName);
		// 	await renameFileOrDirectory(node.fullPath, newPath);

		// 	setTree((prevTree) =>
		// 		prevTree.map((n) =>
		// 			n.fullPath === updatedNode.fullPath ? updatedNode : n,
		// 		),
		// 	);
		// 	// Check if the new file is an igc file or if it does not decode to a proper json
		// 	if (newName.endsWith(".igc")) {
		// 		// Get file content
		// 		const fileContent = await getFileContent(newPath);
		// 		if (!isValidIGC(fileContent.content)) {
		// 			// Create an empty igc file
		// 			console.log(`Creating empty IGC file ${newPath}`);
		// 			await createEmptyIGCFile(newPath);
		// 		}
		// 	}

		// 	// Refresh the file tree
		// 	refresh();
		// };
		// const handleDelete = async (node: FileNode | null) => {
		// 	if (node === null) return;
		// 	console.log(`Deleting ${node.fullPath}`);
		// 	await deleteFileOrDirectory(node.fullPath);
		// 	setTree((prevTree) =>
		// 		prevTree.filter((n) => n.fullPath !== node.fullPath),
		// 	);
		// };

		// const handleNodeContextMenu = (
		// 	event: React.MouseEvent,
		// 	node: FileNode,
		// ) => {
		// 	event.preventDefault();
		// 	setContextMenu({
		// 		mouseX: event.clientX - 2,
		// 		mouseY: event.clientY - 4,
		// 	});
		// 	setSelectedNode(node);
		// 	refresh();
		// };

		// const handleClose = () => {
		// 	setContextMenu(null);
		// };

		return (
			<div>
				{loading ? (
					<div className="loading">
						<p>Loading...</p>
					</div>
				) : error ? (
					<p>Error: {error}</p>
				) : tree.length !== 0 ? (
					<div className={styles.treeViewContainer}>
						<Tree
							data={tree}
							idAccessor="fullPath"
							renderRow={TreeRow}
							onMove={
								({ dragIds, parentId, index }) => {}
								//move(dragIds[0], parentId)
							}
							onRename={
								({ id, name }) => {}
								//move(id, `${path.dirname(id)}/${name}`)
							}
							// onCreate={({ parentId, index }) => {
							// 	/* optional: call your create API */
							// }}
							onDelete={({ ids }) => {
								/* optional: call your delete API */
							}}
							rowHeight={32}
							indent={16}
						>
							{TreeItem}
						</Tree>
						{/* <TreeView
								nodes={tree}
								selectedNodeId={selectedNode?.fullPath || null}
								actions={{
									onSelect: handleNodeSelect,
									onRename: handleNodeRename,
									onContextMenu: handleNodeContextMenu,
								}}
								state={{
									editing: treeItemEditing,
									setEditing: setTreeItemEditing,
									expandedSet: expandedSet,
									setExpandedSet: setExpandedSet,
								}}
							/> */}
					</div>
				) : (
					<div style={{ margin: "10px" }}>No Project Open</div>
				)}
			</div>
		);
	},
);

export default FileNavigator;
