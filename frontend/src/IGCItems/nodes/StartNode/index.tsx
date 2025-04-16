import React from "react";
import "./StartNode.css";
import { Handle, Position } from "reactflow";
import useStore from "@/store/store";
import BaseNode, { IGCNodeProps } from "../BaseNode";
import { createComponent } from "@/utils/componentCache";
import { RegistryComponent } from "@/types/frontend";

const RawStartNode: IGCNodeProps = () => {
	const { setNodes, setEdges } = useStore();
	// Override single click and unselect all nodes
	const onNodeClick = (event: React.MouseEvent<HTMLElement>) => {
		event.stopPropagation(); // Prevent the default single click behavior
		// Deselect All Nodes and Edges
		setNodes((nodes) => {
			let newNodes = nodes.map((node) => {
				node.selected = false;
				return node;
			});
			return [...newNodes];
		});

		setEdges((edges) => {
			let newEdges = edges.map((edge) => {
				edge.selected = false;
				return edge;
			});
			return [...newEdges];
		});
	};

	return (
		<div className="igc-start-node" onClick={onNodeClick}>
			<div className="igc-start-node-inner">
				<Handle
					type="source"
					position={Position.Top}
					style={{
						left: "50%",
						top: "50%",
						transform: "translate(-50%, -50%)",
						border: "1px solid transparent",
					}}
				/>
			</div>
		</div>
	);
};

const StartNode: IGCNodeProps & RegistryComponent = createComponent(
	RawStartNode,
	"StartNode",
	"Start Node",
	{
		parentComponent: BaseNode,
	},
);

export default StartNode;
