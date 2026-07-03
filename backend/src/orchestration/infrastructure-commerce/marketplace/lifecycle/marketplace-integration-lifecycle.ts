/**
 * G2-02 — Marketplace integration lifecycle (framework state machine — no live API calls).
 */

import {
  MARKETPLACE_INTEGRATION_LIFECYCLE,
  type MarketplaceIntegrationLifecyclePhase,
  type MarketplaceLifecycleTransitionRequest,
  type MarketplaceLifecycleTransitionResult,
} from "../contracts/marketplace-integration-types.js";

const LIFECYCLE_INDEX = new Map<MarketplaceIntegrationLifecyclePhase, number>(
  MARKETPLACE_INTEGRATION_LIFECYCLE.map((phase, index) => [phase, index]),
);

const ALLOWED_TRANSITIONS: Record<
  MarketplaceIntegrationLifecyclePhase,
  MarketplaceIntegrationLifecyclePhase[]
> = {
  discover: ["validate", "retire"],
  validate: ["register", "discover", "retire"],
  register: ["authenticate", "validate", "retire"],
  authenticate: ["connect", "register", "retire"],
  connect: ["synchronise", "monitor", "disconnect", "retire"],
  synchronise: ["monitor", "connect", "disconnect"],
  monitor: ["synchronise", "disconnect", "retire"],
  disconnect: ["connect", "retire", "discover"],
  retire: [],
};

export function getMarketplaceLifecyclePhaseIndex(
  phase: MarketplaceIntegrationLifecyclePhase,
): number {
  return LIFECYCLE_INDEX.get(phase) ?? -1;
}

export function canTransitionMarketplaceLifecycle(
  currentPhase: MarketplaceIntegrationLifecyclePhase,
  targetPhase: MarketplaceIntegrationLifecyclePhase,
): boolean {
  return ALLOWED_TRANSITIONS[currentPhase]?.includes(targetPhase) ?? false;
}

export function transitionMarketplaceLifecycle(
  currentPhase: MarketplaceIntegrationLifecyclePhase,
  request: MarketplaceLifecycleTransitionRequest,
): MarketplaceLifecycleTransitionResult {
  if (!request.pillowGovernance) {
    return {
      marketplaceId: request.marketplaceId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: "Pillow governance required for marketplace lifecycle transitions",
    };
  }

  if (!request.actorId?.trim() || !request.workspaceId?.trim()) {
    return {
      marketplaceId: request.marketplaceId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: "actorId and workspaceId are required for marketplace lifecycle transitions",
    };
  }

  if (!canTransitionMarketplaceLifecycle(currentPhase, request.targetPhase)) {
    return {
      marketplaceId: request.marketplaceId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: `Lifecycle transition ${currentPhase} → ${request.targetPhase} is not permitted`,
    };
  }

  return {
    marketplaceId: request.marketplaceId,
    previousPhase: currentPhase,
    currentPhase: request.targetPhase,
    allowed: true,
    reason: `Lifecycle transition ${currentPhase} → ${request.targetPhase} approved by framework`,
  };
}

export function listMarketplaceIntegrationLifecyclePhases(): readonly MarketplaceIntegrationLifecyclePhase[] {
  return MARKETPLACE_INTEGRATION_LIFECYCLE;
}
