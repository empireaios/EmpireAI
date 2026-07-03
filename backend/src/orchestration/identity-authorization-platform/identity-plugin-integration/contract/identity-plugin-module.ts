/**
 * G8-09 — Identity plugin integration module contract.
 */

export const IDENTITY_PLUGIN_INTEGRATION_MODULE_ID = "identity-plugin-integration" as const;

export const IDENTITY_PLUGIN_INTEGRATION_CAPABILITIES = [
  "identity_plugin_contract",
  "provider_plugin_registration",
  "oauth_plugin_registration",
  "credential_plugin_registration",
  "health_plugin_registration",
  "readiness_plugin_registration",
  "reauthorization_plugin_registration",
  "isolation_plugin_registration",
  "notification_plugin_registration",
  "plugin_lifecycle_manager",
  "plugin_compatibility_validation",
  "plugin_health_monitoring",
  "plugin_capability_resolver",
  "plugin_framework_integration",
  "pillow_governance",
  "ekls_plugin_records",
  "cockpit_plugin_contracts",
] as const;

export type IdentityPluginIntegrationCapability = (typeof IDENTITY_PLUGIN_INTEGRATION_CAPABILITIES)[number];

export type IdentityPluginIntegrationModuleContract = {
  moduleId: typeof IDENTITY_PLUGIN_INTEGRATION_MODULE_ID;
  missionId: "G8-09";
  programmeStatus: "identity-plugin-integration-established";
  capabilities: IdentityPluginIntegrationCapability[];
  integratesWith: string[];
  registryRefs: string[];
  brainTools: string[];
  eklsChannel: "identity-plugin-integration";
  pillowGovernance: true;
};

export function createIdentityPluginIntegrationModuleContract(): IdentityPluginIntegrationModuleContract {
  return {
    moduleId: IDENTITY_PLUGIN_INTEGRATION_MODULE_ID,
    missionId: "G8-09",
    programmeStatus: "identity-plugin-integration-established",
    capabilities: [...IDENTITY_PLUGIN_INTEGRATION_CAPABILITIES],
    integratesWith: [
      "identity-authorization-platform",
      "connection-registry",
      "authorization-framework",
      "credential-vault-integration",
      "connection-health-monitoring",
      "operational-readiness-engine",
      "automatic-reauthorization",
      "multi-workspace-isolation",
      "authorization-centre",
      "EmpireAIPluginFramework",
    ],
    registryRefs: [
      "REG-CONNECTION-PROVIDER",
      "REG-CONNECTION-TYPE",
      "REG-CONNECTION-CAPABILITY",
      "REG-CONNECTION-POLICY",
      "REG-IDENTITY-PROVIDER",
      "REG-AUTHORIZATION-PROVIDER",
      "REG-IDENTITY-MONITOR",
      "REG-READINESS-POLICY",
    ],
    brainTools: [
      "identity_plugin_list",
      "identity_plugin_detail",
      "identity_plugin_validate",
      "identity_plugin_enable",
      "identity_plugin_disable",
      "identity_plugin_health",
      "identity_plugin_capabilities",
    ],
    eklsChannel: "identity-plugin-integration",
    pillowGovernance: true,
  };
}
