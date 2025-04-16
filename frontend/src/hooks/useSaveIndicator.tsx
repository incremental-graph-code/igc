import { useIndicator } from "./useIndicator";
import { useMemo } from "react";

const COLOR_MAP = {
	saved: "green",
	unsaved: "orange",
	error: "red",
	externallyChanged: "purple",
	none: "gray",
};

const SAVE_INDICATOR_WEIGHT = 0;
const SAVE_INDICATOR_KEY_PREFIX = "save-indicator";

export const useSaveIndicator = (
	editorId: string,
	getStatus: () => keyof typeof COLOR_MAP,
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
						status === "saved"
							? "green"
							: status === "error"
							? "red"
							: "orange",
				}}
			></span>
		);
	}, [status]);

	useIndicator({
		key: key,
		element: element,
		weight: SAVE_INDICATOR_WEIGHT,
	});
};
