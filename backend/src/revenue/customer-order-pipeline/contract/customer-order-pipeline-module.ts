/**
 * Customer Order Pipeline module — full lifecycle from checkout to delivery.
 */

import type { CustomerOrderPipelineRecord } from "../models/customer-order-pipeline-record.js";
import {
  applyPipelineApproval,
  completePipelineDelivery,
  getPipelineById,
  ingestVerifiedPayment,
  listPipelines,
  runSandboxFulfillmentCycle,
  startCheckoutPipeline,
  submitPipelineFulfillment,
  syncPipelineTracking,
} from "../services/customer-order-pipeline-service.js";

export const CUSTOMER_ORDER_PIPELINE_MODULE_ID = "customer-order-pipeline" as const;
export type CustomerOrderPipelineModuleId = typeof CUSTOMER_ORDER_PIPELINE_MODULE_ID;
export const CUSTOMER_ORDER_PIPELINE_VERSION = "0.1.0" as const;

export type CustomerOrderPipelineCapability =
  | "customer-order-pipeline.checkout"
  | "customer-order-pipeline.payment"
  | "customer-order-pipeline.order"
  | "customer-order-pipeline.inventory"
  | "customer-order-pipeline.fulfillment"
  | "customer-order-pipeline.tracking"
  | "customer-order-pipeline.delivery"
  | "customer-order-pipeline.ledger";

export const CUSTOMER_ORDER_PIPELINE_CAPABILITIES: readonly CustomerOrderPipelineCapability[] = [
  "customer-order-pipeline.checkout",
  "customer-order-pipeline.payment",
  "customer-order-pipeline.order",
  "customer-order-pipeline.inventory",
  "customer-order-pipeline.fulfillment",
  "customer-order-pipeline.tracking",
  "customer-order-pipeline.delivery",
  "customer-order-pipeline.ledger",
] as const;

/** Orchestrates the complete customer order lifecycle. */
export class CustomerOrderPipelineModule {
  readonly moduleId = CUSTOMER_ORDER_PIPELINE_MODULE_ID;
  readonly version = CUSTOMER_ORDER_PIPELINE_VERSION;
  readonly capabilities = CUSTOMER_ORDER_PIPELINE_CAPABILITIES;

  startCheckout = startCheckoutPipeline;
  ingestPayment = ingestVerifiedPayment;
  approve = applyPipelineApproval;
  submitFulfillment = submitPipelineFulfillment;
  syncTracking = syncPipelineTracking;
  completeDelivery = completePipelineDelivery;
  runSandboxCycle = runSandboxFulfillmentCycle;
  getPipeline = getPipelineById;
  listPipelines = listPipelines;
}

export function createCustomerOrderPipelineModule(): CustomerOrderPipelineModule {
  return new CustomerOrderPipelineModule();
}

export const customerOrderPipelineModule = createCustomerOrderPipelineModule();

export type { CustomerOrderPipelineRecord };
