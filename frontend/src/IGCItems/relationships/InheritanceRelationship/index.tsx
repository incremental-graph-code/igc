import { STYLES } from "@/styles/constants";
import BaseRelationship, { IGCRelationshipProps } from "../BaseRelationship";
import { createComponent } from "@/utils/componentCache";
import { RegistryComponent } from "@/types/frontend";

const RawInheritanceRelationship: IGCRelationshipProps = (props) => {
	return (
		<BaseRelationship
			{...props}
			data={{
				...props.data,
				backgroundColor: InheritanceRelationship.color,
				labelRadius: 10,
			}}
		/>
	);
};

const InheritanceRelationship: IGCRelationshipProps & RegistryComponent =
	createComponent(
		RawInheritanceRelationship,
		"InheritanceRelationship",
		"InheritanceRelationship",
		{
			color: STYLES.inheritanceRelationshipColor,
			parentComponent: BaseRelationship,
		},
	);

export default InheritanceRelationship;
