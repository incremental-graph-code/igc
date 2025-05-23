import { IGCViewProps } from "../BaseView";
import { createView } from "@/utils/componentCache";
import { RegistryComponent } from "@/types/frontend";

import useStore from "@/store/store";

import React from "react";
import Editor from "@/components/Editor";
import { saveFileContent } from "@/requests";
import { editor } from "monaco-editor";
import { deserializeGraphData, isValidJSON } from "@/IGCItems/utils/serialization";
import { updateSyncSystem } from "@/utils/syncRegistry";
import { SyncSystem } from "@/adapters/consts";
import { useDebouncedCallback } from "@/hooks/useDebounce";

const RawGeneralTextView: React.FC = () => {
	// Get data store variables
	const fileData = useStore((state) => state.fileData);
	const bufferText = useStore((state) => state.bufferText);
	const isIGCFile = useStore.getState().graph !== null;

	const syncDebounce = useDebouncedCallback((value: string) => {
        if (isValidJSON(value)) {
            updateSyncSystem(SyncSystem.Text, value);
        }
    }, 500);

	const saveLogic = (content: string) => {
		if (fileData === null || content === undefined) {
			return;
		}
		// EDIT WHEN SYNC REGISTRY IMPLEMENTED
		// saveFileContent(fileData.filePath, content).then(() => {
		// 	//useStore.getState().updateFileContent(() => content);
		// });
	};

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
	// 			useStore.getState().sNodes(sFile, () => serializedData.nodes);
	// 			useStore.getState().sEdges(sFile, () => serializedData.edges);
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

	// const onMount = (editor: editor.IStandaloneCodeEditor) => {
	//     if(isIGCFile) {
	//         const curModel = editor.getModel();
	//         if (curModel === null) {
	//             return;
	//         }
	//         const fullRange = curModel.getFullModelRange();
	//         const edits: editor.IIdentifiedSingleEditOperation[] = [
	//             {
	//               range: fullRange,
	//               text: useStore.getState().bufferText,
	//               forceMoveMarkers: true, // keep markers (breakpoints, squiggles, etc.) aligned
	//             },
	//           ];
	//         curModel.pushEditOperations(null, edits, () => null)
	//     }
	// }

	// Check if a file is loaded
	if (fileData === null) {
		return <div className="text-display">No File Selected</div>;
	}

	return (
		<Editor
			editorId={fileData.filePath}
			{...(isIGCFile && {
				language: "json",
				sync: {
					currentContent: bufferText,
					triggerUpdate: (value) => syncDebounce(value),
				},
			})}
			getSavedContent={() => {
				return useStore.getState().fileData.initialContent;
			}}
			saveLogic={saveLogic}
			initialContent={bufferText}
			// onMount={onMount}
		/>
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
