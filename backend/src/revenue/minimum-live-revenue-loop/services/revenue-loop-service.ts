import { randomUUID } from "node:crypto";

import { financialLedger } from "../../../finance/ledger.js";
import { getDatabase } from "../../../brain/database.js";
import type { Order } from "../../../orders/index.js";
import { applyOrderApproval } from "../../../fulfillment/manufacturing-fulfillment-bridge.js";
import { loadCjConfig } from "../../../suppliers/cj-dropshipping/cj-config.js";
import { createCjOrderClient } from "../../../suppliers/cj-dropshipping/orders/cj-order-client.js";
import { loadRevenueLoopEnv } from "../config/revenue-loop-env.js";
import type { RevenueOrderRecord } from "../models/revenue-order-record.js";
import type { LiveStoreRecord } from "../repositories/revenue-loop-repository.js";
import { getRevenueLoopRepository } from "../repositories/sqlite-revenue-loop-repository.js";
import type { StripeWebhookEvent } from "./stripe-client.js";

const STRIPE_FEE_BPS = 290;
const STRIPE_FEE_FIXED_CENTS = 30;
const SHIPPING_ESTIMATE_CENTS = 599;

export type IngestCheckoutInput = {
  event: StripeWebhookEvent;
};

function estimateStripeFeeCents(amountCents: number): number {
  return Math.round((amountCents * STRIPE_FEE_BPS) / 10_000) + STRIPE_FEE_FIXED_CENTS;
}

function buildFulfillmentOrder(
  store: LiveStoreRecord,
  session: Record<string, unknown>,
): Order {
  const customerDetails = (session.customer_details ?? {}) as Record<string, unknown>;
  const shippingDetails = (session.shipping_details ?? {}) as Record<string, unknown>;
  const shippingAddress = (shippingDetails.address ?? {}) as Record<string, unknown>;
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const config = loadCjConfig();
  const now = new Date().toISOString();
  const orderId = `ord-${randomUUID()}`;

  return {
    orderId,
    workspaceId: store.workspaceId,
    storeId: store.storeId,
    brandId: store.brandId,
    supplierPlatform: "CJ_DROPSHIPPING",
    connectorId: "cj-dropshipping-default",
    status: "READY_FOR_APPROVAL",
    fulfillmentStatus: "PREPARING",
    items: [
      {
        itemId: `${orderId}-line-1`,
        supplierSku: store.cjSupplierSku,
        supplierProductId: store.cjSupplierProductId,
        title: store.productName,
        quantity: 1,
        unitCost: store.unitCostCents / 100,
        currency: store.currency,
      },
    ],
    shippingAddress: {
      fullName: String(shippingDetails.name ?? customerDetails.name ?? metadata.customerName ?? "Customer"),
      addressLine1: String(shippingAddress.line1 ?? metadata.addressLine1 ?? "123 Commerce Way"),
      city: String(shippingAddress.city ?? metadata.city ?? "Austin"),
      state: String(shippingAddress.state ?? metadata.state ?? "TX"),
      postalCode: String(shippingAddress.postal_code ?? metadata.postalCode ?? "78701"),
      countryCode: String(shippingAddress.country ?? metadata.countryCode ?? "US").slice(0, 2).toUpperCase(),
      phone: String(metadata.phone ?? "+1-555-0100"),
    },
    estimatedCost: 0,
    estimatedDeliveryDaysMin: 5,
    estimatedDeliveryDaysMax: 12,
    currency: store.currency,
    approval: null,
    supplierOrderId: null,
    trackingNumber: null,
    carrier: null,
    trackingEvents: [],
    integrationMode: config.integrationMode,
    createdAt: now,
    updatedAt: now,
  };
}

