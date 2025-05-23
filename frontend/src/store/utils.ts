import deepEqual from "fast-deep-equal";

/**
 * Creates a guarded setter that only updates the store if the new value is not deeply equal
 * to the current value.
 *
 * @template T - The value type being stored
 * @param getCurrentValue - A function that returns the current value from the store
 * @param setValue - A function to update the store value
 * @returns A new setter function that guards against redundant updates
 */
export const createStoreSetterWithGuard = <T>(
	getCurrentValue: () => T,
	setValue: (value: T) => void,
): ((newValue: T) => void) => {
	return (newValue: T): void => {
		const current = getCurrentValue();
		if (!deepEqual(current, newValue)) {
			setValue(newValue);
		}
	};
};
