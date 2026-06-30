import { loadCjConfig } from "../../suppliers/cj-dropshipping/cj-config.js";
import { createCjOrderClient } from "../../suppliers/cj-dropshipping/orders/cj-order-client.js";
import { buildOrderPayload } from "../../suppliers/cj-dropshipping/orders/cj-order-mapper.js";
import { requireApprovedForSubmit } from "../../suppliers/cj-dropshipping/orders/cj-order-validation.js";
import { syncSandboxTracking } from "../../suppliers/cj-dropshipping/orders/cj-tracking-sync.js";
import type { Order } from "../../orders/index.js";
import type { CjOrderSubmissionResult } from "../../suppliers/cj-dropshipping/orders/cj-order-types.js";
import type { TrackingSyncResult } from "../../suppliers/cj-dropshipping/orders/cj-tracking-sync.js";

export class OrderSandboxSubmissionBlockedError extends Error {
  constructor(reason: string) {
    super(`Sandbox-only submission blocked: ${reason}`);
    this.name = "OrderSandboxSubmissionBlockedError";
  }
}

/** Submits an approved order in SANDBOX mode only — rejects LIVE and never charges. */
export async function submitApprovedOrderSandboxOnly(
  order: Order,
): Promise<{ submission: CjOrderSubmissionResult; tracking: TrackingSyncResult }> {
  requireApprovedForSubmit(order);

  const config = loadCjConfig();
  if (config.integrationMode === "LIVE" || order.integrationMode === "LIVE") {
    throw new OrderSandboxSubmissionBlockedError(
      "LIVE mode is disabled for UI submission. Sandbox only.",
    );
  }

  const sandboxConfig = {
    ...config,
    integrationMode: "SANDBOX" as const,
    apiKey: null,
    apiSecret: null,
  };

  const sandboxOrder: Order = {
    ...order,
    integrationMode: "SANDBOX",
  };

  const client = createCjOrderClient({ config: sandboxConfig });
  const payload = buildOrderPayload(sandboxOrder);
  if (!payload.sandbox) {
    throw new OrderSandboxSubmissionBlockedError("Order payload must remain sandbox.");
  }

  const submission = await client.submitOrder(sandboxOrder);
  if (submission.integrationMode !== "SANDBOX") {
    throw new OrderSandboxSubmissionBlockedError("Live CJ submission remains disabled.");
  }

  const tracking = syncSandboxTracking(
    sandboxOrder,
    submission.supplierOrderId,
    `TRK-${sandboxOrder.orderId.slice(-8).toUpperCase()}`,
  );

  return { submission, tracking };
}
