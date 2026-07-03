/**
 * G7-08 — Identity monitor seed (REG-IDENTITY-MONITOR).
 */

import {
  PRODUCTION_WORKSPACE_REGISTRY_VERSION,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";

export const IDENTITY_MONITOR_SEED_ROWS: ProductionWorkspaceRegistryRowBase[] = [
  {
    id: "identity-monitor-grand-king-production",
    name: "Grand King Production Identity Monitor",
    description: "Registry-driven identity health monitoring for self-healing operations",
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-IDENTITY-PROVIDER", "REG-READINESS-POLICY"],
    capabilities: ["identity-monitor", "self-heal"],
    configuration: {
      identityMonitor: {
        schemaVersion: PRODUCTION_WORKSPACE_REGISTRY_VERSION,
        monitorId: "identity-monitor-grand-king-production",
        monitorName: "Grand King Production Identity Monitor",
        identityProviderRef: "REG-IDENTITY-PROVIDER",
        healthSignalRefs: ["signal:identity-session", "signal:authorization-scope"],
        degradationRuleRefs: ["rule:identity-degradation", "rule:authorization-failure"],
        recoveryRuleRefs: ["rule:identity-reconnect", "rule:identity-revalidate"],
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: PRODUCTION_WORKSPACE_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-IDENTITY-MONITOR rows" },
  },
];
