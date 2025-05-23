import { SyncSystem } from "@/adapters/consts";
import {
	registerSyncSystem,
	unregisterSyncSystem,
	syncFrom,
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
			id: "a",
			get: () => "foo",
			set: jest.fn(),
			serialize: (val: string) => val,
			deserialize: (text: string) => text,
		};

		expect(() => registerSyncSystem(adapter)).not.toThrow();
		expect(() => unregisterSyncSystem("a")).not.toThrow();
	});

	it("should synchronize other systems from text", () => {
		let text = "initial";
		let systemValue = "";

		registerSyncSystem({
			id: SyncSystem.Text,
			get: () => text,
			set: (v) => (text = v),
			serialize: (v) => v,
			deserialize: (t) => t,
		});

		registerSyncSystem(
			{
				id: "a",
				get: () => systemValue,
				set: (v) => (systemValue = v),
				serialize: (v) => v.toUpperCase(),
				deserialize: (t) => `parsed(${t})`,
			},
			SyncSystem.Text,
		);

		syncFrom(SyncSystem.Text);

		expect(systemValue).toBe("parsed(initial)");
	});

	it("Sync System all under root - sync test", () => {
		let text = "true";
		let systemA = false;
		let systemB = 1;

		registerSyncSystem({
			id: SyncSystem.Text,
			get: () => text,
			set: (v) => (text = v),
			serialize: (v) => v,
			deserialize: (t) => t,
		});

		registerSyncSystem<boolean, string>(
			{
				id: "a",
				get: () => systemA,
				set: (v) => (systemA = v),
				serialize: (val) => (val ? "true" : "false"),
				deserialize: (t) => (t === "true" ? true : false),
			},
			SyncSystem.Text,
		);

		registerSyncSystem<number, string>(
			{
				id: "b",
				get: () => systemB,
				set: (v) => (systemB = v),
				serialize: (val) => (val !== 0 ? "true" : "false"),
				deserialize: (t) => (t === "true" ? 1 : 0),
			},
			SyncSystem.Text,
		);

		syncFrom("a");

		expect(text).toBe("false");
		expect(systemB).toBe(0);
	});

	it("Sync System branch - sync test", () => {
		let text = "true";
		let systemA = false;
		let systemB = 1;

		registerSyncSystem({
			id: SyncSystem.Text,
			get: () => text,
			set: (v) => (text = v),
			serialize: (v) => v,
			deserialize: (t) => t,
		});

		registerSyncSystem<boolean, string>(
			{
				id: "a",
				get: () => systemA,
				set: (v) => (systemA = v),
				serialize: (val) => (val ? "true" : "false"),
				deserialize: (t) => (t === "true" ? true : false),
			},
			SyncSystem.Text,
		);

		registerSyncSystem<number, boolean>(
			{
				id: "b",
				get: () => systemB,
				set: (v) => (systemB = v),
				serialize: (val) => (val !== 0 ? true : false),
				deserialize: (t) => (t ? 1 : 0),
			},
			"a",
		);

		syncFrom("a");

		expect(text).toBe("false");
		expect(systemB).toBe(0);
	});

	it("should gracefully handle missing adapters", () => {
		// No adapter registered
		expect(() => syncFrom("unknown")).toThrow(
			`Sync system "unknown" not found.`,
		);
	});
});
