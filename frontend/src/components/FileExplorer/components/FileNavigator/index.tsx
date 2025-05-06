/**
 * @file FileNavigator component for displaying and managing the file tree structure.
 *
 * This component fetches and displays the file tree for the current project directory.
 *
 * @module FileNavigator
 */

import { FC, useCallback, useEffect, useRef, useState } from "react";
import { FileNode } from "shared";
import { getFileTree } from "@/requests";
import useStore from "@/store/store";

import styles from "./FileNavigator.module.css";
import { Tree } from "react-arborist";
import { TreeRow } from "../TreeRow";
import TreeItem from "../TreeItem";
import { useSize } from "@/hooks/useSize";

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

	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [tree, setTree] = useState<FileNode[]>([]);
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

	/**
	 * Fetches and updates the file tree for the current project directory.
	 * Sets loading and error states accordingly.
	 */
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
	// Handle the opening and closing of directories
	const handleToggle = useCallback((id: string) => {
		setOpenMap((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
	}, []);

	// Refresh the file tree whenever the project directory changes.
	useEffect(() => {
		refresh();
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
				data={tree}
				idAccessor="fullPath"
				renderRow={TreeRow}
				onMove={
					({ dragIds, parentId, index }) => {}
					//move(dragIds[0], parentId)
				}
				onRename={
					({ id, name }) => {
                        console.log("rename", id, name);
                    }
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
		</div>
	);
};

export default FileNavigator;
