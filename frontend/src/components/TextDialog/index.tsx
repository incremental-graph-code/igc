import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	Button,
} from "@mui/material";
import useStore from "@/store/store";

interface TextDialogProps {
	open: boolean;
	onClose: (sessionName: string | null) => void;
	defaultSessionName: string;
}

const TextDialog: React.FC<TextDialogProps> = ({
	open,
	onClose,
	defaultSessionName,
}) => {
    const getSessionData = useStore((state) => state.getSessionData);
    const selectedFile = useStore((state) => state.selectedFile);
    const sessions = selectedFile !== null ? getSessionData(selectedFile)?.sessions ?? {} : {};
    const [sessionName, setSessionName] = useState(defaultSessionName);
	const [error, setError] = useState("");

	useEffect(() => {
		if (sessionName in sessions) {
			setError("Session name already exists.");
		} else {
			setError("");
		}
	}, [sessionName, sessions]);

	const handleClose = () => {
		onClose(null);
	};

	const handleConfirm = () => {
		if (!error) {
			onClose(sessionName);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSessionName(e.target.value);
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
			<DialogTitle>Start New Session</DialogTitle>
			<DialogContent>
				<TextField
					autoFocus
					margin="dense"
					label="Session Name"
					type="text"
					fullWidth
					value={sessionName}
					onChange={handleChange}
					error={!!error}
					helperText={error}
					InputProps={{
						style: {
							borderColor: error ? "red" : undefined,
						},
					}}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} color="primary">
					Cancel
				</Button>
				<Button
					onClick={handleConfirm}
					color="primary"
					disabled={!!error}
				>
					Confirm
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default TextDialog;
