import { createHash, randomUUID } from "node:crypto";

import { getCredentialVaultRepository } from "../../repositories/sqlite-credential-vault-repository.js";
import { getConnectorRuntimeState, connectorConnect } from "../../services/connector-runtime.js";
import { getLiveCommerceAdapter, isLiveCommerceProvider } from "../adapters/registry.js";
import {
  isLiveCommerceIntegrationEnabled,
  resolveLiveCommerceIntegrationMode,
  LIVE_COMMERCE_PROVIDER_IDS,
} from "../config.js";
import type {
  LiveCommerceAuditEntry,
  LiveCommerceIntegrationDashboard,
  LiveCommerceSecurityReview,
  LiveCommerceSyncJob,
  LiveCommerceSyncType,
  LiveCommerceWebhookEvent,
} from "../models.js";
import { getLiveCommerceRepository } from "../repositories/sqlite-live-commerce-repository.js";
import type { LiveCommerceAdapterContext } from "../adapters/types.js";

function resolveMode(): "sandbox" | "production" {
  return resolveLiveCommerceIntegrationMode() === "production" ? "production" : "sandbox";
}

function resolveCredentials(workspaceId: string, providerId: string): Record<string, unknown> {
  const state = getConnectorRuntimeState(workspaceId, providerId);
  if (!state?.credentialsRef) return {};
  return getCredentialVaultRepository().resolveSecret(state.credentialsRef) ?? {};
}

function buildAdapterContext(workspaceId: string, providerId: string): LiveCommerceAdapterContext {
  return {
    workspaceId,
    providerId,
    credentials: resolveCredentials(workspaceId, providerId),
    mode: resolveMode(),
  };
}

export function recordLiveCommerceAudit(input: {
  workspaceId: string;
  providerId: string;
  action: string;
  actor: string;
  outcome: LiveCommerceAuditEntry["outcome"];
  metadata?: Record<string, unknown>;
}): LiveCommerceAuditEntry {
  const entry: LiveCommerceAuditEntry = {
    auditId: randomUUID(),
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    action: input.action,
    actor: input.actor,
    outcome: input.outcome,
    metadata: input.metadata ?? {},
    recordedAt: new Date().toISOString(),
  };
  getLiveCommerceRepository().saveAuditEntry(entry);
  return entry;
}

export async function validateLiveMarketplaceConnection(
  workspaceId: string,
  providerId: string,
  actor = "system",
): Promise<{ valid: boolean; blockers: string[]; liveApiVerified: boolean }> {
  if (!isLiveCommerceIntegrationEnabled()) {
    return { valid: false, blockers: ["Live commerce integration disabled"], liveApiVerified: false };
  }

  const adapter = getLiveCommerceAdapter(providerId);
  if (!adapter) {
    return { valid: false, blockers: ["No live commerce adapter registered"], liveApiVerified: false };
  }

  const result = await adapter.validateConnection(buildAdapterContext(workspaceId, providerId));
  recordLiveCommerceAudit({
    workspaceId,
    providerId,
    action: "marketplace.validate",
    actor,
    outcome: result.valid ? "success" : "failure",
    metadata: { blockers: result.blockers, liveApiVerified: result.liveApiVerified },
  });
  return {
    valid: result.valid,
    blockers: result.blockers,
    liveApiVerified: result.liveApiVerified,
  };
}

