import { useIndicator } from "./useIndicator";
import { useMemo } from "react";
import { PlayArrow } from "@mui/icons-material";

const RUN_INDICATOR_WEIGHT = 10;
const RUN_INDICATOR_KEY = "run-indicator";

export const useRunIndicator = (
    isExecutable: () => boolean,
	execute: () => void,
) => {
	const key = `${RUN_INDICATOR_KEY}`;
    const disabled = !isExecutable();

	const element = useMemo(() => {
		return (
			<button
                key={RUN_INDICATOR_KEY}
				className="icon-button"
				title="Run Code"
				onClick={execute}
				disabled={disabled}
			>
				<PlayArrow />
			</button>
		);
	}, [disabled, execute]);

	useIndicator({
		key: key,
		element: element,
		weight: RUN_INDICATOR_WEIGHT,
	});
};
