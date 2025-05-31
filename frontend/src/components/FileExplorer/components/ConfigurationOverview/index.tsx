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
import { isIGCFile } from "@/utils/file";

interface ConfigurationOverviewProps {
	openTextDialog: (defaultName: string) => Promise<string | null>;
}

const ConfigurationOverview: React.FC<ConfigurationOverviewProps> = ({
	openTextDialog,
}) => {
    const currentSessionId = useStore((state) => state.currentSessionId);
	const setCurrentSessionId = useStore((state) => state.setCurrentSessionId);
	const getSessionData = useStore((state) => state.getSessionData);
	const fileData = useStore((state) => state.fileData);
	const isIGC = isIGCFile(fileData);

	const currSessionData =
		fileData !== null ? getSessionData(fileData.filePath) : undefined;
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
		if (isIGC) {
			setSelectedSessionId(currentSessionId);
		} else {
			setSelectedSessionId(null);
		}
	}, [currentSessionId, isIGC]);

	const handleSessionChange = (value: string) => {
		if (fileData === null) {
			return;
		}
		setCurrentSessionId(() => value);
		loadSessionData(fileData.filePath).then((data) => {
			updateExecutionRelationships(fileData.filePath, data);
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
		if (sessionName && fileData.filePath !== null) {
			createNewSession(fileData.filePath, sessionName).then(() => {
				loadSessionData(fileData.filePath).then(() => {
					setCurrentSessionId(() => sessionName);
					useStore
						.getState()
						.sEdges(fileData.filePath, (prevEdges) =>
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
			fileData === null ||
			selectedSessionId === null ||
			selectedSessionId === ""
		) {
			return;
		}
		const sessionName = selectedSessionId;
		await deleteSession(fileData.filePath, sessionName);

		loadSessionData(fileData.filePath).then((sessionData) => {
			setCurrentSessionId(() => sessionData.primarySession);
			updateExecutionRelationships(fileData.filePath, sessionData);
		});
	};

	useEffect(() => {
		if (fileData === null) {
			return;
		}
		loadSessionData(fileData.filePath).then((data) => {
			setCurrentSessionId(() => data.primarySession);
			updateExecutionRelationships(fileData.filePath, data);
		});
	}, [fileData]);

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
					disabled={fileData === null}
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
