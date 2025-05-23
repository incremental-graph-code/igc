import CodeNode, { IGCCodeNodeData } from "@/IGCItems/nodes/CodeNode";
import { IGCViewProps } from "../BaseView";
import { createView } from "@/utils/componentCache";
import { RegistryComponent } from "@/types/frontend";

import useStore from "@/store/store";
import { Node } from "reactflow";

import React, { useEffect, useRef } from "react";
import { Editor } from "@monaco-editor/react";
import { editor, KeyCode, KeyMod } from "monaco-editor";
import { useRunButton } from "../viewUtils";
import TabbedCodeOutput from "@/components/TabbedCodeOutput";
import { FitAddon } from "@xterm/addon-fit";
import { deserializeGraphData } from "@/IGCItems/utils/serialization";
import { saveFileContent } from "@/requests";
import { Box } from "@mui/material";
import DocumentationNode, { IGCDocumentationData, isDocumentationNode } from "@/IGCItems/nodes/DocumentationNode";

const RawDocumentationNodeView: React.FC = () => {
	const selectedFile = useStore((state) => state.selectedFile);
	const selectedItem = useStore((state) => state.selectedItem);
	const fileChanged = useStore((state) => state.fileChanged);
	const mode = useStore((state) => state.mode);
	const sNodes = useStore((state) => state.sNodes);
	const savedNodes = useStore((state) => state.savedNodes);
	const getSessionData = useStore((state) => state.getSessionData);

	const [content, setContent] = React.useState<string | undefined>(undefined);

	const validItem =
		selectedFile !== null &&
		selectedItem !== null &&
		selectedItem.item.type === "node";

	// Save indicator
	const onMount = (editor: editor.IStandaloneCodeEditor) => {
		setContent(editor.getModel()?.getValue());

		// Custom save handler for Command+S or Ctrl+S
		editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyS, () => {
			const sFile = useStore.getState().selectedFile;
			const curContent = editor.getModel()?.getValue();
			const selectedItem = useStore.getState().selectedItem;
			const savedNodes = useStore.getState().savedNodes;
			if (
				sFile !== null &&
				curContent !== undefined &&
				selectedItem !== null
			) {
				savedNodes[sFile][selectedItem.id].data.documentation =
					curContent;
				savedNodes[sFile][selectedItem.id].selected = true;
				const rawGraphData = deserializeGraphData(
					Object.values(savedNodes[sFile]),
					Object.values(useStore.getState().savedEdges[sFile]),
				);
				saveFileContent(sFile, rawGraphData).then((_) => {
					useStore.getState().updateFileContent(() => rawGraphData);
				});
			}
		});
	};
	useEffect(() => {
		if (validItem) {
			if (content !== undefined) {
				// useSaveIndicator(
				// 	content ===
				// 		savedNodes[selectedFile][selectedItem.id]?.data.documentation
				// 		? "saved"
				// 		: "outdated",
				// );
			}
		}
	}, [fileChanged, content]);

	if (!validItem) {
		return <div className="text-display">No node selected</div>;
	}

	const currentNodeItem = selectedItem.item;
    if(currentNodeItem.type !== 'node' || !isDocumentationNode(currentNodeItem.object)){
        return <div className="text-display">Not a valid node selected</div>;
    }
    const currentNode = currentNodeItem.object;

	const onChange = (content: string | undefined) => {
		setContent(content);
		console.log("Content changed", content);
		sNodes(selectedFile, (prevNodes) => {
			return prevNodes.map((node) => {
				if (node.id === currentNode.id) {
					currentNode.data.documentation = content ?? "";
                    return currentNode;
				}
				return node;
			});
		});
	};
	const editorPathKey = `${selectedFile}-${selectedItem.id}`;
	useStore.getState().setHasEditorCreated(editorPathKey);

	const sessionsData = getSessionData(selectedFile);
	const currentSessionId = useStore.getState().currentSessionId;
	let lastExecutionData = null;
	if (
		currentSessionId !== null &&
		sessionsData !== undefined &&
		sessionsData.sessions[currentSessionId] !== undefined
	) {
		const sessionData = sessionsData.sessions[currentSessionId];
		for (let i = sessionData.executions.length - 1; i >= 0; i--) {
			if (sessionData.executions[i].nodeId === selectedItem.id) {
				lastExecutionData = sessionData.executions[i];
				break;
			}
		}
	}
	return (
		<Box
			sx={{
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
			}}
		>
			<Editor
				path={editorPathKey}
				height="100%"
                defaultLanguage="markdown"
				defaultValue={currentNode.data.documentation}
				theme={mode === "light" ? "light" : "vs-dark"}
				onChange={onChange}
				onMount={onMount}
			/>
		</Box>
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
