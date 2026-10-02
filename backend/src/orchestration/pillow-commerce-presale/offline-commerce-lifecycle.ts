/** Receipt-driven OFFLINE lifecycle. No provider calls, Birth, spend or publish authority.
 * A future authenticated provider ingestion path must be independently authorized and verified.
 */
import { createHash } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import { syncTrackingFromSnapshot } from "../../suppliers/cj-dropshipping/orders/cj-tracking-sync.js";
import type { CjTrackingSnapshot } from "../../suppliers/cj-dropshipping/orders/cj-order-types.js";
import type { OfflineFulfillmentDraft } from "./offline-imported-order-fulfillment.js";
import { buildTransactionEconomicsRecord } from "./commerce-actual-pnl.js";

type ReceiptBase = { receiptId: string; occurredAt: string; source: "OFFLINE_FIXTURE" };
export type OfflineCommerceReceipt = ReceiptBase & (
  | { kind: "SUPPLIER_ACCEPTED"; supplierOrderId: string; cjVid: string; quantity: number }
  | { kind: "SUPPLIER_CANCELLATION_REQUESTED"; supplierOrderId: string }
  | { kind: "SUPPLIER_CANCELLATION_RESOLVED"; supplierOrderId: string; requestReceiptId: string; outcome: "CANCELLED" | "DECLINED" }
  | { kind: "SUPPLIER_RETURN_AUTHORIZED"; supplierOrderId: string; rmaId: string; quantity: number }
  | { kind: "SUPPLIER_RETURN_RECEIVED"; supplierOrderId: string; rmaId: string }
  | { kind: "SUPPLIER_CREDIT_ISSUED"; supplierOrderId: string; creditId: string; basisReceiptId: string; productCents: number; freightCents: number; otherCents: number }
  | { kind: "SUPPLIER_REFUND_RECEIVED"; supplierOrderId: string; creditId: string; amountCents: number }
  | { kind: "TRACKING"; snapshot: CjTrackingSnapshot }
  | { kind: "SUPPLIER_PAID"; supplierOrderId: string; productCents: number; freightCents: number; otherCents: number }
  | { kind: "AMAZON_SETTLED"; amazonOrderId: string; orderItemId: string; grossCents: number; feeCents: number; otherCents: number; payoutCents: number }
  | { kind: "REFUND_SETTLED"; amazonOrderId: string; orderItemId: string; refundCents: number; feeCreditCents: number }
);
type JournalEntry = { receiptId: string; account: string; debitCents: number; creditCents: number };

