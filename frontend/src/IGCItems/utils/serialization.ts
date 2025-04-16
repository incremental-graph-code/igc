import { Node, Edge } from "reactflow";


// Serialize the file content into graph data
export const serializeGraphData = (
    content: string,
): { nodes: Node[]; edges: Edge[] } => {
    // console.log("Serializing graph data");
    // console.log("content\n", content);
    try {
        const data = JSON.parse(content);
        console.log("Done parsing, data\n", data);
        return { nodes: data.nodes, edges: data.edges };
    } catch (error) {
        console.error("Error parsing IGC content:", error);
        throw new Error(`Error parsing IGC content: ${error}`);
    }
};
// Deserialize the graph data into a string
export const deserializeGraphData = (nodes: Node[], edges: Edge[]): string => {
	let data = { nodes: nodes, edges: edges };
	return JSON.stringify(data, null, 4); // Pretty print the JSON
};

// Check if the string is a valid JSON
export const isValidJSON = (str: string) => {
	try {
		JSON.parse(str);
		return true;
	} catch (e) {
		return false;
	}
};

export const isValidIGC = (content: string) => {
    if (!isValidJSON(content)) {
        return false;
    }
    const data = JSON.parse(content);
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        return false;
    }
    return true;
}
