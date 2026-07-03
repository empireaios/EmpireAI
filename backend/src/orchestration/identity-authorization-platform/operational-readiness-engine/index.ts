/**
 * G8-06 — Operational Readiness Engine public surface.
 */

import { resetReadinessObservationStoreForTests } from "./ekls/readiness-observation-store.js";
import { resetReadinessPluginHostForTests } from "./plugins/readiness-plugin-host.js";

export {
  OPERATIONAL_READINESS_ENGINE_VERSION,
  READINESS_LEVELS,
  READINESS_CONTEXTS,
  READINESS_EKLS_KINDS,
  type ReadinessLevel,
  type ReadinessContext,
  type ReadinessResult,
  type ReadinessBlocker,
  type ReadinessRecommendation,
  type ReadinessEklsKind,
  type ReadinessPluginManifest,
  redactReadinessSecrets,
  assertNoSecretsInReadinessPayload,
} from "./contracts/readiness-types.js";

export {
  buildCockpitReadinessSummary,
  buildCockpitReadinessDetail,
  buildCockpitWorkflowReadiness,
  buildCockpitAutomationReadiness,
  type CockpitReadinessSummary,
} from "./contracts/readiness-cockpit-contracts.js";

export {
  OPERATIONAL_READINESS_MODULE_ID,
  OPERATIONAL_READINESS_CAPABILITIES,
  createOperationalReadinessModuleContract,
  type OperationalReadinessCapability,
  type OperationalReadinessModuleContract,
} from "./contract/operational-readiness-module.js";

export {
  resolveReadinessPolicyProfile,
  resolveRequiredProvidersForContext,
  resolveWorkflowIds,
  resolveMonitorRefs,
  type ReadinessPolicyProfile,
} from "./registry/readiness-policy-resolver.js";

export {
  validateReadinessPillowGovernance,
  type ReadinessPillowContext,
  type ReadinessPillowResult,
} from "./governance/readiness-pillow-governance.js";

export {
  recordReadinessEklsObservation,
  searchReadinessEklsObservations,
  listReadinessEklsKinds,
} from "./ekls/readiness-ekls-integration.js";

export {
  registerReadinessPlugin,
  listReadinessPlugins,
  listReadinessPluginsByKind,
} from "./plugins/readiness-plugin-host.js";

export {
  evaluateReadinessOverview,
  evaluateReadinessForWorkspace,
  evaluateReadinessForAccountHolder,
  evaluateReadinessForProvider,
  evaluateReadinessForWorkflow,
  evaluateReadinessForAutomation,
  evaluateReadinessForBrand,
  getReadinessBlockers,
  getReadinessRecommendations,
  getOperationalReadinessEngineVersion,
} from "./services/operational-readiness-service.js";

export { operationalReadinessTools } from "./tools/operational-readiness-tools.js";

export function resetOperationalReadinessHarnessForTests(): void {
  resetReadinessObservationStoreForTests();
  resetReadinessPluginHostForTests();
}
