/**
 * G8-09 — Identity plugin lifecycle manager (canonical host).
 * Identity & Authorization consumes the EmpireAI Plugin Framework — it never owns it.
 */

import {
  identityPluginManifestSchema,
  type IdentityPluginCapabilitySummary,
  type IdentityPluginDiscoveryResult,
  type IdentityPluginLifecycleState,
  type IdentityPluginManifest,
  type IdentityPluginRecord,
  type IdentityPluginRegistrationResult,
} from "../contracts/identity-plugin-types.js";
import {
  listIdentityPluginsFromFramework,
  registerIdentityPluginThroughFramework,
} from "../framework/identity-plugin-framework-bridge.js";
import { validateIdentityPluginLifecycleGovernance } from "../governance/identity-plugin-pillow-governance.js";
import { recordIdentityPluginEklsObservation } from "../ekls/identity-plugin-ekls-integration.js";
import {
  IDENTITY_PLUGIN_CATEGORY_TO_TARGET_REGISTRY,
  resolveIdentityPluginRegistryPolicy,
} from "../registry/identity-plugin-registry-policy-resolver.js";
import {
  resolveIdentityPluginCapabilities,
  resolveIdentityPluginProviderCoverage,
} from "../registry/identity-plugin-capability-resolver.js";
import { validateIdentityPlugin } from "../services/identity-plugin-compatibility-service.js";
import {
  applyIdentityPluginHealthReport,
  evaluateIdentityPluginHealth,
} from "../services/identity-plugin-health-service.js";
import { getIdentityPluginDomainRouter } from "../router/identity-plugin-domain-router.js";

function nowIso(): string {
  return new Date().toISOString();
}

function isEnabledState(state: IdentityPluginLifecycleState): boolean {
  return state === "enabled" || state === "loaded";
}

export class IdentityPluginLifecycleManager {
  private readonly records = new Map<string, IdentityPluginRecord>();
  private readonly domainRouter = getIdentityPluginDomainRouter();

  discoverPlugins(input: {
    actorId: string;
    workspaceId: string;
    ownerId: string;
    pillowGovernance: true;
  }): IdentityPluginDiscoveryResult {
    const governance = validateIdentityPluginLifecycleGovernance({
      pillowGovernance: input.pillowGovernance,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      operation: "discover",
    });

    if (!governance.allowed) {
      return { discoveredCount: 0, plugins: [], generatedAt: nowIso() };
    }

    const frameworkPlugins = listIdentityPluginsFromFramework();

    for (const manifest of frameworkPlugins) {
      if (this.records.has(manifest.pluginId)) continue;
      const category =
        typeof manifest.extensions.category === "string"
          ? (manifest.extensions.category as IdentityPluginManifest["pluginCategory"])
          : "future_identity_plugin";

      const timestamp = nowIso();
      this.records.set(manifest.pluginId, {
        pluginId: manifest.pluginId,
        pluginName: manifest.description,
        pluginVersion: manifest.version,
        pluginOwner: String(manifest.extensions.pluginOwner ?? "framework:discovered"),
        pluginCategory: category,
        supportedProviders: Array.isArray(manifest.extensions.supportedProviders)
          ? (manifest.extensions.supportedProviders as string[])
          : [],
        supportedConnectionTypes: [],
        supportedCredentialTypes: [],
        capabilities: Array.isArray(manifest.extensions.capabilities)
          ? (manifest.extensions.capabilities as string[])
          : [],
        requiredPermissions: Array.isArray(manifest.extensions.requiredPermissions)
          ? (manifest.extensions.requiredPermissions as string[])
          : ["identity-authorization.discover"],
        registryReferences: [manifest.targetRegistryId],
        configurationSchema: {},
        healthCheck: { checkType: "ping" },
        compatibilityMatrix: {},
        lifecycleHooks: {},
        governanceState: "pillow-governed",
        pillowGovernance: true,
        status: "discovered",
        healthStatus: "unknown",
        workspaceId: input.workspaceId,
        registryBindingIds: [manifest.targetRegistryId],
        warnings: [],
        errors: [],
        createdAt: manifest.registeredAt ?? timestamp,
        updatedAt: timestamp,
        lastHealthCheckedAt: null,
        failureCount: 0,
      });
    }

    return {
      discoveredCount: frameworkPlugins.length,
      plugins: frameworkPlugins.map((manifest) => ({
        pluginId: manifest.pluginId,
        kind: manifest.kind,
        version: manifest.version,
        targetRegistryId: manifest.targetRegistryId,
        registeredAt: manifest.registeredAt,
      })),
      generatedAt: nowIso(),
    };
  }

