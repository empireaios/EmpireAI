import type {
  LandingPageContent,
  LandingPageContentCreateInput,
} from "../models/landing-page-content.js";

export type ContentRepositoryQuery = {
  workspaceId: string;
  pageId?: string;
  offerId?: string;
  brandId?: string;
  productId?: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persists generated landing page content. */
export interface ContentRepository {
  save(
    workspaceId: string,
    input: LandingPageContentCreateInput,
  ): Promise<LandingPageContent>;
  getById(workspaceId: string, contentId: string): Promise<LandingPageContent | null>;
  getByPage(workspaceId: string, pageId: string): Promise<LandingPageContent | null>;
  list(query: ContentRepositoryQuery): Promise<LandingPageContent[]>;
  delete(workspaceId: string, contentId: string): Promise<boolean>;
}
