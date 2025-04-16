import React, { createContext, ReactNode, useContext } from "react";
import usePopup from "@/hooks/usePopup";
import Popup from "./Popup";

interface PopupContextType {
    showPopup: (component: ReactNode, title: string) => void;
	closePopup: () => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const { popup, showPopup, closePopup } = usePopup();

	return (
		<PopupContext.Provider value={{ showPopup, closePopup }}>
			{children}
			{popup?.component && (
				<Popup title={popup.title} component={popup.component} onClose={popup.onClose} />
			)}
		</PopupContext.Provider>
	);
};

export const usePopupContext = () => {
	const context = useContext(PopupContext);
	if (!context) {
		throw new Error("usePopupContext must be used within a PopupProvider");
	}
	return context;
};
