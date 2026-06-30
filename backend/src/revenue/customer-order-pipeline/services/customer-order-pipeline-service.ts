import { randomUUID } from "node:crypto";

import { applyOrderApproval } from "../../../fulfillment/manufacturing-fulfillment-bridge.js";
import type { Order } from "../../../orders/index.js";
import { getLivePaymentRepository } from "../../live-payment-engine/repositories/sqlite-live-payment-repository.js";
import type { LivePaymentRecord } from "../../live-payment-engine/models/live-payment-record.js";
import { getRevenueLoopRepository } from "../../minimum-live-revenue-loop/repositories/sqlite-revenue-loop-repository.js";
import { loadCjConfig } from "../../../suppliers/cj-dropshipping/cj-config.js";
import { createCjOrderClient } from "../../../suppliers/cj-dropshipping/orders/cj-order-client.js";
import {
  applyTrackingSync,
  syncSandboxTracking,
} from "../../../suppliers/cj-dropshipping/orders/cj-tracking-sync.js";
import { loadCustomerOrderPipelineEnv } from "../config/customer-order-pipeline-env.js";
import type { CustomerOrderPipelineRecord, PipelineStatus } from "../models/customer-order-pipeline-record.js";
import {
  createPipelineRecord,
  getCustomerOrderPipelineRepository,
} from "../repositories/sqlite-customer-order-pipeline-repository.js";
import {
  fulfillInventoryReservation,
  reserveInventoryForPipeline,
} from "./inventory-reservation-service.js";
import { recordDeliveryLedgerEvents } from "./ledger-closure-service.js";

export class CustomerOrderPipelineBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerOrderPipelineBlockedError";
  }
}

const PIPELINE_STAGE_ORDER: PipelineStatus[] = [
  "CHECKOUT_CREATED",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "ORDER_CREATED",
  "INVENTORY_RESERVED",
  "AWAITING_FULFILLMENT_APPROVAL",
  "FULFILLMENT_REQUESTED",
  "IN_TRANSIT",
  "DELIVERED",
];

export type StartCheckoutPipelineInput = {
  workspaceId: string;
  companyId: string;
  storeId: string;
  brandId: string;
  customerEmail: string;
  customerName: string;
  revenueCents: number;
  currency?: string;
  correlationId: string;
  metadata?: Record<string, string>;
};

export type ApplyPipelineApprovalInput = {
  pipelineId: string;
  approvalToken: string;
  approvedBy: string;
  approvedAt: string;
};

