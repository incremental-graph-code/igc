import React from "react";
import List from "@mui/material/List";
import { FileNode } from "shared";
import styles from "./TreeView.module.css";
import TreeItem from "../TreeItem";
import { TreeItemActionHandlers, TreeItemState } from "@/types/frontend";

interface TreeViewProps {
	nodes: FileNode[];
	selectedNodeId: string | null;
	actions: TreeItemActionHandlers;
	state: TreeItemState;
}

const TreeView: React.FC<TreeViewProps> = ({
	nodes,
	selectedNodeId,
	actions,
	state,
}) => {
	return (
		<List className={styles.treeViewContainer}>
			{nodes.map((node) => (
				<TreeItem
					key={node.fullPath}
					node={node}
					selectedNodeId={selectedNodeId}
					depth={0}
					actions={actions}
					state={state}
				/>
			))}
		</List>
	);
};

export default TreeView;
