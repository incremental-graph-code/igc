import { STYLES } from "@/styles/constants";
import BaseRelationship, { IGCRelationshipProps } from "../BaseRelationship";
import { RegistryComponent } from "@/types/frontend";
import { createComponent } from "@/utils/componentCache";

const RawExecutionRelationship: IGCRelationshipProps = (props) => {
	return (
		<BaseRelationship
			{...props}
			data={{
				...props.data,
				backgroundColor: ExecutionRelationship.color,
				labelRadius: 50,
			}}
		/>
	);
};
const ExecutionRelationship: IGCRelationshipProps & RegistryComponent =
	createComponent(
		RawExecutionRelationship,
		"ExecutionRelationship",
		"ExecutionRelationship",
		{
			color: STYLES.executionRelationshipColor,
			parentComponent: BaseRelationship,
			settable: true,
		},
	);

export default ExecutionRelationship;
