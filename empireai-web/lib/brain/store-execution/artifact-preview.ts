import type { ArtifactRow } from "@/lib/brain/store-execution/types";

export type ArtifactMetadata = Record<string, unknown>;

export type MaterializedFilePreview = {
  artifactId: string;
  relativePath: string;
  content: string;
  fileType: string;
  mimeType?: string;
  status?: string;
};

export function resolveArtifactContent(
  artifact: ArtifactRow,
  materializedFiles: MaterializedFilePreview[],
): { content: string; truncated: boolean } {
  const matched = materializedFiles.find((file) => file.artifactId === artifact.artifactId);
  if (matched?.content) {
    return { content: matched.content, truncated: false };
  }

  return {
    content: artifact.preview,
    truncated: true,
  };
}

export function formatArtifactMetadata(metadata: ArtifactMetadata | undefined): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "No metadata available.";
  }

  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return String(metadata);
  }
}

export function isCodeArtifact(fileType: string): boolean {
  return /tsx?|jsx?|json|css|html|markdown|md|yaml|yml|xml|svg/i.test(fileType);
}
