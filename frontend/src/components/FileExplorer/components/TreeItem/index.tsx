import React, { useRef } from "react";
import { NodeRendererProps } from "react-arborist";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import FolderIcon from "@mui/icons-material/Folder";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import styles from "./TreeItem.module.css";
import copyToClipboard from "copy-to-clipboard";
import toast from "react-hot-toast";
import { FileNode, FileNodeType } from "shared";
import { ContextMenuItem } from "@/providers/ContextMenuProvider";
import { useContextMenu } from "@/hooks/useContextMenu";
import useStore from "@/store/store";
import {
	copyFileOrDirectory,
	createNewDirectory,
	createNewFile,
	deleteFileOrDirectory,
	renameFileOrDirectory,
} from "@/requests";
import path from "path-browserify";

type Action =
	| "open"
	| "rename"
	| "copy"
	| "cut"
	| "paste"
	| "copyPath"
	| "copyRelPath"
	| "delete";

const openFile = (filePath: string) => {
	console.log("Opening file:", filePath);
    useStore.getState().loadFile(filePath);
};

const TreeItem: React.FC<NodeRendererProps<FileNode>> = ({
	node,
	style,
	dragHandle,
}) => {
	const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const preventSingleClick = useRef(false);

	const {
		projectDirectory,
		refresh,
		clipboard,
		setClipboard,
		removeTempNodes,
	} = useStore((state) => ({
		projectDirectory: state.projectDirectory,
		refresh: state.refresh,
		clipboard: state.clipboard,
		setClipboard: state.setClipboard,
		removeTempNodes: state.removeTempNodes,
	}));

	const type = node.data.type === FileNodeType.File ? "file" : "directory";

	const menuItems: ContextMenuItem<Action>[] = [
		{
			id: "open",
			label: "Open",
			onClick: () => {
				node.select();
				openFile(node.data.fullPath);
			},
			separator: true,
		},
		{
			id: "rename",
			label: "Rename",
			onClick: () => {
				node.select();
				node.edit();
			},
			separator: true,
		},
		{
			id: "copy",
			label: "Copy",
			onClick: () => {
				setClipboard(() => {
					return { path: node.data.fullPath, cut: false };
				});
				toast.success(`Copied ${type}.`, {
					duration: 2000,
					position: "top-center",
				});
			},
		},
		{
			id: "cut",
			label: "Cut",
			onClick: () => {
				setClipboard(() => {
					return { path: node.data.fullPath, cut: true };
				});
				toast.success(`Cut ${type}.`, {
					duration: 2000,
					position: "top-center",
				});
			},
		},
		{
			id: "paste",
			label: "Paste",
			onClick: async () => {
				if (clipboard !== null) {
					// Path to paste to
					let pastePath = node.data.fullPath;
					// Check if node is a file
					if (node.data.type === FileNodeType.File) {
						// If it is a file, get the parent directory
						pastePath = node.parent?.data.fullPath ?? "";
					}
					// Add the file name to the path
					pastePath = path.join(
						pastePath,
						path.basename(clipboard.path),
					);

					if (clipboard.cut) {
						await renameFileOrDirectory(clipboard.path, pastePath);
					} else {
						await copyFileOrDirectory(clipboard.path, pastePath);
					}
					setClipboard(() => null);

					toast.success(`Pasted ${type}.`, {
						duration: 2000,
						position: "top-center",
					});
					refresh(projectDirectory);
				}
			},
			separator: true,
		},
		{
			id: "copyPath",
			label: "Copy Path",
			onClick: () => {
				const path = node.data.fullPath;
				copyToClipboard(path);
				toast.success("Copied path to clipboard.", {
					duration: 2000,
					position: "top-center",
				});
			},
		},
		{
			id: "copyRelPath",
			label: "Copy Relative Path",
			onClick: () => {
				const path: string = node.data.fullPath;
				const relativePath = path.startsWith(projectDirectory)
					? path
							.substring(projectDirectory.length)
							.replace(/^\/|^\.\//, "")
					: path.startsWith("/") || path.startsWith("./")
						? path.replace(/^\/|^\.\//, "")
						: path;
				copyToClipboard(relativePath);
				toast.success("Copied relative path to clipboard.", {
					duration: 2000,
					position: "top-center",
				});
			},
			separator: true,
		},
		{
			id: "delete",
			label: "Delete",
			onClick: async () => {
				const path = node.data.fullPath;
				deleteFileOrDirectory(path)
					.then(() => {
						toast.success(`Deleted ${type}.`, {
							duration: 2000,
							position: "top-center",
						});
						refresh(projectDirectory);
					})
					.catch((err) => {
						toast.error(`Error deleting ${type}\n${err}.`, {
							duration: 2000,
							position: "top-center",
						});
					});
			},
			disabled: false,
		},
	];

	const { onContextMenu } = useContextMenu(menuItems);

	// // close context menu on outside click / Esc
	// useEffect(() => {
	// 	const onClickAway = (e: MouseEvent) => {
	// 		if (
	// 			containerRef.current &&
	// 			!containerRef.current.contains(e.target as Node)
	// 		) {
	// 			setContextPos(null);
	// 		}
	// 	};
	// 	const onEsc = (e: KeyboardEvent) => {
	// 		if (e.key === "Escape") setContextPos(null);
	// 	};
	// 	document.addEventListener("mousedown", onClickAway);
	// 	document.addEventListener("keydown", onEsc);
	// 	return () => {
	// 		document.removeEventListener("mousedown", onClickAway);
	// 		document.removeEventListener("keydown", onEsc);
	// 	};
	// }, []);
	// const handleAction = async (action: string) => {
	// 	const path = node.data.id;
	// 	const parentPath = node.parent?.data.id ?? "";
	// 	switch (action) {
	// 		case "open":
	// 			if (node.isInternal) {
	// 				await getTree(path);
	// 				node.open();
	// 			} else {
	// 				window.open(
	// 					`/edit?file=${encodeURIComponent(path)}`,
	// 					"_blank",
	// 				);
	// 			}
	// 			break;
	// 		case "rename":
	// 			node.edit(); // enter builtin edit mode :contentReference[oaicite:1]{index=1}
	// 			break;
	// 		case "copy":
	// 			clipboard.current = { path, cut: false };
	// 			break;
	// 		case "cut":
	// 			clipboard.current = { path, cut: true };
	// 			break;
	// 		case "paste":
	// 			if (clipboard.current) {
	// 				if (clipboard.current.cut) {
	// 					await move(clipboard.current.path, path);
	// 				} else {
	// 					await copy(clipboard.current.path, path);
	// 				}
	// 				clipboard.current = null;
	// 				await getTree(parentPath);
	// 			}
	// 			break;
	// 		case "copyPath":
	// 			navigator.clipboard.writeText(path);
	// 			break;
	// 		case "copyRelPath":
	// 			navigator.clipboard.writeText(path);
	// 			break;
	// 		case "delete":
	// 			await tree.delete([path]);
	// 			await getTree(parentPath);
	// 			break;
	// 	}
	// 	setContextPos(null);
	// };

	const isFile = node.data.type === FileNodeType.File;
	if (node.data.isTemporary) {
		style.backgroundColor = "rgba(255, 255, 0, 0.2)";
		if (!node.isEditing) {
			node.select();
			node.edit();
		}
	}

	return (
		<div
			ref={dragHandle}
			style={{ ...style, width: "100%", boxSizing: "border-box" }}
			className={` ${styles.treeItem} ${
				node.isSelected ? styles.selected : ""
			} `}
			onContextMenu={onContextMenu}
			onDoubleClick={() => {
				if (clickTimeout.current) clearTimeout(clickTimeout.current);
				preventSingleClick.current = true;
				node.edit();
			}}
			onClick={(e) => {
				if (clickTimeout.current) clearTimeout(clickTimeout.current);

				clickTimeout.current = setTimeout(() => {
					if (!preventSingleClick.current) {
						console.log("Single click");
						node.handleClick(e);
						openFile(node.data.fullPath);
					}
					preventSingleClick.current = false;
				}, 250);
			}}
		>
			{/* chevron */}
			{!isFile && (
				<div
					className={styles.chevron}
					onClick={(e) => {
						e.stopPropagation();
						node.toggle();
					}}
				>
					{node.isOpen ? <ExpandMoreIcon /> : <ChevronRightIcon />}
				</div>
			)}

			{/* icon */}
			<div className={styles.icon}>
				{isFile ? <InsertDriveFileIcon /> : <FolderIcon />}
			</div>

			{/* name or edit input */}
			<div className={styles.name}>
				{node.isEditing || node.data.isTemporary ? (
					<input
						type="text"
						defaultValue={node.data.name}
						autoFocus
						className={styles.treeItemInput}
						onBlur={() => {
							node.reset();
							removeTempNodes();
						}}
						onKeyDown={async (e) => {
							if (e.key === "Escape") {
								node.reset();
								removeTempNodes();
							}
							if (e.key === "Enter") {
								if (node.data.isTemporary) {
									if (node.data.type === FileNodeType.File) {
										await createNewFile(
											path.join(
												path.dirname(
													node.data.fullPath,
												),
												(e.target as HTMLInputElement)
													.value,
											),
										);
									} else {
										await createNewDirectory(
											path.join(
												path.dirname(
													node.data.fullPath,
												),
												(e.target as HTMLInputElement)
													.value,
											),
										);
									}
									refresh(projectDirectory);
								} else {
									node.submit(
										(e.target as HTMLInputElement).value,
									);
								}
							}
						}}
					/>
				) : (
					<span>{node.data.name}</span>
				)}
			</div>

			{/* context menu */}
			{/* {contextPos && (
				<ul
					className={styles.contextMenu}
					style={{ top: contextPos.mouseY, left: contextPos.mouseX }}
				>
					{[
						"open",
						"rename",
						"copy",
						"cut",
						"paste",
						"copyPath",
						"copyRelPath",
						"delete",
					].map((a) => (
						<li key={a} onClick={() => handleAction(a)}>
							{a === "copyPath"
								? "Copy Path"
								: a === "copyRelPath"
									? "Copy Relative Path"
									: a.charAt(0).toUpperCase() + a.slice(1)}
						</li>
					))}
				</ul>
			)} */}
		</div>
	);
};

export default TreeItem;
