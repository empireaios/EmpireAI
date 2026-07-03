/**
 * G8-07 — Token lifecycle notification contracts (no hardcoded notification provider).
 */

import type { TokenLifecycleState } from "./token-lifecycle-types.js";

export type TokenLifecycleNotificationKind =
  | "token_expiring_soon"
  | "token_expired"
  | "reauthorization_required"
  | "refresh_failed"
  | "permission_revoked"
  | "provider_reconnect_needed";

export type TokenLifecycleNotificationContract = {
  notificationId: string;
  kind: TokenLifecycleNotificationKind;
  providerId: string;
  workspaceId: string;
  lifecycleState: TokenLifecycleState;
  message: string;
  requiredAction: string;
  severity: "info" | "warning" | "critical";
  correlationId: string;
  pillowGovernanceState: "pillow-governed";
};

export function buildTokenLifecycleNotification(input: {
  providerId: string;
  workspaceId: string;
  lifecycleState: TokenLifecycleState;
  requiredAction: string;
  correlationId: string;
}): TokenLifecycleNotificationContract | null {
  let kind: TokenLifecycleNotificationKind | null = null;
  let severity: TokenLifecycleNotificationContract["severity"] = "info";

  switch (input.lifecycleState) {
    case "expiring_soon":
      kind = "token_expiring_soon";
      severity = "warning";
      break;
    case "expired":
      kind = "token_expired";
      severity = "critical";
      break;
    case "reauthorization_pending":
    case "refresh_required":
      kind = "reauthorization_required";
      severity = "warning";
      break;
    case "refresh_failed":
      kind = "refresh_failed";
      severity = "critical";
      break;
    case "revoked":
      kind = "permission_revoked";
      severity = "critical";
      break;
    case "reconnect_required":
      kind = "provider_reconnect_needed";
      severity = "critical";
      break;
    default:
      return null;
  }

  return {
    notificationId: `notification:${input.providerId}:${input.lifecycleState}:${input.correlationId}`,
    kind,
    providerId: input.providerId,
    workspaceId: input.workspaceId,
    lifecycleState: input.lifecycleState,
    message: `Token lifecycle ${input.lifecycleState} for ${input.providerId}`,
    requiredAction: input.requiredAction,
    severity,
    correlationId: input.correlationId,
    pillowGovernanceState: "pillow-governed",
  };
}
