import React from "react";
import {
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Button,
} from "@mui/material";

interface ConfirmDialogProps {
	open: boolean;
	onClose: (shouldRefresh: boolean) => void;
    buttonLabelConfirm: string;
    buttonLabelCancel: string;
	message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
	open,
	onClose,
    buttonLabelConfirm,
    buttonLabelCancel,
	message,
}) => {
	const handleKeepChanges = () => {
		onClose(false);
	};

	const handleRefreshFile = () => {
		onClose(true);
	};

	return (
		<Dialog open={open} onClose={() => onClose(false)}>
			<DialogTitle>File Changed</DialogTitle>
			<DialogContent>
				<DialogContentText>{message}</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleKeepChanges}>
					{buttonLabelCancel}
				</Button>
				<Button onClick={handleRefreshFile} autoFocus>
					{buttonLabelConfirm}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ConfirmDialog;
