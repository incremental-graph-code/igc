import CodeNode, {
	IGCCodeNodeData,
	isCodeNode,
} from "@/IGCItems/nodes/CodeNode";
import { IGCViewProps } from "../BaseView";
import { createView } from "@/utils/componentCache";
import { ItemType, RegistryComponent } from "@/types/frontend";

import useStore from "@/store/store";
import { Node } from "reactflow";

import React, { useCallback } from "react";
import TabbedCodeOutput from "@/components/TabbedCodeOutput";
import MarkdownDisplay from "@/components/MarkdownDisplay";
import Editor from "@/components/Editor";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { useSyncSystem } from "@/hooks/useSyncSystem";
import { IGCGraph } from "@/types/graph";
import { SyncSystem } from "@/adapters/consts";
import { createSnippetSyncAdapter } from "@/adapters/snippet";
import { getSyncAdapter } from "@/utils/syncRegistry";
import { IGCNodeData } from "@/IGCItems/nodes/BaseNode";
import { useRunIndicator } from "@/hooks/useRunIndicator";
import { executeNode } from "@/utils/codeExecution";

const RawCodeNodeView: React.FC = () => {
	const fileData = useStore((state) => state.fileData);
	const currentSessionId = useStore((state) => state.currentSessionId);
	const getSessionData = useStore((state) => state.getSessionData);
	const sessionsData = getSessionData(fileData.filePath);

	const getCodeNode = (
		graph: IGCGraph | null,
	): Node<IGCCodeNodeData<IGCNodeData>> | null => {
		const selectedItem = useStore.getState().selectedItem;
		if (
            graph !== null &&
			selectedItem !== null &&
			selectedItem.item.type === ItemType.node &&
			isCodeNode(selectedItem.item.object)
		) {
			const n = graph.nodes.find(
				(node: Node) => node.id === selectedItem.id,
			);
			if (n !== undefined) {
				return n as Node<IGCCodeNodeData<IGCNodeData>>;
			}
		}
		return null;
	};

	const triggerUpdate = useSyncSystem<string, IGCGraph>(
		createSnippetSyncAdapter<string, IGCGraph>(
			SyncSystem.Snippet,
			(graph: IGCGraph) => getCodeNode(graph).data.codeData.code,
			(code: string, graph: IGCGraph) => {
				const n: Node<IGCCodeNodeData<IGCNodeData>> =
					getCodeNode(graph);
				if (n !== null) {
					n.data.codeData.code = code;
				}
				return graph;
			},
			getSyncAdapter<IGCGraph, any>(SyncSystem.Graph).node,
		),
		SyncSystem.Graph,
	);

	const syncDebounce = useDebouncedCallback((code: string) => {
		triggerUpdate(code);
	}, 500);

	// const validItem =
	// 	selectedFile !== null &&
	// 	selectedItem !== null &&
	// 	selectedItem.item.type === "node";

	// Save indicator
	// const onMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
	//     editorRef.current = editor;
	//     monacoRef.current = monaco;
	// 	setContent(editor.getModel()?.getValue());

	// 	// Custom save handler for Command+S or Ctrl+S
	// 	editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyS, () => {
	// 		const sFile = useStore.getState().selectedFile;
	// 		const curContent = editor.getModel()?.getValue();
	// 		const selectedItem = useStore.getState().selectedItem;
	// 		const savedNodes = useStore.getState().savedNodes;
	// 		if (
	// 			sFile !== null &&
	// 			curContent !== undefined &&
	// 			selectedItem !== null
	// 		) {
	// 			savedNodes[sFile][selectedItem.id].data.codeData.code =
	// 				curContent;
	// 			savedNodes[sFile][selectedItem.id].selected = true;
	// 			const rawGraphData = deserializeGraphData(
	// 				Object.values(savedNodes[sFile]),
	// 				Object.values(useStore.getState().savedEdges[sFile]),
	// 			);
	// 			saveFileContent(sFile, rawGraphData).then(() => {
	// 				useStore.getState().updateFileContent(() => rawGraphData);
	// 			});
	// 		}
	// 	});
	// };
	// useEffect(() => {
	// 	if (validItem) {
	// 		if (content !== undefined) {
	// 			// useSaveIndicator(editorPathKey, () =>
	// 			// 	content ===
	// 			// 		savedNodes[selectedFile][selectedItem.id]?.data.codeData
	// 			// 			.code
	// 			// 		? "saved"
	// 			// 		: "unsaved",
	// 			// );
	// 		}
	// 	}
	// }, [fileChanged, content]);
	// useEffect(() => {
	// 	const si = useStore.getState().selectedItem;
	// 	if (si !== null) {
	// 		useRunButton(si.item.object as Node<IGCCodeNodeData>);
	// 	}
	// }, [content, selectedItem?.id, currentSessionId]);

	// if (!validItem) {
	// 	return <div className="text-display">No node selected</div>;
	// }

	// if (
	// 	currentNodeItem.type !== "node" ||
	// 	!isCodeNode(currentNodeItem.object)
	// ) {
	// 	return <div className="text-display">Not a valid node selected</div>;
	// }
	// const currentNode = currentNodeItem.object;

	// const onChange = (content: string | undefined) => {
	// 	setContent(content);
	// 	console.log("Content changed", content);
	// 	sNodes(selectedFile, (prevNodes) => {
	// 		return prevNodes.map((node) => {
	// 			if (node.id === currentNode.id) {
	// 				currentNode.data.codeData.code = content ?? "";
	// 				return currentNode;
	// 			}
	// 			return node;
	// 		});
	// 	});
	//     if(content === "" && editorRef !== null && monacoRef !== null && monacoRef.current !== null){
	//         showSuggestionSnippet(selectedItem.item.type, "python", monacoRef.current, editorRef.current);
	//     }
	// };
	const selectedCodeNode = getCodeNode(useStore.getState().graph);
	const selectedItem = useStore((state) => state.selectedItem);
	useRunIndicator(
		useCallback(() => {
			return (
				selectedCodeNode !== null &&
				currentSessionId !== null &&
				sessionsData !== undefined
			);
		}, [selectedCodeNode, currentSessionId, sessionsData]),
		useCallback(() => {
			executeNode(selectedCodeNode);
		}, [selectedCodeNode]),
	);

	if (selectedItem === null || selectedCodeNode === null) {
		return <div>No Selected Code Node</div>;
	}
	const editorPathKey = `${fileData.filePath}\x1F${selectedCodeNode.id}`;
	let lastExecutionData = null;
	if (
		currentSessionId !== null &&
		sessionsData !== undefined &&
		sessionsData.sessions[currentSessionId] !== undefined
	) {
		const sessionData = sessionsData.sessions[currentSessionId];
		for (let i = sessionData.executions.length - 1; i >= 0; i--) {
			if (sessionData.executions[i].nodeId === selectedCodeNode.id) {
				lastExecutionData = sessionData.executions[i];
				break;
			}
		}
	}
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				overflowY: "scroll",
			}}
		>
			<div style={{ flex: "0 0 auto" }}>
				<MarkdownDisplay node={selectedCodeNode} />
			</div>
			<div
				style={{
					flex: "1 1 auto",
					height: "100%",
					position: "relative",
					// minHeight: "200px",
				}}
			>
				<Editor
					editorId={editorPathKey}
					language="python"
					sync={{
						currentContent: selectedCodeNode.data.codeData.code,
						triggerUpdate: (value) => syncDebounce(value),
					}}
					getSavedContent={() => {
						return useStore.getState().fileData.initialContent;
					}}
					//saveLogic={saveLogic}
					initialContent={
						getCodeNode(useStore.getState().graph).data.codeData
							.code
					}
					// onChange={onChange}
				/>
			</div>
			{lastExecutionData !== null && (
				<div style={{ flex: "0 0 auto", transition: "all 0.3s ease" }}>
					<TabbedCodeOutput
						executionData={lastExecutionData}
						// fitAddons={fitAddons}
					/>
				</div>
			)}
		</div>
	);
};

const CodeNodeView: IGCViewProps & RegistryComponent = createView(
	RawCodeNodeView,
	"CodeNodeView",
	"Code Node View",
	[CodeNode],
	0,
	{},
);

export default CodeNodeView;
