import { CodeAnalysisResponse, CodeExecutionResponse } from "shared";
import { Node } from "reactflow";
import { addEdge, getEdgeId } from "@/IGCItems/utils/utils";
import { callAnalyze, callExecute, callExecuteMany } from "@/requests";
import useStore from "@/store/store";
import { createDependencyGraph } from "@/IGCItems/utils/edgeCreation";
import {
	createExecutionData,
	loadSessionData,
	updateExecutionRelationships,
} from "./sessionHandler";
import { GraphNodeData } from "@/IGCItems/nodes/GraphNode";
import { IGCCodeNodeData, isCodeNode } from "@/IGCItems/nodes/CodeNode";
import { IGCNodeData } from "@/IGCItems/nodes/BaseNode";

// If the node is a method node, apply the transformation to the code to allow it to attach to the class node
// const applyCodeTransformation = (node: Node, metaNodeData: any) => {

// Run the code analysis on the node
export const runAnalysis = (node: Node) => {
	const selectedFile = useStore.getState().selectedFile;
	if (selectedFile === null) {
		return;
	}
	if (isCodeNode(node)) {
		callAnalyze(node.data.codeData.code).then(
			(response: CodeAnalysisResponse) => {
				useStore.getState().setNodes(selectedFile, (prevNodes) => {
					return prevNodes.map((n) => {
						if (node.id === n.id) {
							if (
								n.data !== undefined &&
								n.data.scope !== undefined
							) {
								n.data = {
									...n.data,
									...response,
								};
							} else {
								n.data = { ...n.data, ...response };
							}
							if (n.data.codeData.new_definitions !== undefined) {
								return metaAnalysis(n, {
									new_definitions: n.data
										.new_definitions as CodeAnalysisResponse["new_definitions"],
									dependencies: n.data
										.dependencies as CodeAnalysisResponse["dependencies"],
								});
							}
						}
						return n;
					});
				});
			},
		);
	}
};

export const runAllAnalysis = async () => {
	const selectedFile = useStore.getState().selectedFile;
	if (selectedFile === null) {
		return;
	}

	// Get all analysis data for all nodes
	const nodeAnalysisData: { [nodeId: string]: CodeAnalysisResponse } = {};
	for (let node of useStore.getState().getNodes(selectedFile) as Node<
		IGCCodeNodeData<IGCNodeData>
	>[]) {
		if (isCodeNode(node)) {
			try {
				const result = await callAnalyze(node.data.codeData.code);
				nodeAnalysisData[node.id] = result;
			} catch (error) {
				console.error(`Error analyzing node ${node.id}:`, error);
			}
		} else {
			const n = node as Node;
			console.log(
				`Skipping node ${n.id} (no code or documentation node).`,
			);
		}
	}

	useStore.getState().setNodes(selectedFile, (prevNodes) => {
		return prevNodes.map((node) => {
			if (node.id in nodeAnalysisData && isCodeNode(node)) {
				node.data.codeData = {
					...node.data.codeData,
					...nodeAnalysisData[node.id],
				};
				console.log(`Node ${node.id} updated with analysis result.`);
			} else {
				console.log(`No analysis result for node ${node.id}.`);
			}
			if (
				isCodeNode(node) &&
				node.data.codeData.new_definitions !== undefined
			) {
				return metaAnalysis(node as Node, {
					new_definitions: node.data.codeData
						.new_definitions as CodeAnalysisResponse["new_definitions"],
					dependencies: node.data.codeData
						.dependencies as CodeAnalysisResponse["dependencies"],
				});
			}
			return node;
		});
	});
	createDependencyGraph();
};

// Convert python code to space first instead of tabs
const replaceTabsWithSpaces = (input: string, indent: number = 0): string => {
	const additionalIndent = " ".repeat(4 * indent);

	return input
		.split("\n")
		.map((line) => {
			const match = line.match(/^\s*/);
			if (match) {
				const whitespace = match[0];
				const replacedWhitespace = whitespace.replace(/\t/g, "    ");
				return (
					additionalIndent + line.replace(/^\s*/, replacedWhitespace)
				);
			}
			return additionalIndent + line;
		})
		.join("\n");
};

// Inject code into scope
export const injectCode = (code: string, cls: string): string => {
	return `def add_code_to_class(cls):
    # START CODE INJECTION
${replaceTabsWithSpaces(code, 1)}
    # END CODE INJECTION
    for key, value in locals().items():
        if key != 'cls':
            setattr(cls, key, value)
    
# Add the new code to the class
add_code_to_class(${cls})
    
# Clear the add_code_to_class function
del add_code_to_class`;
};

