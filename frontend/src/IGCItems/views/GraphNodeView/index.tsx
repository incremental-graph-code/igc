import { IGCViewProps } from "../BaseView";
import { createView } from "@/utils/componentCache";
import { RegistryComponent } from "@/types/frontend";

import useStore from "@/store/store";
import { Node } from "reactflow";

import React, { useEffect, useRef, useState } from "react";
import { fileExists } from "@/requests";
import AttachFileIcon from "@mui/icons-material/AttachFile"; // This is the file icon
import {
	Box,
	TextField,
	Tooltip,
	Typography,
	InputAdornment,
	IconButton,
} from "@mui/material";
import GraphNode, { GraphNodeData } from "@/IGCItems/nodes/GraphNode";
import path from "path-browserify";
import CustomSelect from "@/components/CustomSelect";
import { loadSessionData } from "@/utils/sessionHandler";
import { useRunButton } from "../viewUtils";
import TabbedCodeOutput from "@/components/TabbedCodeOutput";
import SessionInfo from "./SessionInfo";
import { IGCSession } from "shared";
import MarkdownDisplay from "@/components/MarkdownDisplay";

interface Session {
	id: string;
	name: string;
}

const RawGraphNodeView: React.FC = () => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [filePath, setFilePath] = useState<string>("");
	const [goodIGCFile, setGoodIGCFile] = useState<string | null>(null);
	const [sessions, setSessions] = useState<Session[]>([]);
	const [selectedSession, setSelectedSession] = useState<string>("");
	const [isFocused, setIsFocused] = useState(false);
	const [lastExecutionData, setLastExecutionData] = useState<any>(null);
	const [loadedSession, setLoadedSession] = useState<IGCSession | null>(null);

	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const sessionUpdate = useStore((state) => state.sessionUpdate);

	const selectedItem = useStore.getState().selectedItem;
	const curFile = useStore.getState().selectedFile;
	const sessionsData =
		curFile !== null
			? useStore.getState().getSessionData(curFile) ?? null
			: null;
	const currentSessionId = useStore.getState().currentSessionId;

    const fileInputValue = selectedFile ? selectedFile.name : filePath;

	const handleFileInputChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (file && file.name.endsWith(".igc")) {
			const formData = new FormData();
			formData.append("file", file);

			setSelectedFile(file);
			// onFileChange(file); // Trigger the logic for updating sessions related to the file
			// Simulating the updating of sessions (replace this with actual session update logic)
		}
	};

	const handleSessionChange = (sessionId: string) => {
		setSelectedSession(sessionId);
		const curFile = useStore.getState().selectedFile;
		const selectedItem = useStore.getState().selectedItem;
		if (curFile === null || selectedItem === null) {
			return;
		}
		useStore.getState().setNodes(curFile, (prevNodes) =>
			prevNodes.map((node) => {
				if (node.id === selectedItem.id) {
					(node as Node<GraphNodeData>).data.selectedSession =
						sessionId;
				}
				return node;
			}),
		);
		// onSessionChange(sessionId); // Trigger the session change logic
	};
	const handlePathChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setFilePath(event.target.value);
		// handleFilePathChange(event); // Propagate the change
	};

	const loadFileData = async () => {
		const curFile = useStore.getState().selectedFile;
		const selectedItem = useStore.getState().selectedItem;
		if (curFile !== null && selectedItem !== null) {
			// Check if the file path is absolute or relative
			const isAbsolute = path.isAbsolute(filePath);
			const igcFile = isAbsolute
				? filePath
				: path.join(path.dirname(curFile), filePath);
			if (igcFile.endsWith(".igc")) {
				// Check if the file exists
				const fileExistsPromise = await fileExists(igcFile);
				if (fileExistsPromise) {
					console.log(
						"Debounced action triggered with path:",
						igcFile,
					);
					useStore.getState().setNodes(curFile, (prevNodes) =>
						prevNodes.map((node) => {
							if (node.id === selectedItem.id) {
								(node as Node<GraphNodeData>).data.filePath =
									path.basename(igcFile);
							}
							return node;
						}),
					);
					setGoodIGCFile(igcFile);
					useStore.getState().setNodes(curFile, (prevNodes) =>
						prevNodes.map((node) => {
							if (node.id === selectedItem.id) {
								(node as Node<GraphNodeData>).data.filePath =
									igcFile;
							}
							return node;
						}),
					);
				}
			}
		}
	};
	useEffect(() => {
		const selectedItem = useStore.getState().selectedItem;
		const selectedFile = useStore.getState().selectedFile;
		if (selectedItem !== null && selectedFile !== null) {
			const graphNode = selectedItem.item.object as Node<GraphNodeData>;
			const filePath = graphNode.data.filePath;
			if (filePath === undefined) {
				return;
			}
			setFilePath(filePath);
			if (graphNode.data.selectedSession !== undefined) {
				loadSessionData(filePath).then((data) => {
					const sessionKeys = Object.keys(data.sessions);
					if (sessionKeys.includes(graphNode.data.selectedSession)) {
						setSelectedSession(graphNode.data.selectedSession);
					}
					setSessions(
						sessionKeys.map((key) => {
							return {
								id: key,
								name: key,
							};
						}),
					);
				});
			}
			// setSelectedSession(sessionId);
		}
	}, []);

	useEffect(() => {
		// Get session info from the selected file and session
		if (filePath === "" || selectedSession === "") {
			setLoadedSession(null);
			return;
		}
		const sessionData = useStore.getState().getSessionData(filePath);
		if (sessionData === undefined) {
			setLoadedSession(null);
			return;
		}
		const session = sessionData.sessions[selectedSession];
		if (session === undefined) {
			setLoadedSession(null);
			return;
		}
		setLoadedSession(session);
	}, [filePath, selectedSession]);
	useEffect(() => {
		if (goodIGCFile === null) {
			return;
		}
		loadSessionData(goodIGCFile).then((data) => {
			const sessionKeys = Object.keys(data.sessions);
			setSessions(
				sessionKeys.map((key) => {
					return {
						id: key,
						name: key,
					};
				}),
			);
		});
	}, [goodIGCFile]);

	useEffect(() => {
		setGoodIGCFile(null);
		if (filePath === "") {
			return;
		}
		// Clear the previous timeout if any
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		// Set a new timeout
		timeoutRef.current = setTimeout(() => {
			loadFileData(); // Trigger the function after 2 seconds
		}, 1000);

		// Clean up the timeout when the component unmounts or the value changes
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [filePath]); // Re-run the effect whenever `value` changes

	useEffect(() => {
		const si = useStore.getState().selectedItem;
		if (si !== null) {
			useRunButton(si.item.object as Node<GraphNodeData>);
		}
	}, [useStore.getState().selectedItem?.id]);

	useEffect(() => {
		if (
			sessionsData !== null &&
			currentSessionId !== null &&
			currentSessionId in sessionsData.sessions &&
			selectedItem !== null
		) {
			const sessionData = sessionsData.sessions[currentSessionId];
			for (let i = sessionData.executions.length - 1; i >= 0; i--) {
				if (sessionData.executions[i].nodeId === selectedItem.id) {
					setLastExecutionData(sessionData.executions[i]);
					break;
				}
			}
		}
	}, [sessionUpdate]);

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
				<div>
					<MarkdownDisplay node={selectedItem.item.object} />
				</div>
			) : null}
			<div style={{ flexGrow: 1, padding: "20px" }}>
				{/* File Input */}
				<Box>
					<label
						htmlFor="name-input"
						className="selection-pane-label"
					>
						File
					</label>
					<TextField
						value={fileInputValue}
						onChange={handlePathChange}
						onFocus={() => setIsFocused(true)}
						onBlur={(event) => {
							if (event.target) {
								event.target.scrollLeft =
									event.target.scrollWidth;
							}
							setIsFocused(false);
						}}
						fullWidth
						placeholder="Enter relative/absolute path or select a file"
						slotProps={{
							input: {
								endAdornment: (
									<InputAdornment position="end">
										<Tooltip
											title={
												selectedFile
													? selectedFile.name
													: "Select a .igc file"
											}
										>
											<IconButton
												component="label"
												className="icon-button"
											>
												<input
													type="file"
													accept=".igc"
													hidden
													onChange={
														handleFileInputChange
													}
												/>
												<AttachFileIcon />
											</IconButton>
										</Tooltip>
									</InputAdornment>
								),
							},
						}}
						sx={{
							"& .MuiOutlinedInput-root": {
								border: isFocused
									? goodIGCFile
										? "1px solid var(--primary)"
										: "1px solid red"
									: "none",
								backgroundColor:
									"var(--mui-palette-background-default)",
							},
							"& .MuiOutlinedInput-input": {
								padding: "10px",
							},
						}}
					/>
				</Box>

				{/* Session Selection */}
				<Box sx={{ paddingTop: "5px" }}>
					<label
						htmlFor="name-input"
						className="selection-pane-label"
					>
						Session
					</label>
					<CustomSelect
						id={""}
						options={sessions.map((session) => {
							return {
								value: session.id,
								label: session.name,
								style: {},
							};
						})}
						value={selectedSession}
						onChange={handleSessionChange}
						disabled={goodIGCFile === null}
					/>
					{/* <TextField
					select
					fullWidth
					label="Select Session"
					value={selectedSession}
					// onChange={handleSessionChange}
					disabled={!selectedFile} // Disable if no file is selected
				>
					{sessions.map((session) => (
						<MenuItem key={session.id} value={session.id}>
							{session.name}
						</MenuItem>
					))}
				</TextField> */}
				</Box>

				{/* Basic Info Box */}
				<Box
					sx={{
						paddingTop: "5px",
						bgcolor: selectedSession ? "inherit" : "gray",
					}}
				>
					<label
						htmlFor="name-input"
						className="selection-pane-label"
					>
						Session Info
					</label>
					{loadedSession && (
						<SessionInfo
							sessionId={selectedSession}
							executionOrder={loadedSession.executions.map(
								(e) => e.nodeId,
							)}
							lastUpdated={loadedSession.lastUpdate}
							variables={loadedSession.overallConfiguration}
						/>
					)}
				</Box>
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

const GraphNodeView: IGCViewProps & RegistryComponent = createView(
	RawGraphNodeView,
	"GraphNodeView",
	"Graph Node View",
	[GraphNode],
	0,
	{},
);

export default GraphNodeView;
