/**
 * G2-08 — Commerce orchestration lifecycle state machine.
 */

import {
  COMMERCE_ORCHESTRATION_LIFECYCLE,
  type CommerceLifecycleTransitionRequest,
  type CommerceLifecycleTransitionResult,
  type CommerceOrchestrationLifecyclePhase,
} from "../contracts/commerce-orchestration-types.js";

const ALLOWED_TRANSITIONS: Record<
  CommerceOrchestrationLifecyclePhase,
  CommerceOrchestrationLifecyclePhase[]
> = {
  discover: ["validate", "archive"],
  validate: ["prepare", "discover", "archive"],
  prepare: ["coordinate", "validate", "archive"],
  coordinate: ["synchronise", "prepare", "archive"],
  synchronise: ["monitor", "coordinate", "archive"],
  monitor: ["complete", "recover", "synchronise", "archive"],
  complete: ["archive", "monitor"],
  recover: ["coordinate", "monitor", "archive"],
  archive: [],
};

export function canTransitionCommerceOrchestrationLifecycle(
  currentPhase: CommerceOrchestrationLifecyclePhase,
  targetPhase: CommerceOrchestrationLifecyclePhase,
): boolean {
  return ALLOWED_TRANSITIONS[currentPhase]?.includes(targetPhase) ?? false;
}

export function transitionCommerceOrchestrationLifecycle(
  currentPhase: CommerceOrchestrationLifecyclePhase,
  request: CommerceLifecycleTransitionRequest,
): CommerceLifecycleTransitionResult {
  if (!request.pillowGovernance) {
    return deny(request, currentPhase, "Pillow governance required for commerce lifecycle transitions");
  }
  if (!request.brainRouted) {
    return deny(request, currentPhase, "Commerce orchestration must be Brain-routed — never bypass Brain");
  }
  if (!request.actorId?.trim() || !request.workspaceId?.trim()) {
    return deny(request, currentPhase, "actorId and workspaceId are required");
  }
  if (!canTransitionCommerceOrchestrationLifecycle(currentPhase, request.targetPhase)) {
    return deny(
      request,
      currentPhase,
      `Lifecycle transition ${currentPhase} → ${request.targetPhase} is not permitted`,
    );
  }

  return {
    profileId: request.profileId,
    orchestrationId: request.orchestrationId,
    previousPhase: currentPhase,
    currentPhase: request.targetPhase,
    allowed: true,
    reason: `Lifecycle transition ${currentPhase} → ${request.targetPhase} approved by orchestration framework`,
  };
}

function deny(
  request: CommerceLifecycleTransitionRequest,
  currentPhase: CommerceOrchestrationLifecyclePhase,
  reason: string,
): CommerceLifecycleTransitionResult {
  return {
    profileId: request.profileId,
    orchestrationId: request.orchestrationId,
    previousPhase: currentPhase,
    currentPhase,
    allowed: false,
    reason,
  };
}

export function listCommerceOrchestrationLifecyclePhases(): readonly CommerceOrchestrationLifecyclePhase[] {
  return COMMERCE_ORCHESTRATION_LIFECYCLE;
}
