/**
 * G8-08 — Isolation filter service (credential, auth, health, readiness).
 */

import type { IsolationActorContext, VisibilityScope } from "../contracts/isolation-types.js";
import { resolveAccountHolderProfile } from "../registry/isolation-policy-resolver.js";

function scopeAllowsViewer(viewerScope: VisibilityScope, objectScope: VisibilityScope): boolean {
  if (viewerScope === "grand_king_visible") return true;
  if (viewerScope === "system_internal") return true;
  if (viewerScope === "pillow_governed" && objectScope === "pillow_governed") return true;
  if (viewerScope === objectScope) return true;
  if (viewerScope === "operator_visible" && ["workspace_visible", "company_visible", "brand_visible"].includes(objectScope)) {
    return true;
  }
  if (viewerScope === "workspace_visible" && objectScope === "workspace_visible") return true;
  return false;
}

export function filterByIsolationBoundary<T extends Record<string, unknown>>(
  items: T[],
  actor: IsolationActorContext,
  extract: (item: T) => { workspaceId?: string; accountHolderId?: string; providerId?: string },
): T[] {
  const holderTypeId = actor.accountHolderTypeId ?? actor.accountHolderId;
  const profile = resolveAccountHolderProfile(holderTypeId, { workspaceId: actor.workspaceId });
  const viewerScope = actor.visibilityScope ?? profile?.defaultVisibilityScope ?? "pillow_governed";

  return items.filter((item) => {
    const meta = extract(item);
    if (meta.workspaceId && meta.workspaceId !== actor.workspaceId) return false;
    if (viewerScope === "grand_king_visible") return true;
    if (viewerScope === "private_to_account_holder") {
      return !meta.accountHolderId || meta.accountHolderId === actor.accountHolderId;
    }
    if (meta.accountHolderId && meta.accountHolderId !== actor.accountHolderId && viewerScope !== "operator_visible") {
      return false;
    }
    return true;
  });
}

export function filterIsolationPayload(payload: unknown, viewerScope: VisibilityScope): unknown {
  if (!payload || typeof payload !== "object") return payload;
  if (Array.isArray(payload)) {
    return payload.map((entry) => filterIsolationPayload(entry, viewerScope));
  }

  const record = payload as Record<string, unknown>;
  const objectScope = (record.visibilityScope as VisibilityScope | undefined) ?? "pillow_governed";
  if (!scopeAllowsViewer(viewerScope, objectScope) && objectScope === "private_to_account_holder") {
    return { isolationFiltered: true, reason: "Object outside visibility scope" };
  }

  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key === "vaultPath" || key === "credentialReference") {
      filtered[key] = "[REDACTED]";
      continue;
    }
    if (Array.isArray(value)) {
      filtered[key] = value.map((entry) => filterIsolationPayload(entry, viewerScope));
    } else if (value && typeof value === "object") {
      filtered[key] = filterIsolationPayload(value, viewerScope);
    } else {
      filtered[key] = value;
    }
  }
  return filtered;
}

export function filterCredentialReferences<T extends { workspaceId: string; accountHolderId: string; providerId: string }>(
  refs: T[],
  actor: IsolationActorContext,
): T[] {
  return filterByIsolationBoundary(refs, actor, (r) => r);
}

export function filterAuthorizationRecords<
  T extends { workspaceId: string; accountHolderId: string; providerId: string },
>(records: T[], actor: IsolationActorContext): T[] {
  return filterByIsolationBoundary(records, actor, (r) => r);
}

export function filterHealthRecords<
  T extends { workspaceId: string; providerId: string; accountHolderId?: string },
>(records: T[], actor: IsolationActorContext): T[] {
  return filterByIsolationBoundary(records, actor, (r) => r);
}

export function filterReadinessResults<
  T extends { workspaceId: string; accountHolderId?: string; providerId?: string },
>(results: T[], actor: IsolationActorContext): T[] {
  return filterByIsolationBoundary(results, actor, (r) => r);
}
