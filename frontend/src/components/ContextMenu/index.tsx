import React from "react";
import { Menu, MenuItem, ListItemIcon, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface ContextMenuProps {
	anchorEl: null | HTMLElement;
	handleClose: () => void;
	position: { mouseX: number; mouseY: number } | null;
	onDelete: () => void;
    onDuplicate: () => void;
	onRun?: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
	anchorEl,
	handleClose,
	position,
	onDelete,
    onDuplicate,
	onRun,
}) => {
	return (
		<Menu
			anchorReference="anchorPosition"
			anchorPosition={
				position
					? { top: position.mouseY, left: position.mouseX }
					: undefined
			}
			open={Boolean(anchorEl)}
			onClose={handleClose}
		>
			{onRun !== undefined && (
				<MenuItem onClick={onRun}>
					<ListItemIcon>
						<PlayArrowIcon style={{ color: "green" }} />
					</ListItemIcon>
					<Typography variant="inherit">Run</Typography>
				</MenuItem>
			)}
            <MenuItem onClick={onDuplicate}>
                <ListItemIcon>
                    <ContentCopyIcon />
                </ListItemIcon>
                <Typography variant="inherit">Duplicate</Typography>
            </MenuItem>
			<MenuItem onClick={onDelete}>
				<ListItemIcon>
					<DeleteIcon style={{ color: "red" }} />
				</ListItemIcon>
				<Typography variant="inherit">Delete</Typography>
			</MenuItem>
		</Menu>
	);
};

export default ContextMenu;
