/**
 * G2-09 — Commerce plugin lifecycle state machine.
 */

import {
  COMMERCE_PLUGIN_LIFECYCLE,
  type CommercePluginLifecyclePhase,
  type CommercePluginLifecycleTransitionRequest,
  type CommercePluginLifecycleTransitionResult,
} from "../contracts/commerce-plugin-integration-types.js";

const ALLOWED_TRANSITIONS: Record<
  CommercePluginLifecyclePhase,
  CommercePluginLifecyclePhase[]
> = {
  discover: ["validate", "retire"],
  validate: ["register", "discover", "retire"],
  register: ["load", "validate", "retire"],
  load: ["enable", "unload", "register", "retire"],
  enable: ["execute", "disable", "load", "retire"],
  execute: ["monitor", "disable", "enable", "retire"],
  monitor: ["execute", "disable", "deprecate", "retire"],
  disable: ["enable", "unload", "deprecate", "retire"],
  unload: ["load", "deprecate", "retire"],
  deprecate: ["retire", "unload"],
  retire: [],
};

export function canTransitionCommercePluginLifecycle(
  currentPhase: CommercePluginLifecyclePhase,
  targetPhase: CommercePluginLifecyclePhase,
): boolean {
  return ALLOWED_TRANSITIONS[currentPhase]?.includes(targetPhase) ?? false;
}

export function transitionCommercePluginLifecycle(
  currentPhase: CommercePluginLifecyclePhase,
  request: CommercePluginLifecycleTransitionRequest,
): CommercePluginLifecycleTransitionResult {
  if (!request.pillowGovernance) {
    return deny(request, currentPhase, "Pillow governance required for commerce plugin lifecycle");
  }
  if (!request.brainRouted) {
    return deny(
      request,
      currentPhase,
      "Commerce plugins must be Brain-routed — never bypass Brain",
    );
  }
  if (!request.actorId?.trim() || !request.workspaceId?.trim()) {
    return deny(request, currentPhase, "actorId and workspaceId are required");
  }
  if (!canTransitionCommercePluginLifecycle(currentPhase, request.targetPhase)) {
    return deny(
      request,
      currentPhase,
      `Lifecycle transition ${currentPhase} → ${request.targetPhase} is not permitted`,
    );
  }

  return {
    pluginId: request.pluginId,
    previousPhase: currentPhase,
    currentPhase: request.targetPhase,
    allowed: true,
    reason: `Commerce plugin lifecycle ${currentPhase} → ${request.targetPhase} approved`,
  };
}

function deny(
  request: CommercePluginLifecycleTransitionRequest,
  currentPhase: CommercePluginLifecyclePhase,
  reason: string,
): CommercePluginLifecycleTransitionResult {
  return {
    pluginId: request.pluginId,
    previousPhase: currentPhase,
    currentPhase,
    allowed: false,
    reason,
  };
}

export function listCommercePluginLifecyclePhases(): readonly CommercePluginLifecyclePhase[] {
  return COMMERCE_PLUGIN_LIFECYCLE;
}
