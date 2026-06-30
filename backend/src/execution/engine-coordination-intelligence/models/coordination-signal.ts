import { z } from "zod";

export const COORDINATION_SIGNAL_TYPES = [
  "scheduling_health",
  "dependency_satisfaction",
  "recovery_readiness",
  "retry_coverage",
  "monitoring_status",
  "graph_progress",
  "coordination_composite",
] as const;

export type CoordinationSignalType = (typeof COORDINATION_SIGNAL_TYPES)[number];

/** Scoring signal for engine coordination confidence. */
export type CoordinationSignal = {
  signalType: CoordinationSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const coordinationSignalSchema = z.object({
  signalType: z.enum(COORDINATION_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a CoordinationSignal record shape. */
export function validateCoordinationSignal(value: unknown): CoordinationSignal {
  return coordinationSignalSchema.parse(value);
}
