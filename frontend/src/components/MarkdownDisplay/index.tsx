import React from "react";
import ReactMarkdown from "react-markdown";
import AddIcon from "@mui/icons-material/Add";
import styles from "./MarkdownDisplay.module.css";
import { Node, Edge } from "reactflow";
import {
	getEdgeId,
	getIncomingNodes,
} from "../../IGCItems/utils/utils";
import useStore from "@/store/store";
import { isDocumentationNode } from "@/IGCItems/nodes/DocumentationNode";

interface MarkdownDisplayProps {
	node: Node;
}

const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({ node }) => {
	const handleDoubleClick = () => {
		setOrCreateDocumentationNode(node);
	};
	const getCodeDocumentation = (
		node: Node,
	): string | null => {
        const selectedFile = useStore.getState().selectedFile;
        if (selectedFile === null) {
            return null;
        }
        const nodes = useStore.getState().getNodes(selectedFile);
        const edges = useStore.getState().getEdges(selectedFile);
		const incomingDocumentationNodes = getIncomingNodes(
			node.id,
			nodes,
			edges,
            (node) => isDocumentationNode(node),
		);
		if (incomingDocumentationNodes.length === 0) {
			return null;
		}
		return incomingDocumentationNodes[0].data.documentation;
	};

	const setOrCreateDocumentationNode = (
		node: Node,
	): void => {
        const selectedFile = useStore.getState().selectedFile;
        if (selectedFile === null) {
            return;
        }
        const nodes = useStore.getState().getNodes(selectedFile);
        const edges = useStore.getState().getEdges(selectedFile);
		const incomingDocumentationNodes = getIncomingNodes(
			node.id,
			nodes,
			edges,
            (node) => isDocumentationNode(node),
		);
		if (incomingDocumentationNodes.length === 0) {
			// Need to create the documentation node
			const documentationNodeId = `documentation-${node.id}`;
			const documentationNode = {
				id: documentationNodeId,
				type: "DocumentationNode",
				position: {
					x: node.position.x,
					y: node.position.y - 200,
				},
				data: {
					label: `Documentation`,
					documentation: "",
					language: "markdown",
				},
				selected: true,
			};
			const documentationEdge = {
				id: getEdgeId(documentationNodeId, node.id, edges),
				source: documentationNodeId,
				target: node.id,
				type: "DocumentationRelationship",
			};
			useStore.getState().setNodes(selectedFile, (prevNodes) => [
				...prevNodes.map((node) => {
					node.selected = false;
					return node;
				}),
				documentationNode,
			]);
			useStore.getState().setEdges(selectedFile, (prevEdges) => [...prevEdges, documentationEdge]);
		} else {
			useStore.getState().setNodes(selectedFile, (prevNodes) => [
				...prevNodes.map((node) => {
					if (node.id === incomingDocumentationNodes[0].id) {
						node.selected = true;
					} else {
						node.selected = false;
					}
					return node;
				}),
			]);
		}
	};

	const content = getCodeDocumentation(node);

	return (
		<div
			className={styles.markdownDisplayContainer}
			onDoubleClick={handleDoubleClick}
		>
			{content === null ? (
				<div className={styles.iconContainer}>
					<AddIcon />
				</div>
			) : null}
			<div className={content === null ? styles.hidden : ""}>
				<ReactMarkdown>{content !== null ? content : ""}</ReactMarkdown>
			</div>
		</div>
	);
};

export default MarkdownDisplay;
