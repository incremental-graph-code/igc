import { useIndicator } from "./useIndicator";
import { useMemo } from "react";

/**
 * Different file save statuses
 */
export enum FileSaveStatus {
	Saved = "saved",
	Unsaved = "unsaved",
	Error = "error",
	ExternallyChanged = "externallyChanged",
	None = "none",
}

/**
 * Maps each file status to a display color
 */
const FILE_SAVE_STATUS_COLOR_MAP: Record<FileSaveStatus, string> = {
	[FileSaveStatus.Saved]: "green",
	[FileSaveStatus.Unsaved]: "orange",
	[FileSaveStatus.Error]: "red",
	[FileSaveStatus.ExternallyChanged]: "purple",
	[FileSaveStatus.None]: "gray",
};

/**
 * @param status - The file save status
 * @description Returns the color associated with a given file save status.
 * @returns The color associated with the file save status.
 */
export const getStatusColor = (status: FileSaveStatus): string => {
	return FILE_SAVE_STATUS_COLOR_MAP[status];
};

const SAVE_INDICATOR_WEIGHT = 0;
const SAVE_INDICATOR_KEY_PREFIX = "save-indicator";

export const useSaveIndicator = (
	editorId: string,
	getStatus: () => FileSaveStatus,
) => {
	const key = `${SAVE_INDICATOR_KEY_PREFIX}-${editorId}`;
	const status = getStatus();

	const element = useMemo(() => {
		return (
			<span
				key={key}
				className="navbar-circle-icon"
				style={{
					backgroundColor:
						status === FileSaveStatus.Saved
							? getStatusColor(FileSaveStatus.Saved)
							: status === FileSaveStatus.Error
								? getStatusColor(FileSaveStatus.Error)
								: getStatusColor(FileSaveStatus.Unsaved),
				}}
			></span>
		);
	}, [status, key]);

	useIndicator({
		key: key,
		element: element,
		weight: SAVE_INDICATOR_WEIGHT,
	});
};
