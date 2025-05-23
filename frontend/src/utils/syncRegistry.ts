import { SyncID, SyncSystem } from "@/adapters/consts";

/**
 * Defines a syncable node in the system. Each node has its own state (`T`) and derives it
 * from a parent state (`P`) through serialization and deserialization.
 *
 * @template T - The local state type of this system.
 * @template P - The state type expected from its parent.
 */
export interface SyncAdapterNode<T, P> {
	id: SyncID;
	get: () => T | null;
	set: (value: T | null) => void;
	serialize: (value: T) => P;
	deserialize: (parent: P) => T | null;
}

/**
 * Wraps a syncable node into a hierarchical system of nested sync systems.
 *
 * @template T - The local state type of this system.
 * @template P - The parent state type this system depends on.
 */
export interface SyncAdapterSystem<T, P> {
	subSystems: Map<SyncID, SyncAdapterSystem<any, T>>;
	node: SyncAdapterNode<T, P>;
	parent?: SyncAdapterSystem<P, any>;
}

/** Global registry mapping all sync system IDs to their registered adapters. */
const registry = new Map<SyncID, SyncAdapterSystem<any, any>>();

/**
 * Tracks top-level systems that have no parent (e.g., 'text').
 * Useful for debugging or root-level operations.
 */
const registryTree = new Map<SyncID, SyncAdapterSystem<any, any>>();

/**
 * Registers a sync system into the global registry. If a parent ID is provided,
 * the system is added as a child of the parent and linked through the tree.
 *
 * @template T - The local type of the system being registered.
 * @template P - The type of the parent system this system depends on.
 *
 * @param node - The sync node to register.
 * @param parentId - Optional ID of the parent sync system.
 */
export const registerSyncSystem = <T, P>(
	node: SyncAdapterNode<T, P>,
	parentId?: SyncID,
): void => {
	const parent = registry.get(parentId);

	const system: SyncAdapterSystem<T, P> = {
		subSystems: new Map<SyncID, SyncAdapterSystem<any, T>>(),
		node,
		parent: parent,
	};

	registry.set(node.id, system);

	if (parent !== undefined) {
		parent.subSystems.set(node.id, system);
	} else if (parentId !== undefined) {
		console.warn(`Parent system "${parentId}" not found for "${node.id}".`);
	} else {
		// Really only Text should be allowed, but we will keep it general for now
		if (node.id !== SyncSystem.Text) {
			console.warn(
				`Trying to set an unsupported Sync System as root (${node.id}); Text Sync System is only allowed at root.`,
			);
			// return;
		}
		registryTree.set(node.id, system);
	}
};

/**
 * Unregisters a sync system from the registry, and removes it from its parent (if any).
 *
 * @param id - The ID of the sync system to remove.
 */
export const unregisterSyncSystem = (id: SyncID): void => {
	const syncSystem = registry.get(id);
	if (syncSystem !== undefined) {
		// Remove from parent's subSystems, if applicable
		const parentId = syncSystem.parent?.node.id;
		if (parentId !== undefined) {
			registry.get(parentId)?.subSystems.delete(id);
		} else {
			// Otherwise, remove from the root-level registry tree
			registryTree.delete(id);
		}

		registry.delete(id);
	}
};

export const syncFrom = (id: SyncID): void => {
	const visited = new Set<SyncID>();
	const system = registry.get(id);
	if (!system) {
        const err = `Sync system "${id}" not found.`;
		console.error(err);
        throw err;
	}

	const syncParent = <T, P>(
		node: SyncAdapterNode<T, P>,
		parent: SyncAdapterNode<P, any>,
	) => {
		const localValue = node.get();
		if (localValue !== null) {
			const serialized: P = node.serialize(localValue);
			parent.set(serialized);
			visited.add(parent.id);
		}
	};
	const syncChild = <T, P>(
		node: SyncAdapterNode<T, P>,
		child: SyncAdapterNode<any, T>,
	) => {
		const localValue = node.get();
		if (localValue !== null) {
			const deserialized: T = child.deserialize(localValue);
			child.set(deserialized);
			visited.add(child.id);
		}
	};

	const syncDown = (system: SyncAdapterSystem<any, any>) => {
		for (const child of system.subSystems.values()) {
			if (!visited.has(child.node.id)) {
				syncChild(system.node, child.node);
				syncDown(child);
			}
		}
	};

	const syncUp = (system: SyncAdapterSystem<any, any>) => {
		const parent = system.parent;
		if (parent !== undefined) {
			// Sync Parent
			syncParent(system.node, parent.node);
			visited.add(parent.node.id);

			// Propagate changes down from parent
			syncDown(parent);

			// Continue to propagate changes to next parent
			syncUp(parent);
		}
	};

	visited.add(id);
	syncDown(system);
	syncUp(system);
};

