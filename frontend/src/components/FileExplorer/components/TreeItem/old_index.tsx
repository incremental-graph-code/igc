import React, { useState, useEffect, useRef } from "react";
import {
	ListItemIcon,
	ListItemText,
	InputBase,
	Typography,
	ListItemButton,
	List,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { FileNode } from "shared";
import styles from "./TreeItem.module.css";
import { TreeItemActionHandlers, TreeItemState } from "@/types/frontend";

interface TreeItemProps {
	node: FileNode;
	selectedNodeId: string | null;
	depth: number;
	actions: TreeItemActionHandlers;
	state: TreeItemState;
}

const TreeItem: React.FC<TreeItemProps> = ({
	node,
	selectedNodeId,
	depth,
	actions: { onContextMenu, onSelect, onRename },
	state: { editing, setEditing, expandedSet, setExpandedSet },
}) => {
	const [inputValue, setInputValue] = useState(node.name);
	const inputRef = useRef<HTMLInputElement | null>(null);

	// Automatically focus and select the filename (without extension) when entering edit mode
	useEffect(() => {
		if (editing === node.fullPath && inputRef.current) {
			setInputValue(node.name);
			inputRef.current.focus();
			inputRef.current.setSelectionRange(0, node.name.split(".")[0].length);
		}
	}, [editing, node.fullPath, node.name]);

	const handleBlur = () => {
		if (onRename !== undefined) {
			onRename(node, inputValue);
		}
		setEditing(null);
	};

	const handleSelect = () => {
		if (onSelect !== undefined) {
			onSelect(node);
		}
        if(node.type === "directory"){
            setExpandedSet((prevSet) => {
                if(!prevSet.delete(node.fullPath)) {
                    prevSet.add(node.fullPath);
                }
                return new Set(prevSet);
            });
        }
	};

	const onDoubleClick = () => {
		setEditing(node.fullPath);
	};

	const paddingLeft = `${depth * 1.5}em`;

	return (
		<>
			<ListItemButton
				className={styles.treeItemButton}
				onClick={handleSelect}
				onContextMenu={
					onContextMenu !== undefined
						? (event) => onContextMenu(event, node)
						: undefined
				}
				selected={
					selectedNodeId === node.fullPath &&
					editing !== node.fullPath
				}
				sx={{ pl: paddingLeft }}
				onDoubleClick={onDoubleClick}
			>
				<ListItemIcon className={styles.treeItemIcon}>
					{node.type === "directory" ? (
						<FolderIcon />
					) : (
						<InsertDriveFileIcon />
					)}
				</ListItemIcon>
				{editing === node.fullPath ? (
					<InputBase
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onBlur={handleBlur}
						autoFocus
						fullWidth
						className={styles.treeItemInput}
						inputRef={inputRef}
					/>
				) : (
					<ListItemText
						primary={
							<Typography
								variant="body2"
								className={styles.treeItemText}
							>
								{node.name}
							</Typography>
						}
					/>
				)}
			</ListItemButton>
			{expandedSet.has(node.fullPath) && node.children && (
				<List disablePadding>
					{node.children.map((childNode) => (
						<TreeItem
							key={childNode.fullPath}
							node={childNode}
							selectedNodeId={selectedNodeId}
							depth={depth + 1}
							actions={{ onContextMenu, onSelect, onRename }}
							state={{ editing, setEditing, expandedSet, setExpandedSet }}
						/>
					))}
				</List>
			)}
		</>
	);
};

export default TreeItem;
