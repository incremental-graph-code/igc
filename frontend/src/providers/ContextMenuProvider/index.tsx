import {
	ReactNode,
	ReactElement,
	useCallback,
	useState,
	createContext,
	useEffect,
} from "react";
import { createPortal } from "react-dom";
import styles from "./ContextMenuProvider.module.css";
import React from "react";

/**
 * Describes a single item within the context menu.
 *
 * @template T - The type of the unique identifier for the menu item.
 */
export interface ContextMenuItem<T> {
	/**
	 * Unique identifier for the menu item.
	 */
	id: T;

	/**
	 * Content or label to render for the item.
	 */
	label: ReactNode;

	/**
	 * Callback invoked when the item is selected.
	 * Receives the item's `id`.
	 *
	 * @param id - The `id` of the clicked item.
	 */
	onClick: (id: T) => void;

	/**
	 * If `true`, the item is rendered disabled and not clickable.
	 * @default false
	 */
	disabled?: boolean;

	/**
	 * If true, renders a divider line below this item.
	 * @default false
	 */
	separator?: boolean;
	/**
	 * Additional CSS class(es) to apply to the `<li>` element.
	 */
	className?: string;
}

/**
 * Internal representation of the global menu state.
 */
interface InternalMenuState {
	/** Items currently displayed in the menu. */
	items: ContextMenuItem<any>[];

	/** Coordinates (in pixels) where the menu is positioned. */
	position: { x: number; y: number };

	/** Optional CSS class overrides for menu and items. */
	options?: {
		className?: string;
		itemClassName?: string;
	};

	/** Whether the menu is currently open. */
	isOpen: boolean;
}

/**
 * Default initial state for the global context menu.
 */
const defaultState: InternalMenuState = {
	items: [],
	position: { x: 0, y: 0 },
	options: {},
	isOpen: false,
};

/**
 * Context providing control functions for the global context menu.
 */
export const MenuContext = createContext<{
	/**
	 * Opens the menu with the given items at the specified position.
	 *
	 * @param items - Array of menu items to display.
	 * @param position - X/Y coordinates for menu placement.
	 * @param options - Optional CSS class overrides.
	 */
	open: (
		items: ContextMenuItem<any>[],
		position: { x: number; y: number },
		options?: { className?: string; itemClassName?: string },
	) => void;

	/**
	 * Closes the menu if open.
	 */
	close: () => void;
}>({ open: () => {}, close: () => {} });

/**
 * Provider component that renders a singleton, global context menu.
 * Wrap your application with this to enable useContextMenu everywhere.
 *
 * @param children - The React node tree to wrap.
 */
export const ContextMenuProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [state, setState] = useState<InternalMenuState>(defaultState);

	/**
	 * Opens the context menu.
	 */
	const open = useCallback(
		(
			items: ContextMenuItem<any>[],
			position: { x: number; y: number },
			options?: { className?: string; itemClassName?: string },
		) => {
			setState({ items, position, options, isOpen: true });
		},
		[],
	);

	/**
	 * Closes the context menu.
	 */
	const close = useCallback(() => {
		setState((s) => ({ ...s, isOpen: false }));
	}, []);

	// Close on global click or Escape key
	useEffect(() => {
		if (!state.isOpen) return;
		const handleClick = () => close();
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") close();
		};
		document.addEventListener("click", handleClick);
		document.addEventListener("keydown", handleKey);
		return () => {
			document.removeEventListener("click", handleClick);
			document.removeEventListener("keydown", handleKey);
		};
	}, [state.isOpen, close]);

	// Render the menu when open
	const menuElement: ReactElement | null = state.isOpen ? (
		<ul
			className={[styles.menu, state.options?.className]
				.filter(Boolean)
				.join(" ")}
			style={{
				position: "absolute",
				top: state.position.y,
				left: state.position.x,
			}}
			onContextMenu={(e) => e.preventDefault()}
		>
			{state.items.map((item) => (
                <React.Fragment key={String(item.id)}>
				<li
					className={[
						styles.item,
						state.options?.itemClassName,
						item.disabled ? styles.disabled : "",
						item.className,
					]
						.filter(Boolean)
						.join(" ")}
					onClick={(e: React.MouseEvent<HTMLLIElement>) => {
						e.stopPropagation();
						if (!item.disabled) {
							item.onClick(item.id);
							close();
						}
					}}
					aria-disabled={item.disabled}
				>
					{item.label}
				</li>
                {item.separator && (
                    <li
                      className={styles.divider}
                      role="separator"
                      aria-hidden="true"
                      key={`${String(item.id)}-divider`}
                    />
                  )}
                  </React.Fragment>
			))}
		</ul>
	) : null;

	return (
		<MenuContext.Provider value={{ open, close }}>
			{children}
			{createPortal(menuElement, document.body)}
		</MenuContext.Provider>
	);
};
