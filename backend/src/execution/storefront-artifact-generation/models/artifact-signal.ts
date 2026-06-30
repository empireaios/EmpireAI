import { z } from "zod";

export const ARTIFACT_SIGNAL_TYPES = [
  "code_generation_alignment",
  "page_artifact_coverage",
  "component_artifact_coverage",
  "config_artifact_readiness",
  "route_manifest_completeness",
  "metadata_artifact_quality",
  "file_content_quality",
  "artifact_composite",
] as const;

export type ArtifactSignalType = (typeof ARTIFACT_SIGNAL_TYPES)[number];

/** Individual factor contributing to artifact generation scoring. */
export type ArtifactSignal = {
  signalType: ArtifactSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const artifactSignalSchema = z.object({
  signalType: z.enum(ARTIFACT_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates an ArtifactSignal record shape. */
export function validateArtifactSignal(value: unknown): ArtifactSignal {
  return artifactSignalSchema.parse(value);
}
