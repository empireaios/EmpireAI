/**
 * G2-03 — Supplier integration lifecycle (framework state machine — no live API calls).
 */

import {
  SUPPLIER_INTEGRATION_LIFECYCLE,
  type SupplierIntegrationLifecyclePhase,
  type SupplierLifecycleTransitionRequest,
  type SupplierLifecycleTransitionResult,
} from "../contracts/supplier-integration-types.js";

const ALLOWED_TRANSITIONS: Record<
  SupplierIntegrationLifecyclePhase,
  SupplierIntegrationLifecyclePhase[]
> = {
  discover: ["validate", "retire"],
  validate: ["register", "discover", "retire"],
  register: ["authenticate", "validate", "retire"],
  authenticate: ["connect", "register", "retire"],
  connect: ["synchronise_catalogue", "monitor_health", "disconnect", "retire"],
  synchronise_catalogue: ["synchronise_inventory", "connect", "monitor_health", "disconnect"],
  synchronise_inventory: ["submit_order", "synchronise_catalogue", "monitor_health", "disconnect"],
  submit_order: ["track_fulfilment", "synchronise_inventory", "monitor_health", "disconnect"],
  track_fulfilment: ["monitor_health", "submit_order", "disconnect"],
  monitor_health: ["synchronise_catalogue", "track_fulfilment", "disconnect", "retire"],
  disconnect: ["connect", "discover", "retire"],
  retire: [],
};

export function canTransitionSupplierLifecycle(
  currentPhase: SupplierIntegrationLifecyclePhase,
  targetPhase: SupplierIntegrationLifecyclePhase,
): boolean {
  return ALLOWED_TRANSITIONS[currentPhase]?.includes(targetPhase) ?? false;
}

export function transitionSupplierLifecycle(
  currentPhase: SupplierIntegrationLifecyclePhase,
  request: SupplierLifecycleTransitionRequest,
): SupplierLifecycleTransitionResult {
  if (!request.pillowGovernance) {
    return {
      supplierId: request.supplierId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: "Pillow governance required for supplier lifecycle transitions",
    };
  }

  if (!request.actorId?.trim() || !request.workspaceId?.trim()) {
    return {
      supplierId: request.supplierId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: "actorId and workspaceId are required for supplier lifecycle transitions",
    };
  }

  if (!canTransitionSupplierLifecycle(currentPhase, request.targetPhase)) {
    return {
      supplierId: request.supplierId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: `Lifecycle transition ${currentPhase} → ${request.targetPhase} is not permitted`,
    };
  }

  return {
    supplierId: request.supplierId,
    previousPhase: currentPhase,
    currentPhase: request.targetPhase,
    allowed: true,
    reason: `Lifecycle transition ${currentPhase} → ${request.targetPhase} approved by framework`,
  };
}

export function listSupplierIntegrationLifecyclePhases(): readonly SupplierIntegrationLifecyclePhase[] {
  return SUPPLIER_INTEGRATION_LIFECYCLE;
}
