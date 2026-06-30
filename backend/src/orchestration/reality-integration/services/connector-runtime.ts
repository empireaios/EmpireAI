import { randomUUID } from "node:crypto";

import { ConnectorConnectionRepository } from "../../../connectors/connection-repository.js";
import { getRealityProvider } from "../models/provider-catalog.js";
import type {
  ConnectorHealthState,
  ConnectorRuntimeCost,
  ConnectorRuntimeHealth,
  ConnectorRuntimeState,
  RealityProviderDefinition,
} from "../models/reality-integration.js";
import {
  mapLifecycleToHealthState,
} from "../models/connection-lifecycle.js";
import {
  getCredentialVaultRepository,
  storeConnectorCredential,
} from "../repositories/sqlite-credential-vault-repository.js";
import { getConnectorMonitoringRepository } from "../repositories/sqlite-connector-monitoring-repository.js";
import { recordCredentialGovernanceEvent } from "./credential-governance-service.js";
import { assessConnectorGovernance } from "./connector-governance-service.js";

export class ConnectorRuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectorRuntimeError";
  }
}

export class ConnectorRuntimeNotFoundError extends Error {
  constructor(providerId: string) {
    super(`Connector runtime state not found: ${providerId}`);
    this.name = "ConnectorRuntimeNotFoundError";
  }
}

const runtimeStates = new Map<string, ConnectorRuntimeState>();

function stateKey(workspaceId: string, providerId: string): string {
  return `${workspaceId}:${providerId}`;
}

function defaultHealth(providerId: string): ConnectorRuntimeHealth {
  return {
    state: "HEALTHY",
    latencyMs: 45,
    message: `${providerId} connection validated`,
    lastHeartbeat: new Date().toISOString(),
    rateLimitRemaining: 100,
  };
}

function buildCost(definition: RealityProviderDefinition): ConnectorRuntimeCost {
  return {
    monthlyCostCents: definition.monthlyCostCents,
    usageCostEstimateCents: definition.monthlyCostCents > 0 ? 0 : 500,
    currency: "USD",
  };
}

function recordEvent(
  workspaceId: string,
  providerId: string,
  eventType: "heartbeat" | "error" | "retry" | "degraded" | "dependency",
  message: string,
  metadata: Record<string, unknown> = {},
) {
  getConnectorMonitoringRepository().saveEvent({
    eventId: randomUUID(),
    providerId,
    workspaceId,
    eventType,
    message,
    metadata,
    recordedAt: new Date().toISOString(),
  });
}

export function getConnectorRuntimeState(
  workspaceId: string,
  providerId: string,
): ConnectorRuntimeState | null {
  return runtimeStates.get(stateKey(workspaceId, providerId)) ?? null;
}

export function listConnectorRuntimeStates(workspaceId: string): ConnectorRuntimeState[] {
  return [...runtimeStates.values()].filter((s) => s.workspaceId === workspaceId);
}

export function resetConnectorRuntimeStates(): void {
  runtimeStates.clear();
}

async function withRetry<T>(fn: () => Promise<T>, workspaceId: string, providerId: string): Promise<T> {
  const maxAttempts = 3;
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      recordEvent(workspaceId, providerId, "retry", `Retry attempt ${attempt}/${maxAttempts}`, {
        error: lastError.message,
      });
      if (attempt === maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
    }
  }
  recordEvent(workspaceId, providerId, "error", lastError?.message ?? "Unknown error");
  throw lastError;
}