/**
 * Performs a full synchronization starting from the given node.
 *
 * Propagates upward from the node to the root by serializing and applying local changes.
 * Then walks downward from the root to update all children via deserialization.
 *
 * Nodes are only visited once and tracked via a `visited` set.
 *
 * @param id - The ID of the system where the change originated.
 */
// export const syncFrom = (id: SyncID): void => {
// 	const visited = new Set<SyncID>();

// 	/**
// 	 * Propagates local state upward by serializing to the parent system.
// 	 * Returns the final root state after applying all serializations.
// 	 */
// 	const syncUp = <T, P>(system: SyncAdapterSystem<T, P>): P => {
// 		if (visited.has(system.node.id)) {
// 			throw new Error(
// 				`Cycle or duplicate visit detected at node '${system.node.id}'`,
// 			);
// 		}
// 		visited.add(system.node.id);

// 		const local = system.node.get();
// 		if (local === null) {
// 			throw new Error(`Cannot sync from null node: '${system.node.id}'`);
// 		}

// 		const serialized: P = system.node.serialize(local);

// 		if (system.parent) {
// 			system.parent.node.set(serialized);
// 			return syncUp(system.parent);
// 		} else {
// 			// This node is the root
// 			return serialized;
// 		}
// 	};

// 	/**
// 	 * Propagates state downward by deserializing the parent value into the local node,
// 	 * and recursively into all child systems.
// 	 */
// 	const syncDown = <T, P>(
// 		parentValue: P,
// 		system: SyncAdapterSystem<T, P>,
// 	): void => {
// 		if (visited.has(system.node.id)) return;
// 		visited.add(system.node.id);

// 		const local = system.node.deserialize(parentValue);
// 		system.node.set(local);

// 		if (local !== null) {
// 			for (const child of system.subSystems.values()) {
// 				syncDown(local, child);
// 			}
// 		}
// 	};

// 	// Find and validate the starting node
// 	const curNode = registry.get(id);
// 	if (!rootNode) throw new Error(`Node '${id}' not found in registry`);

// 	// Propagate upward to compute new root state
// 	const rootValue = syncUp(curNode);

// 	// Identify the topmost root
// 	let topNode: SyncAdapterSystem<any, any> = rootNode;
// 	while (topNode.parent !== undefined) {
// 		topNode = topNode.parent;
// 	}

// 	// Propagate changes downward from the root
// 	syncDown(rootValue, topNode);
// };

/**
 * Returns the sync system registered with the given ID.
 *
 * @param id - The ID of the system to retrieve.
 * @returns The sync system, if registered.
 */
export const getSyncAdapter = <T, P>(
	id: SyncID,
): SyncAdapterSystem<T, P> | undefined => {
	return registry.get(id);
};

/**
 * Resets all registered sync systems by setting their local state to `null`.
 *
 * This is typically used during app initialization or file switching
 * to clear residual state and avoid stale data propagation.
 */
export const resetSyncSystems = (): void => {
	registry.forEach((system, id) => {
		try {
			system.node.set(null);
		} catch (err) {
			console.warn(`Failed to reset sync system "${id}" with null:`, err);
		}
	});
};

/**
 * Updates the local state of a specific sync system and optionally triggers a sync pass.
 *
 * @param id - The ID of the sync system to update.
 * @param newValue - The new value to assign to the system.
 * @param triggerSync - Whether to trigger a full sync after updating. Default is `true`.
 */
export const updateSyncSystem = <T>(
	id: SyncID,
	newValue: T,
	triggerSync: boolean = true,
): void => {
	const system = registry.get(id);
	if (system) {
		system.node.set(newValue);
		if (triggerSync) {
			syncFrom(id);
		}
	} else {
		console.warn(`Sync system "${id}" not found.`);
	}
};
