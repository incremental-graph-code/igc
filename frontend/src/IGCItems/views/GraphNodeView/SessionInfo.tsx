import React from "react";
import {
	Box,
	Typography,
	Paper,
	List,
	ListItem,
	ListItemText,
	Divider,
	Grid2,
} from "@mui/material";

interface SessionInfoProps {
    sessionId: string;
	executionOrder: string[];
	lastUpdated: number;
	variables: { [key: string]: any };
}

const SessionInfo: React.FC<SessionInfoProps> = ({
    sessionId,
	executionOrder,
	lastUpdated,
	variables,
}) => {
	const formattedDate = new Date(lastUpdated).toLocaleString();

	return (
		<Paper
			elevation={3}
			sx={{
				padding: "12px",
				borderRadius: "8px",
				maxHeight: "100px",
				overflowY: "auto", // Scrollable if content overflows
			}}
		>
            {/* Session Id */}
			<Box sx={{ marginBottom: "12px" }}>
				<Typography variant="subtitle2" color="textSecondary">
					Session ID:
				</Typography>
				<Typography variant="body2">{sessionId}</Typography>
			</Box>

			{/* Last Updated */}
			<Box sx={{ marginBottom: "12px" }}>
				<Typography variant="subtitle2" color="textSecondary">
					Last Updated:
				</Typography>
				<Typography variant="body2">{formattedDate}</Typography>
			</Box>

			<Divider sx={{ marginY: "12px" }} />

			{/* Execution Order */}
			<Box sx={{ marginBottom: "12px" }}>
				<Typography variant="subtitle2" color="textSecondary">
					Execution Order:
				</Typography>
				<List dense>
					{executionOrder.map((id, index) => (
						<ListItem key={id} disableGutters>
							<ListItemText primary={`${index + 1}. ${id}`} />
						</ListItem>
					))}
				</List>
			</Box>

			<Divider sx={{ marginY: "12px" }} />

			{/* Variables */}
			<Box>
				<Typography variant="subtitle2" color="textSecondary">
					Variables:
				</Typography>
				<Grid2 container spacing={1}>
					{Object.entries(variables).map(([key, value]) => (
						<Grid2 columns={12} key={key}>
							<Typography variant="body2">
								<strong>{key}:</strong> {String(value)}
							</Typography>
						</Grid2>
					))}
				</Grid2>
			</Box>
		</Paper>
	);
};

export default SessionInfo;
