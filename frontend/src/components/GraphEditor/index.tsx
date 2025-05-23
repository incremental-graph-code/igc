import React, { useState, useRef, useEffect, useMemo } from "react";
import { Box, Button } from "@mui/material";
import {
	PlayArrow,
	BugReport,
	AddCircle,
	Home,
	PhotoCameraBack,
} from "@mui/icons-material";
import ReactFlow, {
	ReactFlowProvider,
	Background,
	Controls,
	MiniMap,
	applyEdgeChanges,
	applyNodeChanges,
	Edge,
	Node,
	Connection,
	NodeChange,
	EdgeChange,
	ReactFlowInstance,
	getRectOfNodes,
	getTransformForBounds,
} from "reactflow";
import "reactflow/dist/style.css";
import "./GraphEditor.css";
import {
	addEdge,
	getEdgeId,
	// updateExecutionPath,
	// updateExecutionPathEdge,
} from "../../IGCItems/utils/utils";
import CustomConnectionLine, {
	connectionLineStyle,
} from "../../IGCItems/relationships/CustomConnectionLine";
import { Item, ItemType } from "@/types/frontend";
import useStore from "@/store/store";
import FilterPane from "../FilterPane";
import { runAllAnalysis } from "@/utils/codeExecution";
import { STYLES } from "@/styles/constants";
import { createBaseNode, IGCNodeData } from "../../IGCItems/nodes/BaseNode";
import {
	convertMapToTrueEdgeTypes,
	convertMapToTrueNodeTypes,
} from "@/IGCItems/utils/types";
import {
	refreshSession,
	removeExecutionInSession,
	removeNodeInSession,
} from "@/utils/sessionHandler";
import { showRelevantDocumentation } from "@/IGCItems/nodes/DocumentationNode";
import { isGraphNode } from "@/IGCItems/nodes/GraphNode";
import { fileExists } from "@/requests";

import { toSvg } from "html-to-image";
import _ from "lodash";
import { useSyncSystem } from "@/hooks/useSyncSystem";
import { IGCGraph } from "@/types/graph";
import { graphToText, textToGraph } from "@/adapters/graph";
import { SyncSystem } from "@/adapters/consts";
import { createIGCGraph } from "@/utils/graph";
import { useDebounce } from "@/hooks/useDebounce";
import { useRenderDebugger } from "@/hooks/useRenderDebugger";
import { createStoreSetterWithGuard } from "@/store/utils";

