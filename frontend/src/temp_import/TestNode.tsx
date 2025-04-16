import BaseNode, { IGCNodeProps } from "@/IGCItems/nodes/BaseNode";
import { createComponent } from "@/utils/componentCache";

const TestNodeComponent: IGCNodeProps = ( props ) => (
	<BaseNode {...props} data={{
        ...props.data,
        backgroundColor: TestNode.color
    }}/>
);

const TestNode = createComponent(
    TestNodeComponent,
    "TestNode",
    "Test Node",
    {
        color: "cyan",
        parentComponent: BaseNode,
        settable: true,
    },
);

export default TestNode;
