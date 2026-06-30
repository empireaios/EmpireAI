import { buildRealityReadinessDashboard } from "../../orchestration/reality-integration/services/reality-readiness-dashboard-service.js";
import type { AccessDashboard } from "../models/access-dashboard.js";
import {
  buildAmazonAccessReadiness,
  buildCjAccessReadiness,
  buildMarketplaceAccessReadiness,
  FUTURE_MARKETPLACE_IDS,
} from "../models/platform-readiness.js";
import { buildPermissionMatrix } from "../models/permission-matrix.js";
import { getEmpirePlatform } from "../models/empire-platform-catalog.js";
import { buildEmpireAccessRegistry, getEmpireAccessRecord } from "./empire-access-registry-service.js";

/** OAR-008 — Operational Access Dashboard for Mission Home / Executive HQ. */
export function buildAccessDashboard(workspaceId: string, companyId: string): AccessDashboard {
  const registry = buildEmpireAccessRegistry(workspaceId);

  let realCommerceReadinessPercent = 0;
  try {
    realCommerceReadinessPercent = buildRealityReadinessDashboard(workspaceId, companyId).realCommerceReadinessPercent;
  } catch { /* optional */ }

  const connectedPlatforms = registry.records
    .filter((r) => ["CONNECTED", "VERIFIED", "READY", "ACTIVE"].includes(r.accessState))
    .map((r) => ({ platformId: r.platformId, displayName: r.displayName, accessState: r.accessState }));

  const blockedPlatforms = registry.records
    .filter((r) => r.accessState === "BLOCKED" || r.accessState === "NOT_CONNECTED" || r.accessState === "AUTH_REQUIRED")
    .filter((r) => r.revenueBlocking || r.restrictions.length > 0)
    .map((r) => ({
      platformId: r.platformId,
      displayName: r.displayName,
      accessState: r.accessState,
      restrictions: r.restrictions,
    }));

  const readyPlatforms = registry.records
    .filter((r) => r.accessState === "READY" || r.accessState === "ACTIVE")
    .map((r) => ({ platformId: r.platformId, displayName: r.displayName }));

  const requiredAuthorizations = registry.records
    .filter((r) => r.accessState === "AUTH_REQUIRED" || (r.approvalRequired && r.accessState !== "ACTIVE"))
    .map((r) => ({
      platformId: r.platformId,
      displayName: r.displayName,
      authorizationType: r.accessState === "AUTH_REQUIRED" ? "OAuth / API credentials" : "Founder approval",
      priority: (r.revenueBlocking ? "CRITICAL" : "HIGH") as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    }));

  const revenueBlockingGaps = registry.records
    .filter((r) => r.revenueBlocking && !["READY", "ACTIVE"].includes(r.accessState))
    .map((r) => ({
      platformId: r.platformId,
      displayName: r.displayName,
      gap: r.restrictions[0] ?? `Access state: ${r.accessState}`,
    }));

  const priorityOrder = ["amazon-seller", "stripe", "cj-dropshipping", "paypal"];
  const highestGap = revenueBlockingGaps.find((g) => priorityOrder.includes(g.platformId))
    ?? revenueBlockingGaps[0];

  const highestPriorityAccessAction = highestGap
    ? {
        platformId: highestGap.platformId,
        displayName: highestGap.displayName,
        action: highestGap.platformId === "amazon-seller"
          ? "Connect Amazon SP-API + verify scopes"
          : highestGap.platformId === "cj-dropshipping"
            ? "Store CJ API key + verify"
            : "Connect and verify platform",
        reason: highestGap.gap,
      }
    : null;

  const permissionMatrices = registry.records
    .filter((r) => r.revenueBlocking)
    .map((r) => {
      const def = getEmpirePlatform(r.platformId);
      return buildPermissionMatrix({
        platformId: r.platformId,
        displayName: r.displayName,
        accessState: r.accessState,
        grantedScopes: r.scopes,
        architectureOnly: def?.architectureOnly ?? true,
      });
    });

  const amazonRecord = getEmpireAccessRecord(workspaceId, "amazon-seller")!;
  const cjRecord = getEmpireAccessRecord(workspaceId, "cj-dropshipping")!;

  const amazonReadiness = buildAmazonAccessReadiness(
    amazonRecord.accessState,
    Boolean(amazonRecord.credentialsRef),
    amazonRecord.scopes,
  );

  const cjReadiness = buildCjAccessReadiness(
    cjRecord.accessState,
    Boolean(cjRecord.credentialsRef),
  );

  const marketplaceReadiness = FUTURE_MARKETPLACE_IDS.map((id) => {
    const record = getEmpireAccessRecord(workspaceId, id)!;
    const def = getEmpirePlatform(id)!;
    return buildMarketplaceAccessReadiness(id, def.displayName, record.accessState, Boolean(record.credentialsRef));
  });

  const architectureComplete = registry.summary.architectureComplete;
  const readinessScore = Math.round(
    (registry.summary.totalPlatforms > 0
      ? ((registry.summary.connected + registry.summary.ready + registry.summary.active) / registry.summary.totalPlatforms) * 50
      : 0) +
    (architectureComplete ? 50 : 0),
  );

  return {
    moduleId: "operational-access",
    missionId: "OAR-008",
    workspaceId,
    companyId,
    realCommerceReadinessPercent: Math.max(realCommerceReadinessPercent, readinessScore),
    architectureComplete,
    connectedPlatforms,
    blockedPlatforms,
    readyPlatforms,
    requiredAuthorizations,
    highestPriorityAccessAction,
    revenueBlockingGaps,
    permissionMatrices,
    amazonReadiness,
    cjReadiness,
    marketplaceReadiness,
    summary: {
      totalPlatforms: registry.summary.totalPlatforms,
      connected: registry.summary.connected,
      blocked: registry.summary.blocked,
      ready: registry.summary.ready,
      active: registry.summary.active,
      revenueBlockingGaps: registry.summary.revenueBlockingGaps,
    },
    computedAt: new Date().toISOString(),
  };
}