function ensureTables(): void {
  getDatabase().exec(`CREATE TABLE IF NOT EXISTS pillow_offline_commerce_receipts (
    workspace_id TEXT NOT NULL, receipt_id TEXT NOT NULL, transaction_key TEXT NOT NULL,
    payload_sha TEXT NOT NULL, record_json TEXT NOT NULL, sequence INTEGER NOT NULL,
    PRIMARY KEY(workspace_id, receipt_id),
    UNIQUE(workspace_id, transaction_key, sequence)
  )`);
}
function draftFor(workspaceId: string, key: string): OfflineFulfillmentDraft {
  const row = getDatabase().prepare(`SELECT record_json FROM pillow_commerce_fulfillment_drafts
    WHERE workspace_id=@workspaceId AND idempotency_key=@key`).get({workspaceId,key}) as {record_json:string}|undefined;
  if (!row) throw new Error("Persisted offline fulfillment draft required");
  return JSON.parse(row.record_json) as OfflineFulfillmentDraft;
}
function receiptsFor(workspaceId: string, key: string): OfflineCommerceReceipt[] {
  ensureTables();
  const rows = getDatabase().prepare(`SELECT record_json FROM pillow_offline_commerce_receipts
    WHERE workspace_id=@workspaceId AND transaction_key=@key ORDER BY sequence`)
    .all({workspaceId,key}) as Array<{record_json:string}>;
  return rows.map(row => JSON.parse(row.record_json) as OfflineCommerceReceipt);
}
function cents(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > 100_000_000) throw new Error("Invalid USD cents");
  return value;
}
function requireText(value: string): void {
  if (typeof value !== "string" || !value.trim() || value.length > 256) throw new Error("Receipt identity required");
}
function project(draft: OfflineFulfillmentDraft, receipts: OfflineCommerceReceipt[]) {
  let supplierOrderId: string | null = null;
  let tracking: ReturnType<typeof syncTrackingFromSnapshot> | null = null;
  let supplier: Extract<OfflineCommerceReceipt,{kind:"SUPPLIER_PAID"}> | null = null;
  let settlement: Extract<OfflineCommerceReceipt,{kind:"AMAZON_SETTLED"}> | null = null;
  let refunds = 0, feeCredits = 0;
  let cancellation: {requestReceiptId:string; outcome:"PENDING"|"CANCELLED"|"DECLINED"} | null = null;
  let supplierReturn: {rmaId:string; quantity:number; receivedReceiptId:string|null} | null = null;
  const credits = new Map<string,{productCents:number;freightCents:number;otherCents:number;refundedCents:number}>();
  let productCredits=0, freightCredits=0, otherCredits=0, supplierCashRefunds=0;
  const journal: JournalEntry[] = [];
  const entry = (receiptId:string, account:string, debitCents:number, creditCents:number) =>
    journal.push({receiptId,account,debitCents,creditCents});
  for (const receipt of receipts) {
    requireText(receipt.receiptId);
    if (receipt.source !== "OFFLINE_FIXTURE" || !Number.isFinite(Date.parse(receipt.occurredAt))) {
      throw new Error("Only timestamped offline fixture receipts are supported");
    }
    switch (receipt.kind) {
      case "SUPPLIER_ACCEPTED":
        requireText(receipt.supplierOrderId);
        if (supplierOrderId || receipt.cjVid !== draft.cjVid || receipt.quantity !== draft.quantity) {
          throw new Error("Supplier acknowledgement conflicts with draft");
        }
        supplierOrderId = receipt.supplierOrderId;
        break;
      case "SUPPLIER_CANCELLATION_REQUESTED":
        if (!supplierOrderId || receipt.supplierOrderId !== supplierOrderId || cancellation) throw new Error("Cancellation request conflicts");
        cancellation = {requestReceiptId:receipt.receiptId,outcome:"PENDING"};
        break;
      case "SUPPLIER_CANCELLATION_RESOLVED":
        if (!cancellation || cancellation.outcome !== "PENDING" || receipt.requestReceiptId !== cancellation.requestReceiptId ||
            receipt.supplierOrderId !== supplierOrderId || !["CANCELLED","DECLINED"].includes(receipt.outcome) ||
            (receipt.outcome === "CANCELLED" && tracking && tracking.deliveryStatus !== "PENDING")) {
          throw new Error("Cancellation outcome conflicts with supplier or shipment");
        }
        cancellation.outcome = receipt.outcome;
        break;
      case "SUPPLIER_RETURN_AUTHORIZED":
        requireText(receipt.rmaId);
        if (!supplierOrderId || receipt.supplierOrderId !== supplierOrderId || supplierReturn ||
            tracking?.deliveryStatus !== "DELIVERED" || !Number.isSafeInteger(receipt.quantity) ||
            receipt.quantity < 1 || receipt.quantity > draft.quantity) throw new Error("Return authorization conflicts");
        supplierReturn = {rmaId:receipt.rmaId,quantity:receipt.quantity,receivedReceiptId:null};
        break;
      case "SUPPLIER_RETURN_RECEIVED":
        if (!supplierReturn || supplierReturn.receivedReceiptId || receipt.rmaId !== supplierReturn.rmaId ||
            receipt.supplierOrderId !== supplierOrderId) throw new Error("Return receipt conflicts");
        supplierReturn.receivedReceiptId = receipt.receiptId;
        break;
      case "SUPPLIER_CREDIT_ISSUED": {
        requireText(receipt.creditId);
        const basis = receipts.find(row => row.receiptId === receipt.basisReceiptId);
        const cancelled = basis?.kind === "SUPPLIER_CANCELLATION_RESOLVED" && basis.outcome === "CANCELLED" && cancellation?.outcome === "CANCELLED";
        const returned = supplierReturn?.receivedReceiptId === receipt.basisReceiptId;
        if (!supplier || receipt.supplierOrderId !== supplierOrderId || credits.has(receipt.creditId) || (!cancelled && !returned) ||
            productCredits+cents(receipt.productCents)>supplier.productCents ||
            freightCredits+cents(receipt.freightCents)>supplier.freightCents ||
            otherCredits+cents(receipt.otherCents)>supplier.otherCents) throw new Error("Supplier credit does not reconcile");
        const total=receipt.productCents+receipt.freightCents+receipt.otherCents;
        if (total === 0) throw new Error("Supplier credit must be positive");
        credits.set(receipt.creditId,{productCents:receipt.productCents,freightCents:receipt.freightCents,
          otherCents:receipt.otherCents,refundedCents:0});
        productCredits+=receipt.productCents; freightCredits+=receipt.freightCents; otherCredits+=receipt.otherCents;
        entry(receipt.receiptId,"supplier_credit_receivable",total,0);
        entry(receipt.receiptId,"supplier_cost",0,receipt.productCents);
        entry(receipt.receiptId,"freight_cost",0,receipt.freightCents);
        entry(receipt.receiptId,"other_cost",0,receipt.otherCents);
        break;
      }
      case "SUPPLIER_REFUND_RECEIVED": {
        const credit=credits.get(receipt.creditId);
        if (!credit || receipt.supplierOrderId !== supplierOrderId || cents(receipt.amountCents) === 0 ||
            credit.refundedCents+receipt.amountCents>credit.productCents+credit.freightCents+credit.otherCents) {
          throw new Error("Supplier refund exceeds outstanding credit");
        }
        credit.refundedCents+=receipt.amountCents; supplierCashRefunds+=receipt.amountCents;
        entry(receipt.receiptId,"cash",receipt.amountCents,0);
        entry(receipt.receiptId,"supplier_credit_receivable",0,receipt.amountCents);
        break;
      }
      case "TRACKING": {
        if (cancellation?.outcome === "CANCELLED") throw new Error("Cancelled supplier order cannot ship");
        const snapshot = receipt.snapshot;
        if (!supplierOrderId || snapshot.supplierOrderId !== supplierOrderId) throw new Error("Tracking supplier mismatch");
        requireText(snapshot.trackingNumber); requireText(snapshot.carrier);
        if (!["PENDING","IN_TRANSIT","DELIVERED","FAILED"].includes(snapshot.deliveryStatus) ||
            snapshot.events.length === 0 || snapshot.events.length > 100 ||
            snapshot.events.some(event => !Number.isFinite(Date.parse(event.occurredAt)) ||
              !["LABEL_CREATED","PICKED_UP","IN_TRANSIT","OUT_FOR_DELIVERY","DELIVERED","EXCEPTION","FAILED"].includes(event.status)) ||
            (snapshot.deliveryStatus === "DELIVERED" && !snapshot.events.some(event => event.status === "DELIVERED"))) {
          throw new Error("Tracking outcome lacks matching events");
        }
        if (tracking && (tracking.trackingNumber !== snapshot.trackingNumber ||
            (tracking.deliveryStatus === "DELIVERED" && snapshot.deliveryStatus !== "DELIVERED"))) {
          throw new Error("Tracking identity or terminal outcome conflicts");
        }
        tracking = syncTrackingFromSnapshot({orderId:draft.amazonOrderId},snapshot);
        tracking.syncedAt = receipt.occurredAt;
        break;
      }
      case "SUPPLIER_PAID": {
        if (!supplierOrderId || receipt.supplierOrderId !== supplierOrderId || supplier) {
          throw new Error("Supplier payment requires one matching acknowledgement");
        }
        const total = cents(receipt.productCents)+cents(receipt.freightCents)+cents(receipt.otherCents);
        supplier = receipt;
        entry(receipt.receiptId,"supplier_cost",receipt.productCents,0);
        entry(receipt.receiptId,"freight_cost",receipt.freightCents,0);
        entry(receipt.receiptId,"other_cost",receipt.otherCents,0);
        entry(receipt.receiptId,"cash",0,total);
        break;
      }
      case "AMAZON_SETTLED":
        if (settlement || receipt.amazonOrderId !== draft.amazonOrderId || receipt.orderItemId !== draft.orderItemId ||
            cents(receipt.grossCents)-cents(receipt.feeCents)-cents(receipt.otherCents) !== cents(receipt.payoutCents)) {
          throw new Error("Item-attributed Amazon settlement does not reconcile");
        }
        settlement = receipt;
        entry(receipt.receiptId,"cash",receipt.payoutCents,0);
        entry(receipt.receiptId,"amazon_fees",receipt.feeCents,0);
        entry(receipt.receiptId,"other_cost",receipt.otherCents,0);
        entry(receipt.receiptId,"revenue",0,receipt.grossCents);
        break;
      case "REFUND_SETTLED":
        if (!settlement || receipt.amazonOrderId !== draft.amazonOrderId || receipt.orderItemId !== draft.orderItemId ||
            cents(receipt.refundCents) < cents(receipt.feeCreditCents) ||
            refunds + receipt.refundCents > settlement.grossCents ||
            feeCredits + receipt.feeCreditCents > settlement.feeCents) {
          throw new Error("Refund does not reconcile with item settlement");
        }
        refunds += receipt.refundCents; feeCredits += receipt.feeCreditCents;
        entry(receipt.receiptId,"refunds",receipt.refundCents,0);
        entry(receipt.receiptId,"amazon_fees",0,receipt.feeCreditCents);
        entry(receipt.receiptId,"cash",0,receipt.refundCents-receipt.feeCreditCents);
        break;
      default: throw new Error("Unsupported receipt kind");
    }
  }
  const reconciled = Boolean(supplier && settlement);
  const economics = buildTransactionEconomicsRecord({
    recordId:draft.idempotencyKey,amazonOrderId:draft.amazonOrderId,
    amazonSellerSku:draft.amazonSellerSku,asin:draft.asin,
    expectedSellingPriceUsd:draft.economics.expected.sellingPriceUsd,
    expectedProfitUsd:draft.economics.expected.profitUsd,expectedMarginPct:draft.economics.expected.marginPct,
    customerRevenueUsd:settlement ? (settlement.grossCents-refunds)/100 : null,
    amazonFeesUsd:settlement ? (settlement.feeCents-feeCredits)/100 : null,
    cjProductCostUsd:supplier ? (supplier.productCents-productCredits)/100 : null,
    cjShippingUsd:supplier ? (supplier.freightCents-freightCredits)/100 : null,
    brandPackagingCostUsd:null,
    otherDirectCostsUsd:reconciled ? (supplier!.otherCents-otherCredits+settlement!.otherCents)/100 : null,
    marketplacePayoutReceived:settlement ? "YES" : "UNKNOWN",
    orderRevenueRecognized:tracking?.deliveryStatus === "DELIVERED" && settlement ? "YES" : "UNKNOWN",
  });
  // This calculator's LIVE freshness means complete numbers, never live provider authenticity.
  // Label all outward evidence explicitly as simulated, including economics.
  economics.computedAt = receipts.at(-1)?.occurredAt ?? draft.economics.computedAt;
  economics.note = "OFFLINE FIXTURE RECONCILIATION ONLY. No real payment, provider authenticity or commerce authority.";
  return {evidenceMode:"OFFLINE_FIXTURE" as const,transactionKey:draft.idempotencyKey,
    supplierOrderId,tracking,cancellation,supplierReturn,
    supplierCredits:{issuedCents:productCredits+freightCredits+otherCredits,cashReceivedCents:supplierCashRefunds,
      outstandingCents:productCredits+freightCredits+otherCredits-supplierCashRefunds},
    receiptCount:receipts.length,
    reconciliation:reconciled ? "RECONCILED_FIXTURE" as const : "INCOMPLETE" as const,
    economics,journal,supplierSpendAllowed:false as const,submissionAttempted:false as const};
}

