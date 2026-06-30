import type {
  GeneratedStorefront,
  GeneratedStorefrontCreateInput,
} from "../models/generated-storefront.js";

export type CodeGenerationRepositoryQuery = {
  workspaceId: string;
  storefrontId?: string;
  storeId?: string;
  brandId?: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persists generated storefront code structures. */
export interface CodeGenerationRepository {
  save(
    workspaceId: string,
    input: GeneratedStorefrontCreateInput,
  ): Promise<GeneratedStorefront>;
  getById(
    workspaceId: string,
    generatedStorefrontId: string,
  ): Promise<GeneratedStorefront | null>;
  getByStorefront(
    workspaceId: string,
    storefrontId: string,
  ): Promise<GeneratedStorefront | null>;
  getByStore(workspaceId: string, storeId: string): Promise<GeneratedStorefront | null>;
  list(query: CodeGenerationRepositoryQuery): Promise<GeneratedStorefront[]>;
  delete(workspaceId: string, generatedStorefrontId: string): Promise<boolean>;
}
