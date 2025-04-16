import { useState, useCallback, ReactNode } from "react";

interface PopupState {
	component: ReactNode | null;
	title: string;
	onClose: () => void;
}

const usePopup = () => {
	const [popup, setPopup] = useState<PopupState | null>(null);

	const showPopup = useCallback((component: ReactNode, title: string) => {
		setPopup({
			component,
			title,
			onClose: () => setPopup(null),
		});
	}, []);

	const closePopup = useCallback(() => {
		setPopup(null);
	}, []);

	return {
		popup,
		showPopup,
		closePopup,
	};
};

export default usePopup;
