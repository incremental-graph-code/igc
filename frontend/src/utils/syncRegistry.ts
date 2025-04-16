/**
 * A unique identifier used to register a syncable system.
 */
type SyncID = string;

/**
 * An adapter that defines how to get/set a system's state,
 * and how to serialize/deserialize it to/from the raw text source.
 */
export interface SyncAdapter<T> {
	/**
	 * Returns the current local state for this system.
	 */
	get: () => T;

	/**
	 * Updates the local state of the system.
	 * @param value - The new value to set.
	 */
	set: (value: T) => void;

	/**
	 * Converts the local system state to text form.
	 * @param value - The system's current local state.
	 * @param prevText - The full text state before conversion.
	 * @returns A new string representing the updated text state.
	 */
	serialize: (value: T, prevText: string) => string;

	/**
	 * Converts the full text into the system's local state.
	 * @param text - The current raw text data.
	 * @returns A parsed local value derived from the text.
	 */
	deserialize: (text: string) => T;
}

/**
 * The internal sync registry that maps system IDs to their adapters.
 */
const registry = new Map<SyncID, SyncAdapter<any>>();

/**
 * Registers a syncable system with the global sync registry.
 *
 * @param id - A unique identifier for the system (e.g., 'graph', 'snippet:node1').
 * @param adapter - The adapter providing get/set/serialize/deserialize functions.
 */
export const registerSyncSystem = <T>(
	id: SyncID,
	adapter: SyncAdapter<T>,
): void => {
	registry.set(id, adapter);
};

/**
 * Unregisters a syncable system from the registry.
 *
 * @param id - The identifier of the system to remove.
 */
export const unregisterSyncSystem = (id: SyncID): void => {
	registry.delete(id);
};

/**
 * Synchronizes all systems from the current text state.
 * The 'text' system must be registered as the single source of truth.
 * All systems except 'text' and the triggering system will be updated.
 *
 * @param sourceId - The system initiating the sync (will be excluded).
 */
export const synchronize = (sourceId: SyncID): void => {
	const textAdapter = registry.get("text");
	if (!textAdapter) {
		throw new Error("No 'text' system registered — cannot synchronize.");
	}

	const currentText = textAdapter.get();

	for (const [id, adapter] of registry.entries()) {
		if (id === "text" || id === sourceId) continue;

		const newValue = adapter.deserialize(currentText);
		adapter.set(newValue);
	}
};

/**
 * Applies a change from a given system and synchronizes all others.
 * This converts the system's local state into updated text,
 * writes it back to the text system, and then synchronizes all other systems.
 *
 * @param id - The system ID that triggered the change.
 */
export const applySystemChange = (id: SyncID): void => {
	const adapter = registry.get(id);
	const textAdapter = registry.get("text");

	if (!adapter || !textAdapter) return;

	const localValue = adapter.get();
	const prevText = textAdapter.get();
	const newText = adapter.serialize(localValue, prevText);

	textAdapter.set(newText);
	synchronize("text");
};

/**
 * Retrieves the sync adapter registered under the given ID.
 *
 * @param id - The system ID to look up.
 * @returns The registered sync adapter, if found.
 */
export const getSyncAdapter = <T>(id: SyncID): SyncAdapter<T> | undefined => {
	return registry.get(id);
};
