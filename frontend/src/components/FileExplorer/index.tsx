import React, { useEffect, useRef, useState } from "react";
import AddFileIcon from "@mui/icons-material/NoteAdd";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import styles from "./FileExplorer.module.css";
import useStore from "@/store/store";
import ConfigurationOverview from "./components/ConfigurationOverview";
import path from "path-browserify";
import FileNavigator from "./components/FileNavigator";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface FileExplorerProps {
	openTextDialog: (defaultName: string) => Promise<string | null>;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ openTextDialog }) => {
	// STATE
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [width, setWidth] = useState(300);
	const [currentDir, setCurrentDir] = useState<string | null>(null);

	const { projectDirectory, refresh, createTempNode, selectedNode } =
		useStore((state) => ({
			projectDirectory: state.projectDirectory,
			refresh: state.refresh,
			createTempNode: state.createTempNode,
			selectedNode: state.selectedNode,
		}));

	// Collapse the file explorer
	const toggleCollapse = () => {
		setIsCollapsed(!isCollapsed);
	};

	return (
		<div className={styles.fileExplorerContainer}>
			<ResizableBox
				width={isCollapsed ? 40 : width}
				height={Infinity}
				axis="x"
				minConstraints={[40, Infinity]}
				maxConstraints={[800, Infinity]}
				onResize={(_, { size }) => setWidth(size.width)}
				resizeHandles={["e"]}
				handle={
					<div className={styles.resizeHandleContainer}>
						<div
							className={styles.resizeHandle}
							style={{
								cursor: "ew-resize",
								height: "100%",
								width: "5px",
								position: "absolute",
								right: 0,
								top: 0,
								backgroundColor: "transparent",
							}}
						/>
					</div>
				}
			>
				<div
					className={styles.fileExplorer}
					style={{ width: isCollapsed ? 40 : width }}
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
								<span
									className="navbar-component-title take-full-width"
									title={currentDir ? currentDir : ""}
									style={{ cursor: "default" }}
								>
									{currentDir
										? path.basename(currentDir)
										: "File Explorer"}
								</span>
								<button
									className="icon-button"
									title="Add File"
									onClick={() => createTempNode(false)}
								>
									<AddFileIcon />
								</button>
								<button
									className="icon-button"
									title="Add Directory"
									onClick={() => createTempNode(true)}
								>
									<CreateNewFolderIcon />
								</button>
								<button
									className="icon-button"
									title="Refresh"
									onClick={() => refresh(projectDirectory)}
								>
									<RefreshIcon />
								</button>
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

					<PanelGroup direction="vertical">
						<Panel maxSize={75} defaultSize={50}>
							<FileNavigator />
						</Panel>
						<PanelResizeHandle />
						<Panel maxSize={75} minSize={30}>
							<ConfigurationOverview
								openTextDialog={openTextDialog}
							/>
						</Panel>
					</PanelGroup>
				</div>
			</ResizableBox>
		</div>
	);
};

export default FileExplorer;
