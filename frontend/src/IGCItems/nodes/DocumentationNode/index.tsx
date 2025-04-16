import "./DocumentationNode.css";
import BaseNode, { IGCNodeProps } from "../BaseNode";
import { STYLES } from "@/styles/constants";
import { createComponent } from "@/utils/componentCache";
import { RegistryComponent } from "@/types/frontend";
import useStore from "@/store/store";
import { Node } from "reactflow";
import { getIncomingNodes, isComponentOfType } from "@/IGCItems/utils/utils";


export type IGCDocumentationData<T = {}> = T & {
	documentation: string;
};
export type IGCDocumentationNodeProps<T = {}> = IGCNodeProps<IGCDocumentationData & T>;


const RawDocumentationNode: IGCDocumentationNodeProps = (props) => (
	<BaseNode
		{...props}
		data={{
			...props.data,
			backgroundColor: DocumentationNode.color,
		}}
	/>
);

const DocumentationNode: IGCDocumentationNodeProps & RegistryComponent = createComponent(
	RawDocumentationNode,
	"DocumentationNode",
	"Documentation Node",
	{
		color: STYLES.documentationNodeColor,
		parentComponent: BaseNode,
	},
);

export const isDocumentationNode = (node: Node): node is Node<IGCDocumentationData> => {
    const nodeTypes = useStore.getState().nodeTypes;
    if(node.type !== undefined && node.type in nodeTypes) {
        return isComponentOfType(nodeTypes[node.type].object, DocumentationNode);
    }
    return false;
}

export const showRelevantDocumentation = (node: Node | null): void => {
    const curFile = useStore.getState().selectedFile;
    if (curFile === null) {
        return;
    }
    if (node === null) {
        useStore.getState().setNodes(curFile, (prevNodes) =>
            prevNodes.map((n) => {
                if (isDocumentationNode(n)) {
                    n.hidden = true;
                }
                return n;
            }),
        );
        return;
    }
    useStore.getState().setNodes(curFile, (prevNodes) => {
        let nodesToShow: string[] = [];
        if (isDocumentationNode(node)) {
            nodesToShow.push(node.id);
        } else {
            const incomingDocumentationNodes = getIncomingNodes(
                node.id,
                useStore.getState().getNodes(curFile),
                useStore.getState().getEdges(curFile),
                (node) => node.type === "DocumentationNode",
            );
            if (incomingDocumentationNodes.length !== 0) {
                nodesToShow.push(incomingDocumentationNodes[0].id);
            }
        }

        return prevNodes.map((n) => {
            if (nodesToShow.includes(n.id)) {
                n.hidden = false;
            } else if (isDocumentationNode(n)) {
                n.hidden = true;
            }
            return n;
        });
    });
};

export default DocumentationNode;
