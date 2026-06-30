import { z } from "zod";

export const DEPLOYMENT_ARTIFACT_TYPES = [
  "SOURCE",
  "CONFIG",
  "MANIFEST",
  "ENV",
] as const;

export type DeploymentArtifactType = (typeof DEPLOYMENT_ARTIFACT_TYPES)[number];

/** A file included in a store deployment package. */
export type DeploymentArtifact = {
  artifactId: string;
  filePath: string;
  artifactType: DeploymentArtifactType;
  content: string;
  mimeType: string;
  sizeBytes: number;
};

export const deploymentArtifactSchema = z.object({
  artifactId: z.string().min(1),
  filePath: z.string().min(1),
  artifactType: z.enum(DEPLOYMENT_ARTIFACT_TYPES),
  content: z.string(),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
});

/** Validates a DeploymentArtifact record shape. */
export function validateDeploymentArtifact(value: unknown): DeploymentArtifact {
  return deploymentArtifactSchema.parse(value);
}