export function readOfflineCommerceLifecycle(workspaceId:string, key:string) {
  return project(draftFor(workspaceId,key),receiptsFor(workspaceId,key));
}

/** Immutable receipts and derived balanced journal survive a process restart. */
export async function appendOfflineCommerceReceipt(workspaceId:string,key:string,receipt:OfflineCommerceReceipt) {
  const draft = draftFor(workspaceId,key);
  const receipts = receiptsFor(workspaceId,key);
  const db = getDatabase(), recordJson = JSON.stringify(receipt);
  const sha = createHash("sha256").update(recordJson).digest("hex");
  const prior = db.prepare(`SELECT transaction_key,payload_sha FROM pillow_offline_commerce_receipts
    WHERE workspace_id=@workspaceId AND receipt_id=@receiptId`)
    .get({workspaceId,receiptId:receipt.receiptId}) as {transaction_key:string;payload_sha:string}|undefined;
  if (prior) {
    if (prior.transaction_key !== key || prior.payload_sha !== sha) throw new Error("Receipt ID conflict");
    await db.requestCriticalPersist();
    return project(draft,receipts);
  }
  const result = project(draft,[...receipts,receipt]);
  db.prepare(`INSERT INTO pillow_offline_commerce_receipts
    (workspace_id,receipt_id,transaction_key,payload_sha,record_json,sequence)
    VALUES (@workspaceId,@receiptId,@key,@sha,@recordJson,@sequence)`)
    .run({workspaceId,receiptId:receipt.receiptId,key,sha,recordJson,sequence:receipts.length+1});
  await db.requestCriticalPersist();
  const readback = readOfflineCommerceLifecycle(workspaceId,key);
  if (JSON.stringify(readback) !== JSON.stringify(result)) throw new Error("Lifecycle receipt readback failed");
  return readback;
}

