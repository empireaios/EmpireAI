import type {
  MaterializedProject,
  MaterializedProjectCreateInput,
} from "../models/materialized-project.js";

export type MaterializationRepositoryQuery = {
  workspaceId: string;
  generatedStorefrontId?: string;
  storeId?: string;
  brandId?: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persists materialized storefront projects. */
export interface MaterializationRepository {
  save(
    workspaceId: string,
    input: MaterializedProjectCreateInput,
  ): Promise<MaterializedProject>;
  getById(workspaceId: string, projectId: string): Promise<MaterializedProject | null>;
  getByStorefront(
    workspaceId: string,
    generatedStorefrontId: string,
  ): Promise<MaterializedProject | null>;
  getByStore(workspaceId: string, storeId: string): Promise<MaterializedProject | null>;
  list(query: MaterializationRepositoryQuery): Promise<MaterializedProject[]>;
  delete(workspaceId: string, projectId: string): Promise<boolean>;
}
