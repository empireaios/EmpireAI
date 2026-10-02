/** Joins durable seller readbacks to the existing offline order lifecycle.
 * This prepares a draft only; imported seller availability is not supplier stock.
 */
import { getDatabase } from "../../brain/database.js";
import { getAmazonUsListingsImportStatus, listCurrentAmazonUsListings } from "../reality-integration/live-commerce/adapters/amazon-listings-import.js";
import { getAmazonSellerInventoryImportStatus, listCurrentAmazonSellerInventory } from "../reality-integration/live-commerce/adapters/amazon-seller-inventory-import.js";
import { getPillowCommercePresaleRepository } from "./repository/sqlite-pillow-commerce-presale-repository.js";
import { prepareOfflineImportedOrderFulfillment } from "./offline-imported-order-fulfillment.js";

export async function prepareOfflineOrderFromMarketplaceReadback(input: {
  workspaceId:string; opportunityId:string; amazonOrderId:string; orderItemId:string; now?:number;
}) {
  const opportunity = getPillowCommercePresaleRepository().getOpportunityById(input.workspaceId,input.opportunityId);
  if (!opportunity) throw new Error("Pillow opportunity required");
  const map = opportunity.mapping;
  const sellerId = map.providerReceipts?.amazonFees.request.sellerId;
  if (!sellerId) throw new Error("Seller-bound fee receipt required");
  const listingStatus = getAmazonUsListingsImportStatus(input.workspaceId);
  const inventoryStatus = getAmazonSellerInventoryImportStatus(input.workspaceId);
  for (const status of [listingStatus,inventoryStatus]) {
    if (!status || status.status !== "completed" || status.pagesPending || !status.completedAt) {
      throw new Error("Completed listing and inventory imports required");
    }
  }
  const db = getDatabase();
  const listingSeller = db.prepare(`SELECT seller_id FROM amazon_listing_import_cursor
    WHERE workspace_id=@workspaceId AND provider_id='amazon-us'`)
    .get({workspaceId:input.workspaceId}) as {seller_id:string}|undefined;
  const listing = listCurrentAmazonUsListings(input.workspaceId).find(row=>row.sku===map.amazonSellerSku);
  const inventory = listCurrentAmazonSellerInventory(input.workspaceId).find(row=>row.sku===map.amazonSellerSku);
  if (!listing || !inventory || listingSeller?.seller_id !== sellerId || inventory.sellerId !== sellerId ||
      listing.asin !== map.asin || listing.marketplaceId !== map.marketplaceId ||
      inventory.marketplaceId !== map.marketplaceId || !listing.status.includes("BUYABLE") ||
      listing.sellerOfferCurrency !== "USD" ||
      listing.sellerOfferPriceCents !== Math.round(map.proposedSellingPriceUsd*100)) {
    throw new Error("Seller listing, price or inventory identity differs from Pillow decision");
  }
  const now = input.now ?? Date.now();
  for (const timestamp of [listing.cycleStartedAt,inventory.cycleStartedAt]) {
    const age = now-Date.parse(timestamp);
    if (!Number.isFinite(age) || age < -60_000 || age > 10*60_000) {
      throw new Error("Marketplace readback expired; import again");
    }
  }
  const marketplaceEvidence = {
    sellerId,sku:map.amazonSellerSku,asin:map.asin,marketplaceId:map.marketplaceId,
    listingSourceSha256:listing.sourceSha256,inventorySourceSha256:inventory.sourceSha256,
    sellerOfferPriceCents:listing.sellerOfferPriceCents,
    sellerFulfilledQuantity:inventory.sellerFulfilledQuantity,
    observedAt:listing.cycleStartedAt,inventoryObservedAt:inventory.cycleStartedAt,
    supplierStockVerified:false as const,
  };
  const draft = await prepareOfflineImportedOrderFulfillment({
    ...input,listingProof:{state:"BUYABLE",sellerSku:map.amazonSellerSku,asin:map.asin,
      marketplaceId:map.marketplaceId,observedAt:marketplaceEvidence.observedAt},
  });
  db.exec(`CREATE TABLE IF NOT EXISTS pillow_order_marketplace_evidence (
    workspace_id TEXT NOT NULL, transaction_key TEXT NOT NULL, record_json TEXT NOT NULL,
    PRIMARY KEY(workspace_id,transaction_key)
  )`);
  const key = {workspaceId:input.workspaceId,key:draft.idempotencyKey};
  const read = () => db.prepare(`SELECT record_json FROM pillow_order_marketplace_evidence
    WHERE workspace_id=@workspaceId AND transaction_key=@key`).get(key) as {record_json:string}|undefined;
  const encoded = JSON.stringify(marketplaceEvidence), prior = read();
  if (prior && prior.record_json !== encoded) throw new Error("Marketplace source changed; reconcile existing draft");
  if (!prior) db.prepare(`INSERT INTO pillow_order_marketplace_evidence
    (workspace_id,transaction_key,record_json) VALUES (@workspaceId,@key,@recordJson)`)
    .run({...key,recordJson:encoded});
  await db.requestCriticalPersist();
  if (read()?.record_json !== encoded) throw new Error("Marketplace evidence readback failed");
  return {draft,marketplaceEvidence,submissionAttempted:false as const};
}
