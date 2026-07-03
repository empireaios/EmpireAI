/**
 * G8-04 — Connection health notification contracts (no UI).
 */

import type { ConnectionHealthState, HealthCheckSeverity } from "./connection-health-types.js";

export type ConnectionHealthNotificationKind =
  | "expired_credential"
  | "token_expiring_soon"
  | "missing_permission"
  | "provider_degraded"
  | "webhook_failing"
  | "connection_revoked";

export type ConnectionHealthNotificationContract = {
  notificationId: string;
  kind: ConnectionHealthNotificationKind;
  providerId: string;
  connectionId: string;
  workspaceId: string;
  severity: HealthCheckSeverity;
  status: ConnectionHealthState;
  message: string;
  evidenceRefs: string[];
  deliveryDeferred: true;
  futureMission: "G8-05";
  createdAt: string;
};

export function buildConnectionHealthNotification(input: {
  kind: ConnectionHealthNotificationKind;
  providerId: string;
  connectionId: string;
  workspaceId: string;
  severity: HealthCheckSeverity;
  status: ConnectionHealthState;
  message: string;
  evidenceRefs?: string[];
}): ConnectionHealthNotificationContract {
  return {
    notificationId: `health-notify:${input.providerId}:${input.kind}`,
    kind: input.kind,
    providerId: input.providerId,
    connectionId: input.connectionId,
    workspaceId: input.workspaceId,
    severity: input.severity,
    status: input.status,
    message: input.message,
    evidenceRefs: input.evidenceRefs ?? [],
    deliveryDeferred: true,
    futureMission: "G8-05",
    createdAt: new Date().toISOString(),
  };
}
