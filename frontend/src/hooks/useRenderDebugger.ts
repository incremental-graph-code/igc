import { useEffect, useRef } from "react";

export const useRenderDebugger = (
	label = "Component",
	props: Record<string, any> = {},
) => {
	const renderCount = useRef(1);
	const previousProps = useRef(props);

	useEffect(() => {
		console.log(`[${label}] Rendered ${renderCount.current++} times`);

		const allKeys = Object.keys({ ...previousProps.current, ...props });
		const changes: Record<string, { from: any; to: any }> = {};

		allKeys.forEach((key) => {
			if (previousProps.current[key] !== props[key]) {
				changes[key] = {
					from: previousProps.current[key],
					to: props[key],
				};
			}
		});

		if (Object.keys(changes).length > 0) {
			console.log(`[${label}] Prop changes:`, changes);
		}

		previousProps.current = props;
	});
};
