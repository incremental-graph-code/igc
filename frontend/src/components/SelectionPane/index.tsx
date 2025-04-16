import React, { useState, useEffect } from "react";
import CustomSelect, { SelectOption } from "../CustomSelect";
import "./SelectionPane.css";
import useStore from "@/store/store";
// import { applyEdgeChanges } from "reactflow";
// import {
// 	updateExecutionPath,
// 	updateExecutionPathEdge,
// } from "../../IGCItems/utils/utils";
import _ from "lodash";
import { useTriggerEdgeTypeUpdate } from "@/hooks/useEdgeTypeUpdate";
import { ModuleComponent, ModuleComponentValues } from "@/types/frontend";
import { removeExecutionInSession, removeNodeInSession } from "@/utils/sessionHandler";

interface SelectionPaneProps {}

const SelectionPane: React.FC<SelectionPaneProps> = ({}) => {
	// VARIABLES
	const isIGCFile = useStore((state) => state.isIGCFile);
	const selectedFile = useStore((state) => state.selectedFile);
	const selectedItems = useStore((state) => state.selectedItems);
	const selectedItem = useStore((state) => state.selectedItem);
	const setSelectedItem = useStore((state) => state.setSelectedItem);
	const setNodes = useStore((state) => state.setNodes);
	const setEdges = useStore((state) => state.setEdges);
	const nodeTypes = useStore((state) => state.nodeTypes);
	const relationshipTypes = useStore((state) => state.relationshipTypes);

	const triggerEdgeTypeUpdate = useTriggerEdgeTypeUpdate();

	// STATE
	const [name, setName] = useState<string>("");
	const [selectedOption, setSelectedOption] = useState<string>("");

	useEffect(() => {
		if (selectedItems.length > 0) {
			setName(selectedItem?.name || "");
		} else {
			setSelectedItem(() => null);
		}
	}, [selectedItem, selectedItems]);
	useEffect(() => {
        // Reset the selected item
		if (selectedItems.length > 0) {
			setSelectedItem(() => selectedItems[0]);
			let optionType = selectedItems[0].item.object.type ?? "";
			setSelectedOption(optionType);
		}
	}, [selectedItems]);

	if (selectedItems.length === 0 || selectedFile === null) {
		return null;
	}

	const handleOptionChange = (value: string) => {
		setSelectedOption(value);
		if (selectedItem) {
			if (selectedItem.item.type === "node") {
				setNodes(selectedFile, (prevNodes) =>
					prevNodes.map((node) => {
						if (node.id === selectedItem.id) {
							return {
								...node,
								type: value,
							};
						}
						return node;
					}),
				);
			} else if (selectedItem.item.type === "relationship") {
				setEdges(selectedFile, (prevEdges) =>
					prevEdges.map((edge) => {
						if (edge.id === selectedItem.id) {
							return {
								...edge,
								type: value,
							};
						}
						return edge;
					}),
				);
				triggerEdgeTypeUpdate(selectedItem.id);
			}
		}
	};

	const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setName(event.target.value);
		if (selectedItem) {
			setNodes(selectedFile, (prevNodes) =>
				prevNodes.map((node) => {
					if (node.id === selectedItem.id) {
						return {
							...node,
							data: {
								...node.data,
								label: event.target.value,
							},
						};
					}
					return node;
				}),
			);
		}
	};

	const handleDelete = () => {
		console.log("Delete button clicked");
		if (selectedItem) {
			if (selectedItem.item.type === "node") {
				removeNodeInSession(selectedFile, selectedItem.id);
				setNodes(selectedFile, (prevNodes) =>
					prevNodes.filter((node) => node.id !== selectedItem.id),
				);
			} else if (
				selectedItem.item.type === "relationship" &&
				selectedItem.item.object.type === "ExecutionRelationship"
			) {
				const currentSessionId = useStore.getState().currentSessionId;
				if (
					currentSessionId !== null &&
					selectedItem.item.object.data.label !== undefined &&
					!isNaN(parseInt(selectedItem.item.object.data.label))
				) {
					removeExecutionInSession(
						selectedFile,
						currentSessionId,
						parseInt(selectedItem.item.object.data.label),
					);
				}
			}
		}
	};

	const handleItemChange = (value: string) => {
		let item = selectedItems.find((item) => item.id === value);
		setSelectedItem(() => (item ? item : null));
	};

	if (!isIGCFile) {
		return;
	}
	return (
		<div className="selection-pane-formControl">
			{selectedItems.length !== 1 && (
				<CustomSelect
					id="item-select"
					label="Select Item"
					options={selectedItems.map((item) => ({
						value: item.id,
						label: item.name,
						style: {},
					}))}
					value={selectedItem?.id ? selectedItem.id : ""}
					onChange={handleItemChange}
				/>
			)}

			{selectedItem?.item.type === "node" && (
				<>
					<CustomSelect
						id="node-select"
						label="Node"
						options={createSelectionList(nodeTypes)}
						value={selectedOption}
						onChange={handleOptionChange}
					/>
					<label
						htmlFor="name-input"
						className="selection-pane-label"
					>
						Name
					</label>
					<input
						id="name-input"
						type="text"
						value={name}
						onChange={handleNameChange}
						className="selection-pane-input"
					/>
				</>
			)}

			{selectedItem?.item.type === "relationship" && (
				<>
					<CustomSelect
						id="edge-select"
						label="Relation"
						options={createSelectionList(relationshipTypes)}
						value={selectedOption}
						onChange={handleOptionChange}
					/>
				</>
			)}

			<button
				className="selection-pane-deleteButton"
				onClick={handleDelete}
			>
				DELETE
			</button>
		</div>
	);
};

export const createSelectionList = (
	componentTypes: ModuleComponent<any>,
): SelectOption[] => {
	const mappedArray = Object.values(componentTypes)
		.filter(
			(component: ModuleComponentValues<any>) =>
				component.object.settable !== undefined &&
				component.object.settable === true,
		)
		.map((component: ModuleComponentValues<any>) => {
			return {
				value: component.object.key,
				label: component.object.displayName,
				style: { backgroundColor: component.object.color },
			};
		});
	return mappedArray;
};

export default SelectionPane;
