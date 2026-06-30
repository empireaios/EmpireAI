import type { OfferStyle } from "../models/product-offer.js";
import type { ProductOffer, ProductOfferCreateInput } from "../models/product-offer.js";

export type OfferRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  productId?: string;
  offerStyle?: OfferStyle;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persists generated product offers. */
export interface OfferRepository {
  save(workspaceId: string, input: ProductOfferCreateInput): Promise<ProductOffer>;
  getById(workspaceId: string, offerId: string): Promise<ProductOffer | null>;
  getByProduct(workspaceId: string, productId: string): Promise<ProductOffer | null>;
  list(query: OfferRepositoryQuery): Promise<ProductOffer[]>;
  delete(workspaceId: string, offerId: string): Promise<boolean>;
}