function savePipeline(
  record: CustomerOrderPipelineRecord,
  updates: Partial<CustomerOrderPipelineRecord>,
): CustomerOrderPipelineRecord {
  return getCustomerOrderPipelineRepository().savePipeline({
    ...record,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

function buildOrderFromStore(input: {
  storeId: string;
  brandId: string;
  workspaceId: string;
  companyId: string;
  productName: string;
  priceCents: number;
  currency: string;
  cjSupplierSku: string;
  cjSupplierProductId: string;
  unitCostCents: number;
  customerEmail: string;
  customerName: string;
}): Order {
  const config = loadCjConfig();
  const now = new Date().toISOString();
  const orderId = `ord-${randomUUID()}`;

  return {
    orderId,
    workspaceId: input.workspaceId,
    storeId: input.storeId,
    brandId: input.brandId,
    supplierPlatform: "CJ_DROPSHIPPING",
    connectorId: "cj-dropshipping-default",
    status: "READY_FOR_APPROVAL",
    fulfillmentStatus: "PREPARING",
    items: [
      {
        itemId: `${orderId}-line-1`,
        supplierSku: input.cjSupplierSku,
        supplierProductId: input.cjSupplierProductId,
        title: input.productName,
        quantity: 1,
        unitCost: input.unitCostCents / 100,
        currency: input.currency,
      },
    ],
    shippingAddress: {
      fullName: input.customerName,
      addressLine1: "123 Commerce Way",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
      countryCode: "US",
      phone: "+1-555-0100",
    },
    estimatedCost: 0,
    estimatedDeliveryDaysMin: 5,
    estimatedDeliveryDaysMax: 12,
    currency: input.currency,
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

/** Starts a customer order pipeline at checkout. */
export function startCheckoutPipeline(
  input: StartCheckoutPipelineInput,
): CustomerOrderPipelineRecord {
  const repository = getCustomerOrderPipelineRepository();
  const existing = repository.getPipelineByCorrelationId(input.correlationId);
  if (existing) return existing;

  return repository.savePipeline(
    createPipelineRecord({
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      storeId: input.storeId,
      brandId: input.brandId,
      paymentId: null,
      revenueOrderId: null,
      correlationId: input.correlationId,
      status: "CHECKOUT_CREATED",
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      revenueCents: input.revenueCents,
      currency: (input.currency ?? "USD").toUpperCase(),
      fulfillmentOrder: null,
      inventoryReservationId: null,
      supplierOrderId: null,
      trackingNumber: null,
      carrier: null,
      approvalToken: null,
      approvedBy: null,
      approvedAt: null,
      ledgerDeliveryEventId: null,
      mock: true,
      metadata: input.metadata ?? {},
    }),
  );
}

/** Verifies payment and advances pipeline to PAYMENT_VERIFIED. */
export function verifyPipelinePayment(pipelineId: string): CustomerOrderPipelineRecord {
  const repository = getCustomerOrderPipelineRepository();
  const pipeline = repository.getPipelineById(pipelineId);
  if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`);
  if (!pipeline.paymentId) throw new Error("Pipeline has no linked payment");

  const payment = getLivePaymentRepository().getPaymentById(pipeline.paymentId);
  if (!payment || payment.status !== "SUCCEEDED") {
    throw new Error("Payment not verified — status must be SUCCEEDED");
  }

  return savePipeline(pipeline, {
    status: "PAYMENT_VERIFIED",
    revenueCents: payment.amountCents,
    currency: payment.currency,
    mock: payment.mock,
  });
}

/** Creates canonical fulfillment order on the pipeline. */
export async function createPipelineOrder(
  pipelineId: string,
): Promise<CustomerOrderPipelineRecord> {
  const repository = getCustomerOrderPipelineRepository();
  let pipeline = repository.getPipelineById(pipelineId);
  if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`);

  if (pipeline.fulfillmentOrder && pipeline.status === "ORDER_CREATED") {
    return pipeline;
  }

  let order: Order | null = null;
  let revenueOrderId = pipeline.revenueOrderId;

  if (pipeline.revenueOrderId) {
    const revenueOrder = getRevenueLoopRepository().getOrderById(pipeline.revenueOrderId);
    order = revenueOrder?.fulfillmentOrder ?? null;
  }

  if (!order && pipeline.paymentId) {
    const payment = getLivePaymentRepository().getPaymentById(pipeline.paymentId);
    if (payment?.stripeSessionId) {
      const revenueOrder = getRevenueLoopRepository().getOrderByStripeSession(
        payment.stripeSessionId,
      );
      if (revenueOrder) {
        order = revenueOrder.fulfillmentOrder;
        revenueOrderId = revenueOrder.recordId;
      }
    }
  }

  if (!order && pipeline.storeId) {
    const store = getRevenueLoopRepository().getStoreById(pipeline.storeId);
    if (store) {
      order = buildOrderFromStore({
        storeId: store.storeId,
        brandId: store.brandId,
        workspaceId: pipeline.workspaceId,
        companyId: pipeline.companyId,
        productName: store.productName,
        priceCents: pipeline.revenueCents,
        currency: pipeline.currency,
        cjSupplierSku: store.cjSupplierSku,
        cjSupplierProductId: store.cjSupplierProductId,
        unitCostCents: store.unitCostCents,
        customerEmail: pipeline.customerEmail,
        customerName: pipeline.customerName,
      });

      const client = createCjOrderClient();
      const estimate = await client.estimateFulfillment(order);
      order = {
        ...order,
        estimatedCost: estimate.estimatedCost,
        estimatedDeliveryDaysMin: estimate.estimatedDeliveryDaysMin,
        estimatedDeliveryDaysMax: estimate.estimatedDeliveryDaysMax,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  if (!order) {
    throw new Error("Cannot create order — no store or revenue order context");
  }

  pipeline = savePipeline(pipeline, {
    status: "ORDER_CREATED",
    fulfillmentOrder: order,
    revenueOrderId,
  });

  return pipeline;
}

/** Reserves inventory and advances to AWAITING_FULFILLMENT_APPROVAL. */
export function reservePipelineInventory(
  pipelineId: string,
): CustomerOrderPipelineRecord {
  const repository = getCustomerOrderPipelineRepository();
  const pipeline = repository.getPipelineById(pipelineId);
  if (!pipeline?.fulfillmentOrder) {
    throw new Error("Pipeline order must exist before inventory reservation");
  }

  const line = pipeline.fulfillmentOrder.items[0];
  if (!line) throw new Error("Order has no line items");

  const reservation = reserveInventoryForPipeline({
    pipelineId: pipeline.pipelineId,
    workspaceId: pipeline.workspaceId,
    supplierSku: line.supplierSku,
    supplierProductId: line.supplierProductId ?? line.supplierSku,
    quantity: line.quantity,
  });

  return savePipeline(pipeline, {
    status: "AWAITING_FULFILLMENT_APPROVAL",
    inventoryReservationId: reservation.reservationId,
  });
}

/** Applies founder approval gate before fulfillment submission. */
export function applyPipelineApproval(
  input: ApplyPipelineApprovalInput,
): CustomerOrderPipelineRecord {
  const repository = getCustomerOrderPipelineRepository();
  const pipeline = repository.getPipelineById(input.pipelineId);
  if (!pipeline?.fulfillmentOrder) {
    throw new Error(`Pipeline ${input.pipelineId} not ready for approval`);
  }
  if (
    pipeline.status !== "AWAITING_FULFILLMENT_APPROVAL" &&
    pipeline.status !== "INVENTORY_RESERVED"
  ) {
    throw new Error(`Pipeline status ${pipeline.status} cannot be approved`);
  }

  const approvedOrder = applyOrderApproval(pipeline.fulfillmentOrder, {
    approvalToken: input.approvalToken,
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
    approved: true,
  });

  return savePipeline(pipeline, {
    fulfillmentOrder: approvedOrder,
    approvalToken: input.approvalToken,
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
  });
}

/** Submits fulfillment request to CJ (sandbox by default). */
export async function submitPipelineFulfillment(
  pipelineId: string,
): Promise<CustomerOrderPipelineRecord> {
  const config = loadCustomerOrderPipelineEnv();
  const cjConfig = loadCjConfig();
  const repository = getCustomerOrderPipelineRepository();
  const pipeline = repository.getPipelineById(pipelineId);

  if (!pipeline?.fulfillmentOrder) {
    throw new Error(`Pipeline ${pipelineId} has no fulfillment order`);
  }
  if (pipeline.fulfillmentOrder.status !== "APPROVED") {
    throw new CustomerOrderPipelineBlockedError(
      "Fulfillment order must be APPROVED before submission",
    );
  }

  const mode = cjConfig.integrationMode;
  if (mode === "LIVE" && !config.CUSTOMER_ORDER_PIPELINE_LIVE_FULFILLMENT_ENABLED) {
    throw new CustomerOrderPipelineBlockedError(
      "CUSTOMER_ORDER_PIPELINE_LIVE_FULFILLMENT_ENABLED is false — Protect The Empire gate active.",
    );
  }

  const client = createCjOrderClient();
  const submission = await client.submitOrder(pipeline.fulfillmentOrder);

  const updatedOrder: Order = {
    ...pipeline.fulfillmentOrder,
    status: "SUBMITTED",
    fulfillmentStatus: "SUBMITTED",
    supplierOrderId: submission.supplierOrderId,
    updatedAt: new Date().toISOString(),
  };

  fulfillInventoryReservation(pipelineId);

  return savePipeline(pipeline, {
    status: "FULFILLMENT_REQUESTED",
    fulfillmentOrder: updatedOrder,
    supplierOrderId: submission.supplierOrderId,
  });
}

/** Syncs tracking and advances to IN_TRANSIT when shipment is active. */
export function syncPipelineTracking(pipelineId: string): CustomerOrderPipelineRecord {
  const repository = getCustomerOrderPipelineRepository();
  const pipeline = repository.getPipelineById(pipelineId);

  if (!pipeline?.fulfillmentOrder?.supplierOrderId) {
    throw new Error(`Pipeline ${pipelineId} has no supplier order to track`);
  }

  const order = pipeline.fulfillmentOrder;
  const supplierOrderId = order.supplierOrderId;
  if (!supplierOrderId) {
    throw new Error(`Pipeline ${pipelineId} has no supplier order to track`);
  }

  const trackingNumber =
    order.trackingNumber ?? `TRK-${order.orderId.slice(-8).toUpperCase()}`;

  const sync = syncSandboxTracking(order, supplierOrderId, trackingNumber);

  const updatedOrder = applyTrackingSync(order, sync);
  const nextStatus: PipelineStatus =
    sync.deliveryStatus === "DELIVERED" ? "DELIVERED" : "IN_TRANSIT";

  let updated = savePipeline(pipeline, {
    status: nextStatus,
    fulfillmentOrder: updatedOrder,
    trackingNumber: sync.trackingNumber,
    carrier: sync.carrier,
  });

  if (nextStatus === "DELIVERED") {
    updated = completePipelineDelivery(updated.pipelineId);
  }

  return updated;
}

/** Marks pipeline delivered and updates ledger. */
export function completePipelineDelivery(pipelineId: string): CustomerOrderPipelineRecord {
  const repository = getCustomerOrderPipelineRepository();
  const pipeline = repository.getPipelineById(pipelineId);
  if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`);

  if (pipeline.status === "DELIVERED" && pipeline.ledgerDeliveryEventId) {
    return pipeline;
  }

  let order = pipeline.fulfillmentOrder;
  if (order && order.status !== "DELIVERED") {
    order = {
      ...order,
      status: "DELIVERED",
      fulfillmentStatus: "DELIVERED",
      updatedAt: new Date().toISOString(),
    };
  }

  const ledger = recordDeliveryLedgerEvents({ ...pipeline, fulfillmentOrder: order });

  return savePipeline(pipeline, {
    status: "DELIVERED",
    fulfillmentOrder: order,
    ledgerDeliveryEventId: ledger.deliveryEventId,
  });
}

/** Ingests a verified M103 payment into the full customer order pipeline. */
export async function ingestVerifiedPayment(
  paymentId: string,
): Promise<CustomerOrderPipelineRecord> {
  const repository = getCustomerOrderPipelineRepository();
  const existing = repository.getPipelineByPaymentId(paymentId);
  if (existing && existing.status !== "CHECKOUT_CREATED" && existing.status !== "PAYMENT_PENDING") {
    return existing;
  }

  const payment = getLivePaymentRepository().getPaymentById(paymentId);
  if (!payment) throw new Error(`Payment ${paymentId} not found`);
  if (payment.status !== "SUCCEEDED") {
    throw new Error(`Payment ${paymentId} is not SUCCEEDED`);
  }

  const correlationId =
    payment.stripeSessionId ?? payment.stripePaymentIntentId ?? payment.paymentId;

  let pipeline =
    existing ??
    repository.getPipelineByCorrelationId(correlationId) ??
    createPipelineRecord({
      workspaceId: payment.workspaceId,
      companyId: payment.companyId,
      storeId: payment.storeId,
      brandId: null,
      paymentId: payment.paymentId,
      revenueOrderId: null,
      correlationId,
      status: "PAYMENT_VERIFIED",
      customerEmail: payment.customerEmail ?? "customer@example.com",
      customerName: payment.metadata.customerName ?? "Customer",
      revenueCents: payment.amountCents,
      currency: payment.currency,
      fulfillmentOrder: null,
      inventoryReservationId: null,
      supplierOrderId: null,
      trackingNumber: null,
      carrier: null,
      approvalToken: null,
      approvedBy: null,
      approvedAt: null,
      ledgerDeliveryEventId: null,
      mock: payment.mock,
      metadata: payment.metadata,
    });

  if (!existing) {
    pipeline = repository.savePipeline(pipeline);
  } else {
    pipeline = savePipeline(pipeline, {
      paymentId: payment.paymentId,
      status: "PAYMENT_VERIFIED",
      revenueCents: payment.amountCents,
    });
  }

  if (payment.storeId && !pipeline.brandId) {
    const store = getRevenueLoopRepository().getStoreById(payment.storeId);
    if (store) {
      pipeline = savePipeline(pipeline, { brandId: store.brandId, storeId: store.storeId });
    }
  }

  const revenueOrder = payment.stripeSessionId
    ? getRevenueLoopRepository().getOrderByStripeSession(payment.stripeSessionId)
    : null;
  if (revenueOrder) {
    pipeline = savePipeline(pipeline, { revenueOrderId: revenueOrder.recordId });
  }

  pipeline = await createPipelineOrder(pipeline.pipelineId);
  pipeline = reservePipelineInventory(pipeline.pipelineId);

  return pipeline;
}

/** Runs sandbox fulfillment cycle: approve → submit → track → deliver. */
export async function runSandboxFulfillmentCycle(input: {
  pipelineId: string;
  approvalToken: string;
  approvedBy: string;
}): Promise<CustomerOrderPipelineRecord> {
  applyPipelineApproval({
    pipelineId: input.pipelineId,
    approvalToken: input.approvalToken,
    approvedBy: input.approvedBy,
    approvedAt: new Date().toISOString(),
  });

  await submitPipelineFulfillment(input.pipelineId);
  syncPipelineTracking(input.pipelineId);

  const pipeline = getCustomerOrderPipelineRepository().getPipelineById(input.pipelineId);
  if (pipeline?.status === "IN_TRANSIT") {
    return completePipelineDelivery(input.pipelineId);
  }

  return pipeline!;
}

export function getPipelineById(pipelineId: string): CustomerOrderPipelineRecord | null {
  return getCustomerOrderPipelineRepository().getPipelineById(pipelineId);
}

export function listPipelines(
  workspaceId: string,
  companyId?: string,
): CustomerOrderPipelineRecord[] {
  return getCustomerOrderPipelineRepository().listPipelines(workspaceId, companyId);
}

export function getPipelineStageIndex(status: PipelineStatus): number {
  return PIPELINE_STAGE_ORDER.indexOf(status);
}

export type { LivePaymentRecord };
