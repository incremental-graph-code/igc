import { STYLES } from "@/styles/constants";
import BaseRelationship, { IGCRelationshipProps } from "../BaseRelationship";
import { RegistryComponent } from "@/types/frontend";
import { createComponent } from "@/utils/componentCache";

const RawOverridesRelationship: IGCRelationshipProps = (props) => {
	return (
		<BaseRelationship
			{...props}
			data={{
				...props.data,
				backgroundColor: OverridesRelationship.color,
				labelRadius: 10,
			}}
		/>
	);
};
const OverridesRelationship: IGCRelationshipProps & RegistryComponent =
	createComponent(
		RawOverridesRelationship,
		"OverridesRelationship",
		"OverridesRelationship",
		{
			color: STYLES.overridesRelationshipColor,
			parentComponent: BaseRelationship,
		},
	);

export default OverridesRelationship;
