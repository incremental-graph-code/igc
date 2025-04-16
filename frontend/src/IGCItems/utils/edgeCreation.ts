import useStore from "@/store/store";
import { getEdgeId, getIncomingNodes, getOutgoingNodes } from "./utils";
import { Node, Edge } from "reactflow";
import InheritanceRelationship from "../relationships/InheritanceRelationship";
import { IGCCodeNodeData, isCodeNode } from "../nodes/CodeNode";
import { Definitions, Dependencies } from "shared";

interface DependencyEdge {
	source: string;
	target: string;
	dependencyFulfilled: string[];
}

export const createDependencyGraph = () => {
	const { selectedFile, getNodes, getEdges, setEdges } = useStore.getState();
	if (selectedFile === null) {
		return;
	}

	// Create a graph from the nodes dependencies and new_definitions
	const graph: DependencyEdge[] = [];

	// Create a mapping of every dependency and new_definitions
	const dependencyMap: { [key: string]: string[] } = {};
	const newDefinitionsMap: { [key: string]: string[] } = {};

	// Go through every node and get the dependencies and new_definitions
	for (let node of getNodes(selectedFile)) {
		if (!isCodeNode(node)) {
			continue;
		}
		if (node.data !== undefined) {
			if (node.data.codeData.dependencies !== undefined) {
				for (const type of Object.keys(
					node.data.codeData.dependencies,
				) as Array<keyof Dependencies>) {
					for (const dependency of node.data.codeData.dependencies[
						type
					]) {
						if (dependencyMap[dependency] === undefined) {
							dependencyMap[dependency] = [];
						}
						dependencyMap[dependency].push(node.id);
					}
				}
			}
			if (node.data.codeData.new_definitions !== undefined) {
				for (const type of Object.keys(
					node.data.codeData.new_definitions,
				) as Array<keyof Definitions>) {
					for (const new_definition of node.data.codeData
						.new_definitions[type]) {
						if (newDefinitionsMap[new_definition] === undefined) {
							newDefinitionsMap[new_definition] = [];
						}
						newDefinitionsMap[new_definition].push(node.id);
					}
				}
			}
		}
	}

	// Go through every dependency and create an edge to a definition
	const edgeMap: { [source: string]: { [target: string]: string[] } } = {};
	for (let dependency in dependencyMap) {
		if (newDefinitionsMap[dependency] !== undefined) {
			for (let source of dependencyMap[dependency]) {
				for (let target of newDefinitionsMap[dependency]) {
					if (edgeMap[source] === undefined) {
						edgeMap[source] = {};
					}
					if (edgeMap[source][target] === undefined) {
						edgeMap[source][target] = [];
					}
					edgeMap[source][target].push(dependency);
				}
			}
		}
	}

	// Convert the edgeMap to a graph
	for (let source in edgeMap) {
		for (let target in edgeMap[source]) {
			graph.push({
				source,
				target,
				dependencyFulfilled: edgeMap[source][target],
			});
		}
	}

	// Create the edges and push them to reactflow
	const newEdges: Edge[] = [];
	for (let edge of graph) {
		newEdges.push({
			id: getEdgeId(
				edge.source,
				edge.target,
				[...newEdges, ...getEdges(selectedFile)],
				"D",
			),
			source: edge.source,
			target: edge.target,
			type: "DependencyRelationship",
			data: { label: edge.dependencyFulfilled.join(", ") },
		});
	}

	setEdges(selectedFile, (prevEdges) => {
		let edges = [
			...prevEdges.filter(
				(e) =>
					e.type !== undefined &&
					![
						"DependencyRelationship",
						InheritanceRelationship.key,
						"OverridesRelationship",
					].includes(e.type),
			),
			...newEdges,
		];
		for (let node of getNodes(selectedFile)) {
			edges = detectRelationships(node, edges);
		}
		return edges;
	});
};

