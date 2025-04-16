import { Definitions, Dependencies } from "shared";
import BaseNode, { IGCNodeProps } from "../BaseNode";
import { runCode } from "@/utils/codeExecution";
import useStore from "@/store/store";
import { RegistryComponent } from "@/types/frontend";
import { createComponent } from "@/utils/componentCache";
import { isComponentOfType } from "@/IGCItems/utils/utils";
import { Node } from "reactflow";

type CodeData = {
	code: string;
	scope?: string;
	dependencies?: Dependencies;
	new_definitions?: Definitions;
};

export type IGCCodeNodeData<T = {}> = T & {
	codeData: CodeData;
};

export type IGCCodeNodeProps<T = {}> = IGCNodeProps<IGCCodeNodeData & T>;

export const RawCodeNode: IGCCodeNodeProps = (props) => {
    // Set initial codeData if not yet set
    props.data.codeData = props.data.codeData || { code: "test" };
	const { projectDirectory } = useStore();

	const handleRun = () => {
		console.log("Run action triggered for node:", props.id);
		if (props.data.codeData !== undefined && projectDirectory !== null) {
			runCode(
				props.data.codeData.code,
				props.id,
				props.data.codeData.scope,
			);
		}

		// // Select the node
		// setNodes((prevNodes) => {
		// 	return prevNodes.map((node) => {
		// 		node.selected = node.id === id;
		// 		return node;
		// 	});
		// });

		// // Deselect all edges
		// setEdges((prevEdges) => {
		// 	return prevEdges.map((edge) => {
		// 		edge.selected = false;
		// 		return edge;
		// 	});
		// });
	};

	return (
		<BaseNode
			{...props}
			data={{
				...props.data,
				handleRun: handleRun,
			}}
		/>
	);
};

const CodeNode: IGCCodeNodeProps & RegistryComponent = createComponent(
	RawCodeNode,
	"CodeNode",
	"Code Node",
	{
		parentComponent: BaseNode,
		abstract: true,
	},
);
export const isCodeNode = (node: Node): node is Node<IGCCodeNodeData<IGCNodeProps>> => {
    const nodeTypes = useStore.getState().nodeTypes;
    if(node.type !== undefined && node.type in nodeTypes) {
        return isComponentOfType(nodeTypes[node.type].object, CodeNode) && node.data !== undefined && node.data.codeData !== undefined;
    }
    return false;
}
export const isCodeNodeType = (type: string): boolean => {
    const nodeTypes = useStore.getState().nodeTypes;
    if(type !== undefined && type in nodeTypes) {
        return isComponentOfType(nodeTypes[type].object, CodeNode);
    }
    return false;
}

export default CodeNode;
