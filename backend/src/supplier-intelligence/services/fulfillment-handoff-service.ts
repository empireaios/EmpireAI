import { randomUUID } from "node:crypto";

import type { FulfillmentHandoff } from "../models/fulfillment-handoff.js";
import type { SupplierProduct } from "../models/supplier-product.js";
import { getConnectorRuntimeState } from "../../orchestration/reality-integration/index.js";
import { loadLiveCjFulfillmentEnv } from "../../execution/live-cj-fulfillment/config/live-cj-fulfillment-env.js";

/** SUP-014 — Prepare fulfillment handoff (no live execution without credentials). */
export function prepareFulfillmentHandoff(
  workspaceId: string,
  companyId: string,
  product: SupplierProduct,
  input: { customerOrderId?: string; pipelineId?: string } = {},
): FulfillmentHandoff {
  const blockers: string[] = [];
  let liveExecutionAllowed = false;

  if (product.providerId === "cj-dropshipping") {
    const runtime = getConnectorRuntimeState(workspaceId, "cj-dropshipping");
    if (!runtime?.credentialsRef) blockers.push("CJ credentials not in vault");
    try {
      const env = loadLiveCjFulfillmentEnv();
      if (!env.LIVE_CJ_FULFILLMENT_ENABLED) blockers.push("LIVE_CJ_FULFILLMENT_ENABLED=false");
      else liveExecutionAllowed = Boolean(runtime?.credentialsRef);
    } catch {
      blockers.push("Live CJ fulfillment env not configured");
    }
    blockers.push("Founder approval required for supplier order submit");
  } else {
    blockers.push(`Live fulfillment adapter for ${product.providerId} not yet connected`);
  }

  const stage = blockers.length > 0 ? "SUPPLIER_ORDER_PREPARED" : "FOUNDER_APPROVAL_REQUIRED";

  return {
    handoffId: randomUUID(),
    workspaceId,
    companyId,
    customerOrderId: input.customerOrderId,
    pipelineId: input.pipelineId,
    providerId: product.providerId,
    supplierProductId: product.supplierProductId,
    stage,
    liveExecutionAllowed,
    blockers,
    ofdMilestone: "FIRST_SUPPLIER_FULFILLMENT_PREPARED",
    preparedAt: new Date().toISOString(),
  };
}

export function describeFulfillmentChain(handoff: FulfillmentHandoff): string[] {
  return [
    "1. Customer order received (customer-order-pipeline)",
    "2. Supplier order prepared (supplier-intelligence handoff)",
    handoff.liveExecutionAllowed
      ? "3. Founder approval → live-cj-fulfillment submit"
      : "3. Blocked — credentials/approval required",
    "4. Tracking sync → OFD milestone",
  ];
}
