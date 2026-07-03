/**
 * G8-02 — Authorization flow state machine.
 */

import {
  type AuthorizationFlowState,
  isValidAuthorizationTransition,
} from "../contracts/authorization-framework-types.js";

export function transitionAuthorizationState(
  current: AuthorizationFlowState,
  next: AuthorizationFlowState,
): { ok: true; state: AuthorizationFlowState } | { ok: false; reason: string } {
  if (!isValidAuthorizationTransition(current, next)) {
    return { ok: false, reason: `Invalid authorization transition: ${current} -> ${next}` };
  }
  return { ok: true, state: next };
}

export function resolveNextStateForOAuthStart(authorizationType: string): AuthorizationFlowState {
  if (authorizationType === "api_key" || authorizationType === "secret_key" || authorizationType === "webhook_secret") {
    return "awaiting_credentials";
  }
  return "awaiting_redirect";
}

export function resolveNextStateAfterCallback(): AuthorizationFlowState {
  return "validating";
}

export function resolveNextStateAfterCredentials(): AuthorizationFlowState {
  return "validating";
}

export function resolveFinalStateFromValidation(input: {
  scopesValid: boolean;
  permissionsValid: boolean;
  partial?: boolean;
}): AuthorizationFlowState {
  if (input.scopesValid && input.permissionsValid) return "authorized";
  if (input.partial || input.scopesValid || input.permissionsValid) return "partially_authorized";
  return "failed";
}
