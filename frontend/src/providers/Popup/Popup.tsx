import React, { useEffect, useRef } from "react";
import Draggable from "react-draggable";
import styles from "./Popup.module.css";

interface PopupProps {
	component: React.ReactNode;
	title: string;
	onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ component, title, onClose }) => {
	const nodeRef = useRef<HTMLDivElement>(null);

	// Close on Escape
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	return (
		<div className={styles.popupOverlay}>
			<Draggable handle={`.${styles.popupHeader}`} nodeRef={nodeRef}>
				<div ref={nodeRef} className={styles.popupContainer}>
					<div className={styles.popupHeader}>
						<h2>{title}</h2>
						<button className={styles.closeBtn} onClick={onClose}>
							&times;
						</button>
					</div>
					<div className={styles.popupContent}>{component}</div>
				</div>
			</Draggable>
		</div>
	);
};

export default Popup;
