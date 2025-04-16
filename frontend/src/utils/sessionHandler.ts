import { serializeGraphData } from "@/IGCItems/utils/serialization";
import {
	getSessionData,
	deleteNodeInSession,
	deleteExecutionInSession,
	getFileContent,
	callExecuteMany,
	createSession,
    deleteSession,
} from "@/requests";
import useStore from "@/store/store";
import { FileIdCodeList, IGCFileSessionData } from "shared";
import { Node } from "reactflow";
import { updateExecutionPath } from "@/IGCItems/utils/utils";
import { isCodeNode } from "@/IGCItems/nodes/CodeNode";
import { isGraphNode } from "@/IGCItems/nodes/GraphNode";
import { injectCode } from "./codeExecution";

// This should update all the session and run data associated with the IGC file
export const loadSessionData = async (filePath: string) => {
	const sessionData = await getSessionData(filePath);
	useStore.getState().setSessionData(filePath, () => sessionData);
	return sessionData;
};
export const updateExecutionRelationships = async (
	filePath: string,
	sessionData: IGCFileSessionData,
) => {
	// Update edges for the current session
	const newExecutionData = await getExecutionPathFromSession(
		filePath,
		useStore.getState().currentSessionId ?? sessionData.primarySession,
		sessionData,
	);
	useStore
		.getState()
		.setEdges(filePath, (prevEdges) => [
			...prevEdges.filter((e) => e.type !== "ExecutionRelationship"),
			...updateExecutionPath(newExecutionData),
		]);

	if (useStore.getState().currentSessionId === null) {
		useStore
			.getState()
			.setCurrentSessionId(() => sessionData.primarySession);
	}
};
export const createNewSession = async (filePath: string, sessionId: string) => {
	return createSession(filePath, sessionId);
	// await loadSessionData(filePath);
};

export const removeNodeInSession = async (filePath: string, nodeId: string) => {
	const affectedSessions = await deleteNodeInSession(filePath, nodeId);
	const sessionData = await getSessionData(filePath);
	const currentSessionId = useStore.getState().currentSessionId;
	if (
		currentSessionId !== null &&
		affectedSessions.includes(currentSessionId)
	) {
		useStore.getState().setCurrentSessionId(() => null);
	}
	useStore.getState().setSessionData(filePath, () => sessionData);

    // Update session data
	loadSessionData(filePath).then((sessionData) => {
        updateExecutionRelationships(filePath, sessionData);
    });
	// // Update edges for the current session
	// const newExecutionData = await getExecutionPathFromSession(
	// 	filePath,
	// 	useStore.getState().currentSessionId ?? sessionData.primarySession,
	// 	sessionData,
	// );
	// useStore
	// 	.getState()
	// 	.setEdges(filePath, (prevEdges) => [
	// 		...prevEdges.filter((e) => e.type !== "ExecutionRelationship"),
	// 		...updateExecutionPath(newExecutionData),
	// 	]);
};

export const removeExecutionInSession = async (
	filePath: string,
	sessionId: string,
	executionNumber: number,
) => {
	// Remove execution data but keep the path
	const newExecutionPath = await deleteExecutionInSession(
		filePath,
		sessionId,
		executionNumber,
	);

	// Update the session data
	const newExecutionData = await createExecutionData(
		filePath,
		newExecutionPath,
	);
	await callExecuteMany(newExecutionData, "python", filePath, sessionId);

	// Update session data
	await loadSessionData(filePath).then((sessionData) => {
        updateExecutionRelationships(filePath, sessionData);
    });

    return sessionId;
};
export const getExecutionPathFromSession = async (
	filePath: string,
	sessionId: string,
	sessionData?: IGCFileSessionData,
): Promise<string[]> => {
	const sd =
		sessionData !== undefined
			? sessionData
			: await loadSessionData(filePath);
	if (sd === undefined || !(sessionId in sd.sessions)) {
		return [];
	}
	const executionPaths = sd.sessions[sessionId].executions.map(
		(execution) => {
			// Make sure this is in order
			return execution.nodeId;
		},
	);

	return executionPaths;
};

// *This can go into infinite loop if there is a cycle in the graph
export const createExecutionData = async (
	filePath: string,
	executionPath: string[],
): Promise<FileIdCodeList> => {
	const returnData: FileIdCodeList = {
		filePath: filePath,
		elements: [],
	};
	const fileContent = await getFileContent(filePath);
	const serializedGraphData = serializeGraphData(fileContent.content);
	const nodes = serializedGraphData.nodes;
	for (let j = 0; j < executionPath.length; j++) {
		const nodeId = executionPath[j];
		for (let i = 0; i < nodes.length; i++) {
			// Check which type of node
			let node: Node = nodes[i];
			if (node.id === nodeId) {
				// Code node
				if (isCodeNode(node)) {
                    let code = node.data.codeData.code;
                    if (node.data.codeData.scope !== undefined) {
                        code = injectCode(code, node.data.codeData.scope);
                    }
					returnData.elements.push({
						id: nodeId,
						data: node.data.codeData.code,
					});

				} else if (isGraphNode(node)) {
					const newExecutionData = await getExecutionPathFromSession(
						node.data.filePath,
						node.data.selectedSession,
					);
					if (newExecutionData.length > 0) {
						returnData.elements.push({
							id: nodeId,
							data: await createExecutionData(
								node.data.filePath,
								newExecutionData,
							),
						});
					}
				} else {
					console.error("Unknown node type! Please check...");
				}
				break;
			}
		}
	}
	return returnData;
};
export const refreshSession = async (filePath: string) => {
    const currentSessionId = useStore.getState().currentSessionId;
    if (currentSessionId === null) {
        return;
    }
    // Remove the session, then re-add it to refresh the data
    // Get the execution path before deleting the session
    const executionPath = await getExecutionPathFromSession(
        filePath,
        currentSessionId,
    );
    // Remove the session
    await deleteSession(filePath, currentSessionId);

    // Create a new session
    await createNewSession(filePath, currentSessionId);

    // Create the execution data
    const newExecutionData = await createExecutionData(filePath, executionPath);

    // Execute the new execution data
    await callExecuteMany(newExecutionData, "python", filePath, currentSessionId);

    // Update session data
    await loadSessionData(filePath).then((sessionData) => {
        updateExecutionRelationships(filePath, sessionData);
    });
}
