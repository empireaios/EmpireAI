/**
 * G8-08 — Multi-Workspace & Customer Isolation public surface.
 */

import { resetIsolationObservationStoreForTests } from "./ekls/isolation-observation-store.js";
import { resetIsolationPluginHostForTests } from "./plugins/isolation-plugin-host.js";
import { resetIsolationDelegationStateForTests } from "./services/isolation-enforcement-service.js";

export {
  MULTI_WORKSPACE_ISOLATION_VERSION,
  VISIBILITY_SCOPES,
  ACCESS_DECISIONS,
  ISOLATION_EKLS_KINDS,
  type VisibilityScope,
  type AccessDecision,
  type IdentityIsolationObject,
  type IsolationCheckResult,
  type IsolationActorContext,
  type IsolationEklsKind,
  type IsolationPluginManifest,
  redactIsolationSecrets,
  assertNoSecretsInIsolationPayload,
} from "./contracts/isolation-types.js";

export {
  applyCockpitIsolationFilter,
  buildCockpitIsolationSummary,
  type CockpitIsolationView,
} from "./contracts/isolation-cockpit-contracts.js";

export {
  MULTI_WORKSPACE_ISOLATION_MODULE_ID,
  MULTI_WORKSPACE_ISOLATION_CAPABILITIES,
  createMultiWorkspaceIsolationModuleContract,
  type MultiWorkspaceIsolationCapability,
  type MultiWorkspaceIsolationModuleContract,
} from "./contract/multi-workspace-isolation-module.js";

export {
  resolveIsolationPolicyProfile,
  resolveAccountHolderIsolationProfiles,
  resolveAccountHolderProfile,
  resolveVisibilityScopeForRelationship,
  type AccountHolderIsolationProfile,
  type IsolationPolicyProfile,
} from "./registry/isolation-policy-resolver.js";

export {
  filterByIsolationBoundary,
  filterCredentialReferences,
  filterAuthorizationRecords,
  filterHealthRecords,
  filterReadinessResults,
  filterIsolationPayload,
} from "./services/isolation-filter-service.js";

export {
  enforceIsolationBoundary,
  checkIdentityIsolation,
  buildIdentityVisibilityMatrix,
  getAccountHolderConnectionScope,
  getWorkspaceAuthorizationScope,
  getCredentialReferenceVisibility,
  filterIsolatedHealthRecords,
  filterIsolatedReadinessResults,
  createDelegation,
  revokeDelegation,
  enforceBrainToolIsolation,
  wrapBrainToolResult,
  buildIdentityIsolationObject,
  getMultiWorkspaceIsolationVersion,
} from "./services/isolation-enforcement-service.js";

export {
  validateIsolationPillowGovernance,
  type IsolationPillowContext,
  type IsolationPillowResult,
} from "./governance/isolation-pillow-governance.js";

export {
  recordIsolationEklsObservation,
  searchIsolationEklsObservations,
  listIsolationEklsKinds,
} from "./ekls/isolation-ekls-integration.js";

export {
  registerIsolationPlugin,
  listIsolationPlugins,
  listIsolationPluginsByKind,
} from "./plugins/isolation-plugin-host.js";

export { wrapG8BrainToolsWithIsolation } from "./tools/isolation-brain-gateway.js";
export { isolationTools } from "./tools/isolation-tools.js";

export function resetMultiWorkspaceIsolationHarnessForTests(): void {
  resetIsolationDelegationStateForTests();
  resetIsolationObservationStoreForTests();
  resetIsolationPluginHostForTests();
}
