import { SyncID } from "@/adapters/consts";
import {
	SyncAdapterNode,
	registerSyncSystem,
	syncFrom,
	unregisterSyncSystem,
} from "@/utils/syncRegistry";
import { useEffect, useCallback } from "react";

/**
 * Registers a syncable system and returns a trigger function
 * to apply local changes and synchronize the rest of the system.
 *
 * @typeParam T - The type of the system's local state.
 *
 * @param id - A unique string identifier for the system (e.g., 'graph', 'snippet:node1').
 * @param adapter - An object containing functions to get/set state and serialize/deserialize text.
 * @returns A `trigger()` function that serializes the local state, updates the text system,
 *          and synchronizes all other systems.
 *
 * @example
 * ```tsx
 * const triggerGraphSync = useSyncSystem('graph', {
 *   get: () => graphData,
 *   set: setGraphData,
 *   serialize: graphToText,
 *   deserialize: parseTextToGraph,
 * });
 *
 * // Call this after editing graphData
 * triggerGraphSync();
 * ```
 */
export const useSyncSystem = <T, P>(
	adapterNode: SyncAdapterNode<T,P>,
    parent?: SyncID
): ((value?: T) => void) => {
	useEffect(() => {
		registerSyncSystem(adapterNode, parent);
		return () => unregisterSyncSystem(adapterNode.id);
	}, []);

	const trigger = useCallback((value?: T) => {
        if (value !== undefined) {
            adapterNode.set(value);
        }
		syncFrom(adapterNode.id);
	}, []);

	return trigger;
};
