/**
 * G7-01 — Grand King Production Workspace public surface.
 */

import { resetProductionWorkspaceRegistryBatchForTests } from "../../registry/sources/production-workspace-source.js";
import { resetRegistryLoaderForTests } from "../../registry/registry-loader.js";
import { resetProductionWorkspaceObservationStoreForTests } from "./ekls/production-workspace-observation-store.js";
import { resetProductionWorkspacePluginHostForTests } from "./plugins/production-workspace-plugin-host.js";
import { resetProductionWorkspaceStateForTests } from "./services/grand-king-production-workspace-service.js";

export {
  GRAND_KING_PRODUCTION_WORKSPACE_VERSION,
  WORKSPACE_STATUSES,
  PRODUCTION_WORKSPACE_EKLS_KINDS,
  VALID_WORKSPACE_TRANSITIONS,
  type WorkspaceStatus,
  type WorkspaceType,
  type GrandKingProductionWorkspace,
  type WorkspaceHealthSummary,
  type WorkspaceReadinessSummary,
  type WorkspaceDependencySummary,
  type ProductionWorkspaceOverview,
  type ProductionWorkspaceEklsKind,
  type ProductionWorkspacePluginManifest,
  isValidWorkspaceTransition,
} from "./contracts/production-workspace-types.js";

export {
  COCKPIT_PRODUCTION_WORKSPACE_VIEW_ID,
  buildCockpitProductionWorkspaceView,
  type CockpitProductionWorkspaceView,
} from "./contracts/production-workspace-cockpit-contracts.js";

export {
  GRAND_KING_PRODUCTION_WORKSPACE_MODULE_ID,
  GRAND_KING_PRODUCTION_WORKSPACE_CAPABILITIES,
  createGrandKingProductionWorkspaceModuleContract,
  type GrandKingProductionWorkspaceCapability,
  type GrandKingProductionWorkspaceModuleContract,
} from "./contract/production-workspace-module.js";

export {
  resolveProductionWorkspaceConfig,
  resolveReadinessPolicies,
  resolveConnectionProviders,
  resolveIdentityProviders,
  listProductionWorkspaceRegistryIds,
} from "./registry/production-workspace-registry-resolver.js";

export {
  validateProductionWorkspacePillowGovernance,
  type ProductionWorkspacePillowContext,
  type ProductionWorkspacePillowResult,
} from "./governance/production-workspace-pillow-governance.js";

export {
  recordProductionWorkspaceEklsObservation,
  searchProductionWorkspaceEklsObservations,
  listProductionWorkspaceEklsKinds,
} from "./ekls/production-workspace-ekls-integration.js";

export { buildWorkspaceConfiguration } from "./services/workspace-configuration-manager.js";
export { transitionWorkspaceStatus } from "./services/workspace-lifecycle-manager.js";
export { evaluateWorkspaceHealth } from "./services/workspace-health-evaluator.js";
export { evaluateWorkspaceReadiness } from "./services/workspace-readiness-integration.js";
export { validateWorkspaceOwnership } from "./services/workspace-ownership-validator.js";

export {
  createGrandKingProductionWorkspace,
  activateGrandKingProductionWorkspace,
  getGrandKingProductionWorkspace,
  getProductionWorkspaceOverview,
  getWorkspaceHealth,
  getWorkspaceReadiness,
  getWorkspaceDependencies,
  getWorkspaceConfiguration,
  getWorkspaceSummary,
  blockGrandKingProductionWorkspace,
} from "./services/grand-king-production-workspace-service.js";

export {
  registerProductionWorkspacePlugin,
  listProductionWorkspacePlugins,
} from "./plugins/production-workspace-plugin-host.js";

export { grandKingProductionWorkspaceTools } from "./tools/production-workspace-tools.js";

export function resetGrandKingProductionWorkspaceHarnessForTests(): void {
  resetRegistryLoaderForTests();
  resetProductionWorkspaceRegistryBatchForTests();
  resetProductionWorkspaceStateForTests();
  resetProductionWorkspaceObservationStoreForTests();
  resetProductionWorkspacePluginHostForTests();
  delete process.env.WORKSPACE_READINESS_BLOCKED;
  delete process.env.WORKSPACE_HEALTH_DEGRADED;
}
