import { IGCViewProps } from "../BaseView";
import { createView } from "@/utils/componentCache";
import { ItemType, RegistryComponent } from "@/types/frontend";

import useStore from "@/store/store";
import { Node } from "reactflow";

import React, { useEffect, useRef } from "react";
import DocumentationNode, {
	IGCDocumentationData,
	isDocumentationNode,
} from "@/IGCItems/nodes/DocumentationNode";
import Editor from "@/components/Editor";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { useSyncSystem } from "@/hooks/useSyncSystem";
import { createSnippetSyncAdapter } from "@/adapters/snippet";
import { IGCGraph } from "@/types/graph";
import { SyncSystem } from "@/adapters/consts";
import { getSyncAdapter } from "@/utils/syncRegistry";
import { IGCNodeProps } from "@/IGCItems/nodes/BaseNode";

const RawDocumentationNodeView: React.FC = () => {
	const fileData = useStore((state) => state.fileData);
	// const getSessionData = useStore((state) => state.getSessionData);
	const graph = useStore((state) => state.graph);

	const getDocumentationNode = (
		graph: IGCGraph | null,
	): Node<IGCDocumentationData> | null => {
		const selectedItem = useStore.getState().selectedItem;
		if (
            graph !== null &&
			selectedItem !== undefined &&
			selectedItem.item.type === ItemType.node &&
			isDocumentationNode(selectedItem.item.object)
		) {
			const n = graph.nodes.find(
				(node: Node) => node.id === selectedItem.id,
			);
			if (n !== undefined) {
				return n as Node<IGCDocumentationData<IGCNodeProps>>;
			}
		}
		return null;
	};

	const triggerUpdate = useSyncSystem<string, IGCGraph>(
		createSnippetSyncAdapter<string, IGCGraph>(
			SyncSystem.Snippet,
			(graph: IGCGraph) => getDocumentationNode(graph).data.documentation,
			(documentation: string, graph: IGCGraph) => {
				const n = getDocumentationNode(graph);
				if (n !== null) {
					n.data.documentation = documentation;
				}
				return graph;
			},
			getSyncAdapter<IGCGraph, any>(SyncSystem.Graph).node,
		),
		SyncSystem.Graph,
	);

	const syncDebounce = useDebouncedCallback((documentation: string) => {
		triggerUpdate(documentation);
	}, 500);

	const documentationNode = getDocumentationNode(graph);

	if (documentationNode === null) {
		return (
			<div className="text-display">No documentation node selected</div>
		);
	}

	const editorPathKey = `${fileData.filePath}\x1F${documentationNode.id}`;

	// const sessionsData = getSessionData(fileData.filePath);
	// const currentSessionId = useStore.getState().currentSessionId;
	// let lastExecutionData = null;
	// if (
	// 	currentSessionId !== null &&
	// 	sessionsData !== undefined &&
	// 	sessionsData.sessions[currentSessionId] !== undefined
	// ) {
	// 	const sessionData = sessionsData.sessions[currentSessionId];
	// 	for (let i = sessionData.executions.length - 1; i >= 0; i--) {
	// 		if (sessionData.executions[i].nodeId === documentationNode.id) {
	// 			lastExecutionData = sessionData.executions[i];
	// 			break;
	// 		}
	// 	}
	// }
	return (
		<Editor
			editorId={editorPathKey}
			language={"markdown"}
			sync={{
				currentContent: documentationNode.data.documentation,
				triggerUpdate: (value) => syncDebounce(value),
			}}
			getSavedContent={() => {
				return useStore.getState().fileData.initialContent;
			}}
			// saveLogic={saveLogic}
			initialContent={documentationNode.data.documentation}
			// onMount={onMount}
		/>
	);
};

const DocumentationNodeView: IGCViewProps & RegistryComponent = createView(
	RawDocumentationNodeView,
	"DocumentationNodeView",
	"Documentation Node View",
	[DocumentationNode],
	0,
	{},
);

export default DocumentationNodeView;
