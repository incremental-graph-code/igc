// From (with minor debounce alterations): https://github.com/ZeeCoder/use-resize-observer/issues/108#issuecomment-2837671374
import { debounce } from "lodash";
import React, { useState, useCallback, useEffect } from "react";

const useSize = <T extends React.RefObject<HTMLDivElement | null>>(
	target: T,
	delay: number = 10,
) => {
	const [size, setSize] = useState<DOMRect>();

	// Debounced version of size updater
	const updateSize = useCallback(
		debounce(() => {
			if (target.current) {
				const newSize = target.current.getBoundingClientRect();

				setSize((prev) => {
					// Only update if size really changed (optional, but useful)
					if (
						!prev ||
						prev.width !== newSize.width ||
						prev.height !== newSize.height
					) {
						return newSize;
					}
					return prev;
				});
			}
		}, delay),
		[target, delay],
	);

	useEffect(() => {
		const { current } = target;

		updateSize();

		const observer = new ResizeObserver(() => {
			updateSize();
		});

		if (current) {
			observer.observe(current);
		}

		return () => {
			updateSize.cancel();
			if (current) {
				observer.unobserve(current);
			}
			observer.disconnect();
		};
	}, [target, updateSize]);

	return size;
};

export { useSize };
