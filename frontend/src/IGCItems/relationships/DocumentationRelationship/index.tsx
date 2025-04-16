import { STYLES } from "@/styles/constants";
import BaseRelationship, { IGCRelationshipProps } from "../BaseRelationship";
import { RegistryComponent } from "@/types/frontend";
import { createComponent } from "@/utils/componentCache";

const RawDocumentationRelationship: IGCRelationshipProps = (props) => {
	return (
		<BaseRelationship
			{...props}
			data={{
				...props.data,
				backgroundColor: DocumentationRelationship.color,
			}}
		/>
	);
};

const DocumentationRelationship: IGCRelationshipProps & RegistryComponent =
	createComponent(
		RawDocumentationRelationship,
		"DocumentationRelationship",
		"DocumentationRelationship",
		{
			color: STYLES.documentationRelationshipColor,
			parentComponent: BaseRelationship,
		},
	);

export default DocumentationRelationship;