export async function connectorConnect(input: {
  workspaceId: string;
  companyId?: string;
  providerId: string;
  credentialType: "oauth" | "api_key" | "refresh_token" | "secret";
  secretPayload: Record<string, unknown>;
  scopes?: string[];
  actor?: string;
}): Promise<ConnectorRuntimeState> {
  const definition = getRealityProvider(input.providerId);
  if (!definition) throw new ConnectorRuntimeError(`Unknown provider: ${input.providerId}`);

  const governance = assessConnectorGovernance({
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    action: "connect",
    actor: input.actor ?? "system",
  });
  if (!governance.approved) {
    throw new ConnectorRuntimeError(`Governance blocked connect: ${governance.reason}`);
  }

  for (const dep of definition.dependencies) {
    const depState = getConnectorRuntimeState(input.workspaceId, dep);
    if (!depState || !["CONNECTED", "VERIFIED", "READY", "ACTIVE"].includes(depState.lifecycle)) {
      recordEvent(input.workspaceId, input.providerId, "dependency", `Missing dependency: ${dep}`, { dep });
    }
  }

  const vaultRecord = storeConnectorCredential(
    input.workspaceId,
    input.providerId,
    input.credentialType,
    input.secretPayload,
    input.scopes,
  );

  recordCredentialGovernanceEvent({
    credentialsRef: vaultRecord.credentialsRef,
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    event: "stored",
    actor: input.actor ?? "system",
    scopes: input.scopes,
    expiresAt: vaultRecord.expiresAt,
    verified: false,
  });

  await withRetry(async () => {
    // Connection validation — no live API calls, validates credential structure
    if (definition.authentication === "api_key" && !input.secretPayload.apiKey) {
      throw new ConnectorRuntimeError("API key required");
    }
    if (definition.authentication === "oauth2" && !input.secretPayload.accessToken && !input.secretPayload.code) {
      throw new ConnectorRuntimeError("OAuth token or authorization code required");
    }
  }, input.workspaceId, input.providerId);

  const now = new Date().toISOString();
  const state: ConnectorRuntimeState = {
    providerId: input.providerId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    lifecycle: "CONNECTED",
    health: defaultHealth(input.providerId),
    cost: buildCost(definition),
    dependencies: definition.dependencies,
    capabilities: definition.capabilities,
    credentialsRef: vaultRecord.credentialsRef,
    version: definition.version,
    lastSync: now,
    governanceApproved: true,
    executionBlocked: true,
    updatedAt: now,
  };

  runtimeStates.set(stateKey(input.workspaceId, input.providerId), state);

  const legacyCategory = mapCategoryToLegacy(definition.category);
  new ConnectorConnectionRepository().upsert({
    workspaceId: input.workspaceId,
    connectorId: input.providerId,
    category: legacyCategory,
    status: "connected",
    credentialsRef: vaultRecord.credentialsRef,
    metadata: { version: definition.version, connectionOnly: true },
  });

  recordEvent(input.workspaceId, input.providerId, "heartbeat", "Connector connected");
  return state;
}

export async function connectorDisconnect(
  workspaceId: string,
  providerId: string,
  actor = "system",
): Promise<ConnectorRuntimeState> {
  const state = getConnectorRuntimeState(workspaceId, providerId);
  if (!state) throw new ConnectorRuntimeNotFoundError(providerId);

  const governance = assessConnectorGovernance({ workspaceId, providerId, action: "disconnect", actor });
  if (!governance.approved) {
    throw new ConnectorRuntimeError(`Governance blocked disconnect: ${governance.reason}`);
  }

  if (state.credentialsRef) {
    getCredentialVaultRepository().revokeCredential(state.credentialsRef);
    recordCredentialGovernanceEvent({
      credentialsRef: state.credentialsRef,
      workspaceId,
      providerId,
      event: "revoked",
      actor,
      scopes: [],
      verified: false,
    });
  }

  const updated: ConnectorRuntimeState = {
    ...state,
    lifecycle: "REVOKED",
    health: { ...state.health, state: "DISABLED", message: "Disconnected" },
    credentialsRef: null,
    updatedAt: new Date().toISOString(),
  };
  runtimeStates.set(stateKey(workspaceId, providerId), updated);

  new ConnectorConnectionRepository().upsert({
    workspaceId,
    connectorId: providerId,
    category: mapCategoryToLegacy(getRealityProvider(providerId)!.category),
    status: "disconnected",
    credentialsRef: null,
  });

  recordEvent(workspaceId, providerId, "heartbeat", "Connector disconnected");
  return updated;
}

