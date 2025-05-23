import { SyncID } from "@/adapters/consts";
import { SyncAdapterNode } from "@/utils/syncRegistry";
import deepEqual from "fast-deep-equal";

export const createSnippetSyncAdapter = <T, P>(
	syncId: SyncID,
	get: (parent: P) => T,
	set: (value: T, parent: P) => P,
	parentAdapter: SyncAdapterNode<P, any>,
): SyncAdapterNode<T, P> => {
	const getFunc = () => get(parentAdapter.get());
	const setFunc = (value: T) => {
		if (!deepEqual(value, get(parentAdapter.get()))) {
			parentAdapter.set(set(value, parentAdapter.get()));
		}
	};
	const serializeFunc = () => parentAdapter.get();
	const deserializeFunc = (parent: P) => get(parent);

	return {
		id: syncId,
		get: getFunc,
		set: setFunc,
		serialize: serializeFunc,
		deserialize: deserializeFunc,
	};
};
