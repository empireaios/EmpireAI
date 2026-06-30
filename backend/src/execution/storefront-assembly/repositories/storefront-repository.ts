import type { Storefront, StorefrontCreateInput } from "../models/storefront.js";

export type StorefrontRepositoryQuery = {
  workspaceId: string;
  storeId?: string;
  brandId?: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persists assembled storefront structures. */
export interface StorefrontRepository {
  save(workspaceId: string, input: StorefrontCreateInput): Promise<Storefront>;
  getById(workspaceId: string, storefrontId: string): Promise<Storefront | null>;
  getByStore(workspaceId: string, storeId: string): Promise<Storefront | null>;
  getByBrand(workspaceId: string, brandId: string): Promise<Storefront | null>;
  list(query: StorefrontRepositoryQuery): Promise<Storefront[]>;
  delete(workspaceId: string, storefrontId: string): Promise<boolean>;
}
