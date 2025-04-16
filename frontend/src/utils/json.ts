import _ from "lodash";

export const applyFilter = (data: any, filters: string[]): any => {
	const clonedData = _.cloneDeep(data);

	const parsedFilters = filters.map((filter) => filter.split("."));

	const removeKeys = (obj: any, keys: string[][]) => {
		if (!keys.length || !obj) return;

		const keyMap = keys.reduce((map, key) => {
			if (!map[key[0]]) map[key[0]] = [];
			if (key.length > 1) map[key[0]].push(key.slice(1));
			return map;
		}, {} as Record<string, string[][]>);

		Object.keys(keyMap).forEach((key) => {
			if (Array.isArray(obj[key])) {
				obj[key].forEach((item: any) => removeKeys(item, keyMap[key]));
			} else if (keyMap[key].length) {
				removeKeys(obj[key], keyMap[key]);
			} else {
				delete obj[key];
			}
		});
	};

	removeKeys(clonedData, parsedFilters);

	return clonedData;
};

export const mergeChanges = (original: any, filtered: any): any => {
	// Deep clone the original data to avoid mutating it
	const clonedOriginal = _.cloneDeep(original);

	const mergeKeys = (obj: any, updatedObj: any) => {
		if (!obj || !updatedObj) return;

		for (const key of Object.keys(updatedObj)) {
			// If the value is an array, handle it differently
			if (Array.isArray(updatedObj[key])) {
				if (!Array.isArray(obj[key])) {
					obj[key] = [];
				}
				mergeArrays(obj[key], updatedObj[key]);
			} else if (
				typeof updatedObj[key] === "object" &&
				updatedObj[key] !== null
			) {
				// If the value is an object, recurse into the object
				if (!obj[key]) {
					obj[key] = {};
				}
				mergeKeys(obj[key], updatedObj[key]);
			} else {
				// Otherwise, override the value
				obj[key] = updatedObj[key];
			}
		}
	};

	const mergeArrays = (originalArray: any[], filteredArray: any[]) => {
		const filteredMap = new Map(
			filteredArray.map((item) => [item.id, item]),
		);

		// Merge existing items
		for (let i = 0; i < originalArray.length; i++) {
			const originalItem = originalArray[i];
			if (filteredMap.has(originalItem.id)) {
				const filteredItem = filteredMap.get(originalItem.id);
				mergeKeys(originalItem, filteredItem);
				filteredMap.delete(originalItem.id);
			} else {
				// If the original item id is not in the filtered map, it should be removed
				originalArray.splice(i, 1);
				i--;
			}
		}

		// Add new items from filtered array
		for (const [_, item] of filteredMap) {
			originalArray.push(item);
		}
	};

	mergeKeys(clonedOriginal, filtered);

	return clonedOriginal;
};
