/**
 * G5-09 — Canonical Automation Plugin Integration host.
 * Business Automation consumes the EmpireAI Plugin Framework — it never owns it.
 */

import type { RegistryPluginKind } from "../../../registry/types/plugin-manifest.js";
import {
  REG_AUTOMATION_EXECUTOR,
  REG_AUTOMATION_MONITOR,
  REG_AUTOMATION_POLICY,
  REG_AUTOMATION_TRIGGER,
  REG_AUTOMATION_WORKFLOW,
} from "../../../registry/types/registry-ids.js";
import { getRegistryLoader } from "../../../registry/registry-loader.js";
import { recordPluginAuditEvent } from "../audit/plugin-audit-recorder.js";
import type {
  AutomationPluginCapabilitySummary,
  AutomationPluginDiscoveryResult,
  AutomationPluginLifecycleState,
  AutomationPluginManifest,
  AutomationPluginRecord,
  AutomationPluginRegistrationResult,
} from "../contracts/automation-plugin-types.js";
import {
  validateAutomationPluginLifecycleGovernance,
  validateAutomationPluginManifestStructure,
  validateAutomationPluginTrust,
} from "../governance/automation-plugin-pillow-governance.js";
import {
  type AutomationPluginHookBundle,
  getAutomationPluginDomainRouter,
} from "./automation-plugin-domain-router.js";
import { resolveAutomationPluginRegistryPolicy } from "./automation-plugin-registry-resolver.js";

const AUTOMATION_REGISTRY_KINDS = new Set<RegistryPluginKind>([
  "automation_trigger",
  "automation_policy",
  "automation_scheduler",
  "automation_executor",
  "automation_recovery",
  "automation_notification",
  "automation_monitor",
]);

const CATEGORY_TO_REGISTRY_KIND: Partial<Record<AutomationPluginManifest["category"], RegistryPluginKind>> = {
  automation_trigger: "automation_trigger",
  automation_workflow: "workflow",
  automation_scheduler: "automation_scheduler",
  automation_execution: "automation_executor",
  automation_recovery: "automation_recovery",
  automation_monitoring: "automation_monitor",
  automation_notification: "automation_notification",
};

const CATEGORY_TO_TARGET_REGISTRY = {
  automation_trigger: REG_AUTOMATION_TRIGGER,
  automation_workflow: REG_AUTOMATION_WORKFLOW,
  automation_scheduler: REG_AUTOMATION_POLICY,
  automation_execution: REG_AUTOMATION_EXECUTOR,
  automation_recovery: REG_AUTOMATION_POLICY,
  automation_monitoring: REG_AUTOMATION_MONITOR,
  automation_notification: REG_AUTOMATION_POLICY,
  automation_approval: REG_AUTOMATION_POLICY,
  automation_reporting: REG_AUTOMATION_POLICY,
  business_engine_adapter: REG_AUTOMATION_EXECUTOR,
  executive_intelligence_adapter: REG_AUTOMATION_EXECUTOR,
  future_automation: REG_AUTOMATION_EXECUTOR,
} as const;

function nowIso(): string {
  return new Date().toISOString();
}

function isEnabledState(state: AutomationPluginLifecycleState): boolean {
  return state === "enabled" || state === "executing";
}

export class AutomationPluginHost {
  private readonly records = new Map<string, AutomationPluginRecord>();
  private readonly domainRouter = getAutomationPluginDomainRouter();

