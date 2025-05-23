import { useCallback, useEffect, useRef } from "react";

/**
 * Debounces a callback function, calling it only after no dependency changes
 * have occurred for the specified delay.
 *
 * @param callback - The function to execute after the debounce delay.
 * @param delay - Time in milliseconds to wait after the last change.
 * @param deps - Dependency list to watch for changes.
 */
export const useDebounce = (
	callback: () => void,
	delay: number,
	deps: React.DependencyList,
): void => {
	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	useEffect(() => {
		const handler = setTimeout(() => {
			callbackRef.current();
		}, delay);

		return () => clearTimeout(handler);
	}, [delay, ...deps]);
};

/**
 * Returns a debounced version of a callback function with argument support.
 *
 * @param callback - The function to debounce. Can receive any arguments.
 * @param delay - Time in milliseconds to wait before invoking the callback.
 * @returns A debounced function that accepts the same arguments as the original.
 */
export const useDebouncedCallback = <T extends (...args: any[]) => void>(
	callback: T,
	delay: number,
): ((...args: Parameters<T>) => void) => {
	const callbackRef = useRef(callback);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	const debounced = useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				callbackRef.current(...args);
			}, delay);
		},
		[delay],
	);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return debounced;
};
