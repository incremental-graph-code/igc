import { useCallback, useEffect } from "react";
import { STYLES } from "@/styles/constants";

import BaseRelationship, { IGCRelationshipProps } from "../BaseRelationship";
import { useStore as reactflowStore } from "reactflow";
// import useStore from "@/store/store";
import { callAnalyze } from "@/requests";
import { RegistryComponent } from "@/types/frontend";
import { createComponent } from "@/utils/componentCache";
import useStore from "@/store/store";
import { isCodeNode } from "@/IGCItems/nodes/CodeNode";

const RawMethodRelationship: IGCRelationshipProps = (props) => {
	const { setNodes } = useStore();
	const sourceNode = reactflowStore(
		useCallback(
			(store) => store.nodeInternals.get(props.source),
			[props.source],
		),
	);
	const targetNode = reactflowStore(
		useCallback(
			(store) => store.nodeInternals.get(props.target),
			[props.target],
		),
	);
	useEffect(() => {
		console.log("MethodRelationshipProps", props);
		if (
			sourceNode !== undefined &&
			sourceNode.type === "MethodNode" &&
			targetNode !== undefined &&
			targetNode.type === "ClassNode" &&
			targetNode.data !== undefined &&
			targetNode.data.codeData.code !== undefined
		) {
			console.log("sourceNode", sourceNode);
			console.log("targetNode", targetNode);

			const selectedFile = useStore.getState().selectedFile;
			if (selectedFile === null) {
				return;
			}

			// Run analysis on class node to get class name
			callAnalyze(targetNode.data.codeData.code).then((response) => {
				console.log("Response", response);
				if (response.new_definitions.classes.length !== 0) {
					// Update method node with class name
					setNodes(selectedFile, (prevNodes) => {
						return prevNodes.map((node) => {
							if (isCodeNode(node) && node.id === props.source) {
								node.data.codeData = {
									...node.data.codeData,
									scope: response.new_definitions.classes[0],
								};
							}
							return node;
						});
					});
				}
			});
		}
	}, []);

	return (
		<BaseRelationship
			{...props}
			data={{
				...props.data,
				backgroundColor: MethodRelationship.color,
			}}
		/>
	);
};

const MethodRelationship: IGCRelationshipProps & RegistryComponent =
	createComponent(
		RawMethodRelationship,
		"MethodRelationship",
		"MethodRelationship",
		{
			color: STYLES.methodRelationshipColor,
			parentComponent: BaseRelationship,
			settable: true,
		},
	);

export default MethodRelationship;
