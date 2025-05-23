import {
	deserializeGraphData,
	isValidJSON,
} from "@/IGCItems/utils/serialization";
import { IGCGraph, IGCGraphSchema } from "@/types/graph";
import { createIGCGraph } from "@/utils/graph";
import { parseJsonStrict } from "@/utils/json";

// Serialize
export const graphToText = (graph: IGCGraph): string => {
	return JSON.stringify(graph, null, 4);
};
// Deserialize
export const textToGraph = (text: string | null): IGCGraph | null => {
	if (text == null) {
		return null;
	}
	// Try to create the graph to ensure it is valid
	if (isIGCGraph(text)) {
		const graphObj = parseJsonStrict(IGCGraphSchema, text) as IGCGraph;

        return createIGCGraph(graphObj.nodes, graphObj.relationships, graphObj.sessions);
	}
	return null;
};

export const isIGCGraph = (obj: string): boolean => {
	return parseJsonStrict(IGCGraphSchema, obj) !== undefined;
};


