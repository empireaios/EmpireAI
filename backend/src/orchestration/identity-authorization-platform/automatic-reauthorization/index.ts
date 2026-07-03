/**
 * G8-07 — Automatic Reauthorization public surface.
 */

import { resetTokenLifecycleObservationStoreForTests } from "./ekls/token-lifecycle-observation-store.js";
import { resetTokenLifecyclePluginHostForTests } from "./plugins/token-lifecycle-plugin-host.js";
import { resetReauthorizationStateForTests } from "./services/reauthorization-service.js";

export {
  AUTOMATIC_REAUTHORIZATION_VERSION,
  TOKEN_LIFECYCLE_STATES,
  REAUTHORIZATION_REASONS,
  TOKEN_LIFECYCLE_EKLS_KINDS,
  type TokenLifecycleState,
  type ReauthorizationReason,
  type ReauthorizationRequest,
  type TokenLifecycleSummary,
  type TokenLifecycleDetail,
  type TokenLifecycleEklsKind,
  type TokenLifecyclePluginManifest,
  redactTokenLifecycleSecrets,
  assertNoSecretsInTokenLifecyclePayload,
} from "./contracts/token-lifecycle-types.js";

export {
  buildTokenLifecycleNotification,
  type TokenLifecycleNotificationKind,
  type TokenLifecycleNotificationContract,
} from "./contracts/token-lifecycle-notification-contracts.js";

export {
  buildCockpitTokenLifecycleView,
  type CockpitTokenLifecycleView,
} from "./contracts/token-lifecycle-cockpit-contracts.js";

export {
  AUTOMATIC_REAUTHORIZATION_MODULE_ID,
  AUTOMATIC_REAUTHORIZATION_CAPABILITIES,
  createAutomaticReauthorizationModuleContract,
  type AutomaticReauthorizationCapability,
  type AutomaticReauthorizationModuleContract,
} from "./contract/automatic-reauthorization-module.js";

export {
  resolveTokenLifecycleProfile,
  resolveAllTokenLifecycleProfiles,
  resolveWarningWindowMs,
  resolveRefreshEligible,
  type TokenLifecycleProfile,
} from "./registry/token-lifecycle-resolver.js";

export { detectTokenExpiry, type ExpiryDetectionResult } from "./evaluators/expiry-detector.js";

export {
  validateTokenLifecyclePillowGovernance,
  type TokenLifecyclePillowContext,
  type TokenLifecyclePillowResult,
} from "./governance/token-lifecycle-pillow-governance.js";

export {
  recordTokenLifecycleEklsObservation,
  searchTokenLifecycleEklsObservations,
  listTokenLifecycleEklsKinds,
} from "./ekls/token-lifecycle-ekls-integration.js";

export {
  registerTokenLifecyclePlugin,
  listTokenLifecyclePlugins,
  listTokenLifecyclePluginsByKind,
} from "./plugins/token-lifecycle-plugin-host.js";

export {
  scanTokenLifecycleSchedule,
  type ScheduledLifecycleScanResult,
} from "./services/reauthorization-scheduler.js";

export {
  canTransitionReauthorization,
  transitionReauthorizationState,
  resolveReauthorizationTargetState,
} from "./services/reauthorization-state-machine.js";

export {
  getTokenLifecycleSummary,
  getTokenLifecycleDetail,
  listReauthorizationRequired,
  getTokenExpiryWarnings,
  getRefreshEligibility,
  startReauthorization,
  cancelReauthorization,
  getReauthorizationStatus,
  listReauthorizationRequests,
  getAutomaticReauthorizationVersion,
} from "./services/reauthorization-service.js";

export { tokenLifecycleTools } from "./tools/token-lifecycle-tools.js";

export function resetAutomaticReauthorizationHarnessForTests(): void {
  resetReauthorizationStateForTests();
  resetTokenLifecycleObservationStoreForTests();
  resetTokenLifecyclePluginHostForTests();
}
