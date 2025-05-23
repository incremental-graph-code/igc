import _ from "lodash";
import { ZodType } from "zod";

/**
 * A dictionary object with a required 'id' property and arbitrary other keys.
 */
export type DictWithId = {
    id: string;
    [key: string]: string | number | boolean | null | DictWithId | DictWithId[] | undefined;
};

// /**
//  * Recursively omits specified keys from an object or array of objects.
//  * @param data The input object or array of objects.
//  * @param filters Array of dot-separated key paths to remove.
//  * @returns A deep-cloned object/array with specified keys removed.
//  */
// export const applyFilter = (data: DictWithId | DictWithId[], filters: string[]): DictWithId | DictWithId[] => {
//     const clonedData = _.cloneDeep(data);
//     const parsedFilters = filters.map((filter) => filter.split("."));

//     const removeKeys = (obj: DictWithId | DictWithId[] | undefined, keys: string[][]) => {
//         if (!keys.length || !obj) return;

//         const keyMap = keys.reduce((map, key) => {
//             if (!map[key[0]]) map[key[0]] = [];
//             if (key.length > 1) map[key[0]].push(key.slice(1));
//             return map;
//         }, {} as Record<string, string[][]>);

//         Object.keys(keyMap).forEach((key) => {
//             if (Array.isArray((obj as DictWithId)[key])) {
//                 ((obj as DictWithId)[key] as DictWithId[]).forEach((item) => removeKeys(item, keyMap[key]));
//             } else if (keyMap[key].length) {
//                 removeKeys((obj as DictWithId)[key] as DictWithId, keyMap[key]);
//             } else {
//                 delete (obj as DictWithId)[key];
//             }
//         });
//     };

//     removeKeys(clonedData, parsedFilters);

//     return clonedData;
// };

// /**
//  * Deeply merges two objects/arrays by 'id', updating values and structure.
//  * @param original The original object to merge into.
//  * @param filtered The object with updated values.
//  * @returns A new object with merged values.
//  */
// export const mergeChanges = (original: DictWithId, filtered: DictWithId): DictWithId => {
//     const clonedOriginal = _.cloneDeep(original);

//     const mergeKeys = (obj: DictWithId, updatedObj: DictWithId) => {
//         if (!obj || !updatedObj) return;

//         for (const key of Object.keys(updatedObj)) {
//             const updatedValue = updatedObj[key];
//             if (Array.isArray(updatedValue)) {
//                 if (!Array.isArray(obj[key])) {
//                     obj[key] = [];
//                 }
//                 mergeArrays(obj[key] as DictWithId[], updatedValue as DictWithId[]);
//             } else if (typeof updatedValue === "object" && updatedValue !== null) {
//                 if (!obj[key]) {
//                     obj[key] = {};
//                 }
//                 mergeKeys(obj[key] as DictWithId, updatedValue as DictWithId);
//             } else {
//                 obj[key] = updatedValue;
//             }
//         }
//     };

//     const mergeArrays = (originalArray: DictWithId[], filteredArray: DictWithId[]) => {
//         const filteredMap = new Map(filteredArray.map((item) => [item.id, item]));

//         // Merge existing items
//         for (let i = 0; i < originalArray.length; i++) {
//             const originalItem = originalArray[i];
//             if (filteredMap.has(originalItem.id)) {
//                 const filteredItem = filteredMap.get(originalItem.id)!;
//                 mergeKeys(originalItem, filteredItem);
//                 filteredMap.delete(originalItem.id);
//             } else {
//                 // Remove items not present in filtered array
//                 originalArray.splice(i, 1);
//                 i--;
//             }
//         }

//         // Add new items from filtered array
//         for (const [, item] of filteredMap) {
//             originalArray.push(item);
//         }
//     };

//     mergeKeys(clonedOriginal, filtered);

//     return clonedOriginal;
// };

/**
 * Parses a JSON string and validates it against a Zod schema.
 * If parsing or validation fails, it returns undefined.
 * @param schema - The Zod schema to validate against.
 * @param input - The JSON string to parse.
 * @returns The parsed and validated object, or undefined if parsing or validation fails.
 * 
 */
export const parseJsonStrict = <T>(schema: ZodType<T>, input: string): T | undefined => {
	try {
		const parsed = JSON.parse(input);
		return schema.parse(parsed);
	} catch {
		return undefined;
	}
};