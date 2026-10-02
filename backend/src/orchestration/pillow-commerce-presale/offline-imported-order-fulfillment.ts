/** Offline handoff from a durably imported Amazon item to a proposed CJ variant.
 * Caller-supplied listing observations are test evidence, never publish or spend authority.
 */
import { getDatabase } from "../../brain/database.js";
import { getAmazonOrderImportStatus, getImportedOrder } from "../reality-integration/live-commerce/adapters/amazon-order-import.js";
import { amazonCjFulfillmentIdempotencyKey } from "./amazon-shipment-confirm.js";
import { buildTransactionEconomicsRecord, type TransactionEconomicsRecord } from "./commerce-actual-pnl.js";
import { verifyCommerceProviderReceiptDigest } from "./commerce-provider-receipts.js";
import { AMAZON_US_MARKETPLACE_ID } from "./models.js";
import { getPillowCommercePresaleRepository } from "./repository/sqlite-pillow-commerce-presale-repository.js";

export type OfflineFulfillmentDraft = {
  idempotencyKey: string;
  workspaceId: string;
  amazonOrderId: string;
  orderItemId: string;
  amazonSellerSku: string;
  asin: string;
  cjPid: string;
  cjVid: string;
  quantity: number;
  orderSourceSha256: string;
  decisionSha256: string;
  listingObservedAt: string;
  economics: TransactionEconomicsRecord;
  supplierSpendAllowed: false;
  submissionAttempted: false;
  approvalRequired: true;
};

export async function prepareOfflineImportedOrderFulfillment(input: {
  workspaceId: string;
  amazonOrderId: string;
  orderItemId: string;
  opportunityId: string;
  listingProof: {
    state: "BUYABLE";
    sellerSku: string;
    asin: string;
    marketplaceId: string;
    observedAt: string;
  };
  now?: number;
}): Promise<OfflineFulfillmentDraft> {
  const now = input.now ?? Date.now();
  const status = getAmazonOrderImportStatus(input.workspaceId);
  if (!status || status.status !== "completed" || status.pagesPending || !status.lastCompletedAt) {
    throw new Error("Amazon order import window has not completed");
  }
  const order = getImportedOrder(input.workspaceId, "amazon-us", input.amazonOrderId);
  if (!order || order.marketplaceId !== AMAZON_US_MARKETPLACE_ID ||
      order.fulfillmentStatus !== "UNSHIPPED" || order.fulfilledBy !== "MERCHANT") {
    throw new Error("Imported Amazon order is missing or not merchant-fulfillable");
  }
  const item = order.orderItems.find(row => row.orderItemId === input.orderItemId);
  if (!item || !item.sellerSku || !Number.isSafeInteger(item.quantityOrdered) ||
      item.quantityOrdered < 1) {
    throw new Error("Imported Amazon item identity or quantity invalid");
  }
  const repo = getPillowCommercePresaleRepository();
  const map = repo.getMappingByAmazonSku(item.sellerSku);
  const opportunity = repo.getOpportunityById(input.workspaceId, input.opportunityId);
  const receipts = map?.providerReceipts;
  if (!map || !opportunity || opportunity.workspaceId !== input.workspaceId ||
      opportunity.disposition !== "APPROVED_PENDING_PUBLISH" ||
      opportunity.approvalStatus !== "Approved" ||
      opportunity.mapping.amazonSellerSku !== item.sellerSku ||
      opportunity.mapping.cjPid !== map.cjPid || opportunity.mapping.cjVid !== map.cjVid ||
      opportunity.mapping.asin !== map.asin ||
      map.marketplaceId !== AMAZON_US_MARKETPLACE_ID ||
      !receipts || !verifyCommerceProviderReceiptDigest(receipts) ||
      opportunity.mapping.providerReceipts?.decisionSha256 !== receipts.decisionSha256) {
    throw new Error("Approved Pillow variant mapping and provider receipts required");
  }
  const proof = input.listingProof;
  const age = now - Date.parse(proof.observedAt);
  if (proof.state !== "BUYABLE" || proof.marketplaceId !== map.marketplaceId ||
      proof.sellerSku !== item.sellerSku || proof.asin !== map.asin ||
      !Number.isFinite(age) || age < -60_000 || age > 10 * 60_000) {
    throw new Error("Fresh matching BUYABLE listing observation required");
  }
  const key = amazonCjFulfillmentIdempotencyKey({
    amazonOrderId: order.orderId, orderItemId: item.orderItemId, amazonSellerSku: item.sellerSku,
  });
  const db = getDatabase();
  db.exec(`CREATE TABLE IF NOT EXISTS pillow_commerce_fulfillment_drafts (
    idempotency_key TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    record_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
  const read = () => db.prepare(`SELECT record_json FROM pillow_commerce_fulfillment_drafts
    WHERE idempotency_key = @key AND workspace_id = @workspaceId`)
    .get({ key, workspaceId: input.workspaceId }) as { record_json: string } | undefined;
  const prior = read();
  if (prior) {
    const saved = JSON.parse(prior.record_json) as OfflineFulfillmentDraft;
    if (saved.orderSourceSha256 !== order.sourceSha256 ||
        saved.decisionSha256 !== receipts.decisionSha256 ||
        saved.cjVid !== map.cjVid || saved.quantity !== item.quantityOrdered ||
        saved.listingObservedAt !== proof.observedAt) {
      throw new Error("Fulfillment draft conflicts with changed source; reconcile before retry");
    }
    return saved;
  }
  const draft: OfflineFulfillmentDraft = {
    idempotencyKey: key, workspaceId: input.workspaceId,
    amazonOrderId: order.orderId, orderItemId: item.orderItemId,
    amazonSellerSku: item.sellerSku, asin: map.asin,
    cjPid: map.cjPid, cjVid: map.cjVid, quantity: item.quantityOrdered,
    orderSourceSha256: order.sourceSha256, decisionSha256: receipts.decisionSha256,
    listingObservedAt: proof.observedAt,
    economics: buildTransactionEconomicsRecord({
      recordId: key, amazonOrderId: order.orderId, amazonSellerSku: item.sellerSku,
      asin: map.asin,
      expectedSellingPriceUsd: Number((map.proposedSellingPriceUsd * item.quantityOrdered).toFixed(2)),
      expectedProfitUsd: Number((map.expectedProfitUsd * item.quantityOrdered).toFixed(2)),
      expectedMarginPct: map.expectedMarginPct,
      customerRevenueUsd: null, amazonFeesUsd: null,
      cjProductCostUsd: null, cjShippingUsd: null,
      marketplacePayoutReceived: "UNKNOWN", orderRevenueRecognized: "UNKNOWN",
    }),
    supplierSpendAllowed: false, submissionAttempted: false, approvalRequired: true,
  };
  db.prepare(`INSERT INTO pillow_commerce_fulfillment_drafts
    (idempotency_key, workspace_id, record_json, created_at)
    VALUES (@key, @workspaceId, @recordJson, @createdAt)`).run({
    key, workspaceId: input.workspaceId, recordJson: JSON.stringify(draft),
    createdAt: new Date(now).toISOString(),
  });
  await db.requestCriticalPersist();
  if (read()?.record_json !== JSON.stringify(draft)) {
    throw new Error("Offline fulfillment draft durable readback failed");
  }
  return draft;
}