/** Bounded owner projection. No customer address, credentials or authority mutation. */
export function listOfflineCommerceTransactions(workspaceId:string,limit=20) {
  if (!workspaceId || !Number.isSafeInteger(limit) || limit<1 || limit>50) throw new Error("Transaction read scope invalid");
  const db = getDatabase();
  const exists = (name:string) => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=@name").get({name}));
  if (!exists("pillow_commerce_fulfillment_drafts")) return [];
  const rows = db.prepare(`SELECT record_json FROM pillow_commerce_fulfillment_drafts
    WHERE workspace_id=@workspaceId ORDER BY created_at DESC,idempotency_key LIMIT @limit`)
    .all({workspaceId,limit}) as Array<{record_json:string}>;
  const hasMarketplace = exists("pillow_order_marketplace_evidence");
  return rows.map(row=>{
    const draft = JSON.parse(row.record_json) as OfflineFulfillmentDraft;
    const marketplace = hasMarketplace ? db.prepare(`SELECT record_json FROM pillow_order_marketplace_evidence
      WHERE workspace_id=@workspaceId AND transaction_key=@key`)
      .get({workspaceId,key:draft.idempotencyKey}) as {record_json:string}|undefined : undefined;
    const lifecycle = readOfflineCommerceLifecycle(workspaceId,draft.idempotencyKey);
    return {transactionKey:draft.idempotencyKey,evidenceMode:"OFFLINE_FIXTURE" as const,
      amazonOrderId:draft.amazonOrderId,orderItemId:draft.orderItemId,sku:draft.amazonSellerSku,
      asin:draft.asin,cjPid:draft.cjPid,cjVid:draft.cjVid,quantity:draft.quantity,
      orderSourceSha256:draft.orderSourceSha256,decisionSha256:draft.decisionSha256,
      marketplaceEvidence:marketplace ? JSON.parse(marketplace.record_json) : null,
      expected:draft.economics.expected,
      simulated:lifecycle,
      realCommerceVerified:false as const};
  });
}
