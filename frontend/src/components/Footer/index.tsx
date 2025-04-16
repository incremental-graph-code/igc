import React from "react";
import GitHubIcon from "@mui/icons-material/GitHub";
import styles from "./Footer.module.css";
import { STYLES } from "@/styles/constants";

const Footer: React.FC = () => {
	return (
		<div className={styles.footer}>
			<div className={styles.footerContent}>
				<div className={styles.footerLogo}>
					<p>Incremental Graph Code</p>
				</div>
				<div
					className={styles.footerSocial}
					style={{ height: STYLES.footerHeight }}
				>
					<a
						href="https://github.com/MaxMB15/MSc-SE-Master-Project/tree/main/IncrGraph"
						target="_blank"
						rel="noopener noreferrer"
						style={{ paddingRight: "50px", left: "50%" }}
					>
						<GitHubIcon style={{ color: "#ffffff" }} />
					</a>
				</div>
			</div>
		</div>
	);
};

export default Footer;
