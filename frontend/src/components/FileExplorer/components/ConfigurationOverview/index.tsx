import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import ConfigurationDisplay from "../../../ConfigurationDisplay";
import CustomSelect from "../../../CustomSelect";
import styles from "./ConfigurationOverview.module.css";
import useStore from "@/store/store";
import { STYLES } from "@/styles/constants";
import {
	createNewSession,
	loadSessionData,
	updateExecutionRelationships,
} from "@/utils/sessionHandler";
import { deleteSession } from "@/requests";

interface ConfigurationOverviewProps {
	openTextDialog: (defaultName: string) => Promise<string | null>;
}

const ConfigurationOverview: React.FC<ConfigurationOverviewProps> = ({
	openTextDialog,
}) => {
	const isIGCFile = useStore((state) => state.isIGCFile);
	const currentSessionId = useStore((state) => state.currentSessionId);
	const setCurrentSessionId = useStore((state) => state.setCurrentSessionId);
	const getSessionData = useStore((state) => state.getSessionData);
	const selectedFile = useStore((state) => state.selectedFile);

	const currSessionData =
		selectedFile !== null ? getSessionData(selectedFile) : undefined;
	const sessionKeys =
		currSessionData !== undefined
			? Object.keys(currSessionData.sessions)
			: [];
	const sessionData =
		currSessionData !== undefined ? currSessionData.sessions : {};

	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
		null,
	);

	useEffect(() => {
		if (isIGCFile) {
			setSelectedSessionId(currentSessionId);
		} else {
			setSelectedSessionId(null);
		}
	}, [currentSessionId, isIGCFile]);

	const handleSessionChange = (value: string) => {
		if (selectedFile === null) {
			return;
		}
		setCurrentSessionId(() => value);
		loadSessionData(selectedFile).then((data) => {
			updateExecutionRelationships(selectedFile, data);
		});
	};

	const handleStartNewSession = async () => {
		const defaultSessionName = `IGC_${new Intl.DateTimeFormat("en-GB", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		})
			.format(new Date())
			.replace(/,/, "")
			.replace(/\//g, "-")
			.replace(" ", "_")}`;

		const sessionName = await openTextDialog(defaultSessionName);
		if (sessionName && selectedFile !== null) {
			createNewSession(selectedFile, sessionName).then(() => {
				loadSessionData(selectedFile).then(() => {
					setCurrentSessionId(() => sessionName);
					useStore
						.getState()
						.setEdges(selectedFile, (prevEdges) =>
							prevEdges.filter(
								(edge) => edge.type !== "ExecutionRelationship",
							),
						);
				});
			});
		}
	};
	const handleDeleteSession = async () => {
		if (
			selectedFile === null ||
			selectedSessionId === null ||
			selectedSessionId === ""
		) {
			return;
		}
		const sessionName = selectedSessionId;
		await deleteSession(selectedFile, sessionName);

		loadSessionData(selectedFile).then((sessionData) => {
			setCurrentSessionId(() => sessionData.primarySession);
			updateExecutionRelationships(selectedFile, sessionData);
		});
	};

	useEffect(() => {
		if (selectedFile === null) {
			return;
		}
		loadSessionData(selectedFile).then((data) => {
			setCurrentSessionId(() => data.primarySession);
			updateExecutionRelationships(selectedFile, data);
		});
	}, [selectedFile]);

	return (
		<div className={`
    box-border flex h-full min-h-[250px] w-full flex-col items-center border-t-[5px]
    border-t-[var(--mui-palette-background-pure)] bg-[var(--mui-palette-background-paper)] p-4
    text-[var(--mui-palette-text-primary)]
  `}>
			<Typography
				variant="h6"
				className={styles.configurationOverviewTitle}
			>
				Session Configuration
			</Typography>
			<Box className={styles.configurationOverviewControls}>
				<Button
					variant="contained"
					onClick={handleStartNewSession}
					className={styles.configurationOverviewButton}
					sx={{ backgroundColor: STYLES.primary }}
					disabled={selectedFile === null}
				>
					Start New Session
				</Button>
				<CustomSelect
					id="session-select"
					label="Select Session"
					options={sessionKeys.map((sessionId) => ({
						value: sessionId,
						label: sessionId,
						style: {},
					}))}
					value={selectedSessionId || ""}
					onChange={(e) => handleSessionChange(e)}
				/>
			</Box>
			{selectedSessionId !== null ? (
				<ConfigurationDisplay
					data={sessionData[selectedSessionId]?.overallConfiguration}
				/>
			) : (
				<Typography
					className={
						"mt-4 flex-grow text-center text-[var(--mui-palette-text-secondary)]"
					}
				>
					No Configurations
				</Typography>
			)}
			<Button
				variant="contained"
				onClick={handleDeleteSession}
				className={styles.configurationOverviewButton}
				sx={{ backgroundColor: STYLES.nodeErrorColor }}
				disabled={
					currentSessionId === null ||
					selectedSessionId === null ||
					selectedSessionId === ""
				}
			>
				Delete Session
			</Button>
		</div>
	);
};

export default ConfigurationOverview;
