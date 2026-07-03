/**
 * G2-04 — Storefront integration lifecycle (framework state machine — no live deployment).
 */

import {
  STOREFRONT_INTEGRATION_LIFECYCLE,
  type StorefrontIntegrationLifecyclePhase,
  type StorefrontLifecycleTransitionRequest,
  type StorefrontLifecycleTransitionResult,
} from "../contracts/storefront-integration-types.js";

const ALLOWED_TRANSITIONS: Record<
  StorefrontIntegrationLifecyclePhase,
  StorefrontIntegrationLifecyclePhase[]
> = {
  discover: ["validate", "retire"],
  validate: ["register", "discover", "retire"],
  register: ["provision", "validate", "retire"],
  provision: ["configure", "register", "retire"],
  configure: ["publish", "provision", "retire"],
  publish: ["synchronise", "monitor", "suspend", "retire"],
  synchronise: ["monitor", "publish", "suspend"],
  monitor: ["synchronise", "suspend", "archive", "retire"],
  suspend: ["monitor", "archive", "configure", "retire"],
  archive: ["retire", "discover"],
  retire: [],
};

export function canTransitionStorefrontLifecycle(
  currentPhase: StorefrontIntegrationLifecyclePhase,
  targetPhase: StorefrontIntegrationLifecyclePhase,
): boolean {
  return ALLOWED_TRANSITIONS[currentPhase]?.includes(targetPhase) ?? false;
}

export function transitionStorefrontLifecycle(
  currentPhase: StorefrontIntegrationLifecyclePhase,
  request: StorefrontLifecycleTransitionRequest,
): StorefrontLifecycleTransitionResult {
  if (!request.pillowGovernance) {
    return {
      storefrontId: request.storefrontId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: "Pillow governance required for storefront lifecycle transitions",
    };
  }

  if (!request.actorId?.trim() || !request.workspaceId?.trim()) {
    return {
      storefrontId: request.storefrontId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: "actorId and workspaceId are required for storefront lifecycle transitions",
    };
  }

  if (!canTransitionStorefrontLifecycle(currentPhase, request.targetPhase)) {
    return {
      storefrontId: request.storefrontId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: `Lifecycle transition ${currentPhase} → ${request.targetPhase} is not permitted`,
    };
  }

  return {
    storefrontId: request.storefrontId,
    previousPhase: currentPhase,
    currentPhase: request.targetPhase,
    allowed: true,
    reason: `Lifecycle transition ${currentPhase} → ${request.targetPhase} approved by framework`,
  };
}

export function listStorefrontIntegrationLifecyclePhases(): readonly StorefrontIntegrationLifecyclePhase[] {
  return STOREFRONT_INTEGRATION_LIFECYCLE;
}
