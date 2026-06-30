import { getDatabase } from "../../brain/database.js";
import {
  getConnectorRuntimeState,
  buildCredentialVaultProfile,
  assessRuntimeActivation,
} from "../../orchestration/reality-integration/index.js";
import type { EmpireAccessRecord, EmpireAccessRegistry } from "../models/empire-platform-catalog.js";
import { EMPIRE_ACCESS_PLATFORMS, getEmpirePlatform } from "../models/empire-platform-catalog.js";
import { mapToAccessState } from "../models/access-state-machine.js";
import { buildPermissionMatrix } from "../models/permission-matrix.js";
import { listBoundariesForPlatform } from "../models/approval-boundary.js";
import { env } from "../../config/env.js";
import { isPlatformOperationallyLive } from "../../orchestration/version-1-activation/version-1-activation-config.js";

function detectInfraAccess(platformId: string): { hasCredentials: boolean; lifecycle: string; scopes: string[] } {
  switch (platformId) {
    case "vercel":
      return {
        hasCredentials: Boolean(process.env.VERCEL || process.env.VERCEL_URL),
        lifecycle: process.env.VERCEL ? "CONNECTED" : "NOT_CONNECTED",
        scopes: process.env.VERCEL ? ["deploy", "env"] : [],
      };
    case "github":
      return {
        hasCredentials: Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN),
        lifecycle: process.env.GITHUB_TOKEN || process.env.GH_TOKEN ? "CONNECTED" : "CREDENTIALS_REQUIRED",
        scopes: ["repo"],
      };
    case "openai":
      return {
        hasCredentials: Boolean(env.OPENAI_API_KEY),
        lifecycle: env.OPENAI_API_KEY ? "CONNECTED" : "CREDENTIALS_REQUIRED",
        scopes: env.OPENAI_API_KEY ? ["api"] : [],
      };
    case "anthropic":
      return {
        hasCredentials: Boolean(env.ANTHROPIC_API_KEY),
        lifecycle: env.ANTHROPIC_API_KEY ? "CONNECTED" : "CREDENTIALS_REQUIRED",
        scopes: env.ANTHROPIC_API_KEY ? ["api"] : [],
      };
    case "google-ai":
      return {
        hasCredentials: Boolean(env.GOOGLE_AI_API_KEY),
        lifecycle: env.GOOGLE_AI_API_KEY ? "CONNECTED" : "CREDENTIALS_REQUIRED",
        scopes: env.GOOGLE_AI_API_KEY ? ["api"] : [],
      };
    case "cursor":
      return { hasCredentials: false, lifecycle: "DISCOVERED", scopes: [] };
    default:
      return { hasCredentials: false, lifecycle: "DISCOVERED", scopes: [] };
  }
}

function buildRecord(workspaceId: string, platformId: string): EmpireAccessRecord {
  const definition = getEmpirePlatform(platformId)!;
  let accessState: EmpireAccessRecord["accessState"] = "NOT_CONNECTED";
  let credentialsRef: string | null = null;
  let scopes: string[] = [];
  let owner: string | null = null;
  let lastSync: string | null = null;
  let restrictions: string[] = [];
  let approvalRequired = false;
  let health: EmpireAccessRecord["health"] = "DISABLED";

  if (definition.realityProviderId) {
    const runtime = getConnectorRuntimeState(workspaceId, definition.realityProviderId);
    const activation = assessRuntimeActivation(workspaceId, definition.realityProviderId);
    credentialsRef = runtime?.credentialsRef ?? null;
    scopes = runtime?.capabilities ?? [];
    lastSync = runtime?.lastSync ?? null;
    approvalRequired = activation.requiresFounderApproval;
    restrictions = [...activation.blockers];
    if (definition.architectureOnly && !isPlatformOperationallyLive(platformId)) {
      restrictions.push("Architecture-only: no live API execution without credentials");
    }
    if (runtime?.executionBlocked) restrictions.push("Runtime execution blocked");

    accessState = mapToAccessState({
      lifecycle: runtime?.lifecycle,
      blocked: activation.blocked || (definition.architectureOnly && !credentialsRef && !isPlatformOperationallyLive(platformId)),
      hasCredentials: Boolean(credentialsRef) || isPlatformOperationallyLive(platformId),
    });

    if (credentialsRef) {
      const profile = buildCredentialVaultProfile(credentialsRef);
      owner = profile?.owner ?? null;
      scopes = profile?.scopes ?? scopes;
    }
    health = accessState === "ACTIVE" ? "HEALTHY" : credentialsRef ? "WARNING" : "DISABLED";
  } else {
    const infra = detectInfraAccess(platformId);
    credentialsRef = infra.hasCredentials ? `infra:${platformId}` : null;
    scopes = infra.scopes;
    accessState = mapToAccessState({
      lifecycle: infra.lifecycle,
      blocked: definition.architectureOnly && !infra.hasCredentials,
      hasCredentials: infra.hasCredentials,
    });
    if (definition.architectureOnly) restrictions.push("Architecture-only platform");
    health = infra.hasCredentials ? "HEALTHY" : "WARNING";
  }

  const matrix = buildPermissionMatrix({
    platformId,
    displayName: definition.displayName,
    accessState,
    grantedScopes: scopes,
    architectureOnly: definition.architectureOnly && !isPlatformOperationallyLive(platformId),
  });

  const boundaries = listBoundariesForPlatform(platformId);
  const allowedActions = boundaries.filter((b) => b.boundary === "safe_automatic").map((b) => b.action);
  const blockedActions = boundaries.filter((b) => b.boundary === "forbidden").map((b) => b.action);

  return {
    recordId: `${workspaceId}:${platformId}`,
    workspaceId,
    platformId,
    displayName: definition.displayName,
    category: definition.category,
    accessState,
    authentication: definition.authentication,
    revenueBlocking: definition.revenueBlocking,
    credentialsRef,
    scopes,
    allowedActions,
    blockedActions,
    approvalRequired,
    restrictions,
    health: matrix.health === "HEALTHY" ? health : matrix.health,
    lastSync,
    owner,
    updatedAt: new Date().toISOString(),
  };
}

