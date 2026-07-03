/**
 * G5-09 — Automation Plugin Integration contract.
 */

export const AUTOMATION_PLUGIN_LIFECYCLE_STATES = [
  "discovered",
  "validated",
  "registered",
  "loaded",
  "enabled",
  "executing",
  "disabled",
  "unloaded",
  "deprecated",
  "retired",
] as const;

export type AutomationPluginLifecycleState = (typeof AUTOMATION_PLUGIN_LIFECYCLE_STATES)[number];

export const AUTOMATION_PLUGIN_CATEGORIES = [
  "automation_trigger",
  "automation_workflow",
  "automation_scheduler",
  "automation_approval",
  "automation_execution",
  "automation_recovery",
  "automation_monitoring",
  "automation_notification",
  "automation_reporting",
  "business_engine_adapter",
  "executive_intelligence_adapter",
  "future_automation",
] as const;

export type AutomationPluginCategory = (typeof AUTOMATION_PLUGIN_CATEGORIES)[number];

export type AutomationPluginHealthStatus = "healthy" | "degraded" | "failed" | "unknown";

export type AutomationPluginManifest = {
  pluginId: string;
  pluginName: string;
  version: string;
  owner: string;
  category: AutomationPluginCategory;
  capabilities: string[];
  supportedInterfaces: string[];
  dependencies: string[];
  registryReferences: string[];
  configuration: Record<string, unknown>;
  permissions: string[];
  lifecycleHooks?: Record<string, string>;
  compatibility: {
    minFrameworkVersion?: string;
    maxFrameworkVersion?: string;
  };
  trustLevel?: "standard" | "verified" | "enterprise";
};

export type AutomationPluginRecord = AutomationPluginManifest & {
  lifecycleState: AutomationPluginLifecycleState;
  healthStatus: AutomationPluginHealthStatus;
  workspaceId?: string;
  pillowGovernance: true;
  registeredAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  failureCount: number;
  registryBindingIds: string[];
};

export type ResolvedAutomationPluginPolicy = {
  pluginId: string;
  category: AutomationPluginCategory;
  executorRegistryIds: string[];
  workflowRegistryIds: string[];
  policyRegistryIds: string[];
  monitorRegistryIds: string[];
  allowed: boolean;
  reason: string;
};

export type AutomationPluginRegistrationResult = {
  accepted: boolean;
  pluginId: string;
  lifecycleState: AutomationPluginLifecycleState;
  reason: string;
};

export type AutomationPluginDiscoveryResult = {
  discoveredCount: number;
  plugins: Array<{
    pluginId: string;
    kind: string;
    version: string;
    targetRegistryId: string;
    registeredAt?: string;
  }>;
  generatedAt: string;
};

export type AutomationPluginCapabilitySummary = {
  pluginId: string;
  pluginName: string;
  category: AutomationPluginCategory;
  capabilities: string[];
  supportedInterfaces: string[];
  lifecycleState: AutomationPluginLifecycleState;
  healthStatus: AutomationPluginHealthStatus;
  enabled: boolean;
};
