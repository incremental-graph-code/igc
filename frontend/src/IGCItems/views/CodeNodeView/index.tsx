import CodeNode, {
	IGCCodeNodeData,
	isCodeNode,
} from "@/IGCItems/nodes/CodeNode";
import { IGCViewProps } from "../BaseView";
import { createView } from "@/utils/componentCache";
import { RegistryComponent } from "@/types/frontend";

import useStore from "@/store/store";
import { Node } from "reactflow";

import React, { useEffect, useRef } from "react";
import { Editor, Monaco } from "@monaco-editor/react";
import { editor, KeyCode, KeyMod } from "monaco-editor";
import { useRunButton } from "../viewUtils";
import TabbedCodeOutput from "@/components/TabbedCodeOutput";
import { deserializeGraphData } from "@/IGCItems/utils/serialization";
import { saveFileContent } from "@/requests";
import { Box } from "@mui/material";
import MarkdownDisplay from "@/components/MarkdownDisplay";
import { showSuggestionSnippet } from "@/utils/codeTemplates";
import { useSaveIndicator } from "@/hooks/useSaveIndicator";

const RawCodeNodeView: React.FC = () => {
	const selectedFile = useStore((state) => state.selectedFile);
	const selectedItem = useStore((state) => state.selectedItem);
	const fileChanged = useStore((state) => state.fileChanged);
    const currentSessionId = useStore((state) => state.currentSessionId);
	const mode = useStore((state) => state.mode);
	const setNodes = useStore((state) => state.setNodes);
	const savedNodes = useStore((state) => state.savedNodes);
	const getSessionData = useStore((state) => state.getSessionData);

    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);

	const [content, setContent] = React.useState<string | undefined>(undefined);

	const validItem =
		selectedFile !== null &&
		selectedItem !== null &&
		selectedItem.item.type === "node";

	// Save indicator
	const onMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
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
				savedNodes[sFile][selectedItem.id].data.codeData.code =
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
				// useSaveIndicator(editorPathKey, () =>
				// 	content ===
				// 		savedNodes[selectedFile][selectedItem.id]?.data.codeData
				// 			.code
				// 		? "saved"
				// 		: "unsaved",
				// );
			}
		}
	}, [fileChanged, content]);
	useEffect(() => {
		const si = useStore.getState().selectedItem;
		if (si !== null) {
			useRunButton(si.item.object as Node<IGCCodeNodeData>);
		}
	}, [content, selectedItem?.id, currentSessionId]);

	if (!validItem) {
		return <div className="text-display">No node selected</div>;
	}

	const currentNodeItem = selectedItem.item;
	if (
		currentNodeItem.type !== "node" ||
		!isCodeNode(currentNodeItem.object)
	) {
		return <div className="text-display">Not a valid node selected</div>;
	}
	const currentNode = currentNodeItem.object;

	const onChange = (content: string | undefined) => {
		setContent(content);
		console.log("Content changed", content);
		setNodes(selectedFile, (prevNodes) => {
			return prevNodes.map((node) => {
				if (node.id === currentNode.id) {
					currentNode.data.codeData.code = content ?? "";
					return currentNode;
				}
				return node;
			});
		});
        if(content === "" && editorRef !== null && monacoRef !== null && monacoRef.current !== null){
            showSuggestionSnippet(selectedItem.item.type, "python", monacoRef.current, editorRef.current);
        }
	};
	const editorPathKey = `${selectedFile}-${selectedItem.id}`;
	useStore.getState().setHasEditorCreated(editorPathKey);

	const sessionsData = getSessionData(selectedFile);
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
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
                overflowY: "scroll",
			}}
		>
			{selectedItem !== null && selectedItem.item.type === "node" ? (
				<div style={{ flexShrink: 0 }}>
					<MarkdownDisplay node={selectedItem.item.object} />
				</div>
			) : null}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					height: "100%",
                    // minHeight: "200px",
				}}
			>
				<div
					style={{
						flexGrow: 1,
					}}
				>
					<Box
						sx={{
							position: "relative",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
                            height: "100%",
						}}
					>
						<Editor
							path={editorPathKey}
							height="100%"
							defaultLanguage="python"
							defaultValue={currentNode.data.codeData.code}
							theme={mode === "light" ? "light" : "vs-dark"}
							onChange={onChange}
							onMount={onMount}
						/>
					</Box>
				</div>
			</div>
			{lastExecutionData !== null && (
				<div style={{ flexShrink: 0, transition: "all 0.3s ease" }}>
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
