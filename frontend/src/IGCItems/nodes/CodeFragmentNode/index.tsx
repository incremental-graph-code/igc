import "./CodeFragmentNode.css";
import CodeNode, { IGCCodeNodeProps } from "../CodeNode";
import { STYLES } from "@/styles/constants";
import { createComponent } from "@/utils/componentCache";
import { RegistryComponent } from "@/types/frontend";

const RawCodeFragmentNode: IGCCodeNodeProps = (props) => {
	// Set initial codeData if not yet set
	props.data.codeData = props.data.codeData || { code: "" };

	return (
		<CodeNode
			{...props}
			data={{
				...props.data,
				backgroundColor: CodeFragmentNode.color,
			}}
		/>
	);
};

const CodeFragmentNode: IGCCodeNodeProps & RegistryComponent = createComponent(
	RawCodeFragmentNode,
	"CodeFragmentNode",
	"Code Fragment Node",
	{
		color: STYLES.codeFragmentNodeColor,
		parentComponent: CodeNode,
		settable: true,
	},
);

export default CodeFragmentNode;
