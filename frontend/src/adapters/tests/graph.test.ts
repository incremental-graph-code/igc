import { textToGraph, isIGCGraph } from "../graph";
import type { Node, Edge } from "reactflow";
import type { Session } from "../../types/graph";

// Minimal valid structures
const validNode: Node = {
	id: "1",
	type: "input",
	position: { x: 0, y: 0 },
	data: {},
};

const validEdge: Edge = {
	id: "e1",
	source: "1",
	target: "2",
};

const validSession: Session = {
	id: "s1",
	executions: ["step1", "step2"],
	overallConfiguration: "default",
};

describe("isIGCGraph", () => {
	it("returns false for null input", () => {
		expect(isIGCGraph(null as any)).toBe(false);
	});

	it("returns false for malformed JSON", () => {
		expect(isIGCGraph("this is not json")).toBe(false);
	});

	it("returns false if nodes or relationships are missing", () => {
		const missingNodes = JSON.stringify({ relationships: [validEdge] });
		const missingEdges = JSON.stringify({ nodes: [validNode] });

		expect(isIGCGraph(missingNodes)).toBe(false);
		expect(isIGCGraph(missingEdges)).toBe(false);
	});

	it("returns true for valid graph without sessions", () => {
		const text = JSON.stringify({
			nodes: [validNode],
			relationships: [validEdge],
		});
		expect(isIGCGraph(text)).toBe(true);
	});

	it("returns true for valid graph with sessions", () => {
		const text = JSON.stringify({
			nodes: [validNode],
			relationships: [validEdge],
			sessions: [validSession],
		});
		expect(isIGCGraph(text)).toBe(true);
	});

	// it("returns false for valid graph with extra data", () => {
	// 	const text = JSON.stringify({
	// 		nodes: [validNode],
	// 		relationships: [validEdge],
	// 		sessions: [validSession],
	//         extra: "extra data",
	// 	});
	// 	expect(isIGCGraph(text)).toBe(false);
	// });

	it("returns false if session structure is invalid", () => {
		const missingId = JSON.stringify({
			nodes: [validNode],
			relationships: [validEdge],
			sessions: [
				{
					executions: ["run1"],
					overallConfiguration: "test",
				},
			],
		});
		const missingExecutions = JSON.stringify({
			nodes: [validNode],
			relationships: [validEdge],
			sessions: [
				{
					id: "s1",
					overallConfiguration: "test",
				},
			],
		});
		const wrongType = JSON.stringify({
			nodes: [validNode],
			relationships: [validEdge],
			sessions: "not an array",
		});

		expect(isIGCGraph(missingId)).toBe(false);
		expect(isIGCGraph(missingExecutions)).toBe(false);
		expect(isIGCGraph(wrongType)).toBe(false);
	});
});

describe("textToGraph", () => {
	it("returns null for null input", () => {
		expect(textToGraph(null)).toBeNull();
	});

	it("returns null for malformed input", () => {
		expect(textToGraph("{this is broken}")).toBeNull();
	});

	it("returns null if required fields are missing", () => {
		const input = JSON.stringify({ nodes: [validNode] });
		expect(textToGraph(input)).toBeNull();
	});

	it("returns a valid IGCGraph for minimal input", () => {
		const text = JSON.stringify({
			nodes: [validNode],
			relationships: [validEdge],
		});
		const graph = textToGraph(text);

		expect(graph).not.toBeNull();
		expect(graph?.nodes.length).toBe(1);
		expect(graph?.relationships.length).toBe(1);
		expect(graph?.sessions).toBeUndefined();
	});

	it("returns valid IGCGraph with sessions", () => {
		const text = JSON.stringify({
			nodes: [validNode],
			relationships: [validEdge],
			sessions: [validSession],
		});
		const graph = textToGraph(text);

		expect(graph).not.toBeNull();
		expect(graph?.sessions?.[0].id).toBe("s1");
		expect(graph?.sessions?.[0].executions.length).toBe(2);
	});

	it("returns null if session structure is incomplete", () => {
		const text = JSON.stringify({
			nodes: [validNode],
			relationships: [validEdge],
			sessions: [{ executions: ["x"], overallConfiguration: "foo" }],
		});
		expect(textToGraph(text)).toBeNull();
	});
});
