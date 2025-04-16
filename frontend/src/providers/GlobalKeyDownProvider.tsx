import { createContext, useEffect, useRef, FC, ReactNode } from "react";

export interface KeyPressListener {
	(event: KeyboardEvent): void;
}

interface GlobalKeyDownContextValue {
	subscribe: (listener: KeyPressListener) => () => void;
	setRawKeyOwner: (owner: string | null) => void;
	getRawKeyOwner: () => string | null;
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
	const subscribersRef = useRef<Set<KeyPressListener>>(new Set());
	const rawKeyOwnerRef = useRef<string | null>(null); // who currently handles keys natively

	const subscribe = (listener: KeyPressListener) => {
		subscribersRef.current.add(listener);
		return () => {
			subscribersRef.current.delete(listener);
		};
	};

	const setRawKeyOwner = (owner: string | null) => {
		rawKeyOwnerRef.current = owner;
	};

	const getRawKeyOwner = () => rawKeyOwnerRef.current;

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const owner = rawKeyOwnerRef.current;

			// If an owner is set (e.g., Monaco), don't interfere
			if (!owner) {
				e.preventDefault();
				e.stopPropagation();
			}

			// Notify subscribers regardless — let them opt out too if they want
			subscribersRef.current.forEach((listener) => listener(e));
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<GlobalKeyDownContext.Provider
			value={{ subscribe, setRawKeyOwner, getRawKeyOwner }}
		>
			{children}
		</GlobalKeyDownContext.Provider>
	);
};
