import { Node, Edge } from "reactflow";
import { SetState, GetState } from "../store";
import { IGCGraph } from "@/types/graph";

type SnippetSerializer = () => string | null;

export interface SnippetSliceState {
	getSnippet: (snippetSerializer: SnippetSerializer) => string | null;
	setSnippetInBuffer: (v: string) => void;
}

export const createSnippetSlice = (
	set: SetState,
	get: GetState,
): SnippetSliceState => ({
	getSnippet: (snippetSerializer: SnippetSerializer) => {
        return snippetSerializer();
	},

	setSnippetInBuffer: (snippet) => {
		
	},
});
