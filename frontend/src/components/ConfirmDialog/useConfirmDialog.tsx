import { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import ConfirmDialog from ".";

const useConfirmDialog = () => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [resolvePromise, setResolvePromise] = useState<
		((value: boolean) => void) | null
	>(null);
	const [message, setMessage] = useState("");
	const [buttonLabelConfirm, setButtonLabelConfirm] = useState("Confirm");
	const [buttonLabelCancel, setButtonLabelCancel] = useState("Cancel");
    

	const openConfirmDialog = useCallback((msg: string, buttonLabelConfirm: string, buttonLabelCancel: string) => {
		setMessage(msg);
        setButtonLabelConfirm(buttonLabelConfirm);
        setButtonLabelCancel(buttonLabelCancel);
		setIsDialogOpen(true);
		return new Promise<boolean>((resolve) => {
			setResolvePromise(() => resolve);
		});
	}, []);

	const handleDialogClose = (shouldRefresh: boolean) => {
		setIsDialogOpen(false);
		if (resolvePromise) {
			resolvePromise(shouldRefresh);
		}
	};

	const ConfirmDialogPortal = ( ) =>
		ReactDOM.createPortal(
			<ConfirmDialog
				open={isDialogOpen}
				onClose={handleDialogClose}
                buttonLabelCancel={buttonLabelCancel}
                buttonLabelConfirm={buttonLabelConfirm}
				message={message}
			/>,
			document.body,
		);

	return { openConfirmDialog, ConfirmDialogPortal };
};

export default useConfirmDialog;