  registerPlugin(input: {
    manifest: IdentityPluginManifest;
    actorId: string;
    workspaceId: string;
    ownerId: string;
    accountHolderId: string;
    pillowGovernance: true;
    autoEnable?: boolean;
  }): IdentityPluginRegistrationResult {
    const manifest = identityPluginManifestSchema.parse(input.manifest);

    if (this.records.has(manifest.pluginId)) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        lifecycleState: "registered",
        reason: "Plugin already registered",
      };
    }

    const validation = validateIdentityPlugin({
      manifest,
      workspaceId: input.workspaceId,
    });
    if (!validation.valid) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        lifecycleState: validation.lifecycleState,
        reason: validation.reason,
      };
    }

    const governance = validateIdentityPluginLifecycleGovernance({
      pillowGovernance: input.pillowGovernance,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      operation: "register",
    });
    if (!governance.allowed) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        lifecycleState: "discovered",
        reason: governance.reason,
      };
    }

    const policy = resolveIdentityPluginRegistryPolicy({
      pluginId: manifest.pluginId,
      category: manifest.pluginCategory,
      registryReferences: manifest.registryReferences,
      context: { workspaceId: input.workspaceId },
    });

    if (!policy.allowed) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        lifecycleState: "validated",
        reason: policy.reason,
      };
    }

    const targetRegistryId = IDENTITY_PLUGIN_CATEGORY_TO_TARGET_REGISTRY[manifest.pluginCategory];
    const frameworkResult = registerIdentityPluginThroughFramework(manifest, targetRegistryId);
    if (!frameworkResult.accepted) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        lifecycleState: "validated",
        reason: frameworkResult.message,
      };
    }

    const routeResult = this.domainRouter.routeRegistration(manifest, {
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      accountHolderId: input.accountHolderId,
      pillowGovernance: true,
    });

    if (!routeResult.accepted) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        lifecycleState: "failed",
        reason: routeResult.reason,
      };
    }

    const timestamp = nowIso();
    const lifecycleState: IdentityPluginLifecycleState = input.autoEnable === false ? "registered" : "enabled";

    const record: IdentityPluginRecord = {
      ...manifest,
      status: lifecycleState,
      healthStatus: "healthy",
      workspaceId: input.workspaceId,
      registryBindingIds: [...new Set([...policy.bindingIds, targetRegistryId])],
      warnings: validation.warnings,
      errors: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      lastHealthCheckedAt: timestamp,
      failureCount: 0,
    };

    this.records.set(manifest.pluginId, record);

    recordIdentityPluginEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      pluginId: manifest.pluginId,
      kind: "identity_plugin_registered",
      summary: `Identity plugin registered in ${routeResult.subsystem}`,
      pillowGovernance: true,
    });

    if (isEnabledState(lifecycleState)) {
      recordIdentityPluginEklsObservation({
        actorId: input.actorId,
        workspaceId: input.workspaceId,
        ownerId: input.ownerId,
        pluginId: manifest.pluginId,
        kind: "identity_plugin_enabled",
        summary: "Identity plugin enabled after registration",
        pillowGovernance: true,
      });
    }

    return {
      accepted: true,
      pluginId: manifest.pluginId,
      lifecycleState,
      reason: "Identity plugin registered through Plugin Framework and domain router",
      registryBindingIds: record.registryBindingIds,
    };
  }

  enablePlugin(input: {
    pluginId: string;
    actorId: string;
    workspaceId: string;
    ownerId: string;
    pillowGovernance: true;
  }): IdentityPluginRegistrationResult {
    const record = this.records.get(input.pluginId);
    if (!record) {
      return {
        accepted: false,
        pluginId: input.pluginId,
        lifecycleState: "unknown",
        reason: "Plugin not found",
      };
    }

    if (record.workspaceId !== input.workspaceId) {
      return {
        accepted: false,
        pluginId: input.pluginId,
        lifecycleState: record.status,
        reason: "Cross-workspace plugin enable blocked",
      };
    }

    const governance = validateIdentityPluginLifecycleGovernance({
      pillowGovernance: input.pillowGovernance,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      operation: "enable",
      targetWorkspaceId: record.workspaceId,
    });
    if (!governance.allowed) {
      return {
        accepted: false,
        pluginId: input.pluginId,
        lifecycleState: record.status,
        reason: governance.reason,
      };
    }

    const timestamp = nowIso();
    this.records.set(input.pluginId, {
      ...record,
      status: "enabled",
      updatedAt: timestamp,
    });

    recordIdentityPluginEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      pluginId: input.pluginId,
      kind: "identity_plugin_enabled",
      summary: "Identity plugin enabled",
      pillowGovernance: true,
    });

    return {
      accepted: true,
      pluginId: input.pluginId,
      lifecycleState: "enabled",
      reason: "Identity plugin enabled",
    };
  }

  disablePlugin(input: {
    pluginId: string;
    actorId: string;
    workspaceId: string;
    ownerId: string;
    pillowGovernance: true;
  }): IdentityPluginRegistrationResult {
    const record = this.records.get(input.pluginId);
    if (!record) {
      return {
        accepted: false,
        pluginId: input.pluginId,
        lifecycleState: "unknown",
        reason: "Plugin not found",
      };
    }

    if (record.workspaceId !== input.workspaceId) {
      return {
        accepted: false,
        pluginId: input.pluginId,
        lifecycleState: record.status,
        reason: "Cross-workspace plugin disable blocked",
      };
    }

    const governance = validateIdentityPluginLifecycleGovernance({
      pillowGovernance: input.pillowGovernance,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      operation: "disable",
      targetWorkspaceId: record.workspaceId,
    });
    if (!governance.allowed) {
      return {
        accepted: false,
        pluginId: input.pluginId,
        lifecycleState: record.status,
        reason: governance.reason,
      };
    }

    const timestamp = nowIso();
    this.records.set(input.pluginId, {
      ...record,
      status: "disabled",
      updatedAt: timestamp,
    });

    recordIdentityPluginEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      pluginId: input.pluginId,
      kind: "identity_plugin_disabled",
      summary: "Identity plugin disabled",
      pillowGovernance: true,
    });

    return {
      accepted: true,
      pluginId: input.pluginId,
      lifecycleState: "disabled",
      reason: "Identity plugin disabled",
    };
  }

  getPluginDetail(input: {
    pluginId: string;
    actorId: string;
    workspaceId: string;
    ownerId: string;
    pillowGovernance: true;
  }): IdentityPluginRecord | null {
    const governance = validateIdentityPluginLifecycleGovernance({
      pillowGovernance: input.pillowGovernance,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      operation: "validate",
    });
    if (!governance.allowed) return null;

    const record = this.records.get(input.pluginId);
    if (!record || record.workspaceId !== input.workspaceId) return null;
    return record;
  }

  listPlugins(input: {
    actorId: string;
    workspaceId: string;
    ownerId: string;
    pillowGovernance: true;
  }): IdentityPluginRecord[] {
    const governance = validateIdentityPluginLifecycleGovernance({
      pillowGovernance: input.pillowGovernance,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      operation: "discover",
    });
    if (!governance.allowed) return [];

    return [...this.records.values()].filter((record) => record.workspaceId === input.workspaceId);
  }

  listCapabilities(input: {
    actorId: string;
    workspaceId: string;
    ownerId: string;
    pillowGovernance: true;
  }): IdentityPluginCapabilitySummary[] {
    return this.listPlugins(input)
      .filter((record) => isEnabledState(record.status))
      .map((record) => ({
        pluginId: record.pluginId,
        pluginCategory: record.pluginCategory,
        capabilities: resolveIdentityPluginCapabilities(record),
        supportedProviders: resolveIdentityPluginProviderCoverage(record),
        supportedConnectionTypes: record.supportedConnectionTypes,
        supportedCredentialTypes: record.supportedCredentialTypes,
        registryBindingIds: record.registryBindingIds,
        lifecycleState: record.status,
        healthStatus: record.healthStatus,
      }));
  }

  checkPluginHealth(input: {
    pluginId: string;
    actorId: string;
    workspaceId: string;
    ownerId: string;
    pillowGovernance: true;
  }) {
    const record = this.getPluginDetail(input);
    if (!record) {
      return {
        pluginId: input.pluginId,
        healthStatus: "unknown" as const,
        reason: "Plugin not found or workspace boundary blocked",
      };
    }

    const governance = validateIdentityPluginLifecycleGovernance({
      pillowGovernance: input.pillowGovernance,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      operation: "health",
      targetWorkspaceId: record.workspaceId,
    });
    if (!governance.allowed) {
      return {
        pluginId: input.pluginId,
        healthStatus: "unknown" as const,
        reason: governance.reason,
      };
    }

    const report = evaluateIdentityPluginHealth(record);
    const updated = applyIdentityPluginHealthReport(record, report);
    this.records.set(input.pluginId, updated);

    if (record.healthStatus !== report.healthStatus) {
      recordIdentityPluginEklsObservation({
        actorId: input.actorId,
        workspaceId: input.workspaceId,
        ownerId: input.ownerId,
        pluginId: input.pluginId,
        kind: "identity_plugin_health_changed",
        summary: `Health changed to ${report.healthStatus}: ${report.message}`,
        pillowGovernance: true,
      });
    }

    return report;
  }

  resetForTests(): void {
    this.records.clear();
    this.domainRouter.resetForTests();
  }
}

