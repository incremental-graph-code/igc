import React, { useState } from "react";
import {
	Node,
	Handle,
	NodeProps,
	Position,
	ReactFlowState,
	useStore as reactflowStore,
} from "reactflow";
import { STYLES } from "@/styles/constants";
import useStore from "@/store/store";
import "./BaseNode.css";
import { getNodeId } from "../../utils/utils";
import { RegistryComponent } from "@/types/frontend";
import { createComponent } from "@/utils/componentCache";
import { useContextMenu } from "@/hooks/useContextMenu";
import { ContextMenuItem } from "@/providers/ContextMenuProvider";

const connectionNodeIdSelector = (state: ReactFlowState) =>
	state.connectionNodeId;

export type IGCNodeData<T = object> = T & {
	label: string;
	backgroundColor?: string;
	children?: React.ReactNode;
	handleRun?: () => void;
};

export type IGCNodeProps<T = object> = React.FC<NodeProps<IGCNodeData<T>>>;

type ContextMenuAction = "edit" | "delete" | "share";
const menuItems: ContextMenuItem<ContextMenuAction>[] = [
    {
        id: "edit",
        label: "✏️ Edit",
        onClick: (id) => console.log("Action:", id),
    },
    {
        id: "delete",
        label: "🗑️ Delete",
        onClick: (id) => console.log("Action:", id),
        disabled: true,
    },
    {
        id: "share",
        label: "📤 Share",
        onClick: (id) => console.log("Action:", id),
    },
];

const RawBaseNode: IGCNodeProps = ({ id, data, selected }) => {
	const setNodes = useStore((state) => state.setNodes);

	const { onContextMenu } = useContextMenu(menuItems);

	const handleDelete = () => {
		console.log("Delete action triggered for node:", id);
		const curFile = useStore.getState().selectedFile;
		if (curFile !== null) {
			setNodes(curFile, (prevNodes) =>
				prevNodes.filter((node) => node.id !== id),
			);
		}
	};
	const handleDuplicate = () => {
		console.log("Duplicate action triggered for node:", id);
		const curFile = useStore.getState().selectedFile;
		if (curFile !== null) {
			setNodes(curFile, (prevNodes) => {
				const node = prevNodes.find((node) => node.id === id);
				if (node === undefined) {
					return prevNodes;
				}
				return [
					...prevNodes.map((n) => {
						n.selected = false;
						return n;
					}),
					{
						...node,
						id: getNodeId(prevNodes),
						selected: true,
						position: {
							x: node.position.x + 20,
							y: node.position.y + 20,
						},
					},
				];
			});
		}
	};

	const connectionNodeId = reactflowStore(connectionNodeIdSelector);
	const defaultData = {
		backgroundColor: STYLES.defaultNodeColor,
	};

	data = { ...defaultData, ...data };

	const isConnecting = !!connectionNodeId;
	const isTarget = connectionNodeId && connectionNodeId !== id;
	const label = isTarget ? "Drop here" : "Drag to connect";

	let selectionColor = "transparent";
	if (useStore.getState().waitForSelection) {
		selectionColor = STYLES.nodePickColor;
	} else if (selected) {
		selectionColor = STYLES.nodeSelectedColor;
	}
	return (
		<div
			style={{
				border: `${STYLES.highlightThickness}px solid ${selectionColor}`,
				backgroundColor: selectionColor,
				boxShadow:
					selectionColor === "transparent"
						? undefined
						: `0 4px 12px rgba(${selectionColor}, 0.4)`,
				borderRadius: "11px",
			}}
		>
			<div className="customNode" onContextMenu={onContextMenu}>
				<div
					className="customNodeBody"
					style={{
						borderStyle:
							isTarget && isConnecting ? "dashed" : "solid",
						backgroundColor: isConnecting
							? isTarget
								? STYLES.nodeDropColor
								: STYLES.nodePickColor
							: data.backgroundColor !== undefined
								? data.backgroundColor
								: BaseNode.color,
					}}
				>
					{data.children !== undefined &&
						!isConnecting &&
						data.children}
					{!isConnecting && (
						<Handle
							position={Position.Right}
							type="source"
							style={{
								width: "100%",
								height: "100%",
								position: "absolute",
								backgroundColor: "transparent",
								top: 0,
								left: 0,
								borderRadius: 0,
								transform: "none",
								border: "none",
								zIndex: 5,
							}}
						/>
					)}
					<Handle
						position={Position.Left}
						type="target"
						isConnectableStart={false}
						style={{
							width: "100%",
							height: "100%",
							position: "absolute",
							backgroundColor: "transparent",
							top: 0,
							left: 0,
							borderRadius: 0,
							transform: "none",
							border: "none",
							zIndex: 5,
						}}
					/>
					<div style={{ textAlign: "center" }}>
						{isConnecting && label}
						{!isConnecting &&
							data.children === undefined &&
							data.label}
					</div>

					{!isConnecting && <div className="base"></div>}
				</div>

				{/* <ContextMenu
					anchorEl={anchorEl}
					handleClose={handleClose}
					position={contextMenu}
					onDelete={handleDelete}
					onDuplicate={handleDuplicate}
					onRun={
						data.handleRun !== undefined &&
						useStore.getState().currentSessionId !== null
							? () => contextMenuAction(data.handleRun)
							: undefined
					}
				/> */}
			</div>
		</div>
	);
};
const BaseNode: IGCNodeProps & RegistryComponent = createComponent(
	RawBaseNode,
	"BaseNode",
	"Base Node",
	{
		color: STYLES.defaultNodeColor,
		type: "node",
		settable: true,
	},
);

export const createBaseNode = (
	curNodes: Node<IGCNodeData>[],
): Node<IGCNodeData> => {
	return {
		id: getNodeId(curNodes),
		type: BaseNode.key,
		data: {
			label: `Node ${curNodes.length}`,
		},
		position: {
			x: Math.random() * 500 - 250,
			y: Math.random() * 500 - 250,
		},
		selected: true,
	};
};

export default BaseNode;
