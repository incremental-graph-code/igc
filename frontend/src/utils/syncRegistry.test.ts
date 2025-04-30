import { SyncSystem } from "@/adapters/consts";
import {
	registerSyncSystem,
	unregisterSyncSystem,
	synchronize,
	applySystemChange,
} from "./syncRegistry";

describe("Sync Registry System", () => {
	afterEach(() => {
		// Reset internal registry after each test (not exposed in code, so mimic it)
		unregisterSyncSystem(SyncSystem.Text);
		unregisterSyncSystem("a");
		unregisterSyncSystem("b");
	});

	it("should register and unregister systems without error", () => {
		const adapter = {
			get: () => "foo",
			set: jest.fn(),
			serialize: (val: string) => val,
			deserialize: (text: string) => text,
		};

		expect(() => registerSyncSystem("a", adapter)).not.toThrow();
		expect(() => unregisterSyncSystem("a")).not.toThrow();
	});

	it("should synchronize other systems from text", () => {
		let text = "initial";
		let systemValue = "";

		registerSyncSystem(SyncSystem.Text, {
			get: () => text,
			set: (v) => (text = v),
			serialize: (v) => v,
			deserialize: (t) => t,
		});

		registerSyncSystem("a", {
			get: () => systemValue,
			set: (v) => (systemValue = v),
			serialize: (v) => v.toUpperCase(),
			deserialize: (t) => `parsed(${t})`,
		});

		synchronize(SyncSystem.Text);

		expect(systemValue).toBe("parsed(initial)");
	});

	it("should apply change from a system and update text + others", () => {
		let text = "start";
		let systemA = "foo";
		let systemB = "";

		registerSyncSystem(SyncSystem.Text, {
			get: () => text,
			set: (v) => (text = v),
			serialize: (v) => v,
			deserialize: (t) => t,
		});

		registerSyncSystem("a", {
			get: () => systemA,
			set: (v) => (systemA = v),
			serialize: (val, prev) => `${prev}:${val}`, // merge into text
			deserialize: (t) => `from(${t})`,
		});

		registerSyncSystem("b", {
			get: () => systemB,
			set: (v) => (systemB = v),
			serialize: (v) => v,
			deserialize: (t) => `sync(${t})`,
		});

		applySystemChange("a");

		expect(text).toBe("start:foo");
		expect(systemB).toBe("sync(start:foo)");
	});

	it("should gracefully handle missing adapters", () => {
		// No adapter registered
		expect(() => applySystemChange("unknown")).not.toThrow();
		expect(() => synchronize("unknown")).toThrow(
			"No 'text' system registered",
		);
	});

	it("should not update the source or text system during sync", () => {
		let text = "TEXT";
		let updated = false;

		registerSyncSystem(SyncSystem.Text, {
			get: () => text,
			set: (v) => {
				updated = true;
				text = v;
			},
			serialize: (v) => v,
			deserialize: (t) => t,
		});

		registerSyncSystem("a", {
			get: () => "A",
			set: jest.fn(),
			serialize: (v) => v,
			deserialize: jest.fn(() => "sync-A"),
		});

		synchronize("a");
		expect(updated).toBe(false); // ensure text system is untouched
	});
});
