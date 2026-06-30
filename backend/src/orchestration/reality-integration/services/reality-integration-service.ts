import { captureSoulRuntimeEvent } from "../../../foundation/soul-runtime/services/soul-runtime-engine.js";
import {
  REALITY_PROVIDER_CATALOG,
  getRealityProvider,
  listRealityProviders,
} from "../models/provider-catalog.js";
import type {
  ConnectorHealthCenter,
  ConnectorRegistryEntry,
  RealityIntegrationDashboard,
  RealityIntegrationValidation,
} from "../models/reality-integration.js";
import {
  getCredentialVaultRepository,
  resetCredentialVaultRepository,
} from "../repositories/sqlite-credential-vault-repository.js";
import {
  getConnectorMonitoringRepository,
  resetConnectorMonitoringRepository,
} from "../repositories/sqlite-connector-monitoring-repository.js";
import { connectorGovernanceFlow } from "./connector-governance-service.js";
import {
  connectorConnect,
  connectorCost,
  connectorDependencies,
  connectorDisconnect,
  connectorHealth,
  connectorHeartbeat,
  connectorRefresh,
  connectorValidate,
  getConnectorRuntimeState,
  listConnectorRuntimeStates,
  mapLifecycleToHealth,
  resetConnectorRuntimeStates,
} from "./connector-runtime.js";

export {
  resetCredentialVaultRepository,
  resetConnectorMonitoringRepository,
  resetConnectorRuntimeStates,
};

export function listConnectorRegistry(): ConnectorRegistryEntry[] {
  return REALITY_PROVIDER_CATALOG.map((definition) => ({
    providerId: definition.providerId,
    definition,
    connectedWorkspaces: 0,
  }));
}

export function getConnectorRegistryEntry(providerId: string): ConnectorRegistryEntry | null {
  const definition = getRealityProvider(providerId);
  if (!definition) return null;
  return { providerId, definition, connectedWorkspaces: 0 };
}

function captureRealitySoulRuntime(
  workspaceId: string,
  title: string,
  summary: string,
  payload: Record<string, unknown>,
) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "businessMilestones",
      title,
      summary,
      source: "system",
      actor: "reality-integration",
      payload,
    });
  } catch {
    // best-effort
  }
}

export async function connectProvider(input: {
  workspaceId: string;
  companyId?: string;
  providerId: string;
  credentialType: "oauth" | "api_key" | "refresh_token" | "secret";
  secretPayload: Record<string, unknown>;
  scopes?: string[];
  actor?: string;
}) {
  const state = await connectorConnect(input);
  captureRealitySoulRuntime(input.workspaceId, "Connector connected", `${input.providerId} connected`, {
    providerId: input.providerId,
    credentialsRef: state.credentialsRef,
  });
  return state;
}

export async function disconnectProvider(
  workspaceId: string,
  providerId: string,
  actor = "system",
) {
  return connectorDisconnect(workspaceId, providerId, actor);
}

export function buildConnectorHealthCenter(workspaceId: string): ConnectorHealthCenter {
  const states = listConnectorRuntimeStates(workspaceId);
  const stateMap = new Map(states.map((s) => [s.providerId, s]));

  const entries = REALITY_PROVIDER_CATALOG.map((definition) => {
    const state = stateMap.get(definition.providerId);
    const lifecycle = state?.lifecycle ?? "DISCOVERED";
    const health = mapLifecycleToHealth(lifecycle);
    const warnings: string[] = [];

    if (definition.dependencies.length > 0 && (lifecycle === "CONNECTED" || lifecycle === "VERIFIED" || lifecycle === "READY" || lifecycle === "ACTIVE")) {
      for (const dep of definition.dependencies) {
        const depState = stateMap.get(dep);
        if (!depState || (depState.lifecycle !== "CONNECTED" && depState.lifecycle !== "VERIFIED" && depState.lifecycle !== "READY" && depState.lifecycle !== "ACTIVE")) {
          warnings.push(`Dependency ${dep} not connected`);
        }
      }
    }
    if (state?.credentialsRef && getCredentialVaultRepository().isExpired(state.credentialsRef)) {
      warnings.push("Credentials expired");
    }

    return {
      providerId: definition.providerId,
      displayName: definition.displayName,
      category: definition.category,
      health,
      lifecycle,
      monthlyCostCents: definition.monthlyCostCents,
      rateLimitPerMinute: definition.rateLimitPerMinute,
      latencyMs: state?.health.latencyMs ?? 0,
      lastSync: state?.lastSync ?? null,
      warnings,
    };
  });

  return {
    workspaceId,
    entries,
    healthy: entries.filter((e) => e.health === "HEALTHY").length,
    warning: entries.filter((e) => e.health === "WARNING").length,
    failed: entries.filter((e) => e.health === "FAILED").length,
    disabled: entries.filter((e) => e.health === "DISABLED").length,
    totalMonthlyCostCents: entries
      .filter((e) => e.lifecycle === "CONNECTED" || e.lifecycle === "VERIFIED" || e.lifecycle === "READY" || e.lifecycle === "ACTIVE")
      .reduce((sum, e) => sum + e.monthlyCostCents, 0),
    computedAt: new Date().toISOString(),
  };
}

