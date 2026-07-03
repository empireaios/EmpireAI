/**
 * G8-03 — Credential Vault Integration Brain module contract.
 */

export const CREDENTIAL_VAULT_MODULE_ID = "credential-vault-integration" as const;

export type CredentialVaultCapability =
  | "credential-vault.handoff"
  | "credential-vault.list"
  | "credential-vault.detail"
  | "credential-vault.health"
  | "credential-vault.rotation"
  | "credential-vault.redaction";

export const CREDENTIAL_VAULT_CAPABILITIES: CredentialVaultCapability[] = [
  "credential-vault.handoff",
  "credential-vault.list",
  "credential-vault.detail",
  "credential-vault.health",
  "credential-vault.rotation",
  "credential-vault.redaction",
];

export type CredentialVaultModuleContract = {
  moduleId: typeof CREDENTIAL_VAULT_MODULE_ID;
  capabilities: CredentialVaultCapability[];
  missionId: "G8-03";
  programmeStatus: "credential-vault-secret-management-established";
  integratesWith: [
    "pillow",
    "brain",
    "registry",
    "ekls",
    "connection-registry",
    "authorization-framework",
    "identity-authorization",
  ];
};

export function createCredentialVaultModuleContract(): CredentialVaultModuleContract {
  return {
    moduleId: CREDENTIAL_VAULT_MODULE_ID,
    capabilities: CREDENTIAL_VAULT_CAPABILITIES,
    missionId: "G8-03",
    programmeStatus: "credential-vault-secret-management-established",
    integratesWith: [
      "pillow",
      "brain",
      "registry",
      "ekls",
      "connection-registry",
      "authorization-framework",
      "identity-authorization",
    ],
  };
}
