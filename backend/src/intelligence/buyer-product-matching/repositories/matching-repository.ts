import type {
  BuyerProductMatch,
  BuyerProductMatchCreateInput,
  BuyerProductMatchUpdateInput,
  MatchTier,
} from "../models/buyer-product-match.js";

export type MatchingListQuery = {
  workspaceId: string;
  buyerPersonaId?: string;
  productId?: string;
  matchTier?: MatchTier;
  minScore?: number;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persistence contract for buyer-product match records. */
export interface MatchingRepository {
  create(workspaceId: string, input: BuyerProductMatchCreateInput): Promise<BuyerProductMatch>;
  getById(workspaceId: string, id: string): Promise<BuyerProductMatch | null>;
  getByPair(
    workspaceId: string,
    buyerPersonaId: string,
    productId: string,
  ): Promise<BuyerProductMatch | null>;
  update(
    workspaceId: string,
    id: string,
    input: BuyerProductMatchUpdateInput,
  ): Promise<BuyerProductMatch>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: MatchingListQuery): Promise<BuyerProductMatch[]>;
}
