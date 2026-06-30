import { z } from "zod";

import {
  codeGenerationSignalSchema,
  type CodeGenerationSignal,
} from "./code-generation-signal.js";
import { generatedComponentSchema, type GeneratedComponent } from "./generated-component.js";
import { generatedPageSchema, type GeneratedPage } from "./generated-page.js";

export type GeneratedStorefrontId = string;

/** Directory and file layout for a generated storefront project. */
export type ProjectStructure = {
  rootDirectory: string;
  packageName: string;
  framework: string;
  directories: string[];
  files: string[];
};

/** Deployment configuration for a generated storefront. */
export type DeploymentMetadata = {
  platform: string;
  buildCommand: string;
  outputDirectory: string;
  startCommand: string;
  envVars: Record<string, string>;
  deployNotes: string;
};

/** Complete generated storefront codebase output. */
export type GeneratedStorefront = {
  generatedStorefrontId: GeneratedStorefrontId;
  workspaceId: string;
  storefrontId: string;
  storeId: string;
  brandId: string;
  generatedPages: GeneratedPage[];
  generatedComponents: GeneratedComponent[];
  projectStructure: ProjectStructure;
  deploymentMetadata: DeploymentMetadata;
  confidence: number;
  signals: CodeGenerationSignal[];
  createdAt: string;
  updatedAt: string;
};

export type GeneratedStorefrontCreateInput = Omit<
  GeneratedStorefront,
  "generatedStorefrontId" | "workspaceId" | "createdAt" | "updatedAt"
>;

export const projectStructureSchema = z.object({
  rootDirectory: z.string().min(1),
  packageName: z.string().min(1),
  framework: z.string().min(1),
  directories: z.array(z.string()).min(1),
  files: z.array(z.string()).min(1),
});

export const deploymentMetadataSchema = z.object({
  platform: z.string().min(1),
  buildCommand: z.string().min(1),
  outputDirectory: z.string().min(1),
  startCommand: z.string().min(1),
  envVars: z.record(z.string(), z.string()),
  deployNotes: z.string().min(1),
});

const isoTimestamp = z.string().datetime({ offset: true });

export const generatedStorefrontSchema = z.object({
  generatedStorefrontId: z.string().min(1),
  workspaceId: z.string().min(1),
  storefrontId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  generatedPages: z.array(generatedPageSchema).min(1),
  generatedComponents: z.array(generatedComponentSchema).min(1),
  projectStructure: projectStructureSchema,
  deploymentMetadata: deploymentMetadataSchema,
  confidence: z.number().min(0).max(100),
  signals: z.array(codeGenerationSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a GeneratedStorefront record shape. */
export function validateGeneratedStorefront(value: unknown): GeneratedStorefront {
  return generatedStorefrontSchema.parse(value);
}
