import { IGCViewProps } from "../BaseView";
import { createView } from "@/utils/componentCache";
import { RegistryComponent } from "@/types/frontend";

import { useEffect, useRef, useState } from "react";
import {
	DataSet,
	Network,
	Node,
	Edge,
	IdType,
} from "vis-network/standalone/esm/vis-network";
import styles from "./ExploratoryView.module.css";
import useStore from "@/store/store";
import { IGCFileSessionData } from "shared";
import useTextDialog from "@/components/TextDialog/useTextDialog";
import {
	createExecutionData,
	createNewSession,
	loadSessionData,
	updateExecutionRelationships,
} from "@/utils/sessionHandler";
import { callExecuteMany } from "@/requests";

interface PathNode {
	id: string;
	label: string;
}

interface ContextMenuState {
	visible: boolean;
	x: number;
	y: number;
	nodeId: IdType | null;
}

interface TreeNode {
	id: string; // Unique internal ID
	originalId: string; // Original ID from the data
	label: string;
	children: TreeNode[];
}

interface InsertAction {
	position: "before" | "after" | "replace";
	nodeId: IdType;
}

const buildTree = (paths: PathNode[][]): TreeNode => {
	const root: TreeNode = {
		id: "root",
		originalId: "",
		label: "Root",
		children: [],
	};
	let nodeIdCounter = 0; // For generating unique internal IDs

	for (const path of paths) {
		let currentNode = root;
		let diverged = false;

		for (let i = 0; i < path.length; i++) {
			const nodeData = path[i];
			let childNode;

			if (!diverged) {
				// Try to find an existing child node with the same originalId
				childNode = currentNode.children.find(
					(child) => child.originalId === nodeData.id,
				);

				if (childNode) {
					currentNode = childNode;
				} else {
					// No matching child; divergence occurs
					diverged = true;
				}
			}

			if (diverged) {
				// Create a new node
				nodeIdCounter++;
				const newNode: TreeNode = {
					id: "node" + nodeIdCounter,
					originalId: nodeData.id,
					label: `${nodeData.label} (${nodeData.id})`,
					children: [],
				};
				currentNode.children.push(newNode);
				currentNode = newNode;
			}
		}
	}

	return root;
};

const findExecutionTreeNodePath = (
	node: TreeNode,
	executionPath: PathNode[],
	pathIndex: number,
	path: TreeNode[],
): boolean => {
	// Deep comparison of originalId and label
	if (
        executionPath.length > pathIndex &&
        executionPath[pathIndex].id !== undefined && (
		node.originalId !== executionPath[pathIndex].id ||
		node.label !==
			`${executionPath[pathIndex].label} (${executionPath[pathIndex].id})`)
	) {
		return false;
	}

	path.push(node);

	if (pathIndex === executionPath.length - 1) {
		// Reached the end of the execution path
		return true;
	}

	for (const child of node.children) {
		if (
			findExecutionTreeNodePath(child, executionPath, pathIndex + 1, path)
		) {
			return true;
		}
	}

	// Backtrack if no matching path is found from this node
	path.pop();
	return false;
};

const traverseTree = (
	node: TreeNode,
	nodesArray: Node[],
	edgesArray: Edge[],
	executionPathNodeIds: string[],
	nodeColor: string,
	nodeFontColor: string,
	highlightColor: string,
	edgeColor: string,
	parentNodeId?: string,
) => {
	// Skip the root node
	if (node.id !== "root") {
		nodesArray.push({
			id: node.id,
			label: node.label,
			color: executionPathNodeIds.includes(node.id)
				? highlightColor
				: nodeColor,
			font: {
				color: nodeFontColor,
			},
			shape: "dot",
			size: 15,
			borderWidth: 2,
		});
		if (parentNodeId) {
			edgesArray.push({
				from: parentNodeId,
				to: node.id,
				color: edgeColor,
			});
		}
	}

	// Recursively traverse children
	for (const child of node.children) {
		traverseTree(
			child,
			nodesArray,
			edgesArray,
			executionPathNodeIds,
			nodeColor,
			nodeFontColor,
			highlightColor,
			edgeColor,
			node.id,
		);
	}
};