const GraphEditor: React.FC = () => {
	// VARIABLES
	// Store variables
	const fileData = useStore((state) => state.fileData);

	// Selected Items
	const setSelectedItems = useStore((state) => state.setSelectedItems);
	const selectedItem = useStore((state) => state.selectedItem);

	// Graph Data
	const graph = useStore((state) => state.graph);
	const isIGC = graph !== null; //isIGCFile(fileData);
	const isExternalUpdate = useRef(false);

	// Node and Edge Functions
	// const getNodes = useStore((state) => state.getNodes);
	// const sNodes = useStore((state) => state.sNodes);
	// const getEdges = useStore((state) => state.getEdges);
	// const sEdges = useStore((state) => state.sEdges);

	// Session Id
	const currentSessionId = useStore((state) => state.currentSessionId);

	// Node Types
	const nodeTypes = useStore((state) => state.nodeTypes);
	const relationshipTypes = useStore((state) => state.relationshipTypes);

	// Local state to prevent massive rerendering
	const [nodes, setNodes] = useState<Node[]>(isIGC ? graph.nodes : []);
	const [relationships, setRelationships] = useState<Edge[]>(
		isIGC ? graph.relationships : [],
	);

	// STATE
	const [showGraph, setShowGraph] = useState(false); // If the graph should show up or not

	const [selectedNodes, setSelectedNodes] = useState<Node<IGCNodeData>[]>([]);

	const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);

	// REFERENCES
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

	// HOOKS
	const triggerUpdate = useSyncSystem<IGCGraph, string>(
		{
			id: SyncSystem.Graph,
			get: () => useStore.getState().graph,
			set: createStoreSetterWithGuard(
				() => useStore.getState().graph,
				(graph: IGCGraph) => useStore.getState().setGraph(graph),
			),
			serialize: graphToText,
			deserialize: textToGraph,
		},
		SyncSystem.Text,
	);

	// Update sync system with graph updates
	useDebounce(
		() => {
			if (isExternalUpdate.current || !isIGC) {
				return;
			}
			const newGraph = createIGCGraph(
				nodes,
				relationships,
				graph.sessions,
			);
			triggerUpdate(newGraph);
		},
		300,
		[nodes, relationships],
	);

	useEffect(() => {
		if (!isIGC) {
			return;
		}

		// isExternalUpdate.current = true;
		setNodes(graph.nodes);
		setRelationships(graph.relationships);
	}, [graph]);

	// Shows the graph if the file is a valid IGC file
	useEffect(() => {
		if (isIGC) {
			setShowGraph(true);
		} else {
			setShowGraph(false);
		}
	}, [isIGC]);

	// If a node is changed, check to see if there are any selection changes
	useEffect(() => {
		// Look at which nodes are selected
		const newSelectedNodes: Node[] = nodes.filter((node) => node.selected);

		// // REMOVE WHEN SYNCING IS DONE
		// if (
		// 	_.isEqual(
		// 		_.sortBy(newSelectedNodes.map((n) => n.id)),
		// 		_.sortBy(selectedNodes.map((n) => n.id)),
		// 	)
		// ) {
		// 	return;
		// }
		setSelectedNodes(newSelectedNodes);
	}, [nodes]);

	// If an edge is changed, check to see if there are any selection changes
	useEffect(() => {
		const newSelectedEdges: Edge[] = relationships.filter(
			(edge) => edge.selected,
		);

		// // REMOVE WHEN SYNCING IS DONE
		// if (
		// 	_.isEqual(
		// 		_.sortBy(newSelectedEdges.map((e) => e.id)),
		// 		_.sortBy(selectedEdges.map((e) => e.id)),
		// 	)
		// ) {
		// 	return;
		// }
		setSelectedEdges(newSelectedEdges);
	}, [relationships]);

	// useEffect(() => {
	// 	// if (useStore.getState().waitForSelection) {
	// 	// const curFile = useStore.getState().selectedFile;

	// 	// NOTE: Need to check if this will only run if the selected nodes have changed, or just when the address changes. To be debugged further.
	// 	if (selectedNodes.length > 0 && isIGC) {
	// 		useStore.getState().setChosenNode(() => selectedNodes[0]);
	// 		// setNodes((nds) => {
	// 		// 	return nds.map((node) => {
	// 		// 		if (node.id !== selectedNodes[0].id) {
	// 		// 			node.selected = false;
	// 		// 		}
	// 		// 		return node;
	// 		// 	});
	// 		// });
	// 	}
	// 	// }
	// }, [selectedNodes]);

	// When new selections are being made, update the selected items
	// NOTE ABOVE
	useEffect(() => {
		// if (!useStore.getState().waitForSelection) {
		const items: Item[] = [];
		selectedNodes.forEach((node) => {
			items.push({
				item: { type: ItemType.node, object: node },
				id: node.id,
				name: node.data.label,
			});
		});

		selectedEdges.forEach((edge) => {
			items.push({
				item: { type: ItemType.relationship, object: edge },
				id: edge.id,
				name: edge.id,
			});
		});
		setSelectedItems(() => items);
		// }
	}, [selectedNodes, selectedEdges, setSelectedItems]);

	useEffect(() => {
		if (selectedItem !== null && selectedItem.item.type === "node") {
			showRelevantDocumentation(selectedItem?.item.object);
			return;
		}
		showRelevantDocumentation(null);
	}, [selectedItem?.id, selectedItem?.item.object.type]);

	const getNodeTypes = useMemo(() => {
		return convertMapToTrueNodeTypes(nodeTypes);
	}, [nodeTypes]);

	const getEdgeTypes = useMemo(() => {
		return convertMapToTrueEdgeTypes(relationshipTypes);
	}, [relationshipTypes]);

	if (!isIGC) {
		return (
			<div className="editor-pane">
				<div className="navbar-component">
					<span className="navbar-component-title take-full-width">
						Graph Editor
					</span>
				</div>
				<div
					style={{
						margin: "10px",
					}}
				>
					Not a valid IGC file
				</div>
			</div>
		);
	}

	// Node Functions
	const onNodesDelete = async (nodes: Node[]) => {
		isExternalUpdate.current = false;
		console.log("Nodes deleted:", nodes);
		if (currentSessionId !== null) {
			for (let i = 0; i < nodes.length; i++) {
				await removeNodeInSession(fileData.filePath, nodes[i].id);
			}
		}
	};
	const onNodesChange = async (changes: NodeChange[]) => {
		// isExternalUpdate.current = false;
		setNodes((nds) => applyNodeChanges(changes, nds));
	};

	// Add a new node
	const handleAddNode = () => {
		isExternalUpdate.current = false;
		// Select the new node and deselect all other nodes/relationships
		setNodes((nodes) => {
			const newNode: Node<IGCNodeData> = createBaseNode(nodes);

			const newNodes = nodes.map((node) => {
				node.selected = false;
				return node;
			});
			return [...newNodes, newNode];
		});
		setRelationships((relationships) => {
			const newEdges = relationships.map((r) => {
				r.selected = false;
				return r;
			});
			return [...newEdges];
		});
	};

	const exportGraphToSVG = () => {
		const downloadImage = (
			dataUrl: string,
			extension: string,
			name?: string,
		) => {
			const fileName = `${name ? name : "IGC_diagram"}.${extension}`;

			const a = document.createElement("a");
			a.setAttribute("download", fileName);
			a.setAttribute("href", dataUrl);
			a.click();
		};

		const reactFlowElements = document.querySelector(
			".react-flow__viewport",
		) as HTMLElement;
		if (reactFlowInstance.current !== null && reactFlowElements !== null) {
			const nodesBounds = getRectOfNodes(nodes);
			const imageWidth = nodesBounds.width + 200;
			const imageHeight = nodesBounds.height + 200;
			const transform = getTransformForBounds(
				nodesBounds,
				imageWidth,
				imageHeight,
				0.5,
				2,
			);

			return toSvg(reactFlowElements, {
				filter: (node) =>
					!(
						node?.classList?.contains("react-flow__minimap") ||
						node?.classList?.contains("react-flow__controls")
					),
				width: imageWidth,
				height: imageHeight,
				style: {
					width: String(imageWidth),
					height: String(imageHeight),
					transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
				},
			}).then(async (svgContent: any) => {
				// Extract SVG content
				const decodedSVG = decodeURIComponent(
					svgContent
						.replace("data:image/svg+xml;charset=utf-8,", "")
						.trim(),
				);

				// Embed fonts, styles, and images
				const embeddedSVG = await embedAssets(decodedSVG);

				// Convert SVG to Blob and download
				const blob = new Blob([embeddedSVG], { type: "image/svg+xml" });
				const url = URL.createObjectURL(blob);
				downloadImage(url, "svg", `${fileData.filePath}_IGC_diagram`);
				URL.revokeObjectURL(url);
			});
		}
	};

	async function embedAssets(svgContent: string) {
		const parser = new DOMParser();
		const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");

		// Embed styles
		const styles = Array.from(document.styleSheets)
			.map((sheet) => {
				try {
					return Array.from(sheet.cssRules)
						.map((rule) => rule.cssText)
						.join("\n");
				} catch {
					return "";
				}
			})
			.join("\n");

		const styleElement = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"style",
		);
		styleElement.textContent = styles;
		svgDoc.documentElement.insertBefore(
			styleElement,
			svgDoc.documentElement.firstChild,
		);

		// Embed images (convert to base64)
		const images = svgDoc.querySelectorAll("image");
		for (const img of images) {
			const href =
				img.getAttribute("href") || img.getAttribute("xlink:href");
			if (href && !href.startsWith("data:")) {
				const dataUrl = await convertImageToBase64(href);
				img.setAttribute("href", dataUrl);
			}
		}

		return new XMLSerializer().serializeToString(svgDoc);
	}
	function convertImageToBase64(url: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = "Anonymous";
			img.onload = () => {
				const canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext("2d");
				ctx?.drawImage(img, 0, 0);
				resolve(canvas.toDataURL("image/png"));
			};
			img.onerror = reject;
			img.src = url;
		});
	}

	// const exportGraphToPNG = (dpi: number = 10) => {
	//     // Get the bounds of the nodes to determine the size of the image
	//     const nodesBounds = getRectOfNodes(nodes);
	//     const imageWidth = nodesBounds.width + 200;
	//     const imageHeight = nodesBounds.height + 200;

	//     // Calculate the transform for proper alignment and scaling
	//     const transform = getTransformForBounds(
	//       nodesBounds,
	//       imageWidth,
	//       imageHeight,
	//       0.5,
	//       2,
	//     );

	//     // Select the element you wish to capture
	//     const reactFlowElement = document.querySelector('.react-flow__viewport') as HTMLElement;
	//     if (!reactFlowElement) {
	//       console.error('Element .react-flow__viewport not found.');
	//       return;
	//     }

	//     return toPng(reactFlowElement, {
	//       // Filter out any unwanted nodes
	//       filter: (node) =>
	//         !(
	//           node?.classList?.contains("react-flow__minimap") ||
	//           node?.classList?.contains("react-flow__controls")
	//         ),
	//       width: imageWidth,
	//       height: imageHeight,
	//       // The style dimensions are used to layout the element correctly before rendering
	//       style: {
	//         width: `${imageWidth}px`,
	//         height: `${imageHeight}px`,
	//         transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
	//       },
	//       // Set the pixelRatio to the DPI parameter for high resolution
	//       pixelRatio: dpi,
	//     })
	//       .then((dataUrl: string) => {
	//         // Create an anchor element and trigger the download
	//         const fileName = 'high_dpi_diagram.png';
	//         const a = document.createElement('a');
	//         a.setAttribute('download', fileName);
	//         a.setAttribute('href', dataUrl);
	//         document.body.appendChild(a);
	//         a.click();
	//         document.body.removeChild(a);
	//       })
	//       .catch((error: any) => {
	//         console.error('Error exporting PNG:', error);
	//       });
	//   };

	// Edge Functions
	const onRelationshipsDelete = async (relationships: Edge[]) => {
		isExternalUpdate.current = false;
		const selectedItems = useStore.getState().selectedItems;
		const selectedNodeIds: string[] = selectedItems.reduce<string[]>(
			(acc, item) => {
				if (item.item.type === "node") {
					acc.push(item.item.object.id);
				}
				return acc;
			},
			[],
		);
		for (let i = 0; i < relationships.length; i++) {
			const edge = relationships[i];
			if (
				edge.type === "ExecutionRelationship" &&
				!(
					selectedNodeIds.includes(edge.source) ||
					selectedNodeIds.includes(edge.target)
				)
			) {
				console.log("Removing execution relationship:", edge.id);
				const currentSessionId = useStore.getState().currentSessionId;
				if (
					currentSessionId !== null &&
					edge.data.label !== undefined &&
					!isNaN(parseInt(edge.data.label))
				) {
					removeExecutionInSession(
						fileData.filePath,
						currentSessionId,
						parseInt(edge.data.label),
					);
				}
			}
		}
	};
	const onRelationshipsChange = async (changes: EdgeChange[]) => {
		isExternalUpdate.current = false;
		setRelationships((eds) => {
			return applyEdgeChanges(changes, eds);
		});
		// // Update session data
		// loadSessionData(selectedFile);
	};

	// If a new edge is created
	const onConnect = (params: Edge | Connection) => {
		isExternalUpdate.current = false;
		const { source, target } = params;

		// Custom logic to handle the connection
		if (source !== null && target !== null) {
			console.log(`Creating connection from ${source} to ${target}`);
			setRelationships((eds) =>
				addEdge(
					{
						...params,
						type: "BaseRelationship",
						id: getEdgeId(source, target, eds),
						selected: true,
					},
					eds.map((e) => {
						e.selected = false;
						return e;
					}),
				),
			);
			setNodes((nodes) => {
				const newNodes = nodes.map((node) => {
					node.selected = false;
					return node;
				});
				return [...newNodes];
			});
		} else {
			console.error("Invalid connection attempt:", params);
		}
	};

	// General React Flow Functions
	// Pan to the center
	const handlePanToStartNode = () => {
		if (reactFlowInstance.current) {
			const selectedItemTemp = selectedItem?.item;
			if (
				selectedItemTemp !== undefined &&
				selectedItemTemp.type === "node"
			) {
				reactFlowInstance.current.setCenter(
					selectedItemTemp.object.position.x + 50,
					selectedItemTemp.object.position.y,
				);
				reactFlowInstance.current.zoomTo(1.5);
			} else {
				reactFlowInstance.current.setCenter(0, 0);
				reactFlowInstance.current.zoomTo(1);
			}
		}
	};

	const onNodeDoubleClick = async (event: React.MouseEvent, node: Node) => {
		isExternalUpdate.current = false;
		console.log("Node double clicked", node);
		console.log("Event", event);
		if (isGraphNode(node)) {
			if (node.data.filePath) {
				const fileExistsPromise = await fileExists(node.data.filePath);
				if (!fileExistsPromise) {
					console.log("File does not exist");
					return;
				}
				useStore.getState().loadFile(node.data.filePath);
			}
		}
	};

	return (
		<div className="editor-pane">
			<div className="navbar-component">
				<span className="navbar-component-title take-full-width">
					Graph Editor
				</span>
				{isIGC && (
					<>
						<Button
							startIcon={<AddCircle />}
							onClick={handleAddNode}
							sx={{ color: STYLES.primary }}
						>
							Add Node
						</Button>
						<FilterPane />
						<button
							className="icon-button"
							title="Play Current Execution"
							onClick={() => refreshSession(fileData.filePath)}
						>
							<PlayArrow />
						</button>
						<button
							className="icon-button"
							title="Play Current Execution"
							onClick={() => exportGraphToSVG()}
						>
							<PhotoCameraBack />
						</button>
						<button
							className="icon-button"
							title="Debug Current Execution"
							onClick={() => runAllAnalysis()}
						>
							<BugReport />
						</button>
						<button
							className="icon-button"
							title="Pan Back to Start"
							onClick={handlePanToStartNode}
						>
							<Home />
						</button>
					</>
				)}
			</div>
			<Box
				sx={{
					flexGrow: 1,
					overflow: "hidden",
				}}
				ref={reactFlowWrapper}
			>
				{showGraph ? (
					<ReactFlowProvider>
						<ReactFlow
							nodes={nodes}
							edges={relationships}
							onNodesChange={onNodesChange}
							onEdgesChange={onRelationshipsChange}
							onNodesDelete={onNodesDelete}
							onEdgesDelete={onRelationshipsDelete}
							onConnect={onConnect}
							nodeTypes={getNodeTypes}
							onNodeDoubleClick={onNodeDoubleClick}
							edgeTypes={getEdgeTypes}
							connectionLineComponent={CustomConnectionLine}
							connectionLineStyle={connectionLineStyle}
							zoomOnScroll
							panOnScroll={false}
							onInit={(instance) => {
								reactFlowInstance.current = instance;
								handlePanToStartNode();
							}}
							proOptions={{ hideAttribution: true }}
						>
							<MiniMap className="react-flow__minimap" />
							<Controls
								className="react-flow__controls"
								showFitView={false}
								showInteractive={false}
							/>
							<Background />
						</ReactFlow>
					</ReactFlowProvider>
				) : (
					<div
						style={{
							margin: "10px",
						}}
					>
						Not a valid IGC file
					</div>
				)}
			</Box>
		</div>
	);
};

export default GraphEditor;
