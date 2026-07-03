/**
 * G8-06 — Operational Readiness Engine module contract.
 */

export const OPERATIONAL_READINESS_MODULE_ID = "operational-readiness-engine" as const;

export const OPERATIONAL_READINESS_CAPABILITIES = [
  "readiness_evaluation",
  "readiness_policy_resolution",
  "provider_readiness",
  "workspace_readiness",
  "workflow_readiness",
  "automation_readiness",
  "readiness_blockers",
  "readiness_recommendations",
  "cockpit_readiness_summary",
  "pillow_governance",
  "ekls_observation",
  "plugin_extension",
] as const;

export type OperationalReadinessCapability = (typeof OPERATIONAL_READINESS_CAPABILITIES)[number];

export type OperationalReadinessModuleContract = {
  moduleId: typeof OPERATIONAL_READINESS_MODULE_ID;
  missionId: "G8-06";
  programmeStatus: "operational-readiness-engine-established";
  capabilities: OperationalReadinessCapability[];
  integratesWith: string[];
  registryRefs: string[];
  brainTools: string[];
  eklsChannel: "operational-readiness-engine";
  pillowGovernance: true;
};

export function createOperationalReadinessModuleContract(): OperationalReadinessModuleContract {
  return {
    moduleId: OPERATIONAL_READINESS_MODULE_ID,
    missionId: "G8-06",
    programmeStatus: "operational-readiness-engine-established",
    capabilities: [...OPERATIONAL_READINESS_CAPABILITIES],
    integratesWith: [
      "identity-authorization-platform",
      "connection-registry",
      "authorization-framework",
      "credential-vault-integration",
      "connection-health-monitoring",
      "authorization-centre",
      "business-automation",
    ],
    registryRefs: [
      "REG-READINESS-POLICY",
      "REG-CONNECTION-PROVIDER",
      "REG-CONNECTION-REQUIREMENT",
      "REG-CONNECTION-CAPABILITY",
      "REG-CONNECTION-DEPENDENCY",
      "REG-IDENTITY-MONITOR",
      "REG-AUTOMATION-WORKFLOW",
      "REG-COMMERCE-POLICY",
    ],
    brainTools: [
      "readiness_overview",
      "readiness_for_workspace",
      "readiness_for_account_holder",
      "readiness_for_provider",
      "readiness_for_workflow",
      "readiness_for_automation",
      "readiness_blockers",
      "readiness_recommendations",
    ],
    eklsChannel: "operational-readiness-engine",
    pillowGovernance: true,
  };
}
