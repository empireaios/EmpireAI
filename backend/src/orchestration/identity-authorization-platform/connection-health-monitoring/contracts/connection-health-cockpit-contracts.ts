/**
 * G8-04 — Authorization Centre future Cockpit health contracts.
 */

import type {
  ConnectionHealthAttentionItem,
  ConnectionHealthSummary,
  ProviderHealthMatrixEntry,
} from "./connection-health-types.js";
import {
  getConnectionHealthAttentionItems,
  getConnectionHealthSummary,
  getProviderHealthMatrix,
  listConnectionHealthChecks,
} from "../services/connection-monitoring-service.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";

export type CockpitConnectionHealthView = {
  viewId: "cockpit-connection-health";
  computedAt: string;
  dataMode: "connection-health-monitoring";
  presentationDeferred: true;
  futureMission: "G8-05";
  summary: ConnectionHealthSummary;
  matrix: ProviderHealthMatrixEntry[];
  attentionItems: ConnectionHealthAttentionItem[];
  expiredConnections: ConnectionHealthAttentionItem[];
  reconnectRequired: ConnectionHealthAttentionItem[];
  missingPermissions: ConnectionHealthAttentionItem[];
  discoverySource: "connection-health-monitoring:cockpit";
  designLanguage: "g4-cockpit";
};

export function buildCockpitConnectionHealthView(context: RegistryLoaderContext = {}): CockpitConnectionHealthView {
  const workspaceId = context.workspaceId ?? "ws_empire_1";
  const summary = getConnectionHealthSummary({ workspaceId, context });
  const matrix = getProviderHealthMatrix(context);
  const attentionItems = getConnectionHealthAttentionItems(context);

  return {
    viewId: "cockpit-connection-health",
    computedAt: new Date().toISOString(),
    dataMode: "connection-health-monitoring",
    presentationDeferred: true,
    futureMission: "G8-05",
    summary,
    matrix,
    attentionItems,
    expiredConnections: attentionItems.filter((item) => item.status === "expired"),
    reconnectRequired: attentionItems.filter((item) => item.status === "requires_reconnect"),
    missingPermissions: attentionItems.filter((item) => item.status === "missing_permissions"),
    discoverySource: "connection-health-monitoring:cockpit",
    designLanguage: "g4-cockpit",
  };
}

export function buildCockpitProviderHealthDetailView(providerId: string, context: RegistryLoaderContext = {}) {
  const checks = listConnectionHealthChecks(context).filter((c) => c.providerId === providerId);
  return {
    viewId: "cockpit-provider-health-detail" as const,
    providerId,
    checks,
    presentationDeferred: true as const,
    futureMission: "G8-05" as const,
    computedAt: new Date().toISOString(),
  };
}
