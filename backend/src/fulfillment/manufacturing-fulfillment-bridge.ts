import type { CompanyManufacturingRunCreateInput } from "../execution/autonomous-company-manufacturing-loop/index.js";
import type { Order, OrderApproval } from "../orders/index.js";
import { createCjOrderClient } from "../suppliers/cj-dropshipping/orders/cj-order-client.js";
import { validateOrder as validateCjOrder } from "../suppliers/cj-dropshipping/orders/cj-order-validation.js";
import { getCjSandboxProducts } from "../suppliers/cj-dropshipping/cj-sandbox-fixtures.js";
import { loadCjConfig } from "../suppliers/cj-dropshipping/cj-config.js";

export type ManufacturingFulfillmentReadiness = {
  ready: boolean;
  issues: string[];
  integrationMode: "SANDBOX" | "LIVE";
  submissionAllowed: false;
};

export type ManufacturingFulfillmentPreparation = {
  runId: string;
  storeId: string;
  brandId: string;
  workspaceId: string;
  fulfillmentReadiness: ManufacturingFulfillmentReadiness;
  estimatedCost: number;
  estimatedDeliveryDaysMin: number;
  estimatedDeliveryDaysMax: number;
  currency: string;
  supplierValidation: {
    valid: boolean;
    issues: string[];
  };
  draftOrder: Order;
  /** Always false — M072 may prepare but never auto-submit live orders. */
  autoSubmitEnabled: false;
};

export type PrepareManufacturingFulfillmentInput = {
  run: CompanyManufacturingRunCreateInput;
  workspaceId: string;
  runId?: string;
  connectorId?: string;
  shippingAddress?: Order["shippingAddress"];
};

const DEFAULT_SHIPPING_ADDRESS: Order["shippingAddress"] = {
  fullName: "EmpireAI Sandbox Customer",
  addressLine1: "123 Manufacturing Loop Way",
  city: "Austin",
  state: "TX",
  postalCode: "78701",
  countryCode: "US",
  phone: "+1-555-0100",
};

function buildDraftOrderFromRun(input: PrepareManufacturingFulfillmentInput): Order {
  const config = loadCjConfig();
  const sandboxProduct = getCjSandboxProducts()[0];
  if (!sandboxProduct) {
    throw new Error("CJ sandbox catalog is empty — cannot prepare fulfillment.");
  }
  const variant = sandboxProduct.variants?.[0];
  const now = new Date().toISOString();
  const runId = input.runId ?? `mfg-${input.run.productId}`;

  return {
    orderId: `ord-${runId}`,
    workspaceId: input.workspaceId,
    storeId: input.run.storeId,
    brandId: input.run.brandId,
    supplierPlatform: "CJ_DROPSHIPPING",
    connectorId: input.connectorId ?? "cj-dropshipping-default",
    status: "READY_FOR_APPROVAL",
    fulfillmentStatus: "PREPARING",
    items: [
      {
        itemId: `${input.run.productId}-line-1`,
        supplierSku: sandboxProduct.productSku ?? sandboxProduct.pid,
        supplierProductId: variant?.vid ?? sandboxProduct.pid,
        title: sandboxProduct.productNameEn ?? sandboxProduct.productName,
        quantity: 1,
        unitCost: sandboxProduct.sellPrice ?? 0,
        currency: "USD",
      },
    ],
    shippingAddress: input.shippingAddress ?? DEFAULT_SHIPPING_ADDRESS,
    estimatedCost: 0,
    estimatedDeliveryDaysMin: 0,
    estimatedDeliveryDaysMax: 0,
    currency: "USD",
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

/**
 * Prepares CJ fulfillment from an M072 manufacturing run without submitting live orders.
 * Protect The Empire: preparation only — submission requires separate approval gate.
 */
export async function prepareManufacturingFulfillment(
  input: PrepareManufacturingFulfillmentInput,
): Promise<ManufacturingFulfillmentPreparation> {
  const client = createCjOrderClient();
  let draftOrder = buildDraftOrderFromRun(input);

  const estimate = await client.estimateFulfillment(draftOrder);
  draftOrder = {
    ...draftOrder,
    estimatedCost: estimate.estimatedCost,
    estimatedDeliveryDaysMin: estimate.estimatedDeliveryDaysMin,
    estimatedDeliveryDaysMax: estimate.estimatedDeliveryDaysMax,
    currency: estimate.currency,
    updatedAt: new Date().toISOString(),
  };

  const supplierValidation = validateCjOrder(draftOrder);
  const readinessIssues = [...estimate.issues, ...supplierValidation.issues];

  if (input.run.runStatus !== "COMPLETE") {
    readinessIssues.push(`Manufacturing run status ${input.run.runStatus} is not COMPLETE.`);
  }

  const runId = input.runId ?? `mfg-${input.run.productId}`;

  return {
    runId,
    storeId: input.run.storeId,
    brandId: input.run.brandId,
    workspaceId: input.workspaceId,
    fulfillmentReadiness: {
      ready: readinessIssues.length === 0 && supplierValidation.valid && estimate.valid,
      issues: readinessIssues,
      integrationMode: draftOrder.integrationMode,
      submissionAllowed: false,
    },
    estimatedCost: estimate.estimatedCost,
    estimatedDeliveryDaysMin: estimate.estimatedDeliveryDaysMin,
    estimatedDeliveryDaysMax: estimate.estimatedDeliveryDaysMax,
    currency: estimate.currency,
    supplierValidation: {
      valid: supplierValidation.valid,
      issues: supplierValidation.issues,
    },
    draftOrder,
    autoSubmitEnabled: false,
  };
}

/** Applies approval to a draft order — does not submit. */
export function applyOrderApproval(
  order: Order,
  approval: OrderApproval,
): Order {
  return {
    ...order,
    approval,
    status: approval.approved ? "APPROVED" : order.status,
    updatedAt: new Date().toISOString(),
  };
}
