/** Connect a persisted Pillow decision to the existing Amazon offer proof.
 * This prepares an offline body only. It never grants publish authority or calls Amazon.
 */
import type { MarketplaceListingPackage } from "../../runtime/marketplace-publishing/models/marketplace-adapter.js";
import {
  buildVerifiedAmazonOfferBody, validateAmazonCatalogIdentity, validateAmazonOfferInput,
  type AmazonOfferInput,
} from "../../runtime/marketplace-publishing/services/amazon-listing-proof.js";
import type { QualifiedOpportunity } from "./models.js";
import { verifyCommerceProviderReceiptDigest } from "./commerce-provider-receipts.js";

export function prepareOfflineAmazonOfferFromOpportunity(input: {
  opportunity: QualifiedOpportunity;
  identifier: { type: "UPC" | "EAN" | "GTIN"; value: string; cjPid: string; cjVid: string } | null;
  catalogResponse: unknown;
  now?: number;
}): { offer: AmazonOfferInput | null; body: Record<string, unknown> | null;
  decisionSha256: string | null; blockers: string[]; publishAttempted: false } {
  const { opportunity, identifier } = input;
  const map = opportunity.mapping;
  const receipts = map.providerReceipts;
  const blockers: string[] = [];
  if (opportunity.disposition !== "APPROVED_PENDING_PUBLISH" || opportunity.approvalStatus !== "Approved") {
    blockers.push("Grand King listing approval has not been recorded");
  }
  if (!receipts || !verifyCommerceProviderReceiptDigest(receipts)) {
    blockers.push("Persisted provider receipt digest is missing or inconsistent");
  } else {
    const now = input.now ?? Date.now();
    if ([receipts.supplierCost, receipts.supplierStock, receipts.usFreight, receipts.amazonFees].some(r => {
      const age = now - Date.parse(r.capturedAt);
      return !Number.isFinite(age) || age < -60_000 || age > 10 * 60_000;
    })) blockers.push("Provider receipts expired; re-evaluation required before listing");
    if (receipts.supplierCost.request.pid !== map.cjPid || receipts.supplierCost.request.vid !== map.cjVid ||
        receipts.supplierCost.selected.amountUsd !== map.supplierCostUsd.amountUsd ||
        receipts.supplierStock.request.vid !== map.cjVid ||
        receipts.supplierStock.selected.units !== opportunity.stockUnits ||
        receipts.usFreight.request.vid !== map.cjVid ||
        receipts.usFreight.selected.amountUsd !== map.shippingUsd.amountUsd ||
        receipts.amazonFees.request.marketplaceId !== map.marketplaceId ||
        receipts.amazonFees.request.asin !== map.asin ||
        receipts.amazonFees.request.listingPriceUsd !== map.proposedSellingPriceUsd ||
        receipts.amazonFees.selected.amountUsd !== map.amazonFeesUsd.amountUsd) {
      blockers.push("Persisted receipt values differ from the approval mapping");
    }
  }
  if (!identifier || identifier.cjPid !== map.cjPid || identifier.cjVid !== map.cjVid) {
    blockers.push("Supplier UPC/EAN/GTIN has not been bound to this CJ product and variant");
  }
  if (blockers.length) return { offer: null, body: null, decisionSha256: null, blockers, publishAttempted: false };

  const pkg = {
    packageId: `offline-${opportunity.opportunityId}`, workspaceId: opportunity.workspaceId,
    companyId: opportunity.companyId, productId: map.cjPid, marketplaceId: "amazon-us",
    title: opportunity.recommendation.productName, description: "Offline existing-catalog offer preparation",
    bulletPoints: [], specifications: { asin: map.asin, sku: map.amazonSellerSku,
      quantity: String(Math.min(map.startQuantity, opportunity.stockUnits)),
      productIdentifierType: identifier!.type, productIdentifier: identifier!.value,
      requirements: "LISTING_OFFER_ONLY" },
    price: map.proposedSellingPriceUsd, currency: "USD", images: [], status: "DRAFT",
    governanceApproved: false, kingApproved: false, blockers: [], computedAt: new Date(input.now ?? Date.now()).toISOString(),
  } as MarketplaceListingPackage;
  const checked = validateAmazonOfferInput(pkg);
  if (checked.offer) blockers.push(...validateAmazonCatalogIdentity(input.catalogResponse, checked.offer, map.marketplaceId));
  else blockers.push(...checked.blockers);
  if (blockers.length || !checked.offer) return { offer: null, body: null, decisionSha256: null, blockers, publishAttempted: false };
  return { offer: checked.offer, body: buildVerifiedAmazonOfferBody(checked.offer, map.marketplaceId),
    decisionSha256: receipts!.decisionSha256, blockers: [], publishAttempted: false };
}
