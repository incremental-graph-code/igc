import { renderHook } from "@testing-library/react";
import { useDebounce, useDebouncedCallback } from "../useDebounce";
import { act } from "react";

jest.useFakeTimers();

describe("useDebounce", () => {
	it("calls the callback after the debounce delay", () => {
		const callback = jest.fn();
		const { rerender } = renderHook(
			({ value }) => useDebounce(callback, 500, [value]),
			{
				initialProps: { value: "a" },
			},
		);

		// Trigger another change within debounce window
		rerender({ value: "b" });

		// Fast-forward time
		act(() => {
			jest.advanceTimersByTime(499);
		});
		expect(callback).not.toHaveBeenCalled();

		act(() => {
			jest.advanceTimersByTime(1);
		});
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("does not call callback if deps keep changing before delay", () => {
		const callback = jest.fn();
		const { rerender } = renderHook(
			({ value }) => useDebounce(callback, 300, [value]),
			{ initialProps: { value: 0 } },
		);

		// Change value multiple times before delay finishes
		for (let i = 1; i <= 5; i++) {
			act(() => {
				jest.advanceTimersByTime(200); // less than debounce delay
			});
			rerender({ value: i });
		}

		act(() => {
			jest.advanceTimersByTime(300); // now allow it to finish
		});

		expect(callback).toHaveBeenCalledTimes(1); // only once after last change
	});
});

describe("useDebouncedCallback", () => {
	it("calls the callback after the delay", () => {
		const callback = jest.fn();

		const { result } = renderHook(() =>
			useDebouncedCallback(callback, 300),
		);

		// Call the debounced function
		act(() => {
			result.current();
		});

		// Callback should not be called immediately
		expect(callback).not.toHaveBeenCalled();

		// Fast-forward time
		act(() => {
			jest.advanceTimersByTime(299);
		});
		expect(callback).not.toHaveBeenCalled();

		// After the full delay
		act(() => {
			jest.advanceTimersByTime(1);
		});
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("resets the timer if called repeatedly", () => {
		const callback = jest.fn();

		const { result } = renderHook(() =>
			useDebouncedCallback(callback, 500),
		);

		// Simulate rapid firing (like scroll/mousemove)
		act(() => {
			result.current();
			jest.advanceTimersByTime(200);
			result.current();
			jest.advanceTimersByTime(200);
			result.current();
		});

		// Still not called yet
		expect(callback).not.toHaveBeenCalled();

		// Fast-forward past final delay
		act(() => {
			jest.advanceTimersByTime(500);
		});
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("only calls latest version of callback", () => {
		let count = 0;

		const { result, rerender } = renderHook(
			({ cb }) => useDebouncedCallback(cb, 300),
			{
				initialProps: {
					cb: () => {
						count += 1;
					},
				},
			},
		);

		act(() => {
			result.current(); // schedules first
		});

		// Update callback
		rerender({
			cb: () => {
				count += 100;
			},
		});

		act(() => {
			jest.advanceTimersByTime(300);
		});

		// The updated callback should have been called
		expect(count).toBe(100);
	});
});