import type { Order } from "../../orders/index.js";
import type { ManufacturingFulfillmentPreparation } from "../../fulfillment/manufacturing-fulfillment-bridge.js";
import type { CjOrderPayload, CjOrderSubmissionResult } from "../../suppliers/cj-dropshipping/orders/cj-order-types.js";
import type { TrackingSyncResult } from "../../suppliers/cj-dropshipping/orders/cj-tracking-sync.js";
import type { OrderExecutionSession } from "./types.js";

export type FulfillmentReadinessView = {
  ready: boolean;
  issues: string[];
  integrationMode: "SANDBOX" | "LIVE";
  submissionAllowed: false;
  liveSubmitEnabled: false;
  safetyMessage: string;
};

export type ApprovalGateView = {
  satisfied: boolean;
  approvalToken: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  approved: boolean;
  orderStatus: string;
};

export type DraftOrderView = {
  orderId: string;
  status: string;
  fulfillmentStatus: string;
  integrationMode: "SANDBOX" | "LIVE";
  estimatedCost: number;
  estimatedDeliveryDaysMin: number;
  estimatedDeliveryDaysMax: number;
  currency: string;
  items: Array<{
    itemId: string;
    title: string;
    quantity: number;
    unitCost: number;
    supplierSku: string;
  }>;
  shippingAddress: Order["shippingAddress"];
  payload: CjOrderPayload | null;
};

export type FulfillmentPreparationView = {
  sessionId: string;
  runId: string;
  storeId: string;
  brandId: string;
  readiness: FulfillmentReadinessView;
  draftOrder: DraftOrderView;
  supplierValidation: {
    valid: boolean;
    issues: string[];
  };
  approvalGate: ApprovalGateView;
  autoSubmitEnabled: false;
};

export type SandboxSubmissionView = {
  submitted: boolean;
  integrationMode: "SANDBOX";
  supplierOrderId: string;
  status: string;
  message: string;
  submittedAt: string;
  tracking: {
    trackingNumber: string;
    carrier: string;
    deliveryStatus: string;
    events: Array<{
      status: string;
      description: string;
      location: string | null;
      occurredAt: string;
    }>;
  } | null;
  paymentExecuted: false;
  walletDeducted: false;
};

function approvalGateView(order: Order | null): ApprovalGateView {
  const approval = order?.approval;
  return {
    satisfied: Boolean(approval?.approved === true && order?.status === "APPROVED"),
    approvalToken: approval?.approvalToken ?? null,
    approvedBy: approval?.approvedBy ?? null,
    approvedAt: approval?.approvedAt ?? null,
    approved: approval?.approved === true,
    orderStatus: order?.status ?? "UNKNOWN",
  };
}

export function toFulfillmentReadinessView(
  preparation: ManufacturingFulfillmentPreparation,
): FulfillmentReadinessView {
  return {
    ready: preparation.fulfillmentReadiness.ready,
    issues: preparation.fulfillmentReadiness.issues,
    integrationMode: preparation.fulfillmentReadiness.integrationMode,
    submissionAllowed: false,
    liveSubmitEnabled: false,
    safetyMessage: "Live order submission is disabled. Sandbox only.",
  };
}

export function toDraftOrderView(
  order: Order,
  payload: CjOrderPayload | null,
): DraftOrderView {
  return {
    orderId: order.orderId,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus,
    integrationMode: order.integrationMode,
    estimatedCost: order.estimatedCost,
    estimatedDeliveryDaysMin: order.estimatedDeliveryDaysMin,
    estimatedDeliveryDaysMax: order.estimatedDeliveryDaysMax,
    currency: order.currency,
    items: order.items.map((item) => ({
      itemId: item.itemId,
      title: item.title,
      quantity: item.quantity,
      unitCost: item.unitCost,
      supplierSku: item.supplierSku,
    })),
    shippingAddress: order.shippingAddress,
    payload,
  };
}

export function toFulfillmentPreparationView(
  session: OrderExecutionSession,
  preparation: ManufacturingFulfillmentPreparation,
  payload: CjOrderPayload | null,
): FulfillmentPreparationView {
  const order = session.approvedOrder ?? preparation.draftOrder;
  return {
    sessionId: session.sessionId,
    runId: preparation.runId,
    storeId: preparation.storeId,
    brandId: preparation.brandId,
    readiness: toFulfillmentReadinessView(preparation),
    draftOrder: toDraftOrderView(preparation.draftOrder, payload),
    supplierValidation: preparation.supplierValidation,
    approvalGate: approvalGateView(order),
    autoSubmitEnabled: false,
  };
}

export function toSandboxSubmissionView(
  result: CjOrderSubmissionResult,
  tracking: TrackingSyncResult | null,
): SandboxSubmissionView {
  return {
    submitted: true,
    integrationMode: "SANDBOX",
    supplierOrderId: result.supplierOrderId,
    status: result.status,
    message: result.message,
    submittedAt: result.submittedAt,
    tracking: tracking
      ? {
          trackingNumber: tracking.trackingNumber,
          carrier: tracking.carrier,
          deliveryStatus: tracking.deliveryStatus,
          events: tracking.events.map((event) => ({
            status: event.status,
            description: event.description,
            location: event.location,
            occurredAt: event.occurredAt,
          })),
        }
      : null,
    paymentExecuted: false,
    walletDeducted: false,
  };
}
