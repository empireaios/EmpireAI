import { getDatabase } from "../../../brain/database.js";
import type { OperationalAccessRecord, OperationalAccessRegistry } from "../models/operational-access-registry.js";
import { LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS, mapToLiveCommerceLifecycle } from "../models/live-commerce-foundation.js";
import { REALITY_PROVIDER_CATALOG, getRealityProvider } from "../models/provider-catalog.js";
import { getConnectorRuntimeState } from "./connector-runtime.js";
import { assessRuntimeActivation } from "./runtime-activation-service.js";
import { verifyProviderCapabilities } from "./provider-capability-verification-service.js";
import { buildCredentialVaultProfile } from "./credential-vault-profile-service.js";

function buildRecord(workspaceId: string, providerId: string): OperationalAccessRecord {
  const definition = getRealityProvider(providerId);
  const runtime = getConnectorRuntimeState(workspaceId, providerId);
  const lifecycle = mapToLiveCommerceLifecycle(runtime?.lifecycle);
  const activation = assessRuntimeActivation(workspaceId, providerId);
  const capabilities = verifyProviderCapabilities(workspaceId, providerId);
  const profile = runtime?.credentialsRef ? buildCredentialVaultProfile(runtime.credentialsRef) : null;

  let operationalStatus: OperationalAccessRecord["operationalStatus"] = "BLOCKED";
  if (lifecycle === "ACTIVE") operationalStatus = "ACTIVE";
  else if (lifecycle === "DEGRADED") operationalStatus = "DEGRADED";
  else if (["VERIFIED", "READY"].includes(lifecycle)) operationalStatus = "READY";

  let automationStatus: OperationalAccessRecord["automationStatus"] = "DISABLED";
  if (activation.activated) automationStatus = "ENABLED";
  else if (activation.requiresFounderApproval && !activation.founderApproved) automationStatus = "PENDING_APPROVAL";
  else if (activation.blocked) automationStatus = "BLOCKED";

  const restrictions: string[] = [...activation.blockers];
  if (definition?.connectionOnly) restrictions.push("Architecture-only: no live API execution without credentials");
  if (runtime?.executionBlocked) restrictions.push("Runtime execution blocked until activation gates pass");

  return {
    recordId: `${workspaceId}:${providerId}`,
    workspaceId,
    platform: definition?.displayName ?? providerId,
    providerId,
    authentication: definition?.authentication ?? "api_key",
    connectionStatus: lifecycle,
    verificationStatus:
      lifecycle === "VERIFIED" || lifecycle === "READY" || lifecycle === "ACTIVE"
        ? "VERIFIED"
        : lifecycle === "DEGRADED"
          ? "FAILED"
          : "UNVERIFIED",
    operationalStatus,
    automationStatus,
    approvalRequired: activation.requiresFounderApproval,
    health: capabilities.health,
    lastSync: runtime?.lastSync ?? null,
    supportedCapabilities: capabilities.capabilities.filter((c) => c.supported).map((c) => c.capability),
    currentRestrictions: restrictions,
    credentialsRef: runtime?.credentialsRef ?? null,
    owner: profile?.owner ?? null,
    updatedAt: new Date().toISOString(),
  };
}

/** EAR-001 — Operational Access Registry (authoritative external platform access). */
export function buildOperationalAccessRegistry(workspaceId: string): OperationalAccessRegistry {
  const marketplaceIds = new Set<string>(LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS);
  const commerceProviders = REALITY_PROVIDER_CATALOG.filter((p) => p.category === "commerce").map((p) => p.providerId);
  const providerIds = [...new Set([...marketplaceIds, ...commerceProviders])];

  const records = providerIds.map((id) => buildRecord(workspaceId, id));
  persistOperationalAccessRecords(workspaceId, records);

  return {
    moduleId: "operational-access-registry",
    missionId: "EAR-001",
    workspaceId,
    records,
    summary: {
      totalPlatforms: records.length,
      active: records.filter((r) => r.operationalStatus === "ACTIVE").length,
      blocked: records.filter((r) => r.operationalStatus === "BLOCKED").length,
      awaitingApproval: records.filter((r) => r.automationStatus === "PENDING_APPROVAL").length,
      degraded: records.filter((r) => r.operationalStatus === "DEGRADED").length,
    },
    computedAt: new Date().toISOString(),
  };
}

function persistOperationalAccessRecords(workspaceId: string, records: OperationalAccessRecord[]): void {
  const db = getDatabase();
  const stmt = db.prepare(
    `INSERT INTO operational_access_registry (record_id, workspace_id, provider_id, record_json, updated_at)
     VALUES (@recordId, @workspaceId, @providerId, @recordJson, @updatedAt)
     ON CONFLICT(record_id) DO UPDATE SET record_json = @recordJson, updated_at = @updatedAt`,
  );
  for (const record of records) {
    stmt.run({
      recordId: record.recordId,
      workspaceId,
      providerId: record.providerId,
      recordJson: JSON.stringify(record),
      updatedAt: record.updatedAt,
    });
  }
}

export function getOperationalAccessRecord(workspaceId: string, providerId: string): OperationalAccessRecord | null {
  const db = getDatabase();
  const row = db.prepare(
    `SELECT record_json FROM operational_access_registry WHERE workspace_id = @workspaceId AND provider_id = @providerId`,
  ).get({ workspaceId, providerId }) as { record_json: string } | undefined;
  if (!row) return buildRecord(workspaceId, providerId);
  return JSON.parse(row.record_json) as OperationalAccessRecord;
}

export function resetOperationalAccessRegistry(): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM operational_access_registry`).run();
}
