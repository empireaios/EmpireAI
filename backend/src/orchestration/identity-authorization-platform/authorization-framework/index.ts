/**
 * G8-02 — Authorization Framework public surface.
 */

import { resetAuthorizationFlowStateForTests } from "./services/authorization-flow-service.js";
import { resetAuthorizationFrameworkObservationStoreForTests } from "./ekls/authorization-framework-observation-store.js";
import { resetAuthorizationFrameworkPluginHostForTests } from "./plugins/authorization-framework-plugin-host.js";

export {
  AUTHORIZATION_FRAMEWORK_VERSION,
  AUTHORIZATION_TYPES,
  AUTHORIZATION_FLOW_STATES,
  AUTHORIZATION_FRAMEWORK_EKLS_KINDS,
  VALID_AUTHORIZATION_TRANSITIONS,
  type AuthorizationType,
  type AuthorizationFlowState,
  type AuthorizationRequest,
  type AuthorizationResult,
  type CredentialSubmission,
  type OAuthCallbackPreview,
  type AuthorizationFrameworkEklsKind,
  type AuthorizationFrameworkPluginManifest,
  isValidAuthorizationTransition,
  redactAuthorizationSecrets,
} from "./contracts/authorization-framework-types.js";

export {
  buildCockpitAuthorizationFlowView,
  type CockpitAuthorizationFlowView,
} from "./contracts/authorization-framework-cockpit-contracts.js";

export {
  AUTHORIZATION_FRAMEWORK_MODULE_ID,
  AUTHORIZATION_FRAMEWORK_CAPABILITIES,
  createAuthorizationFrameworkModuleContract,
  type AuthorizationFrameworkCapability,
  type AuthorizationFrameworkModuleContract,
} from "./contract/authorization-framework-module.js";

export {
  resolveProviderAuthorizationRequirements,
  resolveAllProviderAuthorizationRequirements,
  resolveAuthorizationScopesForProvider,
  resolveAuthorizationPermissionsForProvider,
  resolveAuthorizationCapabilitiesForProvider,
  type ProviderAuthorizationRequirements,
} from "./registry/authorization-framework-resolver.js";

export {
  validateAuthorizationFrameworkPillowGovernance,
  type AuthorizationFrameworkPillowContext,
  type AuthorizationFrameworkPillowResult,
} from "./governance/authorization-framework-pillow-governance.js";

export {
  recordAuthorizationFrameworkEklsObservation,
  searchAuthorizationFrameworkEklsObservations,
  listAuthorizationFrameworkEklsKinds,
} from "./ekls/authorization-framework-ekls-integration.js";

export {
  registerAuthorizationFrameworkPlugin,
  listAuthorizationFrameworkPlugins,
} from "./plugins/authorization-framework-plugin-host.js";

export {
  validateRequestedScopes,
  validateRequestedPermissions,
  isAuthorizationTypeEligible,
} from "./services/scope-permission-validator.js";

export {
  transitionAuthorizationState,
  resolveNextStateForOAuthStart,
} from "./services/authorization-state-machine.js";

export {
  startAuthorization,
  previewAuthorizationCallback,
  submitAuthorizationCredentials,
  validateAuthorizationResult,
  getAuthorizationStatus,
  cancelAuthorization,
  getAuthorizationRequirements,
  listAuthorizationRequests,
} from "./services/authorization-flow-service.js";

export { authorizationFrameworkTools } from "./tools/authorization-framework-tools.js";

export function resetAuthorizationFrameworkHarnessForTests(): void {
  resetAuthorizationFlowStateForTests();
  resetAuthorizationFrameworkObservationStoreForTests();
  resetAuthorizationFrameworkPluginHostForTests();
}
