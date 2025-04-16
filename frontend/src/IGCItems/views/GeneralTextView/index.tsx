import { IGCViewProps } from "../BaseView";
import { createView } from "@/utils/componentCache";
import { RegistryComponent } from "@/types/frontend";

import useStore from "@/store/store";

import React, { useEffect, useRef } from "react";
// import { Editor } from "@monaco-editor/react";
import { editor, KeyMod, KeyCode } from "monaco-editor";
import { saveFileContent } from "@/requests";
import {
	deserializeGraphData,
	isValidJSON,
	serializeGraphData,
} from "@/IGCItems/utils/serialization";
import { Box } from "@mui/material";
import { useSaveIndicator } from "@/hooks/useSaveIndicator";
import Editor from "@/components/Editor";

const RawGeneralTextView: React.FC = () => {
	// Get data store variables
	const selectedFile = useStore((state) => state.selectedFile);
	const isIGCFile = useStore((state) => state.isIGCFile);

	// Check if a file is loaded
	if (selectedFile === null) {
		return <div className="text-display">No File Selected</div>;
	}

	// // const { selectedFile, fileContent, mode } = useStore();
	// const selectedFile = useStore((state) => state.selectedFile);
	// const fileContent = useStore((state) => state.fileContent);
	// const fileChanged = useStore((state) => state.fileChanged);
	// const isIGCFile = useStore((state) => state.isIGCFile);
	// const mode = useStore((state) => state.mode);
	// const [content, setContent] = React.useState<string | undefined>(undefined);

	// const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

	// const getNodes = useStore((state) => state.getNodes);
	// const getEdges = useStore((state) => state.getEdges);
	// const nodes = selectedFile === null ? [] : getNodes(selectedFile);
	// const edges = selectedFile === null ? [] : getEdges(selectedFile);

	// // Save indicator
	// const onMount = (editor: editor.IStandaloneCodeEditor) => {
	// 	editorRef.current = editor;
	// 	const curModel = editor.getModel();
	// 	if (curModel === null) {
	// 		return;
	// 	}
	// 	if (useStore.getState().isIGCFile) {
	// 		const rawGraphData = deserializeGraphData(nodes, edges);
	// 		if (curModel.getValue() !== rawGraphData) {
	// 			curModel.pushEditOperations(
	// 				[],
	// 				[
	// 					{
	// 						range: curModel.getFullModelRange(),
	// 						text: rawGraphData,
	// 					},
	// 				],
	// 				() => null,
	// 			);
	// 			editor.setModel(curModel);
	// 		}
	// 	}
	// 	setContent(curModel.getValue());

	// 	// Custom save handler for Command+S or Ctrl+S
	// 	editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyS, () => {
	// 		const sFile = useStore.getState().selectedFile;
	// 		const curContent = editor.getModel()?.getValue();
	// 		if (sFile !== null && curContent !== undefined) {
	// 			saveFileContent(sFile, curContent).then((_) => {
	// 				useStore.getState().updateFileContent(() => curContent);
	// 			});
	// 		}
	// 	});
	// };

	// const onChange = (value: string | undefined) => {
	// 	setContent(value);
	// 	if (useStore.getState().isIGCFile && editorRef.current !== null) {
	// 		const sFile = useStore.getState().selectedFile;
	// 		const curContent = editorRef.current.getModel()?.getValue();
	// 		if (
	// 			curContent !== undefined &&
	// 			sFile !== null &&
	// 			isValidJSON(curContent)
	// 		) {
	// 			const serializedData = serializeGraphData(curContent);
	// 			useStore.getState().setNodes(sFile, () => serializedData.nodes);
	// 			useStore.getState().setEdges(sFile, () => serializedData.edges);
	// 		}
	// 	}
	// };
	// useEffect(() => {
	// 	if (selectedFile !== null) {
	// 		if (content !== undefined) {
	// 			const fileHistory = useStore.getState().fileHistory;
	// 		}
	// 	}
	// }, [fileChanged, content]);

	// // if (selectedFile !== null) {
	// // 	useSaveIndicator(selectedFile, () => {
	// // 		if (selectedFile !== null) {
	// // 			if (content !== undefined) {
	// // 				const fileHistory = useStore.getState().fileHistory;
	// // 				return content ===
	// // 					fileHistory[selectedFile]?.lastSavedContent
	// // 					? "saved"
	// // 					: "unsaved";
	// // 			}
	// // 		}
	// // 		return "none";
	// // 	});
	// // }

	// useEffect(() => {
	// 	// If IGC file, then whenever the node and edge data change, update the content
	// 	if (useStore.getState().isIGCFile && editorRef.current !== null) {
	// 		const rawGraphData = deserializeGraphData(nodes, edges);
	// 		const curModel = editorRef.current.getModel();
	// 		if (curModel === null) {
	// 			return;
	// 		}
	// 		curModel.pushEditOperations(
	// 			[],
	// 			[
	// 				{
	// 					range: curModel.getFullModelRange(),
	// 					text: rawGraphData,
	// 				},
	// 			],
	// 			() => null,
	// 		);
	// 		editorRef.current.setModel(curModel);
	// 		setContent(rawGraphData);
	// 	}
	// }, [nodes, edges]);
	// useEffect(() => {
	// 	if (selectedFile !== null && editorRef.current !== null) {
	// 		// editorRef.current.layout(undefined, true);
	// 	}
	// }, [selectedFile, useStore.getState().selectedItem]);

	// if (selectedFile !== null) {
	// 	useStore.getState().setHasEditorCreated(selectedFile);
	// }

	// if (fileContent === null || selectedFile === null) {
	// 	return <div className="text-display">No File Selected</div>;
	// }

	return (
		<Editor
			editorId="selectedFile"
			{...(isIGCFile && { language: "json" })}
            getSavedContent={() => {
                return useStore.getState().fileContent || "";
            }}
		/>
		// <Box
		// 	sx={{
		// 		position: "absolute",
		// 		top: 0,
		// 		left: 0,
		// 		right: 0,
		// 		bottom: 0,
		// 	}}
		// >
		// 	<Editor
		// 		path={selectedFile}
		// 		height="100%"
		// 		{...(isIGCFile && { defaultLanguage: "json" })}
		// 		defaultValue={fileContent}
		// 		theme={mode === "light" ? "light" : "vs-dark"}
		// 		onChange={onChange}
		// 		onMount={onMount}
		// 	/>
		// </Box>
	);
};

const GeneralTextView: IGCViewProps & RegistryComponent = createView(
	RawGeneralTextView,
	"GeneralTextView",
	"File Data",
	[],
	0,
	{},
);

export default GeneralTextView;
