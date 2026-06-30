import type { RealityReadinessDashboard } from "../models/reality-readiness-dashboard.js";
import { isOperationalLifecycleState, mapLifecycleToHealthState } from "../models/connection-lifecycle.js";
import type { ConnectionLifecycleState } from "../models/connection-lifecycle.js";
import { REALITY_PROVIDER_CATALOG } from "../models/provider-catalog.js";
import { listConnectorRuntimeStates } from "./connector-runtime.js";
import { buildCredentialGovernanceSummary, listExpiringCredentials } from "./credential-governance-service.js";
import { buildApprovalQueueSummary } from "./approval-framework-service.js";
import { computeCountryOnboardingBatch } from "../../../runtime/global-commerce/index.js";

const MARKETPLACE_PROVIDERS = ["shopify", "amazon-seller", "ebay", "walmart", "tiktok-shop"];
const PAYMENT_PROVIDERS = ["stripe", "paypal"];
const SUPPLIER_PROVIDERS = ["cj-dropshipping", "aliexpress", "autods", "dsers", "zendrop", "spocket"];

/** REAL-005 — Reality Readiness Dashboard. */
export function buildRealityReadinessDashboard(
  workspaceId: string,
  companyId: string,
): RealityReadinessDashboard {
  const states = listConnectorRuntimeStates(workspaceId);
  const stateMap = new Map(states.map((s) => [s.providerId, s]));
  const governance = buildCredentialGovernanceSummary(workspaceId);
  const expiring = listExpiringCredentials(workspaceId);

  const connectedProviders = states
    .filter((s) => s.lifecycle !== "DISCONNECTED" && s.lifecycle !== "REVOKED" && s.lifecycle !== "DISCOVERED")
    .map((s) => {
      const def = REALITY_PROVIDER_CATALOG.find((p) => p.providerId === s.providerId);
      return {
        providerId: s.providerId,
        displayName: def?.displayName ?? s.providerId,
        lifecycle: s.lifecycle as ConnectionLifecycleState,
        category: def?.category ?? "commerce",
      };
    });

  const providersReady = connectedProviders
    .filter((p) => isOperationalLifecycleState(p.lifecycle))
    .map((p) => p.providerId);

  const verificationPending = connectedProviders
    .filter((p) => p.lifecycle === "CONNECTED" || p.lifecycle === "AUTHORIZATION_REQUIRED")
    .map((p) => ({
      providerId: p.providerId,
      displayName: p.displayName,
      reason: p.lifecycle === "AUTHORIZATION_REQUIRED"
        ? "OAuth authorization pending"
        : "Connection established — verification required",
    }));

  let healthy = 0;
  let warning = 0;
  let failed = 0;
  let disabled = 0;

  for (const def of REALITY_PROVIDER_CATALOG) {
    const state = stateMap.get(def.providerId);
    const lifecycle = (state?.lifecycle ?? "DISCOVERED") as ConnectionLifecycleState;
    const health = mapLifecycleToHealthState(lifecycle);
    if (health === "HEALTHY") healthy++;
    else if (health === "WARNING") warning++;
    else if (health === "FAILED") failed++;
    else disabled++;
  }

  const sgOnboarding = computeCountryOnboardingBatch(workspaceId, companyId, "SG");
  const countriesReady = sgOnboarding
    .filter((o: { readinessScore: number }) => o.readinessScore >= 60)
    .map((o: { displayName: string }) => o.displayName);

  const firstMarketplace = connectedProviders.find((p) => MARKETPLACE_PROVIDERS.includes(p.providerId))?.providerId ?? null;
  const firstPayment = connectedProviders.find((p) => PAYMENT_PROVIDERS.includes(p.providerId))?.providerId ?? null;
  const firstSupplier = connectedProviders.find((p) => SUPPLIER_PROVIDERS.includes(p.providerId))?.providerId ?? null;

  const readinessComponents = [
    firstMarketplace ? 35 : 0,
    firstPayment ? 30 : 0,
    firstSupplier ? 25 : 0,
    providersReady.length > 0 ? 10 : 0,
  ];
  const realCommerceReadinessPercent = Math.min(100, readinessComponents.reduce((s, v) => s + v, 0));

  return {
    moduleId: "reality-integration",
    missionId: "REAL-001-REAL-005",
    connectedProviders,
    providersReady,
    verificationPending,
    credentialExpiry: expiring.map((e) => ({
      credentialsRef: e.credentialsRef,
      providerId: e.providerId,
      expiresAt: e.expiresAt,
      daysRemaining: e.daysRemaining,
    })),
    approvalQueue: buildApprovalQueueSummary(),
    connectionHealth: { healthy, warning, failed, disabled },
    countriesReady,
    realCommerceReadinessPercent,
    firstConnectedMarketplace: firstMarketplace,
    firstConnectedPayment: firstPayment,
    firstConnectedSupplier: firstSupplier,
    computedAt: new Date().toISOString(),
  };
}

export function buildEsisRealityReadinessPayload(workspaceId: string, companyId: string) {
  const dash = buildRealityReadinessDashboard(workspaceId, companyId);
  return {
    module: "reality-integration",
    realCommerceReadinessPercent: dash.realCommerceReadinessPercent,
    connectedCount: dash.connectedProviders.length,
    firstMarketplace: dash.firstConnectedMarketplace,
    firstPayment: dash.firstConnectedPayment,
    firstSupplier: dash.firstConnectedSupplier,
  };
}