/** OAR-001 — Empire Access Registry (reuses Reality Integration vault; no duplicate store). */
export function buildEmpireAccessRegistry(workspaceId: string): EmpireAccessRegistry {
  const records = EMPIRE_ACCESS_PLATFORMS.map((p) => buildRecord(workspaceId, p.platformId));
  persistEmpireAccessRecords(workspaceId, records);

  return {
    moduleId: "operational-access",
    missionId: "OAR-001",
    workspaceId,
    records,
    summary: {
      totalPlatforms: records.length,
      connected: records.filter((r) => ["CONNECTED", "VERIFIED", "READY", "ACTIVE"].includes(r.accessState)).length,
      verified: records.filter((r) => ["VERIFIED", "READY", "ACTIVE"].includes(r.accessState)).length,
      ready: records.filter((r) => ["READY", "ACTIVE"].includes(r.accessState)).length,
      active: records.filter((r) => r.accessState === "ACTIVE").length,
      blocked: records.filter((r) => r.accessState === "BLOCKED").length,
      authRequired: records.filter((r) => r.accessState === "AUTH_REQUIRED").length,
      revenueBlockingGaps: records.filter((r) => r.revenueBlocking && r.accessState !== "ACTIVE").length,
      architectureComplete: true,
    },
    computedAt: new Date().toISOString(),
  };
}

function persistEmpireAccessRecords(workspaceId: string, records: EmpireAccessRecord[]): void {
  const db = getDatabase();
  const stmt = db.prepare(
    `INSERT INTO empire_access_registry (record_id, workspace_id, platform_id, record_json, updated_at)
     VALUES (@recordId, @workspaceId, @platformId, @recordJson, @updatedAt)
     ON CONFLICT(record_id) DO UPDATE SET record_json = @recordJson, updated_at = @updatedAt`,
  );
  for (const record of records) {
    stmt.run({
      recordId: record.recordId,
      workspaceId,
      platformId: record.platformId,
      recordJson: JSON.stringify(record),
      updatedAt: record.updatedAt,
    });
  }
}

export function getEmpireAccessRecord(workspaceId: string, platformId: string): EmpireAccessRecord {
  const db = getDatabase();
  const row = db.prepare(
    `SELECT record_json FROM empire_access_registry WHERE workspace_id = @workspaceId AND platform_id = @platformId`,
  ).get({ workspaceId, platformId }) as { record_json: string } | undefined;
  if (!row) return buildRecord(workspaceId, platformId);
  return JSON.parse(row.record_json) as EmpireAccessRecord;
}

export function resetEmpireAccessRegistry(): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM empire_access_registry`).run();
}

export function getPermissionMatrixForPlatform(workspaceId: string, platformId: string) {
  const record = getEmpireAccessRecord(workspaceId, platformId);
  const def = getEmpirePlatform(platformId);
  return buildPermissionMatrix({
    platformId,
    displayName: record.displayName,
    accessState: record.accessState,
    grantedScopes: record.scopes,
    architectureOnly: def?.architectureOnly ?? true,
  });
}
