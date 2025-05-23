import { IGCGraph, Session } from "@/types/graph";
import { Node, Edge } from "reactflow";

export const createIGCGraph = (
	nodes: Node[],
	relationships: Edge[],
	sessions?: Session[],
): IGCGraph => {
	const retGraph: IGCGraph = {
		nodes: nodes,
		relationships: relationships,
	};
	if (sessions !== undefined) {
		retGraph["sessions"] = sessions;
	}
	return retGraph;
};