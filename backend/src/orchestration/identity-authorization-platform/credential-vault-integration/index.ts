/**
 * G8-03 — Credential Vault & Secret Management Integration public surface.
 */

import { resetCredentialVaultObservationStoreForTests } from "./ekls/credential-vault-observation-store.js";
import { resetCredentialVaultPluginHostForTests } from "./plugins/credential-vault-plugin-host.js";
import { resetCredentialHandoffStateForTests } from "./services/credential-handoff-service.js";
import { resetCredentialVaultGatewayForTests } from "./vault/credential-vault-gateway.js";

export {
  CREDENTIAL_VAULT_INTEGRATION_VERSION,
  VAULT_CREDENTIAL_TYPES,
  CREDENTIAL_REFERENCE_STATUSES,
  CREDENTIAL_VAULT_EKLS_KINDS,
  type VaultCredentialType,
  type CredentialReference,
  type CredentialReferenceStatus,
  type CredentialHandoffPreview,
  type CredentialRotationMetadata,
  type CredentialExpiryMetadata,
  type CredentialHealthMetadata,
  type CredentialVaultEklsKind,
  type CredentialVaultPluginManifest,
  redactCredentialVaultSecrets,
  assertNoRawSecretsInPayload,
} from "./contracts/credential-vault-types.js";

export {
  buildCockpitCredentialStatusView,
  buildCockpitCredentialDetailView,
  type CockpitCredentialStatusView,
  type CockpitCredentialDetailView,
} from "./contracts/credential-vault-cockpit-contracts.js";

export {
  CREDENTIAL_VAULT_MODULE_ID,
  CREDENTIAL_VAULT_CAPABILITIES,
  createCredentialVaultModuleContract,
  type CredentialVaultCapability,
  type CredentialVaultModuleContract,
} from "./contract/credential-vault-module.js";

export {
  resolveCredentialTypeForProvider,
  resolveProviderCredentialRequirements,
  resolveAllProviderCredentialRequirements,
  resolveCredentialCapabilitiesForProvider,
  type ProviderCredentialRequirements,
} from "./registry/credential-vault-resolver.js";

export {
  validateCredentialVaultPillowGovernance,
  type CredentialVaultPillowContext,
  type CredentialVaultPillowResult,
} from "./governance/credential-vault-pillow-governance.js";

export {
  recordCredentialVaultEklsObservation,
  searchCredentialVaultEklsObservations,
  listCredentialVaultEklsKinds,
} from "./ekls/credential-vault-ekls-integration.js";

export {
  registerCredentialVaultPlugin,
  listCredentialVaultPlugins,
  listCredentialVaultPluginsByKind,
} from "./plugins/credential-vault-plugin-host.js";

export {
  handoffSecretToVault,
  verifyVaultReference,
  resolveVaultPath,
  resolveVaultBackend,
} from "./vault/credential-vault-gateway.js";

export {
  buildRotationMetadata,
  buildExpiryMetadata,
  buildHealthMetadata,
} from "./services/credential-metadata-service.js";

export {
  createCredentialReference,
  previewCredentialHandoff,
  listCredentialReferences,
  getCredentialReference,
  getCredentialReferenceDetail,
  verifyCredentialReference,
  getCredentialRotationStatus,
  getCredentialHealth,
  runCredentialRedactionTest,
  getCredentialVaultIntegrationVersion,
} from "./services/credential-handoff-service.js";

export { credentialVaultTools } from "./tools/credential-vault-tools.js";

export function resetCredentialVaultHarnessForTests(): void {
  resetCredentialHandoffStateForTests();
  resetCredentialVaultGatewayForTests();
  resetCredentialVaultObservationStoreForTests();
  resetCredentialVaultPluginHostForTests();
}