  discoverPlugins(input: {
    actorId: string;
    workspaceId: string;
    pillowGovernance: true;
  }): AutomationPluginDiscoveryResult {
    const governance = validateAutomationPluginLifecycleGovernance({
      pillowGovernance: input.pillowGovernance,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      operation: "discover",
    });

    if (!governance.allowed) {
      return { discoveredCount: 0, plugins: [], generatedAt: nowIso() };
    }

    const frameworkPlugins = getRegistryLoader()
      .listRegisteredPlugins()
      .filter((manifest) => AUTOMATION_REGISTRY_KINDS.has(manifest.kind));

    for (const manifest of frameworkPlugins) {
      if (this.records.has(manifest.pluginId)) continue;
      this.records.set(manifest.pluginId, {
        pluginId: manifest.pluginId,
        pluginName: manifest.description,
        version: manifest.version,
        owner: "framework:discovered",
        category: "future_automation",
        capabilities: [],
        supportedInterfaces: [],
        dependencies: [],
        registryReferences: [manifest.targetRegistryId],
        configuration: manifest.extensions,
        permissions: ["business-automation.discover"],
        compatibility: {},
        lifecycleState: "discovered",
        healthStatus: "unknown",
        pillowGovernance: true,
        registeredAt: manifest.registeredAt ?? nowIso(),
        updatedAt: nowIso(),
        failureCount: 0,
        registryBindingIds: [manifest.targetRegistryId],
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
    manifest: AutomationPluginManifest;
    pillowGovernance: true;
    actorId: string;
    workspaceId: string;
    hooks?: AutomationPluginHookBundle;
    killSwitchActive?: boolean;
  }): AutomationPluginRegistrationResult {
    if (this.records.has(input.manifest.pluginId)) {
      return {
        accepted: false,
        pluginId: input.manifest.pluginId,
        lifecycleState: "registered",
        reason: "Plugin already registered",
      };
    }

    const structure = validateAutomationPluginManifestStructure(input.manifest);
    if (!structure.allowed) {
      return {
        accepted: false,
        pluginId: input.manifest.pluginId,
        lifecycleState: "discovered",
        reason: structure.reason,
      };
    }

    const trust = validateAutomationPluginTrust(input.manifest);
    if (!trust.allowed) {
      return {
        accepted: false,
        pluginId: input.manifest.pluginId,
        lifecycleState: "discovered",
        reason: trust.reason,
      };
    }

    const governance = validateAutomationPluginLifecycleGovernance({
      pillowGovernance: input.pillowGovernance,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      operation: "register",
      killSwitchActive: input.killSwitchActive,
    });
    if (!governance.allowed) {
      return {
        accepted: false,
        pluginId: input.manifest.pluginId,
        lifecycleState: "discovered",
        reason: governance.reason,
      };
    }

    const policy = resolveAutomationPluginRegistryPolicy({
      pluginId: input.manifest.pluginId,
      category: input.manifest.category,
      registryReferences: input.manifest.registryReferences,
    });

    if (!policy.allowed) {
      return {
        accepted: false,
        pluginId: input.manifest.pluginId,
        lifecycleState: "validated",
        reason: policy.reason,
      };
    }

    const registryKind =
      CATEGORY_TO_REGISTRY_KIND[input.manifest.category] ?? "automation_executor";
    const targetRegistryId = CATEGORY_TO_TARGET_REGISTRY[input.manifest.category];

    const frameworkResult = getRegistryLoader().registerPlugin({
      pluginId: input.manifest.pluginId,
      kind: registryKind,
      targetRegistryId,
      tier: "policy_topology",
      version: input.manifest.version,
      description: input.manifest.pluginName,
      extensions: {
        category: input.manifest.category,
        capabilities: input.manifest.capabilities,
        supportedInterfaces: input.manifest.supportedInterfaces,
        registryReferences: input.manifest.registryReferences,
        configuration: input.manifest.configuration,
        permissions: input.manifest.permissions,
        compatibility: input.manifest.compatibility,
      },
    });

    if (!frameworkResult.accepted) {
      return {
        accepted: false,
        pluginId: input.manifest.pluginId,
        lifecycleState: "validated",
        reason: frameworkResult.message,
      };
    }

    const timestamp = nowIso();
    const record: AutomationPluginRecord = {
      ...input.manifest,
      lifecycleState: "registered",
      healthStatus: "healthy",
      workspaceId: input.workspaceId,
      pillowGovernance: true,
      registeredAt: timestamp,
      updatedAt: timestamp,
      failureCount: 0,
      registryBindingIds: [
        ...policy.executorRegistryIds,
        ...policy.workflowRegistryIds,
        ...policy.policyRegistryIds,
        ...policy.monitorRegistryIds,
      ],
    };

    this.records.set(input.manifest.pluginId, record);

    recordPluginAuditEvent({
      eventType: "plugin_registered",
      pluginId: input.manifest.pluginId,
      category: input.manifest.category,
      lifecycleState: "registered",
      workspaceId: input.workspaceId,
      actorId: input.actorId,
      reason: policy.reason,
      evidence: { registryBindingIds: record.registryBindingIds },
    });

    this.loadPlugin({
      pluginId: input.manifest.pluginId,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      pillowGovernance: true,
      hooks: input.hooks,
    });

    return {
      accepted: true,
      pluginId: input.manifest.pluginId,
      lifecycleState: this.records.get(input.manifest.pluginId)!.lifecycleState,
      reason: "Plugin registered through Plugin Framework and domain router",
    };
  }

  loadPlugin(input: {
    pluginId: string;
    actorId: string;
    workspaceId: string;
    pillowGovernance: true;
    hooks?: AutomationPluginHookBundle;
  }): AutomationPluginRegistrationResult {
    const record = this.records.get(input.pluginId);
    if (!record) {
      return {
        accepted: false,
        pluginId: input.pluginId,
        lifecycleState: "discovered",
        reason: "Plugin not found",
      };
    }

    if (input.hooks) {
      this.domainRouter.applyHooks(input.pluginId, record.category, input.hooks);
    }

    record.lifecycleState = "loaded";
    record.updatedAt = nowIso();
    record.lastActivityAt = record.updatedAt;

    this.enablePlugin({
      pluginId: input.pluginId,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      pillowGovernance: true,
    });

    return {
      accepted: true,
      pluginId: input.pluginId,
      lifecycleState: record.lifecycleState,
      reason: "Plugin loaded into domain registries",
    };
  }

  enablePlugin(input: {
    pluginId: string;
    actorId: string;
    workspaceId: string;
    pillowGovernance: true;
  }): AutomationPluginRegistrationResult {
    const record = this.records.get(input.pluginId);
    if (!record) {
      return {
        accepted: false,
        pluginId: input.pluginId,
        lifecycleState: "discovered",
        reason: "Plugin not found",
      };
    }

    const governance = validateAutomationPluginLifecycleGovernance({
      pillowGovernance: input.pillowGovernance,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      operation: "enable",
    });
    if (!governance.allowed) {
      return {
        accepted: false,
        pluginId: input.pluginId,
        lifecycleState: record.lifecycleState,
        reason: governance.reason,
      };
    }

    record.lifecycleState = "enabled";
    record.healthStatus = "healthy";
    record.updatedAt = nowIso();
    record.lastActivityAt = record.updatedAt;

    recordPluginAuditEvent({
      eventType: "plugin_activated",
      pluginId: input.pluginId,
      category: record.category,
      lifecycleState: "enabled",
      workspaceId: input.workspaceId,
      actorId: input.actorId,
      reason: "Plugin enabled under Pillow governance",
    });

    return {
      accepted: true,
      pluginId: input.pluginId,
      lifecycleState: "enabled",
      reason: "Plugin enabled",
    };
  }

  disablePlugin(input: {
    pluginId: string;
    actorId: string;
    workspaceId: string;
    pillowGovernance: true;
  }): AutomationPluginRegistrationResult {
    const record = this.records.get(input.pluginId);
    if (!record) {
      return {
        accepted: false,
        pluginId: input.pluginId,
        lifecycleState: "discovered",
        reason: "Plugin not found",
      };
    }

    record.lifecycleState = "disabled";
    record.updatedAt = nowIso();

    recordPluginAuditEvent({
      eventType: "plugin_disabled",
      pluginId: input.pluginId,
      category: record.category,
      lifecycleState: "disabled",
      workspaceId: input.workspaceId,
      actorId: input.actorId,
      reason: "Plugin disabled under Pillow governance",
    });

    return {
      accepted: true,
      pluginId: input.pluginId,
      lifecycleState: "disabled",
      reason: "Plugin disabled",
    };
  }

  unloadPlugin(input: {
    pluginId: string;
    actorId: string;
    workspaceId: string;
    pillowGovernance: true;
  }): AutomationPluginRegistrationResult {
    const record = this.records.get(input.pluginId);
    if (!record) {
      return {
        accepted: false,
        pluginId: input.pluginId,
        lifecycleState: "discovered",
        reason: "Plugin not found",
      };
    }

    this.domainRouter.removeHooks(input.pluginId);
    record.lifecycleState = "unloaded";
    record.updatedAt = nowIso();

    recordPluginAuditEvent({
      eventType: "plugin_unloaded",
      pluginId: input.pluginId,
      category: record.category,
      lifecycleState: "unloaded",
      workspaceId: input.workspaceId,
      actorId: input.actorId,
      reason: "Plugin hooks removed from domain registries",
    });

    return {
      accepted: true,
      pluginId: input.pluginId,
      lifecycleState: "unloaded",
      reason: "Plugin unloaded",
    };
  }

  recordExecution(input: {
    pluginId: string;
    actorId: string;
    workspaceId: string;
    success: boolean;
    reason: string;
  }): void {
    const record = this.records.get(input.pluginId);
    if (!record || !isEnabledState(record.lifecycleState)) return;

    record.lifecycleState = "executing";
    record.lastActivityAt = nowIso();
    record.updatedAt = record.lastActivityAt;

    if (input.success) {
      record.healthStatus = "healthy";
      recordPluginAuditEvent({
        eventType: "plugin_execution",
        pluginId: input.pluginId,
        category: record.category,
        lifecycleState: "executing",
        workspaceId: input.workspaceId,
        actorId: input.actorId,
        reason: input.reason,
      });
      record.lifecycleState = "enabled";
      return;
    }

    record.failureCount += 1;
    record.healthStatus = record.failureCount >= 3 ? "failed" : "degraded";
    recordPluginAuditEvent({
      eventType: "plugin_failure",
      pluginId: input.pluginId,
      category: record.category,
      lifecycleState: record.lifecycleState,
      workspaceId: input.workspaceId,
      actorId: input.actorId,
      reason: input.reason,
    });
    record.lifecycleState = "enabled";
  }

  getPlugin(pluginId: string): AutomationPluginRecord | undefined {
    return this.records.get(pluginId);
  }

  listPlugins(workspaceId?: string): AutomationPluginRecord[] {
    return [...this.records.values()].filter((record) => {
      if (!workspaceId) return true;
      return !record.workspaceId || record.workspaceId === workspaceId;
    });
  }

  listPluginSummaries(workspaceId?: string): Array<{
    pluginId: string;
    pluginName: string;
    version: string;
    category: string;
    lifecycleState: AutomationPluginLifecycleState;
    healthStatus: string;
    capabilities: string[];
    lastActivityAt?: string;
  }> {
    return this.listPlugins(workspaceId).map((record) => ({
      pluginId: record.pluginId,
      pluginName: record.pluginName,
      version: record.version,
      category: record.category,
      lifecycleState: record.lifecycleState,
      healthStatus: record.healthStatus,
      capabilities: record.capabilities,
      lastActivityAt: record.lastActivityAt,
    }));
  }

  listEnabledCapabilities(): AutomationPluginCapabilitySummary[] {
    return this.listPlugins()
      .filter((record) => isEnabledState(record.lifecycleState))
      .map((record) => ({
        pluginId: record.pluginId,
        pluginName: record.pluginName,
        category: record.category,
        capabilities: record.capabilities,
        supportedInterfaces: record.supportedInterfaces,
        lifecycleState: record.lifecycleState,
        healthStatus: record.healthStatus,
        enabled: true,
      }));
  }

  resetForTests(): void {
    this.records.clear();
    this.domainRouter.resetForTests();
  }
}

let sharedHost: AutomationPluginHost | undefined;

export function getAutomationPluginHost(): AutomationPluginHost {
  if (!sharedHost) {
    sharedHost = new AutomationPluginHost();
  }
  return sharedHost;
}

export function resetAutomationPluginHostForTests(): void {
  sharedHost = undefined;
}
