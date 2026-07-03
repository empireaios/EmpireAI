/**
 * G8-04 — Connection Health & Monitoring public surface.
 */

import { resetConnectionHealthObservationStoreForTests } from "./ekls/connection-health-observation-store.js";
import { resetConnectionHealthPluginHostForTests } from "./plugins/connection-health-plugin-host.js";
import { resetConnectionMonitoringStateForTests } from "./services/connection-monitoring-service.js";

export {
  CONNECTION_HEALTH_MONITORING_VERSION,
  CONNECTION_HEALTH_STATES,
  HEALTH_CHECK_TYPES,
  CONNECTION_HEALTH_EKLS_KINDS,
  type ConnectionHealthState,
  type HealthCheckType,
  type ConnectionHealthCheck,
  type ConnectionHealthSummary,
  type ProviderHealthMatrixEntry,
  type ConnectionHealthAttentionItem,
  type ConnectionHealthEklsKind,
  type ConnectionHealthPluginManifest,
  redactConnectionHealthSecrets,
  assertNoSecretsInHealthPayload,
} from "./contracts/connection-health-types.js";

export {
  buildConnectionHealthNotification,
  type ConnectionHealthNotificationKind,
  type ConnectionHealthNotificationContract,
} from "./contracts/connection-health-notification-contracts.js";

export {
  buildCockpitConnectionHealthView,
  buildCockpitProviderHealthDetailView,
  type CockpitConnectionHealthView,
} from "./contracts/connection-health-cockpit-contracts.js";

export {
  CONNECTION_HEALTH_MODULE_ID,
  CONNECTION_HEALTH_CAPABILITIES,
  createConnectionHealthModuleContract,
  type ConnectionHealthCapability,
  type ConnectionHealthModuleContract,
} from "./contract/connection-health-module.js";

export {
  resolveProviderMonitoringProfile,
  resolveAllProviderMonitoringProfiles,
  type ProviderMonitoringProfile,
} from "./registry/connection-health-resolver.js";

export {
  validateConnectionHealthPillowGovernance,
  type ConnectionHealthPillowContext,
  type ConnectionHealthPillowResult,
} from "./governance/connection-health-pillow-governance.js";

export {
  recordConnectionHealthEklsObservation,
  searchConnectionHealthEklsObservations,
  listConnectionHealthEklsKinds,
} from "./ekls/connection-health-ekls-integration.js";

export {
  registerConnectionHealthPlugin,
  listConnectionHealthPlugins,
  listConnectionHealthPluginsByKind,
} from "./plugins/connection-health-plugin-host.js";

export {
  runConnectionHealthCheck,
  listConnectionHealthChecks,
  getConnectionHealthDetail,
  getConnectionHealthSummary,
  getConnectionHealthAttentionItems,
  getProviderHealthMatrix,
  getConnectionHealthMonitoringVersion,
} from "./services/connection-monitoring-service.js";

export { connectionHealthTools } from "./tools/connection-health-tools.js";

export function resetConnectionHealthHarnessForTests(): void {
  resetConnectionMonitoringStateForTests();
  resetConnectionHealthObservationStoreForTests();
  resetConnectionHealthPluginHostForTests();
}
