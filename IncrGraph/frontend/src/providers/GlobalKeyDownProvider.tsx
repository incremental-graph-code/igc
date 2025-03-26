import {
	createContext,
	useEffect,
	useRef,
	FC,
	ReactNode,
} from "react";

export interface KeyPressListener {
	(event: KeyboardEvent): void;
}

interface GlobalKeyDownContextValue {
	subscribe: (listener: KeyPressListener) => () => void;
}

//Create the context; the default is `undefined` so we can check for it.
export const GlobalKeyDownContext = createContext<
	GlobalKeyDownContextValue | undefined
>(undefined);

// Create a provider component
interface GlobalKeyDownProviderProps {
	children: ReactNode;
}

export const GlobalKeyDownProvider: FC<GlobalKeyDownProviderProps> = ({
	children,
}) => {
	// We'll store the listeners in a ref so that our event listener
	// always sees the up-to-date set of subscribers.
	const subscribersRef = useRef<Set<KeyPressListener>>(new Set());

	// Subscribe function that returns an unsubscribe callback
	const subscribe = (listener: KeyPressListener) => {
		subscribersRef.current.add(listener);
		// Return an unsubscribe function
		return () => {
			subscribersRef.current.delete(listener);
		};
	};

	// Add the global keydown listener once when this provider mounts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Completely disable the browser's default behavior for *all* keys
			e.preventDefault();
			e.stopPropagation();

			// Notify all subscribers
			subscribersRef.current.forEach((listener) => {
				listener(e);
			});
		};

		window.addEventListener("keydown", handleKeyDown);

		// Cleanup
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	// Provide subscribe function to children
	return (
		<GlobalKeyDownContext.Provider value={{ subscribe }}>
			{children}
		</GlobalKeyDownContext.Provider>
	);
};
