import { z } from "zod";

export const EXECUTION_NODE_STATUSES = [
  "PENDING",
  "READY",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "SKIPPED",
] as const;

export type ExecutionNodeStatus = (typeof EXECUTION_NODE_STATUSES)[number];

/** Node in an execution graph representing an engine step. */
export type ExecutionGraphNode = {
  nodeId: string;
  engineId: string;
  engineName: string;
  status: ExecutionNodeStatus;
  order: number;
  durationMs: number | null;
  score: number;
};

export const executionGraphNodeSchema = z.object({
  nodeId: z.string().min(1),
  engineId: z.string().min(1),
  engineName: z.string().min(1),
  status: z.enum(EXECUTION_NODE_STATUSES),
  order: z.number().int().min(0),
  durationMs: z.number().min(0).nullable(),
  score: z.number().min(0).max(100),
});

/** Edge in an execution graph representing a dependency link. */
export type ExecutionGraphEdge = {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label: string;
};

export const executionGraphEdgeSchema = z.object({
  edgeId: z.string().min(1),
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  label: z.string().min(1),
});

/** Execution graph coordinating engine runs. */
export type ExecutionGraph = {
  graphId: string;
  graphName: string;
  nodes: ExecutionGraphNode[];
  edges: ExecutionGraphEdge[];
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  score: number;
  summary: string;
};

export const executionGraphSchema = z.object({
  graphId: z.string().min(1),
  graphName: z.string().min(1),
  nodes: z.array(executionGraphNodeSchema).min(1),
  edges: z.array(executionGraphEdgeSchema),
  totalNodes: z.number().int().min(1),
  completedNodes: z.number().int().min(0),
  failedNodes: z.number().int().min(0),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates an ExecutionGraph record shape. */
export function validateExecutionGraph(value: unknown): ExecutionGraph {
  return executionGraphSchema.parse(value);
}

/** Validates an ExecutionGraphNode record shape. */
export function validateExecutionGraphNode(value: unknown): ExecutionGraphNode {
  return executionGraphNodeSchema.parse(value);
}
