/** Evidence contracts for existing-catalog Amazon offers. These pure functions
 * do not grant commerce authority or prove supplier qualification/stock freshness.
 * Provider schemas: amzn/selling-partner-api-models listingsItems_2021-08-01 and
 * catalogItems_2022-04-01. ACCEPTED is processing admission, not a published listing.
 */
import type { MarketplaceListingPackage } from "../models/marketplace-adapter.js";

export type AmazonOfferInput = {
  asin: string;
  sku: string;
  quantity: number;
  price: number;
  currency: string;
  identifier: { type: "UPC" | "EAN" | "GTIN"; value: string };
};
export type AmazonSubmissionBinding = { sellerId: string; sku: string; marketplaceId: string; asin: string };
function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

/** No ASIN inferred from a title, no invented stock, SKU, price or currency. */
export function validateAmazonOfferInput(pkg: MarketplaceListingPackage): { offer: AmazonOfferInput | null; blockers: string[] } {
  const blockers: string[] = [];
  const specs = pkg.specifications;
  const aliases = [specs.asin, specs.ASIN, specs.merchant_suggested_asin].filter(value => value !== undefined);
  const asin = aliases[0];
  if (!nonempty(asin) || !/^[A-Z0-9]{10}$/.test(asin) || aliases.some(value => value !== asin)) {
    blockers.push("An explicit, unambiguous ASIN is required; title search is not product identity proof");
  }
  const sku = specs.sku;
  if (!nonempty(sku) || sku.length > 200 || /[\u0000-\u001f\u007f]/.test(sku)) blockers.push("Explicit seller SKU is required");
  const rawQuantity = specs.quantity;
  const quantity = typeof rawQuantity === "string" && /^(0|[1-9]\d*)$/.test(rawQuantity) ? Number(rawQuantity) : NaN;
  if (!Number.isSafeInteger(quantity) || quantity < 0) blockers.push("Stock quantity is unknown or invalid; provide an explicit nonnegative integer, including zero for out-of-stock");
  if (!Number.isFinite(pkg.price) || pkg.price <= 0) blockers.push("A known positive offer price is required");
  if (!nonempty(pkg.currency) || !/^[A-Z]{3}$/.test(pkg.currency)) blockers.push("Explicit three-letter currency is required");
  const type = specs.productIdentifierType;
  const value = specs.productIdentifier;
  const lengths = { UPC: 12, EAN: 13, GTIN: 14 } as const;
  if (!type || !(type in lengths) || !nonempty(value) || !/^\d+$/.test(value) || value.length !== lengths[type as keyof typeof lengths]) {
    blockers.push("Explicit supplier product UPC/EAN/GTIN is required for exact catalog identity comparison");
  }
  if (specs.requirements && specs.requirements !== "LISTING_OFFER_ONLY") blockers.push("This executor only supports existing-catalog offers; new-catalog creation requires separate verified product facts");
  if (blockers.length) return { offer: null, blockers };
  return { offer: { asin: asin!, sku: sku!, quantity, price: pkg.price, currency: pkg.currency,
    identifier: { type: type as AmazonOfferInput["identifier"]["type"], value: value! } }, blockers };
}

/** Compare the exact requested catalog item and marketplace to the supplier's
 * declared product identifier. This proves a catalog match, not supplier honesty. */
export function validateAmazonCatalogIdentity(payload: unknown, offer: AmazonOfferInput, marketplaceId: string): string[] {
  const item = record(payload);
  if (!item || item.asin !== offer.asin || !Array.isArray(item.identifiers)) return ["Catalog response does not substantiate the explicit ASIN"];
  const groups = item.identifiers.map(record).filter(group => group?.marketplaceId === marketplaceId);
  if (groups.length !== 1 || !Array.isArray(groups[0]!.identifiers)) return ["Catalog identifiers are missing or ambiguous for the requested marketplace"];
  const identifiers = groups[0]!.identifiers as unknown[];
  if (identifiers.some(value => {
    const identifier = record(value);
    return !identifier || !nonempty(identifier.identifierType) || !nonempty(identifier.identifier);
  })) return ["Catalog product identifier evidence is malformed"];
  if (!identifiers.some(value => {
    const identifier = record(value);
    return identifier?.identifierType === offer.identifier.type && identifier.identifier === offer.identifier.value;
  })) return ["Supplier product identifier does not match the explicit catalog ASIN in this marketplace"];
  return [];
}

