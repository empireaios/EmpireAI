import type {
  LandingPageBlueprint,
  LandingPageBlueprintCreateInput,
} from "../models/landing-page-blueprint.js";

export type BlueprintRepositoryQuery = {
  workspaceId: string;
  offerId?: string;
  brandId?: string;
  productId?: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persists landing page blueprints. */
export interface BlueprintRepository {
  save(
    workspaceId: string,
    input: LandingPageBlueprintCreateInput,
  ): Promise<LandingPageBlueprint>;
  getById(workspaceId: string, pageId: string): Promise<LandingPageBlueprint | null>;
  getByOffer(workspaceId: string, offerId: string): Promise<LandingPageBlueprint | null>;
  list(query: BlueprintRepositoryQuery): Promise<LandingPageBlueprint[]>;
  delete(workspaceId: string, pageId: string): Promise<boolean>;
}
