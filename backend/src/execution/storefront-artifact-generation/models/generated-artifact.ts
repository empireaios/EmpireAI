import { z } from "zod";

import {
  artifactSignalSchema,
  type ArtifactSignal,
} from "./artifact-signal.js";
import {
  artifactFileMetadataSchema,
  ARTIFACT_FILE_TYPES,
  type ArtifactFileType,
  type ArtifactFileMetadata,
} from "./artifact-file.js";

export type GeneratedArtifactId = string;

/** A persisted code artifact generated from storefront code outputs. */
export type GeneratedArtifact = {
  artifactId: GeneratedArtifactId;
  workspaceId: string;
  generatedStorefrontId: string;
  filePath: string;
  fileType: ArtifactFileType;
  generatedContent: string;
  metadata: ArtifactFileMetadata;
  confidence: number;
  signals: ArtifactSignal[];
  createdAt: string;
  updatedAt: string;
};

export type GeneratedArtifactCreateInput = Omit<
  GeneratedArtifact,
  "artifactId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const generatedArtifactSchema = z.object({
  artifactId: z.string().min(1),
  workspaceId: z.string().min(1),
  generatedStorefrontId: z.string().min(1),
  filePath: z.string().min(1),
  fileType: z.enum(ARTIFACT_FILE_TYPES),
  generatedContent: z.string().min(1),
  metadata: artifactFileMetadataSchema,
  confidence: z.number().min(0).max(100),
  signals: z.array(artifactSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a GeneratedArtifact record shape. */
export function validateGeneratedArtifact(value: unknown): GeneratedArtifact {
  return generatedArtifactSchema.parse(value);
}