export async function runLiveCommerceSync(input: {
  workspaceId: string;
  providerId: string;
  syncType: LiveCommerceSyncType;
  actor?: string;
}): Promise<LiveCommerceSyncJob> {
  const adapter = getLiveCommerceAdapter(input.providerId);
  if (!adapter) throw new Error(`No adapter for ${input.providerId}`);

  const jobId = randomUUID();
  const startedAt = new Date().toISOString();
  const ctx = buildAdapterContext(input.workspaceId, input.providerId);

  let job: LiveCommerceSyncJob = {
    jobId,
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    syncType: input.syncType,
    status: "running",
    itemsProcessed: 0,
    itemsFailed: 0,
    errorMessage: null,
    mode: ctx.mode,
    startedAt,
    completedAt: null,
  };
  getLiveCommerceRepository().saveSyncJob(job);

  try {
    const syncFn = {
      catalog: adapter.syncCatalog.bind(adapter),
      inventory: adapter.syncInventory.bind(adapter),
      pricing: adapter.syncPricing.bind(adapter),
      orders: adapter.syncOrders.bind(adapter),
    }[input.syncType];

    const result = await syncFn(ctx);
    job = {
      ...job,
      status: "completed",
      itemsProcessed: result.itemsProcessed,
      itemsFailed: result.itemsFailed,
      completedAt: new Date().toISOString(),
    };
    recordLiveCommerceAudit({
      workspaceId: input.workspaceId,
      providerId: input.providerId,
      action: `sync.${input.syncType}`,
      actor: input.actor ?? "system",
      outcome: "success",
      metadata: { jobId, itemsProcessed: result.itemsProcessed },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    job = {
      ...job,
      status: "failed",
      errorMessage: message,
      completedAt: new Date().toISOString(),
    };
    getLiveCommerceRepository().createRecoveryRecord({
      workspaceId: input.workspaceId,
      providerId: input.providerId,
      operation: `sync.${input.syncType}`,
      errorMessage: message,
    });
    recordLiveCommerceAudit({
      workspaceId: input.workspaceId,
      providerId: input.providerId,
      action: `sync.${input.syncType}`,
      actor: input.actor ?? "system",
      outcome: "failure",
      metadata: { jobId, error: message },
    });
  }

  getLiveCommerceRepository().saveSyncJob(job);
  return job;
}

export async function recoverFailedLiveCommerceOperation(input: {
  workspaceId: string;
  recoveryId: string;
  actor?: string;
}): Promise<{ recovered: boolean; recoveryId: string }> {
  const repo = getLiveCommerceRepository();
  const pending = repo.listPendingRecoveries(input.workspaceId);
  const item = pending.find((p) => p.recoveryId === input.recoveryId);
  if (!item) return { recovered: false, recoveryId: input.recoveryId };

  const syncType = item.operation.replace("sync.", "") as LiveCommerceSyncType;
  const job = await runLiveCommerceSync({
    workspaceId: input.workspaceId,
    providerId: item.providerId,
    syncType,
    actor: input.actor ?? "recovery",
  });

  if (job.status === "completed" || job.status === "recovered") {
    repo.markRecoveryComplete(input.recoveryId);
    getLiveCommerceRepository().saveSyncJob({ ...job, status: "recovered" });
    return { recovered: true, recoveryId: input.recoveryId };
  }
  return { recovered: false, recoveryId: input.recoveryId };
}

export function processLiveCommerceWebhook(input: {
  workspaceId: string;
  providerId: string;
  topic: string;
  payload: string;
  signature: string;
  secret: string;
}): LiveCommerceWebhookEvent {
  const adapter = getLiveCommerceAdapter(input.providerId);
  const signatureValid = adapter?.verifyWebhookSignature(input.payload, input.signature, input.secret) ?? false;
  const event: LiveCommerceWebhookEvent = {
    eventId: randomUUID(),
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    topic: input.topic,
    payloadHash: createHash("sha256").update(input.payload).digest("hex"),
    status: signatureValid ? "processed" : "failed",
    signatureValid,
    processedAt: signatureValid ? new Date().toISOString() : null,
    receivedAt: new Date().toISOString(),
  };

  if (!signatureValid) {
    event.status = "dead_letter";
    getLiveCommerceRepository().createRecoveryRecord({
      workspaceId: input.workspaceId,
      providerId: input.providerId,
      operation: `webhook.${input.topic}`,
      errorMessage: "Invalid webhook signature",
    });
  }

  getLiveCommerceRepository().saveWebhookEvent(event);
  recordLiveCommerceAudit({
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    action: "webhook.process",
    actor: "webhook",
    outcome: signatureValid ? "success" : "blocked",
    metadata: { topic: input.topic, eventId: event.eventId },
  });
  return event;
}

export function runLiveCommerceSecurityReview(
  workspaceId: string,
  providerId: string,
): LiveCommerceSecurityReview {
  const credentials = resolveCredentials(workspaceId, providerId);
  const findings: LiveCommerceSecurityReview["findings"] = [];

  if (!credentials.accessToken && !credentials.apiKey && !credentials.refreshToken) {
    findings.push({
      severity: "critical",
      code: "CREDENTIALS_MISSING",
      message: "No credentials stored in vault",
      remediated: false,
    });
  }

  const state = getConnectorRuntimeState(workspaceId, providerId);
  if (state?.credentialsRef && getCredentialVaultRepository().isExpired(state.credentialsRef)) {
    findings.push({
      severity: "high",
      code: "CREDENTIALS_EXPIRED",
      message: "Credentials expired — refresh required",
      remediated: false,
    });
  }

  if (resolveMode() === "production" && !process.env.CREDENTIAL_VAULT_KEY) {
    findings.push({
      severity: "critical",
      code: "VAULT_KEY_DEFAULT",
      message: "Production requires CREDENTIAL_VAULT_KEY",
      remediated: false,
    });
  }

  const passed = findings.filter((f) => !f.remediated && f.severity === "critical").length === 0;
  return {
    reviewId: randomUUID(),
    workspaceId,
    providerId,
    passed,
    findings,
    computedAt: new Date().toISOString(),
  };
}

export function assessLiveCommerceGoLive(workspaceId: string): {
  score: number;
  goLiveEligible: boolean;
  blockers: string[];
} {
  const blockers: string[] = [];
  let score = 0;

  if (!isLiveCommerceIntegrationEnabled()) {
    blockers.push("Live commerce integration disabled");
    return { score: 0, goLiveEligible: false, blockers };
  }

  for (const providerId of LIVE_COMMERCE_PROVIDER_IDS.marketplaces) {
    const state = getConnectorRuntimeState(workspaceId, providerId);
    if (!state || !["VERIFIED", "READY", "ACTIVE"].includes(state.lifecycle)) {
      blockers.push(`${providerId} not verified`);
    } else {
      score += 25;
    }
    const security = runLiveCommerceSecurityReview(workspaceId, providerId);
    if (!security.passed) blockers.push(`${providerId} security review failed`);
    else score += 10;
  }

  for (const providerId of LIVE_COMMERCE_PROVIDER_IDS.suppliers) {
    const state = getConnectorRuntimeState(workspaceId, providerId);
    if (!state) {
      blockers.push(`${providerId} supplier not connected`);
    } else {
      score += 15;
    }
  }

  const syncJobs = getLiveCommerceRepository().listSyncJobs(workspaceId);
  const completedSyncs = syncJobs.filter((j) => j.status === "completed").length;
  if (completedSyncs >= 4) score += 20;
  else blockers.push("Full sync cycle incomplete (catalog, inventory, pricing, orders)");

  score = Math.min(100, score);
  return {
    score,
    goLiveEligible: blockers.length === 0 && score >= 70,
    blockers,
  };
}

export function buildLiveCommerceIntegrationDashboard(
  workspaceId: string,
): LiveCommerceIntegrationDashboard {
  const mode = resolveLiveCommerceIntegrationMode();
  const syncJobs = getLiveCommerceRepository().listSyncJobs(workspaceId);
  const webhooks = getLiveCommerceRepository().listWebhookEvents(workspaceId);
  const goLive = assessLiveCommerceGoLive(workspaceId);

  const marketplaceProviders = LIVE_COMMERCE_PROVIDER_IDS.marketplaces.map((providerId) => {
    const state = getConnectorRuntimeState(workspaceId, providerId);
    const failed = syncJobs.filter((j) => j.providerId === providerId && j.status === "failed").length;
    return {
      providerId,
      authenticated: Boolean(state?.credentialsRef),
      validated: state?.lifecycle === "VERIFIED" || state?.lifecycle === "READY" || state?.lifecycle === "ACTIVE",
      syncHealth: failed > 0 ? ("WARNING" as const) : state ? ("HEALTHY" as const) : ("DISABLED" as const),
    };
  });

  const supplierProviders = LIVE_COMMERCE_PROVIDER_IDS.suppliers.map((providerId) => {
    const state = getConnectorRuntimeState(workspaceId, providerId);
    return {
      providerId,
      authenticated: Boolean(state?.credentialsRef),
      validated: Boolean(state && ["CONNECTED", "VERIFIED", "READY", "ACTIVE"].includes(state.lifecycle)),
    };
  });

  const countByType = (type: LiveCommerceSyncType) =>
    syncJobs.filter((j) => j.syncType === type && j.status === "completed").length;

  let securityReviewsPassed = 0;
  for (const id of [...LIVE_COMMERCE_PROVIDER_IDS.marketplaces, ...LIVE_COMMERCE_PROVIDER_IDS.suppliers]) {
    if (runLiveCommerceSecurityReview(workspaceId, id).passed) securityReviewsPassed += 1;
  }

  return {
    missionId: "REAL-002B",
    moduleId: "reality-integration",
    mode,
    liveIntegrationEnabled: isLiveCommerceIntegrationEnabled(),
    marketplaceProviders,
    supplierProviders,
    syncSummary: {
      catalog: countByType("catalog"),
      inventory: countByType("inventory"),
      pricing: countByType("pricing"),
      orders: countByType("orders"),
      failed: syncJobs.filter((j) => j.status === "failed").length,
    },
    webhookSummary: {
      received: webhooks.length,
      processed: webhooks.filter((w) => w.status === "processed").length,
      deadLetter: webhooks.filter((w) => w.status === "dead_letter").length,
    },
    securityReviewsPassed,
    commercialReadiness: goLive,
    computedAt: new Date().toISOString(),
  };
}

export async function connectLiveCommerceProvider(input: {
  workspaceId: string;
  providerId: string;
  credentialType: "oauth" | "api_key" | "refresh_token" | "secret";
  secretPayload: Record<string, unknown>;
  scopes?: string[];
  actor?: string;
}): Promise<void> {
  if (!isLiveCommerceProvider(input.providerId)) {
    throw new Error(`Provider ${input.providerId} is not a live commerce provider`);
  }
  await connectorConnect({
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    credentialType: input.credentialType,
    secretPayload: input.secretPayload,
    scopes: input.scopes,
    actor: input.actor,
  });
  recordLiveCommerceAudit({
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    action: "connect",
    actor: input.actor ?? "system",
    outcome: "success",
    metadata: { credentialType: input.credentialType },
  });
}

export { isLiveCommerceProvider };
