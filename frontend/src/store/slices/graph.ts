import { Node, Edge } from "reactflow";
import { SetState, GetState } from "../store";
import { IGCGraph } from "@/types/graph";

export interface GraphSliceState {
	graph: IGCGraph | null;
	setGraph: (data: IGCGraph | null) => void;
	updateNodes: (
		updateFn: (
			prevNodes: Node[],
			previousGraph: IGCGraph,
		) => Node[],
	) => Node[];
	updateRelationships: (
		updateFn: (
			prevRelationships: Edge[],
			previousGraph: IGCGraph,
		) => Edge[],
	) => Edge[];
}

export const createGraphSlice = (
	set: SetState,
	get: GetState,
): GraphSliceState => ({
	graph: null,
	setGraph: (data: IGCGraph | null) => {
		set(() => ({ graph: data }));
	},
	updateNodes: (
		updateFn: (
			prevNodes: Node[],
			previousGraph: IGCGraph,
		) => Node[],
	) => {
		const { graph } = get();
		if (graph) {
			const updatedNodes = updateFn(graph.nodes, graph);
			set(() => ({ graph: { ...graph, nodes: updatedNodes } }));
			return updatedNodes;
		}
		return [];
	},
	updateRelationships: (
		updateFn: (
			prevRelationships: Edge[],
			previousGraph: IGCGraph,
		) => Edge[],
	) => {
		const { graph } = get();
		if (graph) {
			const updatedRelationships = updateFn(graph.relationships, graph);
			set(() => ({ graph: { ...graph, relationships: updatedRelationships } }));
			return updatedRelationships;
		}
		return [];
	},
});