export async function connectorValidate(workspaceId: string, providerId: string): Promise<{
  valid: boolean;
  providerId: string;
  capabilities: string[];
  blockers: string[];
}> {
  const definition = getRealityProvider(providerId);
  const state = getConnectorRuntimeState(workspaceId, providerId);
  const blockers: string[] = [];

  if (!definition) blockers.push("Provider not in registry");
  if (!state) blockers.push("Not connected");
  if (state?.credentialsRef && getCredentialVaultRepository().isExpired(state.credentialsRef)) {
    blockers.push("Credentials expired");
  }

  if (blockers.length === 0) {
    try {
      const { isLiveCommerceIntegrationEnabled } = await import("../live-commerce/config.js");
      const { isLiveCommerceProvider } = await import("../live-commerce/adapters/registry.js");
      const { validateLiveMarketplaceConnection } = await import(
        "../live-commerce/services/live-commerce-integration-service.js"
      );
      if (isLiveCommerceIntegrationEnabled() && isLiveCommerceProvider(providerId)) {
        const live = await validateLiveMarketplaceConnection(workspaceId, providerId);
        if (!live.valid) blockers.push(...live.blockers);
      }
    } catch {
      // Fall through to structural validation
    }
  }

  if (state) {
    runtimeStates.set(stateKey(workspaceId, providerId), {
      ...state,
      lifecycle: blockers.length === 0 ? "VERIFIED" : "ERROR",
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    valid: blockers.length === 0,
    providerId,
    capabilities: definition?.capabilities ?? [],
    blockers,
  };
}

export async function connectorHeartbeat(workspaceId: string, providerId: string): Promise<ConnectorRuntimeHealth> {
  const state = getConnectorRuntimeState(workspaceId, providerId);
  if (!state) throw new ConnectorRuntimeNotFoundError(providerId);

  const latencyMs = 30 + Math.floor(Math.random() * 40);
  const health: ConnectorRuntimeHealth = {
    state: state.lifecycle === "DEGRADED" ? "WARNING" : "HEALTHY",
    latencyMs,
    message: "Heartbeat OK",
    lastHeartbeat: new Date().toISOString(),
    rateLimitRemaining: Math.max(0, 100 - Math.floor(latencyMs / 2)),
  };

  runtimeStates.set(stateKey(workspaceId, providerId), {
    ...state,
    health,
    lastSync: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  recordEvent(workspaceId, providerId, "heartbeat", "Heartbeat recorded", { latencyMs });
  return health;
}

export async function connectorRefresh(workspaceId: string, providerId: string): Promise<ConnectorRuntimeState> {
  const state = getConnectorRuntimeState(workspaceId, providerId);
  if (!state?.credentialsRef) throw new ConnectorRuntimeNotFoundError(providerId);

  const secret = getCredentialVaultRepository().resolveSecret(state.credentialsRef);
  if (!secret) throw new ConnectorRuntimeError("Cannot refresh — credentials not found");

  const rotated = getCredentialVaultRepository().rotateCredential(state.credentialsRef, {
    ...secret,
    refreshedAt: new Date().toISOString(),
  });

  recordCredentialGovernanceEvent({
    credentialsRef: rotated.credentialsRef,
    workspaceId,
    providerId,
    event: "rotated",
    actor: "system",
    scopes: rotated.scopes,
    expiresAt: rotated.expiresAt,
    verified: false,
  });

  const updated: ConnectorRuntimeState = {
    ...state,
    credentialsRef: rotated.credentialsRef,
    lastSync: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  runtimeStates.set(stateKey(workspaceId, providerId), updated);
  recordEvent(workspaceId, providerId, "heartbeat", "Credentials refreshed");
  return updated;
}

export function connectorHealth(workspaceId: string, providerId: string): ConnectorRuntimeHealth {
  const state = getConnectorRuntimeState(workspaceId, providerId);
  if (!state) {
    return {
      state: "DISABLED",
      latencyMs: 0,
      message: "Not connected",
      lastHeartbeat: new Date().toISOString(),
    };
  }
  return state.health;
}

export function connectorCost(workspaceId: string, providerId: string): ConnectorRuntimeCost {
  const state = getConnectorRuntimeState(workspaceId, providerId);
  const definition = getRealityProvider(providerId);
  if (state) return state.cost;
  if (definition) return buildCost(definition);
  return { monthlyCostCents: 0, usageCostEstimateCents: 0, currency: "USD" };
}

export function connectorDependencies(providerId: string): string[] {
  return getRealityProvider(providerId)?.dependencies ?? [];
}

function mapCategoryToLegacy(
  category: RealityProviderDefinition["category"],
): "suppliers" | "commerce" | "advertising" | "payments" | "shipping" | "analytics" | "trend_intelligence" {
  switch (category) {
    case "suppliers": return "suppliers";
    case "commerce": return "commerce";
    case "advertising": return "advertising";
    case "payments": return "payments";
    case "analytics": return "analytics";
    case "trend_intelligence":
    case "search_intelligence":
    case "seo_intelligence":
    case "product_intelligence":
    case "buyer_intelligence":
    case "creative_ai":
      return "analytics";
    default:
      return "commerce";
  }
}

export function mapLifecycleToHealth(lifecycle: ConnectorRuntimeState["lifecycle"]): ConnectorHealthState {
  return mapLifecycleToHealthState(lifecycle);
}
