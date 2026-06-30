import type { MarketplacePublishId } from "../models/marketplace-adapter.js";

/** REAL-003 — Marketplace-specific formatting (architecture payloads only). */
export function formatForMarketplace(
  marketplaceId: MarketplacePublishId,
  listing: {
    title: string;
    description: string;
    bulletPoints: string[];
    specifications: Record<string, string>;
    price: number;
    images: string[];
  },
): Record<string, unknown> {
  switch (marketplaceId) {
    case "amazon":
      return {
        productType: "PRODUCT",
        attributes: {
          item_name: [{ value: listing.title }],
          product_description: [{ value: listing.description }],
          bullet_point: listing.bulletPoints.map((b) => ({ value: b })),
          list_price: [{ value: listing.price, currency: "USD" }],
        },
        images: listing.images.map((url, i) => ({ variant: i === 0 ? "MAIN" : `PT0${i}`, url })),
      };
    case "shopify":
    case "woocommerce":
      return {
        title: listing.title,
        body_html: listing.description,
        variants: [{ price: listing.price }],
        images: listing.images.map((src) => ({ src })),
        tags: Object.keys(listing.specifications).join(", "),
      };
    default:
      return {
        marketplaceId,
        title: listing.title,
        description: listing.description,
        bulletPoints: listing.bulletPoints,
        specifications: listing.specifications,
        price: listing.price,
        images: listing.images,
      };
  }
}
