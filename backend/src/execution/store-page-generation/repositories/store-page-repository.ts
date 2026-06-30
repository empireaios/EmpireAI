import type {
  RenderableStorePage,
  RenderableStorePageCreateInput,
} from "../models/renderable-store-page.js";

export type StorePageRepositoryQuery = {
  workspaceId: string;
  storeId?: string;
  brandId?: string;
  pageId?: string;
  route?: string;
  pageType?: RenderableStorePage["pageType"];
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persists generated renderable store pages. */
export interface StorePageRepository {
  save(
    workspaceId: string,
    input: RenderableStorePageCreateInput,
  ): Promise<RenderableStorePage>;
  saveMany(
    workspaceId: string,
    inputs: RenderableStorePageCreateInput[],
  ): Promise<RenderableStorePage[]>;
  getById(workspaceId: string, renderablePageId: string): Promise<RenderableStorePage | null>;
  getByPage(workspaceId: string, pageId: string): Promise<RenderableStorePage | null>;
  getByRoute(workspaceId: string, route: string): Promise<RenderableStorePage | null>;
  list(query: StorePageRepositoryQuery): Promise<RenderableStorePage[]>;
  delete(workspaceId: string, renderablePageId: string): Promise<boolean>;
}
