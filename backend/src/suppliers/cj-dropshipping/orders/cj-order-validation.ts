import type { Order } from "../../../orders/index.js";
import { isOrderApproved } from "../../../orders/index.js";
import type { CjConfig } from "../cj-config.js";
import { isCjLiveApiEnabled } from "../cj-config.js";
import type { CjOrderApprovalInput, CjOrderValidationResult } from "./cj-order-types.js";

export class CjOrderValidationError extends Error {
  readonly issues: string[];

  constructor(message: string, issues: string[]) {
    super(message);
    this.name = "CjOrderValidationError";
    this.issues = issues;
  }
}

export class CjOrderApprovalRequiredError extends Error {
  constructor() {
    super("Order submission blocked: approval gate required (approvalToken, approvedBy, approvedAt, APPROVED=true).");
    this.name = "CjOrderApprovalRequiredError";
  }
}

export class CjOrderSubmissionDisabledError extends Error {
  constructor(reason: string) {
    super(`Order submission disabled: ${reason}`);
    this.name = "CjOrderSubmissionDisabledError";
  }
}

/** Validates order shape, items, address, and supplier readiness. Does not require approval. */
export function validateOrder(order: Order): CjOrderValidationResult {
  const issues: string[] = [];

  if (order.items.length === 0) {
    issues.push("Order must contain at least one item.");
  }

  for (const item of order.items) {
    if (item.quantity < 1) {
      issues.push(`Item ${item.itemId} quantity must be at least 1.`);
    }
    if (!item.supplierSku) {
      issues.push(`Item ${item.itemId} missing supplier SKU.`);
    }
  }

  const address = order.shippingAddress;
  if (!address.fullName.trim()) {
    issues.push("Shipping address requires fullName.");
  }
  if (!address.addressLine1.trim()) {
    issues.push("Shipping address requires addressLine1.");
  }
  if (!address.countryCode || address.countryCode.length !== 2) {
    issues.push("Shipping address requires a 2-letter countryCode.");
  }

  if (order.status === "CANCELLED" || order.status === "FAILED") {
    issues.push(`Order status ${order.status} cannot be fulfilled.`);
  }

  return {
    valid: issues.length === 0,
    issues,
    order,
  };
}

/** Validates approval gate fields required before submitOrder(). */
export function validateApprovalGate(
  order: Order,
  approval?: CjOrderApprovalInput | null,
): void {
  const gate = approval ?? order.approval;

  if (!gate) {
    throw new CjOrderApprovalRequiredError();
  }

  if (gate.approved !== true) {
    throw new CjOrderApprovalRequiredError();
  }

  if (!gate.approvalToken.trim()) {
    throw new CjOrderApprovalRequiredError();
  }

  if (!gate.approvedBy.trim()) {
    throw new CjOrderApprovalRequiredError();
  }

  if (!gate.approvedAt.trim()) {
    throw new CjOrderApprovalRequiredError();
  }

  if (!isOrderApproved({ approval: gate, status: "APPROVED" })) {
    throw new CjOrderApprovalRequiredError();
  }

  if (order.status !== "APPROVED") {
    throw new CjOrderApprovalRequiredError();
  }
}

/** Ensures live submission is only attempted when explicitly enabled and approved. */
export function assertSubmissionAllowed(config: CjConfig, order: Order): "SANDBOX" | "LIVE" {
  validateApprovalGate(order);

  const validation = validateOrder(order);
  if (!validation.valid) {
    throw new CjOrderValidationError("Order validation failed.", validation.issues);
  }

  if (isCjLiveApiEnabled(config)) {
    return "LIVE";
  }

  return "SANDBOX";
}

/** Returns true when submitOrder would proceed (approval + valid order). */
export function canSubmitOrder(config: CjConfig, order: Order): boolean {
  try {
    assertSubmissionAllowed(config, order);
    return true;
  } catch {
    return false;
  }
}

/** Blocks submission when approval is missing — Protect The Empire gate. */
export function requireApprovedForSubmit(order: Order): void {
  if (!isOrderApproved(order)) {
    throw new CjOrderApprovalRequiredError();
  }
  validateApprovalGate(order);
}
