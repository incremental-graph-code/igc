import { GetState, SetState } from "../store";

import { ElementItem } from "@/types/frontend";

export interface NavIndicatorsSliceState {
	navBarContainer: Map<string, ElementItem>;
	setNavBarContainer: (key: string, item: ElementItem | null) => void;
	getNavBarContainer: () => ElementItem[];
}

export const createNavIndicatorsSlice = (
	set: SetState,
	get: GetState,
): NavIndicatorsSliceState => ({
	navBarContainer: new Map(),

	setNavBarContainer: (key, item) =>
		set((state) => {
			const newNavBarContainer = new Map(state.navBarContainer);

			if (item) {
				newNavBarContainer.set(key, item);
			} else {
				newNavBarContainer.delete(key); // Remove the item if null is passed
			}

			return { navBarContainer: newNavBarContainer };
		}),

	getNavBarContainer: () => {
		const items = Array.from(get().navBarContainer.values());
		return items.sort((a, b) => a.weight - b.weight);
	},
});
