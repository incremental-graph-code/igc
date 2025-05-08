import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import "./FileEditor.css";
import useStore from "@/store/store";
import _ from "lodash";
import SelectionPane from "../SelectionPane";
import { IGCViewProps, RegisteredView } from "@/IGCItems/views/BaseView";
import { RegistryComponent } from "@/types/frontend";
import style from "./FileEditor.module.css";
import { STYLES } from "@/styles/constants";
import { loadSessionData } from "@/utils/sessionHandler";
import { serializeGraphData } from "@/IGCItems/utils/serialization";
import { Node, Edge } from "reactflow";
import { isComponentOfType } from "@/IGCItems/utils/utils";
import GeneralTextView from "@/IGCItems/views/GeneralTextView";

interface FileEditorProps {
	openConfirmDialog: (
		msg: string,
		buttonLabelConfirm: string,
		buttonLabelCancel: string,
	) => Promise<boolean>;
}

const componentIncludes = (
	component: RegistryComponent,
	forComponents: RegistryComponent[],
): boolean => {
	for (let i = 0; i < forComponents.length; i++) {
		const ref = forComponents[i];
		if (isComponentOfType(component, ref)) {
			return true;
		}
	}
	return false;
};

const FileEditor: React.FC<FileEditorProps> = (props) => {
	// Memoized store values to prevent unnecessary re-renders
	const selectedFile = useStore((state) => state.selectedFile);
	const fileContent = useStore((state) => state.fileContent);
	const fileChanged = useStore((state) => state.fileChanged);
	const setHasEditorInitialized = useStore(
		(state) => state.setHasEditorInitialized,
	);
	const isIGCFile = useStore((state) => state.isIGCFile);
	const setSavedNodes = useStore((state) => state.setSavedNodes);
	const setSavedEdges = useStore((state) => state.setSavedEdges);
	const selectedItem = useStore(
		(state) => state.selectedItem,
		(prev, next) => prev?.id === next?.id,
	);
    const navBarItems = useStore((state) => state.getNavBarContainer());
	// const setNavBarContainer = useStore((state) => state.setNavBarContainer);
	const nodeTypes = useStore((state) => state.nodeTypes);
	const relationshipTypes = useStore((state) => state.relationshipTypes);
	const viewTypes = useStore((state) => state.viewTypes);

	// Local component state
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [width, setWidth] = useState(500);
	const [activeTab, setActiveTab] = useState(0);
	const [views, setViews] = useState<(IGCViewProps & RegistryComponent)[]>(
		[],
	);

	// Toggle file editor collapse
	const toggleCollapse = useCallback(() => {
		setIsCollapsed((prev) => !prev);
	}, []);

	// Function to check if a view is valid
	const validView = useCallback(
		(view: RegisteredView): boolean => {
			return view.key in viewTypes && viewTypes[view.key].enabled;
		},
		[viewTypes],
	);

	// Function to get views based on selected item
	const getViews = useCallback((): (IGCViewProps & RegistryComponent)[] => {
        if(!isIGCFile){
            return [GeneralTextView]
        }
		const selectedComponent = selectedItem?.item;
		const allViews = Object.values(viewTypes)
			.map((vt) => vt.object)
			.filter(validView);

		if (!selectedComponent) {
			return allViews.filter((view) => view.forComponents.length === 0);
		}

		const componentType = selectedComponent.object.type;

		if (
			componentType === undefined ||
			(selectedComponent.type === "node" &&
				!(componentType in nodeTypes) &&
				nodeTypes[componentType].enabled) ||
			(selectedComponent.type === "relationship" &&
				!(componentType in relationshipTypes) &&
				relationshipTypes[componentType].enabled)
		) {
			return allViews.filter((view) => view.forComponents.length === 0);
		}

		const realComponent: RegistryComponent =
			selectedComponent.type === "node"
				? nodeTypes[componentType].object
				: relationshipTypes[componentType].object;

		const filteredViews = allViews.filter((view) =>
			componentIncludes(realComponent, view.forComponents),
		);

		return filteredViews.length > 0
			? filteredViews
			: allViews.filter((view) => view.forComponents.length === 0);
	}, [selectedItem, nodeTypes, relationshipTypes, viewTypes, validView]);

	// Effect to handle view updates when selectedItem changes
	useEffect(() => {
		const newViews = getViews().sort((v1, v2) => v1.weight - v2.weight);

		if (
			!_.isEqual(
				newViews.map((v) => v.key),
				views.map((v) => v.key),
			)
		) {
			// setNavBarContainer(() => []);
			setViews(newViews);
            if(newViews.length >= activeTab) {
                setActiveTab(newViews.length - 1);
            }
		}
	}, [isIGCFile, selectedItem?.id, views]); // setNavBarContainer

	// Memoized function to create tab elements
	const createTabs = useMemo(() => {
		if (views.length <= 0) return <></>;

		return (
			<div style={{ overflowX: "scroll", scrollbarWidth: "none" }}>
				<Tabs
					value={activeTab}
					onChange={(_, newValue) => setActiveTab(newValue)}
					className={style.tabs}
					sx={{
						padding: "0px 10px",
						height: STYLES.tabHeight,
						minHeight: STYLES.tabHeight,
						display: "inline-flex",
					}}
				>
					{views.map((view, index) => (
						<Tab label={view.displayName} key={index} />
					))}
				</Tabs>
			</div>
		);
	}, [views, activeTab]);

	// Memoized function to create tab content
	const createTabContent = useMemo(() => {
		if (views.length === 0 || views[activeTab] === undefined) {
			return <></>;
		}
		const Component = views[activeTab];

		if (typeof Component !== "function" && typeof Component !== "object") {
			console.error("Invalid component:", Component);
			return <></>;
		}

		return <Component />;
	}, [views, activeTab]);

	// Memoized navbar elements to prevent unnecessary recalculations
	// const navBarElements = useMemo(() => {
	// 	return navBarContainer
	// 		.sort((a, b) => a.weight - b.weight)
	// 		.map((element) => element.element);
	// }, [navBarContainer]);

	// Effect to initialize the editor when file changes
	useEffect(() => {
		if (
			fileContent !== null &&
			isIGCFile &&
			selectedFile !== null &&
			!useStore.getState().hasEditor[selectedFile]
		) {
			setHasEditorInitialized(selectedFile);
			const serializedData = serializeGraphData(fileContent);
			useStore
				.getState()
				.setNodes(selectedFile, () => serializedData.nodes);
			useStore
				.getState()
				.setEdges(selectedFile, () => serializedData.edges);

			// Copy of the data to prevent references
			const serializedData2 = serializeGraphData(fileContent);

			setSavedNodes(selectedFile, () =>
				serializedData2.nodes.reduce<{ [id: string]: Node }>(
					(acc, node) => {
						acc[node.id] = node;
						return acc;
					},
					{},
				),
			);

			setSavedEdges(selectedFile, () =>
				serializedData2.edges.reduce<{ [id: string]: Edge }>(
					(acc, edge) => {
						acc[edge.id] = edge;
						return acc;
					},
					{},
				),
			);

			loadSessionData(selectedFile);
		}
	}, [
		fileChanged,
		fileContent,
		isIGCFile,
		selectedFile,
		setHasEditorInitialized,
		setSavedEdges,
		setSavedNodes,
	]);

	return (
		<ResizableBox
			width={isCollapsed ? 40 : width}
			height={Infinity}
			axis="x"
			minConstraints={[40, Infinity]}
			maxConstraints={[800, Infinity]}
			onResize={(_, { size }) => setWidth(size.width)}
			resizeHandles={["w"]}
			handle={
				<div className="resize-handle-container-left">
					<div
						className="resize-handle"
						style={{
							cursor: "ew-resize",
							height: "100%",
							width: "5px",
							position: "absolute",
							left: 0,
							top: 0,
							backgroundColor: "transparent",
						}}
					/>
				</div>
			}
		>
			<div className="file-editor-container">
				<div
					className={`
       file-editor
       ${isCollapsed ? "collapsed" : ""}
     `}
				>
					<div
						className={`
        navbar-component
        ${
							isCollapsed ? "collapsed" : ""
						}
      `}
					>
						{!isCollapsed && (
							<>
								<span className="navbar-component-title">
									File Editor
								</span>
								{navBarItems.map(item => item.element)}
								<span className="take-full-width"></span>
							</>
						)}
						<button
							className="icon-button"
							title="Toggle Visibility"
							onClick={toggleCollapse}
						>
							<VisibilityIcon />
						</button>
					</div>
					<div
						style={{
							display: isCollapsed ? "none" : "flex",
							flexDirection: "column",
							height: "100vh",
							overflow: "hidden",
							paddingLeft: "2px",
						}}
					>
						<div className={style.tabsContainer}>{createTabs}</div>
						<Box
							sx={{
								flexGrow: 1,
								overflow: "hidden",
								position: "relative",
							}}
						>
							{createTabContent}
						</Box>
						<div>
							<SelectionPane />
						</div>
					</div>
				</div>
			</div>
		</ResizableBox>
	);
};

// FileEditor.whyDidYouRender = true;

export default FileEditor;
