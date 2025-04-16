import { IGCViewProps } from "../BaseView";
import { createView } from "@/utils/componentCache";
import { RegistryComponent } from "@/types/frontend";
import React, { useEffect, useMemo, useState } from "react";
import CodeNode, {
	IGCCodeNodeData,
	isCodeNode,
} from "@/IGCItems/nodes/CodeNode";
import {
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	SelectChangeEvent,
	ToggleButton,
	ToggleButtonGroup,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Edge, Node } from "reactflow";
import {
	IGCDocumentationData,
	isDocumentationNode,
} from "@/IGCItems/nodes/DocumentationNode";
import ReactMarkdown from "react-markdown";
import { Editor } from "@monaco-editor/react";
import useStore from "@/store/store";
import { getExecutionPathFromSession } from "@/utils/sessionHandler";
import { getIncomingNodes, getOutgoingNodes } from "@/IGCItems/utils/utils";

const StyledToggleButton = styled(ToggleButton)({
	"&.Mui-selected": {
		backgroundColor: "var(--primary)",
	},
});

const RawProjectionView: React.FC = () => {
	const [mode, setMode] = useState<
		"Execution" | "Dependency" | "Class" | undefined
	>(undefined);
	const [dependencyChosen, setDependencyChosen] = useState<
		string | undefined
	>(undefined);
	const [display, setDisplay] = useState<string[]>(["Code", "Documentation"]);
	const [view, setView] = useState<JSX.Element[]>([]);

	const curSession = useStore((state) => state.currentSessionId);
	const selectedItem = useStore((state) => state.selectedItem);

	const handleModeChange = (
		event: SelectChangeEvent<"Execution" | "Dependency" | "Class">,
	) => {
		setMode(event.target.value as "Execution" | "Dependency" | "Class");
	};

	const partOfExecution = useMemo((): boolean => {
		const selectedFile = useStore.getState().selectedFile;
		if (
			selectedFile === null ||
			curSession === null ||
			selectedItem === null
		) {
			return false;
		}
		const sessionData = useStore.getState().getSessionData(selectedFile);
		const curSessionData = sessionData?.sessions[curSession];
		if (curSessionData === undefined) {
			return false;
		}
		// see if selected item exists in the current session
		for (const execution of curSessionData.executions) {
			if (execution.nodeId === selectedItem.id) {
				return true;
			}
		}
		return false;
	}, [selectedItem, curSession]);
	const partOfDependency = useMemo((): boolean => {
		if (selectedItem === null) {
			return false;
		}
		// check if the selected item has new definitions or dependencies
		const curNode: Node<IGCCodeNodeData> = selectedItem.item
			.object as Node<IGCCodeNodeData>;
		return (
			(curNode.data.codeData.dependencies !== undefined &&
				(curNode.data.codeData.dependencies.variables.length > 0 ||
					curNode.data.codeData.dependencies.functions.length > 0 ||
					curNode.data.codeData.dependencies.classes.length > 0)) ||
			(curNode.data.codeData.new_definitions !== undefined &&
				(curNode.data.codeData.new_definitions.variables.length > 0 ||
					curNode.data.codeData.new_definitions.functions.length >
						0 ||
					curNode.data.codeData.new_definitions.classes.length > 0))
		);
	}, [selectedItem]);
	const partOfClass = useMemo((): boolean => {
		if (selectedItem === null) {
			return false;
		}
		return ["ClassNode", "MethodNode"].includes(
			selectedItem.item.object.type ?? "",
		);
	}, [selectedItem]);

	const handleDisplayChange = (
		event: React.MouseEvent<HTMLElement>,
		newDisplay: string[],
	) => {
		if (newDisplay !== null) {
			setDisplay(newDisplay);
		}
	};

	const renderContent = async (): Promise<JSX.Element[]> => {
		switch (mode) {
			case "Execution":
				return (await renderExecutionContent()).filter(
					(content) => content !== null,
				);
			case "Dependency":
				return renderDependencyContent().filter(
					(content) => content !== null,
				);
			case "Class":
				return renderClassContent().filter(
					(content) => content !== null,
				);
			default:
				return [
					<div key="default">Select the type of projection.</div>,
				];
		}
	};

	const renderExecutionContent = async () => {
		const selectedFile = useStore.getState().selectedFile;
		const currentSessionId = useStore.getState().currentSessionId;

		if (selectedFile === null) {
			return [<div key="no-file">Select a file to view content.</div>];
		}
		if (currentSessionId === null) {
			return [
				<div key="no-session">Select a session to view content.</div>,
			];
		}

		const executionPath = await getExecutionPathFromSession(
			selectedFile,
			currentSessionId,
		);
		const nodes = useStore.getState().getNodes(selectedFile);
		const edges = useStore.getState().getEdges(selectedFile);
		const codeNodes = executionPath.map((nodeId) =>
			nodes.find((node) => isCodeNode(node) && node.id === nodeId),
		);

		return renderNodeData(
			getCorrespondingDocumentationNodes(codeNodes, nodes, edges),
			codeNodes,
		);
	};

	const renderDependencyContent = () => {
		const handleDependencyChange = (val: SelectChangeEvent<string>) => {
			console.log("Dependency changed");
			setDependencyChosen(val.target.value);
		};

		// Get all dependencies of the selected item
		const selectedFile = useStore.getState().selectedFile;
		if (selectedFile === null) {
			return [<div key="no-file">Select a file to view content.</div>];
		}
		if (selectedItem === null) {
			return [<div key="no-item">Select an item to view content.</div>];
		}
		const curNode: Node<IGCCodeNodeData> = selectedItem.item
			.object as Node<IGCCodeNodeData>;
		const dependencies = curNode.data.codeData.dependencies;
		const newDefinitions = curNode.data.codeData.new_definitions;
		const allDeps = new Set<string>();
		if (dependencies !== undefined) {
			dependencies.variables.forEach((variable) => allDeps.add(variable));
			dependencies.functions.forEach((func) => allDeps.add(func));
			dependencies.classes.forEach((cls) => allDeps.add(cls));
		}
		if (newDefinitions !== undefined) {
			newDefinitions.variables.forEach((variable) =>
				allDeps.add(variable),
			);
			newDefinitions.functions.forEach((func) => allDeps.add(func));
			newDefinitions.classes.forEach((cls) => allDeps.add(cls));
		}
		const containsDependency = (
			dep: string,
			node: Node<IGCCodeNodeData>,
		): boolean => {
			if (node.data.codeData.dependencies !== undefined) {
				const v =
					node.data.codeData.dependencies.variables.includes(dep) ||
					node.data.codeData.dependencies.functions.includes(dep) ||
					node.data.codeData.dependencies.classes.includes(dep);
				console.log(v);
				return v;
			}
			return false;
		};

		// Display all associated dependencies
		const depNodes = [];
		const nodes = useStore.getState().getNodes(selectedFile);
		const edges = useStore.getState().getEdges(selectedFile);

		const depEdges = edges.filter(
			(edge) => edge.type === "DependencyRelationship",
		);
		if (dependencyChosen !== undefined) {
			const connectedDepOutNodes = getOutgoingNodes(
				selectedItem.id,
				nodes,
				depEdges,
				(node) =>
					isCodeNode(node) &&
					containsDependency(dependencyChosen, node),
			);
			const connectedDepInNodes = getIncomingNodes(
				selectedItem.id,
				nodes,
				depEdges,
				(node) =>
					isCodeNode(node) &&
					containsDependency(dependencyChosen, node),
			);
			depNodes.push(
				...connectedDepOutNodes.filter((n) => n.id !== selectedItem.id),
				curNode,
				...connectedDepInNodes.filter((n) => n.id !== selectedItem.id),
			);
		}

		return [
			<FormControl
				variant="outlined"
				size="small"
				style={{
					marginTop: "10px",
					marginBottom: "10px",
					width: "100%",
					// backgroundColor: "white",
				}}
			>
				<InputLabel>Dependency</InputLabel>
				<Select
					value={dependencyChosen}
					onChange={handleDependencyChange}
					label="Dependency"
				>
					{Array.from(allDeps).map((dep) => (
						<MenuItem value={dep}>{dep}</MenuItem>
					))}
				</Select>
			</FormControl>,
			...renderNodeData(
				getCorrespondingDocumentationNodes(depNodes, nodes, edges),
				depNodes,
			),
		];
	};

	const renderClassContent = () => {
		const selectedFile = useStore.getState().selectedFile;
		const currentSessionId = useStore.getState().currentSessionId;
		if (selectedFile === null) {
			return [<div key="no-file">Select a file to view content.</div>];
		}
		if (currentSessionId === null) {
			return [
				<div key="no-session">Select a session to view content.</div>,
			];
		}
		if (selectedItem === null) {
			return [<div key="no-item">Select an item to view content.</div>];
		}

		// Check if the selected item is a class or method node
		let classNode: Node<IGCCodeNodeData> | undefined = undefined;
		if (selectedItem.item.object.type === "ClassNode") {
			// Get all methods associated with the class
			classNode = selectedItem.item.object as Node<IGCCodeNodeData>;
		} else if (selectedItem.item.object.type === "MethodNode") {
			// Get the class associated with the method
			const nodes = useStore.getState().getNodes(selectedFile);
			const edges = useStore.getState().getEdges(selectedFile);
			const outgoingNodes = getOutgoingNodes(
				selectedItem.id,
				nodes,
				edges,
				(node) => node.type === "ClassNode",
			);
			if (outgoingNodes.length > 0) {
				classNode = outgoingNodes[0];
			}
		}
		if (classNode === undefined) {
			return [
				<div key="no-class">
					Selected item is not a class or method node.
				</div>,
			];
		}
		// Get all methods associated with the class
		const nodes = useStore.getState().getNodes(selectedFile);
		const edges = useStore.getState().getEdges(selectedFile);
		const methodNodes = getIncomingNodes(
			classNode.id,
			nodes,
			edges,
			(node) => node.type === "MethodNode",
		);
		const renderNodes = [classNode, ...methodNodes] as (
			| Node<IGCCodeNodeData>
			| undefined
		)[];

		return renderNodeData(
			getCorrespondingDocumentationNodes(renderNodes, nodes, edges),
			renderNodes,
		);
	};
	const getCorrespondingDocumentationNodes = (
		codeNodes: (Node<IGCCodeNodeData> | undefined)[],
		allNodes: Node[],
		allEdges: Edge[],
	): (Node<IGCDocumentationData> | undefined)[] => {
		const documentationNodes = codeNodes.map((codeNode) =>
			codeNode
				? (getIncomingNodes(
						codeNode.id,
						allNodes,
						allEdges,
						isDocumentationNode,
				  )[0] as Node<IGCDocumentationData>)
				: undefined,
		);
		return documentationNodes;
	};

	const renderNodeData = (
		documentationNodes: (Node<IGCDocumentationData> | undefined)[],
		codeNodes: (Node<IGCCodeNodeData> | undefined)[],
	) => {
		return documentationNodes.map((docNode, index) => {
			const codeNode = codeNodes[index];

			if (!docNode && !codeNode) return null;

			// Calculate the height for the Monaco Editor based on the number of lines in the code
			const codeContent = codeNode?.data.codeData.code || "";
			const lineCount = codeContent.split("\n").length;
			const editorHeight = lineCount * 22;

			return (
				<div
					key={index}
					style={{
						marginBottom: "20px",
						border:
							codeNode !== undefined &&
							codeNode.id === selectedItem?.id
								? "1px solid cyan"
								: "1px solid transparent",
						borderRadius: "2px",
					}}
				>
					{display.includes("Documentation") && docNode && (
						<ReactMarkdown>
							{docNode.data.documentation}
						</ReactMarkdown>
					)}
					{display.includes("Code") && codeNode && (
						<Editor
							height={`${editorHeight}px`}
							language="python"
							value={codeContent}
							options={{
								readOnly: true,
								minimap: { enabled: false },
								scrollBeyondLastLine: false,
							}}
							theme={
								useStore.getState().mode === "dark"
									? "vs-dark"
									: "light"
							}
						/>
					)}
				</div>
			);
		});
	};

	useEffect(() => {
		let isMounted = true;
		renderContent().then((content) => {
			if (isMounted) {
				setView(content);
			}
		});
		return () => {
			isMounted = false; // Cleanup to avoid setting state if component is unmounted
		};
	}, [mode, display, selectedItem, curSession, dependencyChosen]);

	return (
		<div
			style={{
				padding: "10px",
				display: "flex",
				flexDirection: "column",
				gap: "10px",
				height: "100%",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
				<FormControl
					variant="outlined"
					size="small"
					style={{ flexGrow: 1 }}
				>
					<InputLabel>Select Projection</InputLabel>
					<Select
						value={mode}
						onChange={handleModeChange}
						label="Mode"
					>
						{partOfExecution && (
							<MenuItem value="Execution">Execution</MenuItem>
						)}
						{partOfDependency && (
							<MenuItem value="Dependency">Dependency</MenuItem>
						)}
						{partOfClass && (
							<MenuItem value="Class">Class</MenuItem>
						)}
					</Select>
				</FormControl>
				<ToggleButtonGroup
					value={display}
					onChange={handleDisplayChange}
					aria-label="display selection"
					size="small"
				>
					<StyledToggleButton value="Documentation">
						Documentation
					</StyledToggleButton>
					<StyledToggleButton value="Code">Code</StyledToggleButton>
				</ToggleButtonGroup>
			</div>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flexGrow: 1,
					height: "100vh",
					overflowY: "auto",
				}}
			>
				<div style={{ flexGrow: 1 }}>{view}</div>
			</div>
		</div>
	);
};

const ProjectionView: IGCViewProps & RegistryComponent = createView(
	RawProjectionView,
	"ProjectionView",
	"Projection View",
	[CodeNode],
	10,
	{},
);

export default ProjectionView;