/** Ingests a completed checkout session into a revenue order with ledger entries. */
export async function ingestCheckoutCompleted(
  input: IngestCheckoutInput,
): Promise<RevenueOrderRecord> {
  const session = input.event.data.object;
  const sessionId = String(session.id ?? "");
  const repository = getRevenueLoopRepository();

  const existing = repository.getOrderByStripeSession(sessionId);
  if (existing) return existing;

  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const store =
    repository.getStoreById(metadata.storeId ?? "") ??
    repository.getStoreBySlug(metadata.storeSlug ?? "");

  if (!store) {
    throw new Error("Checkout session missing valid store metadata");
  }

  const customerDetails = (session.customer_details ?? {}) as Record<string, unknown>;
  const revenueCents = Number(session.amount_total ?? store.priceCents);
  const currency = String(session.currency ?? store.currency).toUpperCase();
  const costCents = store.unitCostCents + SHIPPING_ESTIMATE_CENTS;
  const stripeFeeCents = estimateStripeFeeCents(revenueCents);
  const profitCents = revenueCents - costCents - stripeFeeCents;
  const config = loadRevenueLoopEnv();

  let fulfillmentOrder = buildFulfillmentOrder(store, session);
  const client = createCjOrderClient();
  const estimate = await client.estimateFulfillment(fulfillmentOrder);
  fulfillmentOrder = {
    ...fulfillmentOrder,
    estimatedCost: estimate.estimatedCost,
    estimatedDeliveryDaysMin: estimate.estimatedDeliveryDaysMin,
    estimatedDeliveryDaysMax: estimate.estimatedDeliveryDaysMax,
    updatedAt: new Date().toISOString(),
  };

  const totalCostCents = Math.round(estimate.estimatedCost * 100) + stripeFeeCents;
  const adjustedProfitCents = revenueCents - totalCostCents;
  const profitable = adjustedProfitCents >= config.REVENUE_LOOP_MIN_PROFIT_CENTS;

  const record: RevenueOrderRecord = {
    recordId: randomUUID(),
    storeId: store.storeId,
    workspaceId: store.workspaceId,
    companyId: store.companyId,
    stripeSessionId: sessionId,
    stripePaymentIntentId: String(session.payment_intent ?? ""),
    customerEmail: String(customerDetails.email ?? metadata.customerEmail ?? "customer@example.com"),
    customerName: String(customerDetails.name ?? metadata.customerName ?? "Customer"),
    revenueCents,
    costCents: totalCostCents,
    profitCents: adjustedProfitCents,
    currency,
    status: "AWAITING_FULFILLMENT_APPROVAL",
    fulfillmentOrder,
    approvalToken: null,
    approvedBy: null,
    approvedAt: null,
    supplierOrderId: null,
    trackingNumber: null,
    profitable,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const db = getDatabase();
  const existingSale = db
    .prepare(
      `SELECT 1 FROM financial_ledger_events
       WHERE correlation_id = @cid AND event_type = 'sale' LIMIT 1`,
    )
    .get({ cid: sessionId });

  if (!existingSale) {
    financialLedger.append({
      workspaceId: store.workspaceId,
      companyId: store.companyId,
      eventType: "sale",
      amountCents: revenueCents,
      currency,
      direction: "credit",
      correlationId: sessionId,
      source: "stripe_checkout",
      description: `Customer payment for ${store.productName}`,
      metadata: { storeId: store.storeId, customerEmail: record.customerEmail },
    });

    if (stripeFeeCents > 0) {
      financialLedger.append({
        workspaceId: store.workspaceId,
        companyId: store.companyId,
        eventType: "tax",
        amountCents: stripeFeeCents,
        currency,
        direction: "debit",
        correlationId: sessionId,
        source: "stripe_fee",
        description: "Estimated Stripe processing fee",
      });
    }
  }

  financialLedger.append({
    workspaceId: store.workspaceId,
    companyId: store.companyId,
    eventType: "supplier_cost",
    amountCents: Math.round(estimate.estimatedCost * 100),
    currency,
    direction: "debit",
    correlationId: sessionId,
    source: "cj_estimate",
    description: `Estimated supplier cost for order ${fulfillmentOrder.orderId}`,
  });

  return repository.saveOrder(record);
}

export type ApplyFulfillmentApprovalInput = {
  recordId: string;
  approvalToken: string;
  approvedBy: string;
  approvedAt: string;
};

/** Applies founder approval gate before LIVE CJ submission. */
export function applyFulfillmentApproval(
  input: ApplyFulfillmentApprovalInput,
): RevenueOrderRecord {
  const repository = getRevenueLoopRepository();
  const record = repository.getOrderById(input.recordId);
  if (!record) {
    throw new Error(`Revenue order ${input.recordId} not found`);
  }
  if (!record.fulfillmentOrder) {
    throw new Error("Revenue order has no fulfillment order attached");
  }
  if (record.status !== "AWAITING_FULFILLMENT_APPROVAL" && record.status !== "PAYMENT_RECEIVED") {
    throw new Error(`Order status ${record.status} cannot be approved for fulfillment`);
  }

  const approvedOrder = applyOrderApproval(record.fulfillmentOrder, {
    approvalToken: input.approvalToken,
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
    approved: true,
  });

  return repository.saveOrder({
    ...record,
    status: "APPROVED",
    fulfillmentOrder: approvedOrder,
    approvalToken: input.approvalToken,
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
    updatedAt: new Date().toISOString(),
  });
}

export class LiveFulfillmentBlockedError extends Error {
  constructor(reason: string) {
    super(`Live fulfillment blocked: ${reason}`);
    this.name = "LiveFulfillmentBlockedError";
  }
}

/** Submits approved order to CJ in LIVE mode — requires explicit env gate + approval. */
export async function submitLiveFulfillment(recordId: string): Promise<RevenueOrderRecord> {
  const config = loadRevenueLoopEnv();
  if (!config.REVENUE_LOOP_LIVE_FULFILLMENT_ENABLED) {
    throw new LiveFulfillmentBlockedError(
      "REVENUE_LOOP_LIVE_FULFILLMENT_ENABLED is false — Protect The Empire gate active.",
    );
  }

  const cjConfig = loadCjConfig();
  if (cjConfig.integrationMode !== "LIVE") {
    throw new LiveFulfillmentBlockedError(
      "CJ_INTEGRATION_MODE must be LIVE with valid credentials.",
    );
  }

  const repository = getRevenueLoopRepository();
  const record = repository.getOrderById(recordId);
  if (!record?.fulfillmentOrder) {
    throw new Error(`Approved revenue order ${recordId} not found`);
  }
  if (record.status !== "APPROVED") {
    throw new LiveFulfillmentBlockedError(`Order status must be APPROVED, got ${record.status}`);
  }

  const client = createCjOrderClient();
  const submission = await client.submitOrder(record.fulfillmentOrder);

  const profitable = record.profitable;
  const updatedOrder = {
    ...record.fulfillmentOrder,
    status: "SUBMITTED" as const,
    fulfillmentStatus: "SUBMITTED" as const,
    supplierOrderId: submission.supplierOrderId,
    updatedAt: new Date().toISOString(),
  };

  return repository.saveOrder({
    ...record,
    status: profitable ? "PROFITABLE" : "FULFILLED",
    fulfillmentOrder: updatedOrder,
    supplierOrderId: submission.supplierOrderId,
    trackingNumber: `TRK-${record.recordId.slice(-8).toUpperCase()}`,
    profitable,
    updatedAt: new Date().toISOString(),
  });
}
