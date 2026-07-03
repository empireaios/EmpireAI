/**
 * G8-08 — Cockpit isolation visibility contracts.
 */

import type { AuthorizationCentreView } from "../../authorization-centre/contracts/authorization-centre-types.js";
import type { IsolationActorContext } from "../contracts/isolation-types.js";
import { enforceIsolationBoundary } from "../services/isolation-enforcement-service.js";
import { filterByIsolationBoundary } from "../services/isolation-filter-service.js";
import { resolveAccountHolderProfile } from "../registry/isolation-policy-resolver.js";

export type CockpitIsolationView = {
  workspaceId: string;
  viewerScope: string;
  visibleProviderCount: number;
  hiddenProviderCount: number;
  visibleAccountHolderGroups: number;
  isolationEnforced: true;
  requiredAccountHolderAction: string;
  governanceState: "pillow-governed";
};

export function applyCockpitIsolationFilter(input: {
  view: AuthorizationCentreView;
  actor: IsolationActorContext;
}): AuthorizationCentreView {
  const check = enforceIsolationBoundary({
    actor: input.actor,
    targetWorkspaceId: input.view.workspaceId,
    operation: "cockpit",
  });
  if (!check.allowed) {
    return {
      ...input.view,
      providerCards: [],
      providerMatrix: [],
      attentionItems: [],
      accountHolderGroups: [],
      grandKingConnections: [],
      futureCustomerConnections: [],
      recentActivity: [],
      pluginWidgets: [],
      overview: {
        ...input.view.overview,
        connectedProviders: 0,
        disconnectedProviders: 0,
      },
    };
  }

  const holderTypeId = input.actor.accountHolderTypeId ?? input.actor.accountHolderId;
  const profile = resolveAccountHolderProfile(holderTypeId, { workspaceId: input.actor.workspaceId });
  const viewerScope = input.actor.visibilityScope ?? profile?.defaultVisibilityScope ?? "pillow_governed";

  const providerCards = filterByIsolationBoundary(
    input.view.providerCards,
    input.actor,
    (c) => ({ workspaceId: input.view.workspaceId, accountHolderId: c.accountHolderId, providerId: c.providerId }),
  );

  const visibleProviderIds = new Set(providerCards.map((c) => c.providerId));

  return {
    ...input.view,
    providerCards,
    providerMatrix: input.view.providerMatrix.filter((m) => visibleProviderIds.has(m.providerId)),
    attentionItems: input.view.attentionItems.filter((a) => visibleProviderIds.has(a.providerId)),
    grandKingConnections:
      viewerScope === "grand_king_visible" ? input.view.grandKingConnections : input.view.grandKingConnections.filter((id) => visibleProviderIds.has(id)),
    futureCustomerConnections: input.view.futureCustomerConnections.filter((id) => visibleProviderIds.has(id)),
    recentActivity: input.view.recentActivity.filter((a) => !a.providerId || visibleProviderIds.has(a.providerId)),
  };
}

export function buildCockpitIsolationSummary(input: {
  view: AuthorizationCentreView;
  actor: IsolationActorContext;
}): CockpitIsolationView {
  const filtered = applyCockpitIsolationFilter(input);
  const holderTypeId = input.actor.accountHolderTypeId ?? input.actor.accountHolderId;
  const profile = resolveAccountHolderProfile(holderTypeId, { workspaceId: input.actor.workspaceId });

  return {
    workspaceId: input.view.workspaceId,
    viewerScope: input.actor.visibilityScope ?? profile?.defaultVisibilityScope ?? "pillow_governed",
    visibleProviderCount: filtered.providerCards.length,
    hiddenProviderCount: input.view.providerCards.length - filtered.providerCards.length,
    visibleAccountHolderGroups: filtered.accountHolderGroups.length,
    isolationEnforced: true,
    requiredAccountHolderAction: filtered.readinessSummary?.nextRequiredAction ?? "none",
    governanceState: "pillow-governed",
  };
}
