import useStore from "@/store/store";
import { useEffect } from "react";

export const useTriggerEdgeTypeUpdate = () => {
	const trigger = useStore((state) => state.triggerEdgeTypeUpdate);
	return trigger;
};

export const useSubscribeEdgeTypeUpdate = (
	id: string,
	callback: () => void,
) => {
	const subscribe = useStore((state) => state.subscribeEdgeTypeUpdate);

	useEffect(() => {
		const unsubscribe = subscribe(id, callback);
		return () => unsubscribe();
	}, [id, callback, subscribe]);
};
