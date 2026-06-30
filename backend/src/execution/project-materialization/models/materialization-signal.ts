import { z } from "zod";

export const MATERIALIZATION_SIGNAL_TYPES = [
  "artifact_alignment",
  "structure_completeness",
  "file_materialization",
  "dependency_resolution",
  "build_metadata_readiness",
  "config_coverage",
  "route_coverage",
  "materialization_composite",
] as const;

export type MaterializationSignalType = (typeof MATERIALIZATION_SIGNAL_TYPES)[number];

/** Individual factor contributing to project materialization scoring. */
export type MaterializationSignal = {
  signalType: MaterializationSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const materializationSignalSchema = z.object({
  signalType: z.enum(MATERIALIZATION_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a MaterializationSignal record shape. */
export function validateMaterializationSignal(value: unknown): MaterializationSignal {
  return materializationSignalSchema.parse(value);
}
