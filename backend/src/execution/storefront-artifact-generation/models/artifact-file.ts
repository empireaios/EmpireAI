import { z } from "zod";

export const ARTIFACT_FILE_TYPES = [
  "PAGE",
  "COMPONENT",
  "CONFIG",
  "METADATA",
  "ROUTE",
] as const;

export type ArtifactFileType = (typeof ARTIFACT_FILE_TYPES)[number];

/** Metadata describing a generated artifact file. */
export type ArtifactFileMetadata = {
  sourceId: string;
  mimeType: string;
  generatedStorefrontId: string;
  storefrontId: string;
  storeId: string;
  brandId: string;
  description: string;
};

/** A concrete file to be written as part of a generated storefront. */
export type ArtifactFile = {
  filePath: string;
  fileType: ArtifactFileType;
  generatedContent: string;
  metadata: ArtifactFileMetadata;
};

export const artifactFileMetadataSchema = z.object({
  sourceId: z.string().min(1),
  mimeType: z.string().min(1),
  generatedStorefrontId: z.string().min(1),
  storefrontId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  description: z.string().min(1),
});

export const artifactFileSchema = z.object({
  filePath: z.string().min(1),
  fileType: z.enum(ARTIFACT_FILE_TYPES),
  generatedContent: z.string().min(1),
  metadata: artifactFileMetadataSchema,
});

/** Validates an ArtifactFile record shape. */
export function validateArtifactFile(value: unknown): ArtifactFile {
  return artifactFileSchema.parse(value);
}