let sharedHost: IdentityPluginLifecycleManager | undefined;

export function getIdentityPluginHost(): IdentityPluginLifecycleManager {
  if (!sharedHost) {
    sharedHost = new IdentityPluginLifecycleManager();
  }
  return sharedHost;
}

export function registerIdentityPlugin(
  input: Parameters<IdentityPluginLifecycleManager["registerPlugin"]>[0],
): IdentityPluginRegistrationResult {
  return getIdentityPluginHost().registerPlugin(input);
}

export function enableIdentityPlugin(
  input: Parameters<IdentityPluginLifecycleManager["enablePlugin"]>[0],
): IdentityPluginRegistrationResult {
  return getIdentityPluginHost().enablePlugin(input);
}

export function disableIdentityPlugin(
  input: Parameters<IdentityPluginLifecycleManager["disablePlugin"]>[0],
): IdentityPluginRegistrationResult {
  return getIdentityPluginHost().disablePlugin(input);
}

export function discoverIdentityPlugins(
  input: Parameters<IdentityPluginLifecycleManager["discoverPlugins"]>[0],
): IdentityPluginDiscoveryResult {
  return getIdentityPluginHost().discoverPlugins(input);
}

export function listIdentityPlugins(
  input: Parameters<IdentityPluginLifecycleManager["listPlugins"]>[0],
): IdentityPluginRecord[] {
  return getIdentityPluginHost().listPlugins(input);
}

export function getIdentityPluginDetail(
  input: Parameters<IdentityPluginLifecycleManager["getPluginDetail"]>[0],
): IdentityPluginRecord | null {
  return getIdentityPluginHost().getPluginDetail(input);
}

export function listIdentityPluginCapabilities(
  input: Parameters<IdentityPluginLifecycleManager["listCapabilities"]>[0],
): IdentityPluginCapabilitySummary[] {
  return getIdentityPluginHost().listCapabilities(input);
}

export function checkIdentityPluginHealth(
  input: Parameters<IdentityPluginLifecycleManager["checkPluginHealth"]>[0],
) {
  return getIdentityPluginHost().checkPluginHealth(input);
}

export function resetIdentityPluginLifecycleManagerForTests(): void {
  sharedHost = undefined;
}
