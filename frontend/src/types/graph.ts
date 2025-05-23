import { Node, Edge } from "reactflow";
import { z, ZodType } from "zod";

export interface IGCGraph {
	nodes: Node[];
	relationships: Edge[];
	sessions?: Session[];
}

export interface Session {
	id: string;
	executions: string[];
	overallConfiguration: string;
}

export const sessionSchema = z.object({
	id: z.string(),
	executions: z.array(z.string()),
	overallConfiguration: z.string(),
});

const nodeSchema = z.any();

const edgeSchema = z.any();

export const IGCGraphSchema = z.object({
	nodes: z.array(nodeSchema),
	relationships: z.array(edgeSchema),
	sessions: z.array(sessionSchema).optional(),
});