// Convert newly defined variables in accordance to the scope
const setScope = (
	metaNodeData: CodeAnalysisResponse,
	scope: string,
): CodeAnalysisResponse => {
	if (metaNodeData.new_definitions !== undefined) {
		// Go through every new definition and set the scope
		Object.keys(metaNodeData.new_definitions).forEach((key) => {
			const typedKey = key as keyof typeof metaNodeData.new_definitions;
			metaNodeData.new_definitions[typedKey] =
				metaNodeData.new_definitions[typedKey].map(
					(definition: string) => {
						return `${scope}.${definition}`;
					},
				);
		});
		// Add the scope to the dependencies
		if (metaNodeData.dependencies.classes.includes(scope) === false) {
			metaNodeData.dependencies.classes.push(scope);
		}
	}

	return metaNodeData;
};
// Meta Analysis
const metaAnalysis = (
	node: Node<IGCCodeNodeData<IGCNodeData>>,
	metaNodeData: CodeAnalysisResponse,
) => {
	if (!isCodeNode(node)) {
		return node;
	}

	if (node.type === "BaseNode") {
		if (
			metaNodeData.new_definitions !== undefined &&
			metaNodeData.new_definitions.classes.length > 0
		) {
			node.type = "ClassNode";
			node.data["label"] = metaNodeData.new_definitions.classes[0];
		} else {
			if (metaNodeData.new_definitions !== undefined) {
				if (metaNodeData.new_definitions.functions.length > 0) {
					node.data["label"] =
						metaNodeData.new_definitions.functions[0];
				} else if (metaNodeData.new_definitions.variables.length > 0) {
					node.data["label"] =
						metaNodeData.new_definitions.variables[0];
				}
			}
			node.type = "CodeFragmentNode";
		}
	} else if (node.type === "ClassNode" && node.data !== undefined) {
		if (
			metaNodeData &&
			metaNodeData.new_definitions &&
			metaNodeData.new_definitions.classes &&
			metaNodeData.new_definitions.classes.length > 0
		) {
			node.data["label"] = metaNodeData.new_definitions.classes[0];
		}
	} else if (node.type === "MethodNode" && node.data !== undefined) {
		if (
			metaNodeData &&
			metaNodeData.new_definitions &&
			metaNodeData.new_definitions.functions &&
			metaNodeData.new_definitions.functions.length > 0
		) {
			node.data["label"] = metaNodeData.new_definitions.functions[0];
		}
	}
	if (node.data !== undefined && node.data.codeData.scope !== undefined) {
		metaNodeData = setScope(metaNodeData, node.data.codeData.scope);
	}
	node.data.codeData = { ...node.data.codeData, ...metaNodeData };

	return node;
};

// Apply the code analysis to the node
const applyCodeAnalysis = (
	nodeId: string,
	metaNodeData: CodeAnalysisResponse,
) => {
	const selectedFile = useStore.getState().selectedFile;
	if (selectedFile === null) {
		return;
	}
	useStore.getState().setNodes(selectedFile, (prevNodes) => {
		return prevNodes.map((node) => {
			if (node.id === nodeId) {
				return metaAnalysis(node, metaNodeData);
			}
			return node;
		});
	});
};

export const runCode = (code: string, nodeId: string, scope?: string): void => {
	// Data store variables
	const selectedFile = useStore.getState().selectedFile;
	const currentSessionId = useStore.getState().currentSessionId;
	if (selectedFile === null) {
		return;
	}

	if (scope !== undefined) {
		code = injectCode(code, scope);
	}

	callExecute(code, "python", selectedFile, nodeId, currentSessionId).then(
		(response: CodeExecutionResponse) => {
			loadSessionData(selectedFile).then((data) => {
				updateExecutionRelationships(selectedFile, data);
			});
			// useStore.getState().setCodeRunData((prevData) =>
			// 	prevData.set(nodeId, {
			// 		stdout: response.output,
			// 		stderr: response.error,
			// 		configuration: response.configuration,
			// 		metrics: response.metrics,
			// 	}),
			// );
			// applyCodeAnalysis(nodeId, response.metaNodeData);
			// useStore.getState().setSessions((prevSessions) => {
			// 	const prevSession:
			// 		| { configuration: any; executionPath: string[] }
			// 		| undefined = prevSessions.get(response.metrics.sessionId);
			// 	let executionPath: string[] | undefined =
			// 		prevSession?.executionPath;
			// 	// Add the node to the execution path
			// 	if (executionPath === undefined) {
			// 		executionPath = ["start", nodeId];
			// 	} else {
			// 		executionPath.push(nodeId);
			// 	}
			// 	// Create a new edge for the execution path
			// 	useStore.getState().setEdges(selectedFile, (eds) => {
			// 		const params = {
			// 			source: executionPath[executionPath.length - 2],
			// 			target: nodeId,
			// 			sourceHandle: null,
			// 			targetHandle: null,
			// 		};
			// 		return addEdge(
			// 			{
			// 				...params,
			// 				type: "ExecutionRelationship",
			// 				id: getEdgeId(params.source, params.target, eds),
			// 				data: { label: executionPath.length - 1 },
			// 			},
			// 			eds.map((e) => {
			// 				e.selected = false;
			// 				return e;
			// 			}),
			// 		);
			// 	});

			// 	return prevSessions.set(response.metrics.sessionId, {
			// 		configuration: response.configuration,
			// 		executionPath: executionPath,
			// 	});
			// });
			// useStore.getState().setCurrentSessionId(() => response.metrics.sessionId);
		},
	);
};

export const runGraph = async (nodeId: string) => {
	const selectedFile = useStore.getState().selectedFile;
	const currentSessionId = useStore.getState().currentSessionId;
	if (selectedFile === null || currentSessionId === null) {
		return;
	}
	const executionData = await createExecutionData(selectedFile, [nodeId]);
	await callExecuteMany(
		executionData,
		"python",
		selectedFile,
		currentSessionId,
	);
	loadSessionData(selectedFile).then((data) => {
		updateExecutionRelationships(selectedFile, data);
	});
};