const findPathToNode = (
	node: TreeNode,
	targetNodeId: string,
	path: TreeNode[] = [],
): TreeNode[] | null => {
	// Add the current node's ID to the path
	path.push(node);

	// Check if the current node is the target node
	if (node.id === targetNodeId) {
		return path;
	}

	// Recursively search in the children
	for (const child of node.children) {
		const result = findPathToNode(child, targetNodeId, [...path]);
		if (result) {
			return result;
		}
	}

	// If not found, return null
	return null;
};

const getCurrentExecutionPath = (): PathNode[] => {
	const fileData = useStore.getState().fileData;
	const currentSessionId = useStore.getState().currentSessionId;

	const sessionsData: IGCFileSessionData | null =
		fileData === null
			? null
			: useStore.getState().getSessionData(fileData.filePath) ?? null;
	if (
		sessionsData === null ||
		fileData === null ||
		currentSessionId === null
	) {
		return [];
	}
	const nodeIdLabelPairs: { [id: string]: string } = useStore
		.getState()
		.graph.nodes
		.reduce<{ [id: string]: string }>((acc, n) => {
			acc[n.id] = n.data.label;
			return acc;
		}, {});

	return [
		{ id: "start", label: "start" },
		...sessionsData.sessions[currentSessionId].executions.map((e) => {
			return {
				id: e.nodeId,
				label: nodeIdLabelPairs[e.nodeId],
			};
		}),
	];
};

