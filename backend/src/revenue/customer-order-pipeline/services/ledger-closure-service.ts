import { getDatabase } from "../../../brain/database.js";
import { financialLedger } from "../../../finance/ledger.js";
import type { CustomerOrderPipelineRecord } from "../models/customer-order-pipeline-record.js";
import { loadCustomerOrderPipelineEnv } from "../config/customer-order-pipeline-env.js";

/** Records delivery closure events in the financial ledger. */
export function recordDeliveryLedgerEvents(
  pipeline: CustomerOrderPipelineRecord,
): { deliveryEventId: string; shippingEventId: string | null } {
  const config = loadCustomerOrderPipelineEnv();
  const db = getDatabase();
  const correlationId = pipeline.correlationId;

  const existingDelivery = db
    .prepare(
      `SELECT id FROM financial_ledger_events
       WHERE correlation_id = @cid AND source = 'customer_order_pipeline' AND event_type = 'sale'
       LIMIT 1`,
    )
    .get({ cid: `${correlationId}:delivered` });

  if (existingDelivery) {
    return {
      deliveryEventId: String((existingDelivery as { id: string }).id),
      shippingEventId: null,
    };
  }

  const deliveryEvent = financialLedger.append({
    workspaceId: pipeline.workspaceId,
    companyId: pipeline.companyId,
    eventType: "manual_adjustment",
    amountCents: 0,
    currency: pipeline.currency,
    direction: "credit",
    correlationId: `${correlationId}:delivered`,
    source: "customer_order_pipeline",
    description: `Order ${pipeline.pipelineId} delivered — revenue recognized at payment, delivery confirmed`,
    metadata: {
      pipelineId: pipeline.pipelineId,
      supplierOrderId: pipeline.supplierOrderId,
      trackingNumber: pipeline.trackingNumber,
    },
  });

  let shippingEventId: string | null = null;
  const shippingCents = config.CUSTOMER_ORDER_PIPELINE_SHIPPING_ESTIMATE_CENTS;
  const existingShipping = db
    .prepare(
      `SELECT 1 FROM financial_ledger_events
       WHERE correlation_id = @cid AND event_type = 'shipping' LIMIT 1`,
    )
    .get({ cid: correlationId });

  if (!existingShipping && shippingCents > 0) {
    const shippingEvent = financialLedger.append({
      workspaceId: pipeline.workspaceId,
      companyId: pipeline.companyId,
      eventType: "shipping",
      amountCents: shippingCents,
      currency: pipeline.currency,
      direction: "debit",
      correlationId: `${correlationId}:shipping`,
      source: "customer_order_pipeline",
      description: `Shipping cost for delivered order ${pipeline.pipelineId}`,
      metadata: { pipelineId: pipeline.pipelineId },
    });
    shippingEventId = shippingEvent.id;
  }

  return { deliveryEventId: deliveryEvent.id, shippingEventId };
}
