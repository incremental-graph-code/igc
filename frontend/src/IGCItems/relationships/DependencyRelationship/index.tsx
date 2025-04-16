import { STYLES } from "@/styles/constants";
import BaseRelationship, { IGCRelationshipProps } from "../BaseRelationship";
import { RegistryComponent } from "@/types/frontend";
import { createComponent } from "@/utils/componentCache";

const RawDependencyRelationship: IGCRelationshipProps = (props) => {
	return (
		<BaseRelationship
			{...props}
			data={{
				...props.data,
				backgroundColor: DependencyRelationship.color,
				labelRadius: 5,
			}}
		/>
	);
};

const DependencyRelationship: IGCRelationshipProps & RegistryComponent =
	createComponent(
		RawDependencyRelationship,
		"DependencyRelationship",
		"DependencyRelationship",
		{
			color: STYLES.dependencyRelationshipColor,
			parentComponent: BaseRelationship,
		},
	);

export default DependencyRelationship;
