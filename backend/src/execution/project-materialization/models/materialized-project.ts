import { z } from "zod";

import {
  materializationSignalSchema,
  type MaterializationSignal,
} from "./materialization-signal.js";
import { materializedFileSchema, type MaterializedFile } from "./materialized-file.js";

export type MaterializedProjectId = string;

/** Directory and file layout for a materialized project. */
export type MaterializedProjectStructure = {
  rootDirectory: string;
  packageName: string;
  framework: string;
  directories: string[];
  files: string[];
};

/** Build and deployment metadata for a materialized project. */
export type BuildMetadata = {
  platform: string;
  buildCommand: string;
  startCommand: string;
  outputDirectory: string;
  envVars: Record<string, string>;
  materializationNotes: string;
};

/** A fully materialized storefront project ready for build and deployment. */
export type MaterializedProject = {
  projectId: MaterializedProjectId;
  workspaceId: string;
  generatedStorefrontId: string;
  storeId: string;
  brandId: string;
  projectStructure: MaterializedProjectStructure;
  materializedFiles: MaterializedFile[];
  dependencyMap: Record<string, string[]>;
  buildMetadata: BuildMetadata;
  confidence: number;
  signals: MaterializationSignal[];
  createdAt: string;
  updatedAt: string;
};

export type MaterializedFileCreateInput = Omit<MaterializedFile, "fileId">;

export type MaterializedProjectCreateInput = Omit<
  MaterializedProject,
  "projectId" | "workspaceId" | "createdAt" | "updatedAt" | "materializedFiles"
> & {
  materializedFiles: MaterializedFileCreateInput[];
};

export const materializedProjectStructureSchema = z.object({
  rootDirectory: z.string().min(1),
  packageName: z.string().min(1),
  framework: z.string().min(1),
  directories: z.array(z.string()).min(1),
  files: z.array(z.string()).min(1),
});

export const buildMetadataSchema = z.object({
  platform: z.string().min(1),
  buildCommand: z.string().min(1),
  startCommand: z.string().min(1),
  outputDirectory: z.string().min(1),
  envVars: z.record(z.string(), z.string()),
  materializationNotes: z.string().min(1),
});

const isoTimestamp = z.string().datetime({ offset: true });

export const materializedProjectSchema = z.object({
  projectId: z.string().min(1),
  workspaceId: z.string().min(1),
  generatedStorefrontId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  projectStructure: materializedProjectStructureSchema,
  materializedFiles: z.array(materializedFileSchema).min(1),
  dependencyMap: z.record(z.string(), z.array(z.string())),
  buildMetadata: buildMetadataSchema,
  confidence: z.number().min(0).max(100),
  signals: z.array(materializationSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a MaterializedProject record shape. */
export function validateMaterializedProject(value: unknown): MaterializedProject {
  return materializedProjectSchema.parse(value);
}