// Detects override relationships and inheritance relationships
const detectRelationships = (node: Node, edges: Edge[]): Edge[] => {
	edges.push(...detectInheritanceRelationships(node, edges));
	edges.push(...detectOverrideRelationships(node, edges));
	return edges;
};
const detectOverrideRelationships = (
	node: Node<IGCCodeNodeData>,
	edges: Edge[],
): Edge[] => {
	/** Override Relationships are detected by if the following path exists:
	 * Method Node -> (Method relationship) -> Class Node -> (Inheritance relationship) -> Class Node <- (Method relationship) <- Method Node (with the same name)
	 */
	const overrideRelationships: Edge[] = [];
	const selectedFile = useStore.getState().selectedFile;
	if (selectedFile === null) {
		return [];
	}

	if (
		node.type === "MethodNode" &&
		node.data !== undefined &&
		node.data.codeData.new_definitions !== undefined
	) {
		const methodDefinitions = node.data.codeData.new_definitions.functions
			.filter((f: string) => f.includes("."))
			.map((f: string) => f.split(".")[1]);
		// Get the classes that are attached to the method node
		const classNodes = getOutgoingNodes(
			node.id,
			useStore.getState().getNodes(selectedFile),
			edges,
			(n) => {
				const nodeType = n.type;
				return nodeType === undefined
					? false
					: nodeType.toLowerCase().includes("class");
			},
			(e) => {
				const edgeType = e.type;
				return edgeType === undefined
					? false
					: edgeType === "MethodRelationship";
			},
		);

		// Get the class nodes that are attached to the class nodes from above through interface relationships
		for (let cn of classNodes) {
			const classNodes2 = getOutgoingNodes(
				cn.id,
				useStore.getState().getNodes(selectedFile),
				edges,
				(n) => {
					const nodeType = n.type;
					return nodeType === undefined
						? false
						: nodeType.toLowerCase().includes("class");
				},
				(e) => {
					const edgeType = e.type;
					return edgeType === undefined
						? false
						: edgeType === InheritanceRelationship.key;
				},
			);

			// Get the method nodes that are attached to the class nodes from above through method relationships
			for (let cn2 of classNodes2) {
				const methodNodes = getIncomingNodes(
					cn2.id,
					useStore.getState().getNodes(selectedFile),
					edges,
					(n) => {
						return n.type === "MethodNode";
					},
					(e) => {
						return e.type === "MethodRelationship";
					},
				);

				// Check if the method node has the same name as the method node from the first step
				for (let mn of methodNodes) {
					if (
						mn.data !== undefined &&
                        isCodeNode(mn) &&
						mn.data.codeData.new_definitions !== undefined
					) {
						const methodDefinitions2 =
							mn.data.codeData.new_definitions.functions
								.filter((f: string) => f.includes("."))
								.map((f: string) => f.split(".")[1]);
						for (let mdef of methodDefinitions) {
							for (let mdef2 of methodDefinitions2) {
								if (mdef === mdef2) {
									overrideRelationships.push({
										id: getEdgeId(node.id, mn.id, edges),
										source: node.id,
										target: mn.id,
										type: "OverridesRelationship",
										data: { label: mdef },
									});
								}
							}
						}
					}
				}
			}
		}
	}
	return overrideRelationships;
};
const detectInheritanceRelationships = (
	node: Node<IGCCodeNodeData>,
	edges: Edge[],
): Edge[] => {
	const selectedFile = useStore.getState().selectedFile;
	if (selectedFile === null) {
		return [];
	}
	// Inheritance relationships are detected by the class node having a class dependency
	const inheritanceEdges: Edge[] = [];
	const nodeType = node.type;
	if (nodeType !== undefined && nodeType.toLowerCase().includes("class")) {
		if (
			node.data !== undefined &&
			node.data.codeData.dependencies !== undefined
		) {
			const classDependencies =
				node.data.codeData.dependencies.variables.filter(
					(v: string) => v[0] === v[0].toUpperCase(),
				);
			if (classDependencies === undefined) {
				return [];
			}
			const classNodes = getOutgoingNodes(
				node.id,
				useStore.getState().getNodes(selectedFile),
				edges,
				(n) => {
					const nodeType = n.type;
					return nodeType === undefined
						? false
						: nodeType.toLowerCase().includes("class");
				},
				(e) => {
					const edgeType = e.type;
					return edgeType === undefined
						? false
						: edgeType === "DependencyRelationship";
				},
			);
			for (let cn of classNodes) {
				if (
					cn.data !== undefined &&
					cn.data.codeData.new_definitions !== undefined
				) {
					const classDefinitions = cn.data.codeData.new_definitions.classes;
					if (!classDefinitions) {
						continue;
					}
					for (let cdep of classDependencies) {
						for (let cdef of classDefinitions) {
							if (cdep === cdef) {
								inheritanceEdges.push({
									id: getEdgeId(node.id, cn.id, edges),
									source: node.id,
									target: cn.id,
									type: InheritanceRelationship.key,
									data: { label: cdep },
								});
							}
						}
					}
				}
			}
		}
	}
	return inheritanceEdges;
};
