import "./ClassNode.css";
import CodeNode, { IGCCodeNodeProps } from "../CodeNode";
import { STYLES } from "@/styles/constants";
import { createComponent } from "@/utils/componentCache";
import { RegistryComponent } from "@/types/frontend";

const RawClassNode: IGCCodeNodeProps = (props) => {
	// Set initial codeData if not yet set
	props.data.codeData = props.data.codeData || { code: "" };

	return (
		<CodeNode
			{...props}
			data={{
				...props.data,
				backgroundColor: ClassNode.color,
			}}
		/>
	);
};

const ClassNode: IGCCodeNodeProps & RegistryComponent = createComponent(
	RawClassNode,
	"ClassNode",
	"Class Node",
	{
		color: STYLES.classNodeColor,
		parentComponent: CodeNode,
		settable: true,
	},
);

export default ClassNode;
