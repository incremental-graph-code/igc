import { Box, Typography } from "@mui/material";
import styles from "./ConfigurationDisplay.module.css";
import ReactJson from "react-json-view";
import useStore from "@/store/store";

const ConfigurationDisplay: React.FC<{ data: any }> = ({ data }) => {
	return (
		<Box className={styles.container}>
			{data ? (
				<ReactJson src={data} theme={useStore.getState().mode === "light" ? "rjv-default" : "summerfruit"} indentWidth={4} name={null} style={{width: "100%", height: "100%", backgroundColor: "var(--mui-background-main)"}}/>
			) : (
				<Typography>No Configurations</Typography>
			)}
		</Box>
	);
};

export default ConfigurationDisplay;
