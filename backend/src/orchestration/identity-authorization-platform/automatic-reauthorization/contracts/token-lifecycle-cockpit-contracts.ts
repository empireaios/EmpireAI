/**
 * G8-07 — Cockpit token lifecycle backend contracts.
 */

import {
  getReauthorizationStatus,
  getTokenExpiryWarnings,
  getTokenLifecycleDetail,
  getTokenLifecycleSummary,
  listReauthorizationRequired,
} from "../services/reauthorization-service.js";

export type CockpitTokenLifecycleView = {
  summary: ReturnType<typeof getTokenLifecycleSummary>;
  expiringSoon: Array<{ providerId: string; expiry: string | null; scheduledAction: string }>;
  expired: Array<{ providerId: string; expiry: string | null; scheduledAction: string }>;
  reconnectRequired: Array<{ providerId: string; lifecycleState: string; scheduledAction: string }>;
  reauthorizationActions: string[];
  lifecycleStatuses: Array<{ providerId: string; lifecycleState: string; requiredAction: string }>;
  requiredAccountHolderAction: string;
  pillowGovernanceState: "pillow-governed";
};

const DEFAULT_ACTOR = {
  actorId: "grand-king",
  ownerId: "grand-king",
  accountHolderId: "grand-king",
  pillowGovernance: true as const,
};

export function buildCockpitTokenLifecycleView(workspaceId: string): CockpitTokenLifecycleView {
  const summary = getTokenLifecycleSummary({ ...DEFAULT_ACTOR, workspaceId });
  const required = listReauthorizationRequired({ ...DEFAULT_ACTOR, workspaceId });
  const warnings = getTokenExpiryWarnings({ ...DEFAULT_ACTOR, workspaceId });

  const expiringSoon = warnings.warnings.map((w) => ({
    providerId: w.providerId,
    expiry: w.expiry,
    scheduledAction: w.scheduledAction,
  }));

  const expired = required.required
    .filter((r) => r.lifecycleState === "expired")
    .map((r) => ({
      providerId: r.providerId,
      expiry: r.expiry,
      scheduledAction: r.scheduledAction,
    }));

  const reconnectRequired = required.required
    .filter((r) => ["reconnect_required", "expired", "refresh_failed", "revoked"].includes(r.lifecycleState))
    .map((r) => ({
      providerId: r.providerId,
      lifecycleState: r.lifecycleState,
      scheduledAction: r.scheduledAction,
    }));

  const lifecycleStatuses = required.required.map((r) => {
    const detail = getTokenLifecycleDetail({ ...DEFAULT_ACTOR, workspaceId, providerId: r.providerId });
    return {
      providerId: r.providerId,
      lifecycleState: r.lifecycleState,
      requiredAction: detail.found ? detail.detail.requiredAction : r.scheduledAction,
    };
  });

  const pending = getReauthorizationStatus({ ...DEFAULT_ACTOR, workspaceId });
  const reauthorizationActions =
    "requests" in pending && pending.requests
      ? pending.requests.map((r) => r.requiredAction)
      : [];

  return {
    summary,
    expiringSoon,
    expired,
    reconnectRequired,
    reauthorizationActions,
    lifecycleStatuses,
    requiredAccountHolderAction: reconnectRequired[0]?.scheduledAction ?? warnings.warnings[0]?.scheduledAction ?? "none",
    pillowGovernanceState: "pillow-governed",
  };
}