export function buildRealityIntegrationDashboard(
  workspaceId: string,
  companyId: string,
): RealityIntegrationDashboard {
  const healthCenter = buildConnectorHealthCenter(workspaceId);
  const connected = healthCenter.entries
    .filter((e) => e.lifecycle !== "DISCOVERED" && e.lifecycle !== "REVOKED" && e.lifecycle !== "DISCONNECTED" && e.lifecycle !== "ERROR")
    .map((e) => e.providerId);
  const disconnected = healthCenter.entries
    .filter((e) => e.lifecycle === "DISCOVERED" || e.lifecycle === "REVOKED" || e.lifecycle === "DISCONNECTED")
    .map((e) => e.providerId);

  const warnings = healthCenter.entries.flatMap((e) => e.warnings);
  if (connected.length === 0) {
    warnings.push("No services connected — start with CJ Dropshipping and Stripe");
  }

  const priorityProviders = ["cj-dropshipping", "stripe", "shopify", "meta-ads", "ga4"];
  const recommendedConnections = priorityProviders.filter((id) => !connected.includes(id));

  return {
    workspaceId,
    companyId,
    connectedServices: connected,
    disconnectedServices: disconnected,
    monthlyCostCents: healthCenter.totalMonthlyCostCents,
    healthSummary: {
      healthy: healthCenter.healthy,
      warning: healthCenter.warning,
      failed: healthCenter.failed,
      disabled: healthCenter.disabled,
    },
    warnings: [...new Set(warnings)],
    capabilities: healthCenter.entries.map((e) => ({
      providerId: e.providerId,
      capabilities: getRealityProvider(e.providerId)?.capabilities ?? [],
    })),
    recommendedConnections,
    computedAt: new Date().toISOString(),
  };
}

export async function validateRealityIntegration(workspaceId: string): Promise<RealityIntegrationValidation> {
  const blockers: string[] = [];

  const registryValid = REALITY_PROVIDER_CATALOG.length >= 32;
  if (!registryValid) blockers.push("Registry incomplete");

  const vaultValid = typeof getCredentialVaultRepository().storeCredential === "function";
  if (!vaultValid) blockers.push("Vault unavailable");

  const governanceFlow = connectorGovernanceFlow();
  const governanceValid = governanceFlow.stages.length === 3 && governanceFlow.irreversibleActionsBlocked;
  if (!governanceValid) blockers.push("Governance flow invalid");

  let providersValidated = 0;
  for (const provider of REALITY_PROVIDER_CATALOG.slice(0, 5)) {
    try {
      await connectProvider({
        workspaceId,
        providerId: provider.providerId,
        credentialType: provider.authentication === "api_key" ? "api_key" : "oauth",
        secretPayload: provider.authentication === "api_key"
          ? { apiKey: `test-key-${provider.providerId}` }
          : { accessToken: `test-token-${provider.providerId}` },
        actor: "validation-runner",
      });
      const validation = await connectorValidate(workspaceId, provider.providerId);
      if (validation.valid) providersValidated++;
      await connectorHeartbeat(workspaceId, provider.providerId);
    } catch (error) {
      blockers.push(`Provider ${provider.providerId}: ${(error as Error).message}`);
    }
  }

  const runtimeValid = providersValidated >= 3;
  if (!runtimeValid) blockers.push("Runtime validation insufficient");

  const dashboard = buildRealityIntegrationDashboard(workspaceId, "co-validation");
  const dashboardValid = Boolean(dashboard.connectedServices.length >= 3);
  if (!dashboardValid) blockers.push("Dashboard integration failed");

  for (const provider of REALITY_PROVIDER_CATALOG.slice(0, 5)) {
    try {
      await disconnectProvider(workspaceId, provider.providerId, "validation-runner");
    } catch {
      // cleanup best-effort
    }
  }

  return {
    validationId: `riv-${Date.now()}`,
    workspaceId,
    valid: blockers.length === 0,
    runtimeValid,
    registryValid,
    vaultValid,
    governanceValid,
    dashboardValid,
    providersValidated,
    blockers,
    validatedAt: new Date().toISOString(),
  };
}

export {
  connectorValidate,
  connectorHeartbeat,
  connectorRefresh,
  connectorHealth,
  connectorCost,
  connectorDependencies,
  getConnectorRuntimeState,
  listConnectorRuntimeStates,
  listRealityProviders,
  getRealityProvider,
};

export { buildProviderCapabilityMatrix, getProviderCapabilityMatrixEntry } from "./provider-capability-matrix-service.js";
export { listApprovalPolicies, assessApprovalRequired } from "./approval-framework-service.js";
export { buildCredentialGovernanceSummary, verifyCredential, listExpiringCredentials } from "./credential-governance-service.js";
export { buildRealityReadinessDashboard } from "./reality-readiness-dashboard-service.js";
