/**
 * @file FileNavigator component for displaying and managing the file tree structure.
 *
 * This component fetches and displays the file tree for the current project directory.
 *
 * @module FileNavigator
 */

import { FC, useCallback, useEffect, useRef, useState } from "react";
import { FileNode } from "shared";
import { deleteFileOrDirectory, getFileTree, renameFileOrDirectory } from "@/requests";
import useStore from "@/store/store";

import styles from "./FileNavigator.module.css";
import { Tree } from "react-arborist";
import { TreeRow } from "../TreeRow";
import TreeItem from "../TreeItem";
import { useSize } from "@/hooks/useSize";
import path from "path-browserify";
import toast from "react-hot-toast";

// To track if directories are open or closed
const STORAGE_KEY = "IGC.treeOpenState";

/**
 * FileNavigator component.
 *
 * Displays the file tree for the current project directory.
 * Handles loading and error states, and refreshes the tree when the project directory changes.
 *
 * @returns {JSX.Element} The rendered FileNavigator component.
 */
const FileNavigator: FC = () => {
	const projectDirectory = useStore((state) => state.projectDirectory);
	const { fileTree, loading, error, refresh, setSelectedNode } = useStore((state) => ({
		fileTree: state.fileTree,
		loading: state.loading,
		error: state.error,
		refresh: state.refresh,
        setSelectedNode: state.setSelectedNode,
	}));

	const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
		try {
			const raw = window.localStorage.getItem(STORAGE_KEY);
			return raw ? JSON.parse(raw) : {};
		} catch {
			return {};
		}
	});

	const parentRef = useRef<HTMLDivElement>(null);

	const size = useSize(parentRef);

	// Handle the opening and closing of directories
	const handleToggle = useCallback((id: string) => {
		setOpenMap((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
	}, []);

	// Refresh the file tree whenever the project directory changes.
	useEffect(() => {
		refresh(projectDirectory);
	}, [projectDirectory]);
	// Update the cached open/closed state of directories in local storage
	useEffect(() => {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(openMap));
	}, [openMap]);

	if (loading) {
		return <div>Loading...</div>;
	}
	if (error !== null) {
		return <div>Error: {error}</div>;
	}
	return (
		<div ref={parentRef}>
			<Tree
				openByDefault={false}
				initialOpenState={openMap}
				onToggle={handleToggle}
				width={size?.width}
				height={size?.height}
				data={fileTree}
				idAccessor="fullPath"
				renderRow={TreeRow}
				onMove={
					async ({ dragIds, parentId, index }) => {
                        // Move each dragged item to the new parent
						console.log("move", dragIds, parentId, index);
						await Promise.all(
							dragIds.map(async (id) => {
                                let newPath = `${parentId}/${path.basename(id)}`;
                                if (parentId === null) {
                                    newPath = `${projectDirectory}/${path.basename(id)}`;
                                }
								console.log("Moving", id, "to", newPath);
								await renameFileOrDirectory(id, newPath);
							}),
						);

                        // Refresh the file tree after moving
                        refresh(projectDirectory);
                        toast.success("Moved file(s) successfully", {
                            duration: 2000,
                            position: "top-center",
                        });
					}
					//move(dragIds[0], parentId)
				}
				onRename={
					async ({ id, name }) => {
						console.log("rename", id, name);
                        // Get the new path with the new name
                        const newPath = path.join(path.dirname(id), name);
                        // Rename the file
                        await renameFileOrDirectory(id, newPath)
                        // Refresh the file tree after moving
                        refresh(projectDirectory);
                        toast.success("Renamed file successfully", {
                            duration: 2000,
                            position: "top-center",
                        });
					}
					//move(id, `${path.dirname(id)}/${name}`)
				}
				// onCreate={({ parentId, index }) => {
				// 	/* optional: call your create API */
				// }}
				onDelete={async ({ ids }) => {
                    console.log("delete", ids);
                    await Promise.all(
                        ids.map(async (id) => {
                            console.log("Deleting", id);
                            //await deleteFileOrDirectory(id);
                        }),
                    ).then(() => {
						toast.success(`Deleted File.`, {
							duration: 2000,
							position: "top-center",
						});
                        refresh(projectDirectory);
					})
					.catch((err) => {
						toast.error(`Error deleting File\n${err}.`, {
							duration: 2000,
							position: "top-center",
						});
					});
				}}
                onFocus={({ id }) => {
                    console.log("focus", id);
                    
                    // setSelectedFile(id);
                }}
                onSelect={(nodes) => {
                    console.log("select", nodes);
                    if (nodes.length > 0) {
                        const selectedNode = nodes[0];
                        console.log("Selected node:", selectedNode.id);
                        setSelectedNode(selectedNode);
                    } else {
                        console.log("No nodes selected");
                        setSelectedNode(null);
                    }
                }}
				rowHeight={32}
				indent={16}
			>
				{TreeItem}
			</Tree>
		</div>
	);
};

export default FileNavigator;
