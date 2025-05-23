import React, { useCallback, useContext, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { useRenderDebugger } from "@/hooks/useRenderDebugger";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import useStore from "@/store/store";
import { editor } from "monaco-editor";
import { FileSaveStatus, useSaveIndicator } from "@/hooks/useSaveIndicator";
import {
	GlobalKeyDownContext,
	KeyPressListener,
} from "@/providers/GlobalKeyDownProvider";
import { useDebouncedCallback } from "@/hooks/useDebounce";

/**
 * A generic Monaco-based editor component that supports:
 * - Save status tracking
 * - Keyboard shortcuts (e.g. Ctrl/Cmd+S)
 * - Content change detection and history
 * - Integration with external sync systems
 *
 * Designed for reuse across different editing contexts (text, snippet, etc.)
 */
interface EditorProps {
	/**
	 * Unique identifier for this editor instance (used for tracking/save indicator)
	 */
	editorId: string;

	/**
	 * Monaco language ID (e.g. "javascript", "json", "plaintext")
	 */
	language?: string;

	/**
	 * Optional getter for the "saved" content version to compare against for status display.
	 * Must return a consistent value during the lifetime of the editor to avoid unnecessary re-renders.
	 */
	getSavedContent?: () => string;

	/**
	 * Optional custom save logic called when user presses Ctrl+S / Cmd+S
	 */
	saveLogic?: (text: string | undefined) => void;

	/**
	 * Optional callback for text changes
	 */
	onChange?: (
		value: string | undefined,
		event: editor.IModelContentChangedEvent,
	) => void;

	/**
	 * Optional callback when the Monaco editor is mounted
	 */
	onMount?: (editor: editor.IStandaloneCodeEditor) => void;

	/**
	 * Optional trigger function from useSyncSystem (e.g. for 'text' or 'snippet')
	 * Called after onChange to notify other sync systems
	 */
	triggerSyncUpdate?: () => void;

	/**
	 * Optionally override the initial editor content
	 * If undefined, falls back to `getSavedContent()`
	 */
	initialContent?: string;

	/**
	 * Optional sync integration object for live syncing
	 */
	sync?: {
		/**
		 * Latest content from the store (used to sync into the editor)
		 */
		currentContent: string;

		/**
		 * Trigger the sync system; optionally updates the store first
		 */
		triggerUpdate: (value: string) => void;
	};
}

const addModelUpdate = (model: editor.ITextModel, value: string) => {
	const fullRange = model.getFullModelRange();
	const edits: editor.IIdentifiedSingleEditOperation[] = [
		{
			range: fullRange,
			text: value,
			forceMoveMarkers: true, // keep markers (breakpoints, squiggles, etc.) aligned
		},
	];
	model.pushEditOperations(null, edits, () => null);
};

const Editor = (props: EditorProps) => {
	const {
		editorId,
		getSavedContent,
		saveLogic = () => {},
		onChange,
		onMount,
		initialContent,
		language,
		sync,
	} = props;

	// Track the number of renders for performance testing
	useRenderDebugger(`Editor: ${editorId}`, props);

	// Check if the sync system has edited the model
	const isExternalUpdate = useRef(false);

	// Store the editor
	const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

	// State variables
	const [content, setContent] = React.useState<string | undefined>(undefined);

	// Subscribe to key press events
	const globalKeyCtx = useContext(GlobalKeyDownContext);
	const mode = useStore((state) => state.mode);

	// Sync with save indicator
	useSaveIndicator(editorId, () => {
		try {
			if (!getSavedContent) return FileSaveStatus.None;

			const saved = getSavedContent();
			if (content === undefined) return FileSaveStatus.None;
			if (content === saved) return FileSaveStatus.Saved;
			return FileSaveStatus.Unsaved;
		} catch {
			return FileSaveStatus.Error;
		}
	});

	// Save shortcut (Cmd/Ctrl + S)
	const handleSaveShortcut = useCallback<KeyPressListener>(
		(ev) => {
			if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "s") {
				ev.preventDefault();
				ev.stopPropagation();
				saveLogic(content);
			}
		},
		[saveLogic, content],
	);

	// Global key context subscription
	useEffect(() => {
		if (!globalKeyCtx) return;
		const unsubscribe = globalKeyCtx.subscribe(handleSaveShortcut);
		return () => unsubscribe();
	}, [globalKeyCtx, handleSaveShortcut]);

	useEffect(() => {
		if (!sync) return;
		const model = editorRef.current?.getModel();
		if (!model) return;

		const currentValue = model.getValue();
		if (currentValue !== sync.currentContent) {
			isExternalUpdate.current = true;
			addModelUpdate(model, sync.currentContent);
		}
	}, [sync?.currentContent]);

	// Focus / blur tracking
	const handleFocus = () => {
		globalKeyCtx?.setRawKeyOwner(editorId);
	};
	const handleBlur = () => {
		globalKeyCtx?.setRawKeyOwner(null);
	};

	// Handle editor change
	const handleChange = (
		value: string | undefined,
		event: editor.IModelContentChangedEvent,
	) => {
		if (isExternalUpdate.current) {
			isExternalUpdate.current = false;
			return;
		}

		setContent(value);
		onChange?.(value, event);

		// Trigger sync update if applicable
		if (sync) {
			sync.triggerUpdate(value ?? "");
		}
	};

	// Handle editor mount
	const handleMount = (editor: editor.IStandaloneCodeEditor) => {
		editorRef.current = editor;
		const curModel = editor.getModel();
		if (curModel === null) {
			// Initial loading of editor
			setContent(initialContent ?? getSavedContent?.());
		} else {
			// Model already exists
			const value = curModel.getValue();

			// Check if the sync system updated the model
			if (sync !== undefined && value !== sync.currentContent) {
				// Update the editor model with the latest content
				addModelUpdate(curModel, sync.currentContent);
				setContent(sync.currentContent);
			} else {
				setContent(value);
			}
		}
		onMount?.(editor);

		// Custom editor widgets
		editor.onDidFocusEditorWidget(handleFocus);
		editor.onDidBlurEditorWidget(handleBlur);
	};

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
				path={editorId}
				height="100%"
				theme={mode === "light" ? "light" : "vs-dark"}
				defaultLanguage={language}
				defaultValue={initialContent ?? getSavedContent?.()}
				onChange={handleChange}
				onMount={handleMount}
			/>
		</Box>
	);
};

export default Editor;