export function buildVerifiedAmazonOfferBody(offer: AmazonOfferInput, marketplaceId: string): Record<string, unknown> {
  return {
    productType: "PRODUCT", requirements: "LISTING_OFFER_ONLY",
    attributes: {
      merchant_suggested_asin: [{ value: offer.asin, marketplace_id: marketplaceId }],
      condition_type: [{ value: "new_new", marketplace_id: marketplaceId }],
      fulfillment_availability: [{ fulfillment_channel_code: "DEFAULT", quantity: offer.quantity, marketplace_id: marketplaceId }],
      purchasable_offer: [{ currency: offer.currency, our_price: [{ schedule: [{ value_with_tax: offer.price }] }], marketplace_id: marketplaceId }],
    },
  };
}

export type AmazonSubmissionProof = {
  accepted: boolean;
  submissionId: string | null;
  amazonStatus: string | null;
  issues: unknown[];
  blockers: string[];
  binding: AmazonSubmissionBinding | null;
  listingVerified: false;
};
/** Amazon does not echo seller/marketplace in the normal acknowledgement. Bind
 * those to the exact request context; do not pretend this is marketplace readback. */
export function validateAmazonSubmissionReceipt(
  response: { ok: boolean; status: number; json: unknown }, binding: AmazonSubmissionBinding,
): AmazonSubmissionProof {
  const body = record(response.json);
  const blockers: string[] = [];
  const status = typeof body?.status === "string" ? body.status : null;
  const submissionId = nonempty(body?.submissionId) && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/.test(body.submissionId) ? body.submissionId : null;
  const issues = Array.isArray(body?.issues) ? body.issues : [];
  if (!response.ok || response.status !== 200) blockers.push(`Amazon submission acknowledgement HTTP ${response.status} is not successful`);
  if (!body || body.sku !== binding.sku) blockers.push("Amazon submission receipt is missing or identifies a different SKU");
  if (status !== "ACCEPTED") blockers.push("Amazon did not acknowledge acceptance for processing; VALID means preview only");
  if (!submissionId) blockers.push("Amazon submission receipt identifier is missing");
  if (![binding.sellerId, binding.sku, binding.marketplaceId, binding.asin].every(nonempty)) blockers.push("Exact seller/SKU/marketplace/ASIN request binding is required");
  if (body?.sellerId !== undefined && body.sellerId !== binding.sellerId) blockers.push("Amazon response seller identity conflicts with request");
  if (body?.marketplaceId !== undefined && body.marketplaceId !== binding.marketplaceId) blockers.push("Amazon response marketplace conflicts with request");
  if (body?.errors !== undefined && (!Array.isArray(body.errors) || body.errors.length > 0)) blockers.push("Amazon response contains contradictory error evidence");
  if (body?.issues !== undefined && !Array.isArray(body.issues)) blockers.push("Amazon issue evidence is malformed");
  for (const issue of issues) {
    const value = record(issue);
    if (!value || !nonempty(value.code) || !nonempty(value.message) || typeof value.severity !== "string" || !["ERROR", "WARNING", "INFO"].includes(value.severity)) blockers.push("Amazon issue evidence is malformed");
    else if (value.severity === "ERROR") blockers.push(`Amazon rejected listing data: ${value.code}`);
  }
  if (body?.identifiers !== undefined) {
    const identifiers = body.identifiers;
    if (!Array.isArray(identifiers) || identifiers.length !== 1 || record(identifiers[0])?.marketplaceId !== binding.marketplaceId || record(identifiers[0])?.asin !== binding.asin) {
      blockers.push("Amazon response identity conflicts with requested marketplace/ASIN");
    }
  }
  const accepted = blockers.length === 0;
  return { accepted, submissionId, amazonStatus: status, issues, blockers, binding: accepted ? { ...binding } : null, listingVerified: false };
}
