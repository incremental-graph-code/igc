import "./InterfaceNode.css";
import CodeNode, { IGCCodeNodeProps } from "../CodeNode";
import { STYLES } from "@/styles/constants";
import { createComponent } from "@/utils/componentCache";
import { RegistryComponent } from "@/types/frontend";

const RawInterfaceNode: IGCCodeNodeProps = (props) => {
	// Set initial codeData if not yet set
	props.data.codeData = props.data.codeData || { code: "" };

	return (
		<CodeNode
			{...props}
			data={{
				...props.data,
				backgroundColor: InterfaceNode.color,
			}}
		/>
	);
};

const InterfaceNode: IGCCodeNodeProps & RegistryComponent = createComponent(
	RawInterfaceNode,
	"InterfaceNode",
	"Interface Node",
	{
		color: STYLES.interfaceNodeColor,
		parentComponent: CodeNode,
		settable: true,
	},
);

export default InterfaceNode;
