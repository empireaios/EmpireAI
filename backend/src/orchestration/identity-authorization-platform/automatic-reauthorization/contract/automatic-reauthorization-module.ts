/**
 * G8-07 — Automatic Reauthorization module contract.
 */

export const AUTOMATIC_REAUTHORIZATION_MODULE_ID = "automatic-reauthorization" as const;

export const AUTOMATIC_REAUTHORIZATION_CAPABILITIES = [
  "token_lifecycle_evaluation",
  "expiry_detection",
  "refresh_eligibility",
  "reconnect_resolution",
  "reauthorization_scheduling",
  "reauthorization_state_machine",
  "expiry_warnings",
  "reconnect_actions",
  "cockpit_lifecycle_summary",
  "pillow_governance",
  "ekls_lifecycle_observation",
  "plugin_extension",
  "notification_contracts",
] as const;

export type AutomaticReauthorizationCapability = (typeof AUTOMATIC_REAUTHORIZATION_CAPABILITIES)[number];

export type AutomaticReauthorizationModuleContract = {
  moduleId: typeof AUTOMATIC_REAUTHORIZATION_MODULE_ID;
  missionId: "G8-07";
  programmeStatus: "automatic-reauthorization-established";
  capabilities: AutomaticReauthorizationCapability[];
  integratesWith: string[];
  registryRefs: string[];
  brainTools: string[];
  eklsChannel: "automatic-reauthorization";
  pillowGovernance: true;
};

export function createAutomaticReauthorizationModuleContract(): AutomaticReauthorizationModuleContract {
  return {
    moduleId: AUTOMATIC_REAUTHORIZATION_MODULE_ID,
    missionId: "G8-07",
    programmeStatus: "automatic-reauthorization-established",
    capabilities: [...AUTOMATIC_REAUTHORIZATION_CAPABILITIES],
    integratesWith: [
      "identity-authorization-platform",
      "connection-registry",
      "authorization-framework",
      "credential-vault-integration",
      "connection-health-monitoring",
      "operational-readiness-engine",
      "authorization-centre",
    ],
    registryRefs: [
      "REG-CONNECTION-PROVIDER",
      "REG-CONNECTION-POLICY",
      "REG-CONNECTION-REQUIREMENT",
      "REG-CONNECTION-CAPABILITY",
      "REG-CREDENTIAL-TYPE",
      "REG-READINESS-POLICY",
      "REG-IDENTITY-MONITOR",
    ],
    brainTools: [
      "token_lifecycle_summary",
      "token_lifecycle_detail",
      "reauthorization_required",
      "reauthorization_start",
      "reauthorization_cancel",
      "reauthorization_status",
      "token_expiry_warnings",
      "refresh_eligibility",
    ],
    eklsChannel: "automatic-reauthorization",
    pillowGovernance: true,
  };
}
