import { z } from "zod";

import { ARTIFACT_FILE_TYPES } from "../../storefront-artifact-generation/models/artifact-file.js";

export type MaterializedFileType = (typeof ARTIFACT_FILE_TYPES)[number];

export const MATERIALIZED_FILE_STATUSES = ["READY", "PENDING"] as const;

export type MaterializedFileStatus = (typeof MATERIALIZED_FILE_STATUSES)[number];

/** A file materialized on disk within a project structure. */
export type MaterializedFile = {
  fileId: string;
  artifactId: string;
  relativePath: string;
  absolutePath: string;
  content: string;
  fileType: MaterializedFileType;
  mimeType: string;
  status: MaterializedFileStatus;
};

export const materializedFileSchema = z.object({
  fileId: z.string().min(1),
  artifactId: z.string().min(1),
  relativePath: z.string().min(1),
  absolutePath: z.string().min(1),
  content: z.string().min(1),
  fileType: z.enum(ARTIFACT_FILE_TYPES),
  mimeType: z.string().min(1),
  status: z.enum(MATERIALIZED_FILE_STATUSES),
});

/** Validates a MaterializedFile record shape. */
export function validateMaterializedFile(value: unknown): MaterializedFile {
  return materializedFileSchema.parse(value);
}
