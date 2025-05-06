import { ContextMenuItem, MenuContext } from "@/providers/ContextMenuProvider";
import { useCallback, useContext } from "react";

/**
 * Custom hook to open the global context menu on right-click.
 *
 * @template T - The type of the unique identifier for the menu items.
 * @param items - Array of menu items to display.
 * @param options - Optional CSS class overrides.
 * @returns An object containing `onContextMenu` handler.
 */
export const useContextMenu = <T,>(
	items: ContextMenuItem<T>[],
	options?: { className?: string; itemClassName?: string },
): { onContextMenu: (e: React.MouseEvent<HTMLElement>) => void } => {
	const { open } = useContext(MenuContext);

	/**
	 * Handler to attach to any element's onContextMenu event (right-click).
	 */
	const onContextMenu = useCallback(
		(e: React.MouseEvent<HTMLElement>) => {
			e.preventDefault();
			open(
				items as ContextMenuItem<any>[],
				{ x: e.clientX, y: e.clientY },
				options,
			);
		},
		[items, options, open],
	);

	return { onContextMenu };
};

// Usage:
// 1. Wrap your root component with ContextMenuProvider:
//
// import React from 'react';
// import { ContextMenuProvider } from './useContextMenu';
// import App from './App';
//
// const Root: React.FC = () => (
//   <ContextMenuProvider>
//     <App />
//   </ContextMenuProvider>
// );
//
// 2. In any descendant component, use the hook:
//
// import React from 'react';
// import { useContextMenu, ContextMenuItem } from './useContextMenu';
//
// type Action = 'edit' | 'delete' | 'share';
//
// const menuItems: ContextMenuItem<Action>[] = [
//   { id: 'edit',   label: '✏️ Edit',   onClick: id => console.log('Action:', id) },
//   { id: 'delete', label: '🗑️ Delete', onClick: id => console.log('Action:', id), disabled: true },
//   { id: 'share',  label: '📤 Share',  onClick: id => console.log('Action:', id) },
// ];
//
// const MyComponent: React.FC = () => {
//   const { onContextMenu } = useContextMenu(menuItems, {
//     className: 'customMenu',      // optional override
//     itemClassName: 'customItem',  // optional override
//   });
//
//   return (
//     <div
//       onContextMenu={onContextMenu}
//       style={{ padding: 16, border: '1px solid #ddd' }}
//     >
//       Right-click anywhere in this box to open the global context menu.
//     </div>
//   );
// };
//
// export default MyComponent;
