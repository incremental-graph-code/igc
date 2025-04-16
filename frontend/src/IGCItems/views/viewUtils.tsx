import useStore from "@/store/store";
import { ElementItem } from "@/types/frontend";
import { IGCCodeNodeData, isCodeNode } from "../nodes/CodeNode";
import { Node } from "reactflow";
import { runCode, runGraph } from "@/utils/codeExecution";
import { PlayArrow } from "@mui/icons-material";
import { GraphNodeData, isGraphNode } from "../nodes/GraphNode";

// Save Indicator
// const saveIndicatorKey = "saveIndicator";
// const updateElementItem = (element: ElementItem, elements: ElementItem[]) =>
// 	elements.some((e) => e.key === element.key)
// 		? elements.map((e) => {
// 				if (e.key === element.key) {
// 					return element;
// 				}
// 				return e;
// 		  })
// 		: [...elements, element];

// export type SaveIndicatorProps = "saved" | "error" | "outdated";

// export const useSaveIndicator = (status: SaveIndicatorProps) => {
// 	const saveIndicator: ElementItem = {
// 		key: saveIndicatorKey,
// 		weight: 0,
// 		element: (
// 			<span
// 				key={saveIndicatorKey}
// 				className="navbar-circle-icon"
// 				style={{
// 					backgroundColor:
// 						status === "saved"
// 							? "green"
// 							: status === "error"
// 							? "red"
// 							: "orange",
// 				}}
// 			></span>
// 		),
// 	};

// 	useStore
// 		.getState()
// 		.setNavBarContainer((prev) => updateElementItem(saveIndicator, prev));
// };

const runButtonKey = "runButton";
export const useRunButton = (
	node: Node,
) => {
	const runButton: ElementItem = {
		key: runButtonKey,
		weight: 10,
		element: (
			<button
                key={runButtonKey}
				className="icon-button"
				title="Run Code"
				onClick={() => {
					if (isGraphNode(node)) {
						runGraph(node.id);
					} else if (isCodeNode(node)) {
						runCode(
							node.data.codeData.code,
							node.id,
							node.data.codeData.scope,
						);
					}
				}}
				disabled={
					(isGraphNode(node) &&
						(node.data.filePath === undefined ||
							node.data.filePath === "" ||
							node.data.selectedSession === undefined ||
							node.data.selectedSession === "")) ||
					(isCodeNode(node) &&
						node.data.codeData.code === "") ||
					useStore.getState().currentSessionId === null ||
                    useStore.getState().currentSessionId === ""
                    
				}
			>
				<PlayArrow />
			</button>
		),
	};

	// useStore
	// 	.getState()
	// 	.setNavBarContainer((prev) => updateElementItem(runButton, prev));
};
