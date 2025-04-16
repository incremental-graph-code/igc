import { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import TextDialog from ".";

const useTextDialog = () => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [resolvePromise, setResolvePromise] = useState<
		((value: string | null) => void) | null
	>(null);
	const [defaultSessionName, setDefaultSessionName] = useState("");

	const openTextDialog = useCallback((defaultName: string) => {
		setDefaultSessionName(defaultName);
		setIsDialogOpen(true);
		return new Promise<string | null>((resolve) => {
			setResolvePromise(() => resolve);
		});
	}, []);

	const handleDialogClose = (sessionName: string | null) => {
		setIsDialogOpen(false);
		if (resolvePromise) {
			resolvePromise(sessionName);
		}
	};

	const TextDialogPortal = () =>
		ReactDOM.createPortal(
			<TextDialog
				open={isDialogOpen}
				onClose={handleDialogClose}
				defaultSessionName={defaultSessionName}
			/>,
			document.body,
		);

	return { openTextDialog, TextDialogPortal };
};

export default useTextDialog;
