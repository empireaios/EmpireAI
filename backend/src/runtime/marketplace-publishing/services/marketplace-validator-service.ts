import type { MarketplacePublishId } from "../models/marketplace-adapter.js";

/** REAL-003 — Marketplace listing validation (no publish without passing). */
export function validateMarketplaceListing(
  marketplaceId: MarketplacePublishId,
  payload: Record<string, unknown>,
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const title = String(payload.title ?? (payload.attributes as Record<string, unknown>)?.item_name ?? "");
  if (!title || title.length < 5) errors.push("Title too short for marketplace requirements");

  if (marketplaceId === "amazon" && title.length > 200) warnings.push("Amazon title may truncate beyond 200 chars");

  const images = payload.images as unknown[] | undefined;
  if (!images || images.length === 0) errors.push("At least one product image required");

  return { valid: errors.length === 0, errors, warnings };
}
