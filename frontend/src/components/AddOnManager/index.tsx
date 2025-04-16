import React, { useState } from "react";
import styles from "./AddOnManager.module.css";
import useStore from "@/store/store";
import { callAddModule, callRemoveModule } from "@/requests";
import { ModuleComponent, ModuleComponentValues } from "@/types/frontend";
import path from "path-browserify";
import { useComponentRegistry } from "@/hooks/useComponentRegistry";
import {
	fetchAndRegisterComponents,
	loadComponentCache,
} from "@/utils/componentCache";

// MUI Icons
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoIcon from "@mui/icons-material/Info";
import AddBoxIcon from "@mui/icons-material/AddBox";
import DeleteIcon from "@mui/icons-material/Delete";
import CustomSelect from "../CustomSelect";
import OpenDirectoryButton from "../OpenDirectoryButton";

interface AddOnManagerProps {
	onClose: () => void;
}

const AddOnManager: React.FC<AddOnManagerProps> = ({ onClose }) => {
	const { nodeTypes, relationshipTypes, viewTypes, moduleData } = useStore();
	const { registerComponent, updateComponent } = useComponentRegistry();
	const everyComponentLabel = "All";

	const [selectedModule, setSelectedModule] =
		useState<string>(everyComponentLabel);
	const [selectedItems, setSelectedItems] = useState<
		ModuleComponentValues<any>[]
	>([]);

	const moduleComponentExists = (
		moduleComponent: ModuleComponentValues<any>,
		list: ModuleComponentValues<any>[],
	): boolean => {
		return list.some(
			(component) =>
				component.object.key === moduleComponent.object.key &&
				component.modulePath === moduleComponent.modulePath,
		);
	};

	const toggleSelection = (moduleComponent: ModuleComponentValues<any>) => {
		setSelectedItems((prevSelected) =>
			moduleComponentExists(moduleComponent, prevSelected)
				? prevSelected.filter(
						(selectedItem) => selectedItem !== moduleComponent,
				  )
				: [...prevSelected, moduleComponent],
		);
	};

	const getListFromComponentTypes = (
		componentTypes: ModuleComponent<any>,
	): JSX.Element[] => {
		return Object.values(componentTypes)
			.filter(
				(c) =>
					selectedModule === everyComponentLabel ||
					selectedModule === c.modulePath,
			)
			.map((component: ModuleComponentValues<any>) => (
				<li
					key={`${component.modulePath}~${component.object.key}`}
					className={`${styles.listItem} ${
						component.enabled ? "" : styles.disabled
					} ${
						selectedItems.includes(component) ? styles.selected : ""
					}`}
					onClick={() => toggleSelection(component)}
				>
					{component.object.key}
				</li>
			));
	};
	// (path: string) => handleImportAddon(path)
	// Placeholder function for importing an add-on
	const handleImportAddon = (modulePath: string): void => {
		callAddModule(modulePath).then(() => {
			handleRefreshComponents();
		});
	};

	// Placeholder function for refreshing the components
	const handleRefreshComponents = (): void => {
		fetchAndRegisterComponents(registerComponent);
	};

	const toggleEnableDisable = () => {
		const toEnable =
			selectedItems.length > 0 ? !selectedItems[0].enabled : true;
		selectedItems.forEach((selectedItem) => {
			selectedItem.enabled = toEnable;
			updateComponent(selectedItem);
		});
		handleRefreshComponents();
		setSelectedItems([]);
	};

	const deleteModule = (modulePath: string) => {
		callRemoveModule(modulePath).then(() => {
			handleRefreshComponents();
		});
	};

	return (
		<div className={styles.managerContainer}>
			{/* Module Selector and Icon Buttons */}
			<div className={styles.moduleSelectContainer}>
				<CustomSelect
					id="moduleSelect"
					className={styles.moduleSelect}
					value={selectedModule}
					onChange={(val) => setSelectedModule(val)}
					options={[
						{
							value: everyComponentLabel,
							label: everyComponentLabel,
							style: {},
						},
						...moduleData.map((module) => ({
							value: module.search_path,
							label:
								module.meta?.name ||
								path.basename(module.search_path),
							style: {},
						})),
					]}
				></CustomSelect>

				<div className={styles.moduleActionButtons}>
					<button
						className="icon-button"
						title="Refresh"
						onClick={handleRefreshComponents}
					>
						<RefreshIcon />
					</button>
					<button className="icon-button" title="Module Info">
						<InfoIcon />
					</button>
					<OpenDirectoryButton
						onClick={() =>
							handleImportAddon(
								"/Users/maxboksem/Documents/Master's Thesis/MSc-SE-Master-Project/IncrGraph/frontend/src/temp_import",
							)
						}
						className="icon-button"
						title="Import AddOn"
					>
						<AddBoxIcon />
					</OpenDirectoryButton>
					<button
						className="icon-button"
						title="Remove AddOn"
						onClick={() => deleteModule(selectedModule)}
						disabled={selectedModule === "All"}
					>
						<DeleteIcon />
					</button>
				</div>
			</div>

			<div className={styles.listsContainer}>
				<div className={styles.listSection}>
					<h3>Nodes</h3>
					<ul className={styles.scrollableList}>
						{getListFromComponentTypes(nodeTypes)}
					</ul>
				</div>

				<div className={styles.listSection}>
					<h3>Relationships</h3>
					<ul className={styles.scrollableList}>
						{getListFromComponentTypes(relationshipTypes)}
					</ul>
				</div>

				<div className={styles.listSection}>
					<h3>Views</h3>
					<ul className={styles.scrollableList}>
						{getListFromComponentTypes(viewTypes)}
					</ul>
				</div>
			</div>

			<div className={styles.actionButtons}>
				{/* Enable/Disable Selected */}
				{selectedItems.length > 0 && (
					<button
						className={`${styles.toggleBtn} ${
							selectedItems.length > 0 && selectedItems[0].enabled
								? styles.disableBtn
								: styles.enableBtn
						}`}
						onClick={toggleEnableDisable}
						disabled={selectedItems.length === 0}
					>
						{selectedItems.length > 0 && selectedItems[0].enabled
							? "Disable Selected"
							: "Enable Selected"}
					</button>
				)}
			</div>
		</div>
	);
};

export default AddOnManager;
