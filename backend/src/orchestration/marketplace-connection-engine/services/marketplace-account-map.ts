import type { AccountProviderId } from "../../account-infrastructure-engine/models/account-provider.js";
import type { MarketplaceId } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";
import type { MarketplaceAccountType } from "../models/marketplace-connection-record.js";

export const MARKETPLACE_TO_PROVIDER: Record<MarketplaceId, AccountProviderId> = {
  amazon: "amazon-seller",
  walmart: "walmart-marketplace",
  shopify: "shopify",
  "tiktok-shop": "tiktok-shop",
  ebay: "ebay",
  "google-merchant": "google-merchant-center",
  "facebook-shop": "meta-business",
  "instagram-shop": "instagram-shop",
};

export function marketplaceToProviderId(marketplaceId: MarketplaceId): AccountProviderId {
  return MARKETPLACE_TO_PROVIDER[marketplaceId];
}

export function toInternalAccountType(accountType: MarketplaceAccountType): "grand_king" | "founder" {
  return accountType === "GRAND_KING" ? "grand_king" : "founder";
}

export function toMarketplaceAccountType(accountType: "grand_king" | "founder"): MarketplaceAccountType {
  return accountType === "grand_king" ? "GRAND_KING" : "FOUNDER";
}
