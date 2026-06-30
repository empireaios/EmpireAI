import type {
  GeneratedArtifact,
  GeneratedArtifactCreateInput,
} from "../models/generated-artifact.js";

export type ArtifactRepositoryQuery = {
  workspaceId: string;
  generatedStorefrontId?: string;
  filePath?: string;
  fileType?: GeneratedArtifact["fileType"];
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persists generated storefront code artifacts. */
export interface ArtifactRepository {
  save(
    workspaceId: string,
    input: GeneratedArtifactCreateInput,
  ): Promise<GeneratedArtifact>;
  saveMany(
    workspaceId: string,
    inputs: GeneratedArtifactCreateInput[],
  ): Promise<GeneratedArtifact[]>;
  getById(workspaceId: string, artifactId: string): Promise<GeneratedArtifact | null>;
  getByFilePath(
    workspaceId: string,
    generatedStorefrontId: string,
    filePath: string,
  ): Promise<GeneratedArtifact | null>;
  list(query: ArtifactRepositoryQuery): Promise<GeneratedArtifact[]>;
  delete(workspaceId: string, artifactId: string): Promise<boolean>;
}
