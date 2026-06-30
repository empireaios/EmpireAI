import type {
  StoreBlueprint,
  StoreBlueprintCreateInput,
} from "../models/store-blueprint.js";

export type StoreBlueprintRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persists generated store blueprints. */
export interface StoreBlueprintRepository {
  save(
    workspaceId: string,
    input: StoreBlueprintCreateInput,
  ): Promise<StoreBlueprint>;
  getById(workspaceId: string, storeId: string): Promise<StoreBlueprint | null>;
  getByBrand(workspaceId: string, brandId: string): Promise<StoreBlueprint | null>;
  list(query: StoreBlueprintRepositoryQuery): Promise<StoreBlueprint[]>;
  delete(workspaceId: string, storeId: string): Promise<boolean>;
}
