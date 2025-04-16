import React, { useState } from "react";
import {
	MenuItem,
	Checkbox,
	ListItemText,
	Popper,
	Paper,
	ClickAwayListener,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import useStore from "@/store/store";
import styles from "./FilterPane.module.css"; // Import the CSS module
import ExecutionRelationship from "@/IGCItems/relationships/ExecutionRelationship";
import BaseRelationship from "@/IGCItems/relationships/BaseRelationship";
import InheritanceRelationship from "@/IGCItems/relationships/InheritanceRelationship";

const FilterPane: React.FC = () => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [filterOptions, setFilterOptions] = useState<{
		[key: string]: boolean;
	}>({
		Base: true,
		Inheritance: true,
		Overrides: true,
		Method: true,
		Execution: true,
		Dependency: true,
	});

	const { setEdges } = useStore();

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(anchorEl ? null : event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const relationshipTypeMapping: { [key: string]: string } = {
		Base: BaseRelationship.key,
		Inheritance: InheritanceRelationship.key,
		Overrides: "overridesRelationship",
		Method: "methodRelationship",
		Execution: "ExecutionRelationship",
		Dependency: "dependencyRelationship",
	};

	const mapDisplayNameToRelationshipType = (
		displayName: string,
	): string | null => {
		return relationshipTypeMapping[displayName] || null;
	};

	const changeEdgeVisibility = (
		relationshipType: string,
		visible: boolean,
	) => {
		setEdges((prevEdges) => {
			const newEdges = prevEdges.map((edge) => {
				if (relationshipType === edge.type) {
					edge.hidden = !visible;
				}
				return edge;
			});
			return newEdges;
		});
	};

	const handleCheckboxChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		setFilterOptions({
			...filterOptions,
			[event.target.name]: event.target.checked,
		});
		changeEdgeVisibility(
			mapDisplayNameToRelationshipType(event.target.name) || "",
			event.target.checked,
		);
	};

	const open = Boolean(anchorEl);

	return (
		<>
			<button
				className={styles.iconButton} // Apply the iconButton styles
				title="Filter Relationships"
				onClick={handleMenuOpen}
			>
				<FilterListIcon />
			</button>
			<Popper
				open={open}
				anchorEl={anchorEl}
				placement="bottom-start"
				className={styles.filterPanePopper} // Apply the filterPanePopper styles
			>
				<ClickAwayListener onClickAway={handleMenuClose}>
					<Paper className={styles.filterPanePaper}>
						{" "}
						{/* Apply the filterPanePaper styles */}
						{[
							"Base",
							"Inheritance",
							"Overrides",
							"Method",
							"Execution",
							"Dependency",
						].map((relationshipType) => (
							<MenuItem
								key={relationshipType}
								className={`${styles.filterPaneMenuItem} ${
									styles[`filterPane${relationshipType}`]
								}`} // Apply the filterPaneMenuItem and relationship-specific styles
							>
								<div className={styles.filterPaneColor} />{" "}
								{/* Apply the filterPaneColor styles */}
								<ListItemText primary={relationshipType} />
								<Checkbox
									checked={filterOptions[relationshipType]}
									onChange={handleCheckboxChange}
									name={relationshipType}
									color="primary"
									className={styles.filterPaneCheckbox} // Apply the filterPaneCheckbox styles
								/>
							</MenuItem>
						))}
					</Paper>
				</ClickAwayListener>
			</Popper>
		</>
	);
};

export default FilterPane;
