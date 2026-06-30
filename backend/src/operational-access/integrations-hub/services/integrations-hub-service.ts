import { isLiveCommerceProductionMode } from "../../../orchestration/version-1-activation/version-1-activation-config.js";
import { isPlatformOperationallyLive } from "../../../orchestration/version-1-activation/version-1-activation-config.js";
import type { EmpireAccessRecord } from "../../models/empire-platform-catalog.js";
import { getEmpireAccessRecord } from "../../services/empire-access-registry-service.js";
import {
  INTEGRATIONS_HUB_CATALOG,
  INTEGRATIONS_HUB_CATEGORIES,
  INTEGRATIONS_HUB_CATEGORY_LABELS,
  type IntegrationsHubDashboard,
  type IntegrationsHubDefinition,
  type IntegrationsHubDisplayStatus,
  type IntegrationsHubItem,
} from "../models/integrations-hub-catalog.js";

function mapDisplayStatus(
  definition: IntegrationsHubDefinition,
  record: EmpireAccessRecord | null,
): IntegrationsHubDisplayStatus {
  if (definition.connectKind === "env" && definition.platformId) {
    return record?.credentialsRef ? "connected" : "not_connected";
  }

  if ((definition.future ?? false) && !record?.credentialsRef) {
    return "disabled";
  }

  if (!record) {
    return "not_connected";
  }

  if (record.health === "FAILED" || record.accessState === "BLOCKED") return "error";
  if (record.accessState === "REVOKED" || record.accessState === "DEGRADED") return "needs_reauth";
  if (record.accessState === "AUTH_REQUIRED") return "needs_reauth";

  if (
    record.accessState === "ACTIVE" ||
    record.accessState === "READY" ||
    record.accessState === "VERIFIED" ||
    (record.accessState === "CONNECTED" && record.credentialsRef)
  ) {
    return "connected";
  }

  if (record.accessState === "NOT_CONNECTED" && !record.credentialsRef) {
    return (definition.future ?? false) ? "disabled" : "not_connected";
  }

  if (record.credentialsRef) return "connected";

  return "not_connected";
}

function resolveProductionStatus(
  definition: IntegrationsHubDefinition,
  record: EmpireAccessRecord | null,
): IntegrationsHubItem["productionStatus"] {
  if (definition.platformId && isPlatformOperationallyLive(definition.platformId)) {
    return "production";
  }
  if (record?.credentialsRef && isLiveCommerceProductionMode()) {
    return "production";
  }
  if (record?.credentialsRef) return "sandbox";
  if ((definition.future ?? false)) return "architecture_only";
  if (record?.restrictions.some((r) => r.includes("Architecture-only"))) {
    return "architecture_only";
  }
  return "not_configured";
}

function buildItem(workspaceId: string, definition: IntegrationsHubDefinition): IntegrationsHubItem {
  const def = { ...definition, future: definition.future ?? false };
  const record = def.platformId
    ? getEmpireAccessRecord(workspaceId, def.platformId)
    : null;

  const displayStatus = mapDisplayStatus(def, record);

  const productionStatus = resolveProductionStatus(def, record);
  const lastVerification = record?.lastSync ?? record?.updatedAt ?? null;

  const connected = displayStatus === "connected";
  const needsAction = displayStatus === "not_connected" || displayStatus === "needs_reauth";

  return {
    integrationId: def.integrationId,
    displayName: def.displayName,
    category: def.category,
    purpose: def.purpose,
    whyEmpireNeedsIt: def.whyEmpireNeedsIt,
    oneTimeSetup: true,
    displayStatus,
    productionStatus,
    lastVerification,
    connectKind: def.connectKind,
    canConnect: needsAction && !def.future && def.connectKind !== "env",
    canReconnect: displayStatus === "needs_reauth" || displayStatus === "error",
    future: def.future,
    documentationUrl: def.documentationUrl,
    oarAccessState: record?.accessState,
    restrictions: record?.restrictions ?? (def.future ? ["Adapter planned — not yet live"] : []),
  };
}

/** IH-001 — Build Integrations Hub dashboard (single source of truth for external connectivity). */
export function buildIntegrationsHubDashboard(workspaceId: string): IntegrationsHubDashboard {
  const items = INTEGRATIONS_HUB_CATALOG.map((def) => buildItem(workspaceId, def));

  const summary = {
    total: items.length,
    connected: items.filter((i) => i.displayStatus === "connected").length,
    notConnected: items.filter((i) => i.displayStatus === "not_connected").length,
    needsReauth: items.filter((i) => i.displayStatus === "needs_reauth").length,
    disabled: items.filter((i) => i.displayStatus === "disabled").length,
    error: items.filter((i) => i.displayStatus === "error").length,
  };

  const categories = INTEGRATIONS_HUB_CATEGORIES.map((category) => ({
    category,
    label: INTEGRATIONS_HUB_CATEGORY_LABELS[category],
    integrations: items.filter((i) => i.category === category),
  }));

  return {
    moduleId: "integrations-hub",
    missionId: "IH-001",
    doctrineRef: "REAL-051A",
    workspaceId,
    categories,
    summary,
    computedAt: new Date().toISOString(),
  };
}

export function getIntegrationsHubConnectTarget(integrationId: string): {
  connectKind: IntegrationsHubDefinition["connectKind"];
  marketplaceInfrastructureId?: string;
  realityProviderId?: string;
} | null {
  const def = INTEGRATIONS_HUB_CATALOG.find((d) => d.integrationId === integrationId);
  if (!def || (def.future ?? false)) return null;
  return {
    connectKind: def.connectKind,
    marketplaceInfrastructureId: def.marketplaceInfrastructureId,
    realityProviderId: def.realityProviderId,
  };
}
