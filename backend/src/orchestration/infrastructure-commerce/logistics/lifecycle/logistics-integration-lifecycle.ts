/**
 * G2-06 — Logistics shipment lifecycle (framework state machine — no live carrier calls).
 */

import {
  LOGISTICS_SHIPMENT_LIFECYCLE,
  type LogisticsLifecycleTransitionRequest,
  type LogisticsLifecycleTransitionResult,
  type LogisticsShipmentLifecyclePhase,
} from "../contracts/logistics-integration-types.js";

const ALLOWED_TRANSITIONS: Record<
  LogisticsShipmentLifecyclePhase,
  LogisticsShipmentLifecyclePhase[]
> = {
  discover: ["validate", "archive_shipment"],
  validate: ["register", "discover", "archive_shipment"],
  register: ["authenticate", "validate", "archive_shipment"],
  authenticate: ["create_shipment", "register", "archive_shipment"],
  create_shipment: ["generate_tracking", "authenticate", "archive_shipment"],
  generate_tracking: ["track_shipment", "create_shipment", "archive_shipment"],
  track_shipment: ["update_delivery_status", "generate_tracking", "archive_shipment"],
  update_delivery_status: ["process_return", "track_shipment", "archive_shipment"],
  process_return: ["archive_shipment", "update_delivery_status"],
  archive_shipment: [],
};

export function canTransitionLogisticsLifecycle(
  currentPhase: LogisticsShipmentLifecyclePhase,
  targetPhase: LogisticsShipmentLifecyclePhase,
): boolean {
  return ALLOWED_TRANSITIONS[currentPhase]?.includes(targetPhase) ?? false;
}

export function transitionLogisticsLifecycle(
  currentPhase: LogisticsShipmentLifecyclePhase,
  request: LogisticsLifecycleTransitionRequest,
): LogisticsLifecycleTransitionResult {
  if (!request.pillowGovernance) {
    return {
      providerId: request.providerId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: "Pillow governance required for logistics lifecycle transitions",
    };
  }

  if (!request.actorId?.trim() || !request.workspaceId?.trim()) {
    return {
      providerId: request.providerId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: "actorId and workspaceId are required for logistics lifecycle transitions",
    };
  }

  if (!canTransitionLogisticsLifecycle(currentPhase, request.targetPhase)) {
    return {
      providerId: request.providerId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: `Lifecycle transition ${currentPhase} → ${request.targetPhase} is not permitted`,
    };
  }

  return {
    providerId: request.providerId,
    previousPhase: currentPhase,
    currentPhase: request.targetPhase,
    allowed: true,
    reason: `Lifecycle transition ${currentPhase} → ${request.targetPhase} approved by framework`,
  };
}

export function listLogisticsShipmentLifecyclePhases(): readonly LogisticsShipmentLifecyclePhase[] {
  return LOGISTICS_SHIPMENT_LIFECYCLE;
}
