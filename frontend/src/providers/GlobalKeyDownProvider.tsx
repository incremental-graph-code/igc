import {
	createContext,
	useEffect,
	useRef,
	FC,
	ReactNode,
	RefObject,
} from "react";

export interface KeyPressListener {
	(event: KeyboardEvent): void;
}

interface GlobalKeyDownContextValue {
	subscribe: (listener: KeyPressListener) => () => void;
	setRawKeyOwner: (owner: string | null) => void;
	getRawKeyOwner: () => string | null;
}

export const GlobalKeyDownContext = createContext<
	GlobalKeyDownContextValue | undefined
>(undefined);

interface GlobalKeyDownProviderProps {
	children: ReactNode;
}

export const GlobalKeyDownProvider: FC<GlobalKeyDownProviderProps> = ({
	children,
}) => {

	const subscribersRef = useRef<Set<KeyPressListener>>(new Set());
	const rawKeyOwnerRef: RefObject<string | null> = useRef(null);

	const isTypingField = (el: EventTarget | null): el is HTMLElement => {
		if (!el || !(el as HTMLElement).tagName) return false;

		const target = el as HTMLElement;
		const tag = target.tagName.toLowerCase();

		// Allow plain text boxes, search boxes, number fields, etc.
		if (tag === "input" || tag === "textarea") return true;

		// Editable divs / spans
		if (target.isContentEditable) return true;

		return false;
	};

	/** PUBLIC API */
	const subscribe = (listener: KeyPressListener) => {
		subscribersRef.current.add(listener);
		return () => subscribersRef.current.delete(listener);
	};

	const setRawKeyOwner = (owner: string | null) => {
		rawKeyOwnerRef.current = owner;
	};

	const getRawKeyOwner = () => rawKeyOwnerRef.current;

    /** KEY HANDLER */
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const owner = rawKeyOwnerRef.current;

			const allowBecauseInput = isTypingField(e.target);

			if (!owner && !allowBecauseInput) {
				e.preventDefault();
				e.stopPropagation();
			}

			// Forward to all subscribers so they can still react if they want
			subscribersRef.current.forEach((listener) => listener(e));
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	/** PROVIDER */
	return (
		<GlobalKeyDownContext.Provider
			value={{ subscribe, setRawKeyOwner, getRawKeyOwner }}
		>
			{children}
		</GlobalKeyDownContext.Provider>
	);
};
