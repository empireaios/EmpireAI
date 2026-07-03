/**
 * G8-08 — Multi-Workspace Isolation module contract.
 */

export const MULTI_WORKSPACE_ISOLATION_MODULE_ID = "multi-workspace-isolation" as const;

export const MULTI_WORKSPACE_ISOLATION_CAPABILITIES = [
  "workspace_isolation",
  "account_holder_isolation",
  "provider_visibility_boundary",
  "credential_reference_isolation",
  "authorization_record_isolation",
  "readiness_isolation",
  "health_record_isolation",
  "cockpit_visibility_rules",
  "brain_tool_isolation",
  "pillow_governance",
  "ekls_isolation_records",
  "plugin_isolation_rules",
] as const;

export type MultiWorkspaceIsolationCapability = (typeof MULTI_WORKSPACE_ISOLATION_CAPABILITIES)[number];

export type MultiWorkspaceIsolationModuleContract = {
  moduleId: typeof MULTI_WORKSPACE_ISOLATION_MODULE_ID;
  missionId: "G8-08";
  programmeStatus: "multi-workspace-isolation-established";
  capabilities: MultiWorkspaceIsolationCapability[];
  integratesWith: string[];
  registryRefs: string[];
  brainTools: string[];
  eklsChannel: "multi-workspace-isolation";
  pillowGovernance: true;
};

export function createMultiWorkspaceIsolationModuleContract(): MultiWorkspaceIsolationModuleContract {
  return {
    moduleId: MULTI_WORKSPACE_ISOLATION_MODULE_ID,
    missionId: "G8-08",
    programmeStatus: "multi-workspace-isolation-established",
    capabilities: [...MULTI_WORKSPACE_ISOLATION_CAPABILITIES],
    integratesWith: [
      "identity-authorization-platform",
      "connection-registry",
      "authorization-framework",
      "credential-vault-integration",
      "connection-health-monitoring",
      "operational-readiness-engine",
      "automatic-reauthorization",
      "authorization-centre",
    ],
    registryRefs: [
      "REG-CONNECTION-ACCOUNT-HOLDER",
      "REG-CONNECTION-POLICY",
      "REG-CONNECTION-PROVIDER",
      "REG-READINESS-POLICY",
      "REG-IDENTITY-PROVIDER",
      "REG-AUTHORIZATION-PROVIDER",
    ],
    brainTools: [
      "identity_isolation_check",
      "identity_visibility_matrix",
      "account_holder_connection_scope",
      "workspace_authorization_scope",
      "credential_reference_visibility",
    ],
    eklsChannel: "multi-workspace-isolation",
    pillowGovernance: true,
  };
}