const RawExploratoryView = () => {
	const { openTextDialog, TextDialogPortal } = useTextDialog();
	const [insertType, setInsertType] = useState<InsertAction | null>(null);

	const containerRef = useRef<HTMLDivElement>(null);
	const treeRef = useRef<TreeNode | null>(null);
	const [contextMenu, setContextMenu] = useState<ContextMenuState>({
		visible: false,
		x: 0,
		y: 0,
		nodeId: null,
	});

	const mode = useStore((state) => state.mode);
	const lightMode = mode === "light";

	const currentSessionId = useStore((state) => state.currentSessionId);

	const executionPath = getCurrentExecutionPath();

	const nodeColor = lightMode ? "#cccccc" : "#888888";
	const nodeFontColor = lightMode ? "#000000" : "#ffffff";
	const edgeColor = lightMode ? "#cccccc" : "#888888";
	const highlightColor = "#ff6347";

	const getPaths = (): PathNode[][] => {
		const fileData = useStore.getState().fileData;

		const sessionsData: IGCFileSessionData | null =
			fileData === null
				? null
				: useStore.getState().getSessionData(fileData.filePath) ?? null;
		if (sessionsData === null || fileData === null) {
			return [];
		}
		const nodeIdLabelPairs: { [id: string]: string } = useStore
			.getState()
			.graph.nodes
			.reduce<{ [id: string]: string }>((acc, n) => {
				acc[n.id] = n.data.label;
				return acc;
			}, {});

		const retList = [];
		const sessions = Object.keys(sessionsData.sessions);
		for (let i = 0; i < sessions.length; i++) {
			const sessionId = sessions[i];
			const session = sessionsData.sessions[sessionId];
			retList.push([
				{ id: "start", label: "start" },
				...session.executions.map((e) => {
					return {
						id: e.nodeId,
						label: nodeIdLabelPairs[e.nodeId],
					};
				}),
			]);
		}

		return retList;
	};
	const paths = getPaths();

	const root = buildTree(paths);
	treeRef.current = root;

	const executionTreeNodePath: TreeNode[] = [];
	let found = false;
	for (const child of root.children) {
		if (
			findExecutionTreeNodePath(
				child,
				executionPath,
				0,
				executionTreeNodePath,
			)
		) {
			found = true;
			break;
		}
	}
	if (!found) {
		console.warn("Execution path not found in the tree.");
	}

	const nodesArray: Node[] = [];
	const edgesArray: Edge[] = [];

	const executionPathNodeIds = executionTreeNodePath.map((node) => node.id);

	traverseTree(
		root,
		nodesArray,
		edgesArray,
		executionPathNodeIds,
		nodeColor,
		nodeFontColor,
		highlightColor,
		edgeColor,
	);

	const nodes = new DataSet<Node>(nodesArray);
	const edges = new DataSet<Edge>(edgesArray);

	const data = { nodes, edges };

	// Configure options for hierarchical layout
	const options = {
		layout: {
			hierarchical: {
				direction: "UD", // Up to Down
				sortMethod: "directed",
				nodeSpacing: 200,
				levelSeparation: 150,
			},
		},
		nodes: {
			shape: "dot",
			size: 15,
			borderWidth: 2,
		},
		edges: {
			smooth: {
				enabled: true,
				type: "cubicBezier",
				forceDirection: "vertical",
				roundness: 0.4,
			},
		},
		physics: {
			enabled: false, // Disable physics since we're using a hierarchical layout
		},
		interaction: {
			dragNodes: false, // Prevent manual node dragging
			zoomView: true,
			dragView: true,
			multiselect: false,
		},
	};
	useEffect(() => {
		if (containerRef.current !== null) {
			const network = new Network(containerRef.current, data, options);

			// Handle right-click events
			network.on("oncontext", (params) => {
				params.event.preventDefault();
				const nodeId = network.getNodeAt(params.pointer.DOM);

				if (nodeId) {
					const containerRect =
						containerRef.current!.getBoundingClientRect();
					const x = params.event.clientX - containerRect.left;
					const y = params.event.clientY - containerRect.top;

					setContextMenu({
						visible: true,
						x,
						y,
						nodeId,
					});
				}
			});

			// Hide context menu when clicking elsewhere
			const handleClick = () => {
				if (contextMenu.visible) {
					setContextMenu({ ...contextMenu, visible: false });
				}
			};

			document.addEventListener("click", handleClick);

			// Cleanup
			return () => {
				document.removeEventListener("click", handleClick);
				network.destroy();
			};
		}
	}, [contextMenu.visible, lightMode, currentSessionId]);

	const fileData = useStore.getState().fileData;
	const chosenNode = useStore((state) => state.chosenNode);

	useEffect(() => {
		if (
			chosenNode !== null &&
			insertType !== null &&
			treeRef.current !== null
		) {
			console.log(chosenNode);
			useStore.getState().setWaitForSelection((_) => false);
			useStore.getState().setChosenNode((_) => null);

			// Create new session based on the chosen node
			const index = executionTreeNodePath.findIndex(
				(node) => node.id === (insertType.nodeId as string),
			);
			if (index === -1) {
				throw new Error(
					`Node with id ${insertType.nodeId} not found in the path.`,
				);
			}

			const originalIdPath = executionTreeNodePath.map(
				(node) => node.originalId,
			);
            if(insertType.position === "replace") {
                originalIdPath.splice(
                    index,
                    1,
                    chosenNode.id,
                );
            }
            else if (insertType.position === "before") {
                originalIdPath.splice(
                    index,
                    0,
                    chosenNode.id,
                );
            }
            else if (insertType.position === "after") {
                originalIdPath.splice(
                    index + 1,
                    0,
                    chosenNode.id,
                );
            }
			originalIdPath.shift();
			console.log("New execution path:", originalIdPath);
			if (fileData === null) {
				return;
			}
			openTextDialog(defaultSessionName).then((sessionName) => {
				if (sessionName !== null) {
					createNewSession(fileData.filePath, sessionName).then(() => {
						createExecutionData(fileData.filePath, originalIdPath).then(
							(executionData) => {
								callExecuteMany(
									executionData,
									"python",
									fileData.filePath,
									sessionName,
								).then(() => {
									loadSessionData(fileData.filePath).then(
										(sessionData) => {
											useStore
												.getState()
												.setCurrentSessionId(
													() => sessionName,
												);
											updateExecutionRelationships(
												fileData.filePath,
												sessionData,
											);
										},
									);
								});
							},
						);
					});
				}
				setInsertType(null);
			});
		}
	}, [chosenNode, insertType]);

	if (fileData === null) {
		return <div className="text-display">No File Selected</div>;
	} else if (currentSessionId === null) {
		return <div className="text-display">No Session Selected</div>;
	}

	const defaultSessionName = `IGC_${new Intl.DateTimeFormat("en-GB", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	})
		.format(new Date())
		.replace(/,/, "")
		.replace(/\//g, "-")
		.replace(" ", "_")}`;

	const startNewSession = async (nodeId: IdType) => {
		setContextMenu({ ...contextMenu, visible: false });

		if (treeRef.current) {
			const path = findPathToNode(treeRef.current, nodeId as string);
			if (path) {
				console.log(`Path to node ${nodeId}:`, path);
				const realExecutionPath = path.map((node) => node.originalId);
				realExecutionPath.shift(); // For root node
				realExecutionPath.shift(); // For start node

				const sessionName = await openTextDialog(defaultSessionName);
                const fileData = useStore.getState().fileData;

				if (sessionName !== null) {
					createNewSession(fileData.filePath, sessionName).then(() => {
						createExecutionData(
							fileData.filePath,
							realExecutionPath,
						).then((executionData) => {
							callExecuteMany(
								executionData,
								"python",
								fileData.filePath,
								sessionName,
							).then(() => {
								loadSessionData(fileData.filePath).then(
									(sessionData) => {
										useStore
											.getState()
											.setCurrentSessionId(
												() => sessionName,
											);
										updateExecutionRelationships(
											fileData.filePath,
											sessionData,
										);
									},
								);
							});
						});
					});
				}
			} else {
				console.warn(`Node ${nodeId} not found in the tree.`);
			}
		} else {
			console.error("Tree not initialized.");
		}
	};
	const addBeforeSession = async (nodeId: IdType) => {
		setInsertType({ position: "before", nodeId: nodeId });
		setContextMenu({ ...contextMenu, visible: false });

		// const sessionName = await openTextDialog(defaultSessionName);
		useStore.getState().setWaitForSelection((_) => true);
	};
	const addAfterSession = async (nodeId: IdType) => {
		setInsertType({ position: "after", nodeId: nodeId });
		setContextMenu({ ...contextMenu, visible: false });

		// const sessionName = await openTextDialog(defaultSessionName);
		useStore.getState().setWaitForSelection((_) => true);
	};

    const replaceNodeSession = async (nodeId: IdType) => {
		setInsertType({ position: "replace", nodeId: nodeId });
		setContextMenu({ ...contextMenu, visible: false });

		// const sessionName = await openTextDialog(defaultSessionName);
		useStore.getState().setWaitForSelection((_) => true);
	};

	const nodeInExecutionPath = (nodeId: string) => {
		if (treeRef.current === null) {
			return false;
		}
		const path = findPathToNode(treeRef.current, nodeId as string);
		if (!path) {
			return false;
		}

		return executionPath.some(
			(e) => e.id === path[path.length - 1].originalId,
		);
	};

	const backgroundColor = lightMode ? "#ffffff" : "#1e1e1e";

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				position: "relative",
				backgroundColor: backgroundColor,
				margin: "2px",
			}}
		>
			{/* Context Menu */}
			{contextMenu.visible && (
				<div
					className={styles.contextMenu}
					style={{ top: contextMenu.y, left: contextMenu.x }}
				>
					<div
						className={styles.contextMenuItem}
						onClick={() => startNewSession(contextMenu.nodeId!)}
					>
						Start Session From Here
					</div>
					{nodeInExecutionPath(contextMenu.nodeId as string) && (
						<>
							{contextMenu.nodeId !== "node1" && (
								<div
									className={styles.contextMenuItem}
									onClick={() =>
										addBeforeSession(contextMenu.nodeId!)
									}
								>
									Insert Before Node
								</div>
							)}
                            <div
								className={styles.contextMenuItem}
								onClick={() =>
									replaceNodeSession(contextMenu.nodeId!)
								}
							>
								Replace Node
							</div>

							<div
								className={styles.contextMenuItem}
								onClick={() =>
									addAfterSession(contextMenu.nodeId!)
								}
							>
								Insert After Node
							</div>
						</>
					)}
				</div>
			)}

			{/* Network Graph */}
			<div ref={containerRef} style={{ width: "100%", height: "100%" }} />
			<TextDialogPortal />
		</div>
	);
};

const ExploratoryView: IGCViewProps & RegistryComponent = createView(
	RawExploratoryView,
	"ExploratoryView",
	"Exploratory View",
	[],
	10,
	{},
);

export default ExploratoryView;
