import React, { useState, useEffect } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Divider } from "@mui/material";

export type ContextMenuState = {
    mouseX: number;
    mouseY: number;
} | null;

interface ContextMenuProps {
	mouseX: number | null;
	mouseY: number | null;
	handleClose: () => void;
	actions: ActionHandlers;
}

interface ActionHandlers {
	onOpen?: () => void;
	onRename?: () => void;
	onCopy?: () => void;
	onPaste?: () => void;
	onDelete?: () => void;
	onCopyPath?: () => void;
	onCopyRelativePath?: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
	mouseX,
	mouseY,
	handleClose,
	actions,
}) => {
	const open = mouseX !== null && mouseY !== null;
	const [selectedAction, setSelectedAction] = useState<(() => void) | null>(
		null,
	);

	const {
		onOpen = () => {},
		onRename = () => {},
		onCopy = () => {},
		onPaste = () => {},
		onDelete = () => {},
		onCopyPath = () => {},
		onCopyRelativePath = () => {},
	} = actions;

	const handleMenuItemClick = (action: () => void) => {
		setSelectedAction(() => action);
		handleClose();
	};

	useEffect(() => {
		if (!open && selectedAction) {
			selectedAction();
			setSelectedAction(null);
		}
	}, [open, selectedAction]);

	return (
		<Menu
			open={open}
			onClose={handleClose}
			anchorReference="anchorPosition"
			anchorPosition={
				mouseX !== null && mouseY !== null
					? { top: mouseY, left: mouseX }
					: undefined
			}
			autoFocus={false}
		>
			<MenuItem onClick={() => handleMenuItemClick(onOpen)}>
				Open
			</MenuItem>
			<Divider />
			<MenuItem onClick={() => handleMenuItemClick(onRename)}>
				Rename
			</MenuItem>
			<Divider />
			<MenuItem onClick={() => handleMenuItemClick(onCopy)}>
				Copy
			</MenuItem>
			<MenuItem onClick={() => handleMenuItemClick(onPaste)}>
				Paste
			</MenuItem>
			<MenuItem onClick={() => handleMenuItemClick(onDelete)}>
				Delete
			</MenuItem>
			<Divider />
			<MenuItem onClick={() => handleMenuItemClick(onCopyPath)}>
				Copy Path
			</MenuItem>
			<MenuItem onClick={() => handleMenuItemClick(onCopyRelativePath)}>
				Copy Relative Path
			</MenuItem>
		</Menu>
	);
};

export default ContextMenu;
