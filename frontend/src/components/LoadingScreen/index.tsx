import React from "react";
import styles from "./LoadingScreen.module.css";
import useStore from "@/store/store";
import { STYLES } from "@/styles/constants";

const LoadingScreen: React.FC = () => {
	const mode = useStore((state) => state.mode);
    const textColor = mode === "light" ? STYLES.mainFontColorLight : STYLES.mainFontColorDark;
	return (
        <div style={{  display: "flex",
            justifyContent: "center", /* Horizontal center */
            alignItems: "center", /* Vertical center */
            height: "100vh",
            backgroundColor: "var(--mui-palette-background-default)"}}>
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p
                    className={styles.message}
                    style={
                        {color: textColor}
                    }
                >
                    Loading dynamic components...
                </p>
            </div>
        </div>
	);
};

export default LoadingScreen;
