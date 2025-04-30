import React, { useCallback, useContext, useEffect } from "react";
import { Box } from "@mui/material";
import { useRenderDebugger } from "@/hooks/useRenderDebugger";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import useStore from "@/store/store";
import { editor } from "monaco-editor";

// import { debounce } from 'lodash';
import { useSaveIndicator } from "@/hooks/useSaveIndicator";
import {
	GlobalKeyDownContext,
	KeyPressListener,
} from "@/providers/GlobalKeyDownProvider";

interface EditorProps {
	editorId: string;
	language?: string;
	getSavedContent?: () => string;
	saveLogic?: (string) => void;
	onChange?: (
		value: string | undefined,
		event: editor.IModelContentChangedEvent,
	) => void;
	onMount?: (editor: editor.IStandaloneCodeEditor) => void;
}
/**
 * Text editor component that uses Monaco Editor to provide syntax highlighting and other features.
 * @param props
 * @returns
 */
const Editor = (props: EditorProps) => {
	let { getSavedContent, saveLogic } = props;

	// Track the number of renders for performance testing
	useRenderDebugger(`Editor: ${props.editorId}`, props);

	// State variables
	const [content, setContent] = React.useState<string | undefined>(undefined);

	// Subscribe to key press events
	const globalKeyCtx = useContext(GlobalKeyDownContext);

	// Focus event
	const handleFocus = () => {
		// Set the editor as the key owner
		globalKeyCtx?.setRawKeyOwner(props.editorId);
	};
	// Blur event
	const handleBlur = () => {
		// Clear the key owner
		globalKeyCtx?.setRawKeyOwner(null);
	};

	// Provide default logic if none is provided
	if (getSavedContent === undefined) {
		getSavedContent = () => "test";
	}
	if (saveLogic === undefined) {
		saveLogic = () => {};
	}

	// Handle save logic
	const handleSaveShortcut = useCallback<KeyPressListener>(
		(ev) => {
			const isSaveCombo =
				(ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "s";

			// Bail if it is not the save combo
			if (
				!isSaveCombo
			)
				return;

			ev.preventDefault();
			ev.stopPropagation();

            // Call the save logic
			saveLogic(content);
		},
		[saveLogic, content],
	);

	// Get theme mode
	const mode = useStore((state) => state.mode);

	/* Indicators */
	// Save Indicator
	useSaveIndicator(props.editorId, () => {
		try {
			// Get saved content and compare with current value
			const savedContent = getSavedContent();
			if (content === undefined) {
				return "none";
			} else if (content === savedContent) {
				return "saved";
			}
			return "unsaved";
		} catch {
			// Set the file save status to error
			return "error";
		}
	});

	// // Use Effect functions
	// useEffect(() => {
	//     // Update the save indicator
	//     debounce(() => {
	//         // Get saved content and compare with current value
	//         const savedContent = getSavedContent();
	//         if (savedContent !== content) {
	//             // Set the file save status to unsaved
	//         } else {
	//             // Set the file save status to saved
	//         }
	//       }, 300),
	//       [getSavedContent]
	// }, [content]);

	// On Change code
	const onChange = (
		value: string | undefined,
		event: editor.IModelContentChangedEvent,
	) => {
		setContent(value);
		props.onChange?.(value, event);
	};

	// On Mount code
	const onMount = (editor: editor.IStandaloneCodeEditor) => {
		const curModel = editor.getModel();
		if (curModel === null) {
			return;
		}
		setContent(curModel.getValue());
		props.onMount?.(editor);

		// Custom editor widgets
		editor.onDidFocusEditorWidget(handleFocus);
		editor.onDidBlurEditorWidget(handleBlur);
	};

	// Subscribe to global keydown context and forward to editor
	useEffect(() => {
		if (!globalKeyCtx) return;

		const unsubscribe = globalKeyCtx.subscribe(handleSaveShortcut);
		// const unsubscribe = globalKeyCtx.subscribe(() => {
		// 	if (!editor) return;
		// });

		return () => unsubscribe();
	}, [globalKeyCtx, handleSaveShortcut]);

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
			<MonacoEditor
				path={props.editorId}
				height="100%"
				defaultLanguage={props.language}
				defaultValue={getSavedContent()}
				theme={mode === "light" ? "light" : "vs-dark"}
				onChange={onChange}
				onMount={onMount}
			/>
		</Box>
	);
};

export default Editor;
