/**
 * G7-04 — Grand King Executive Decision Centre public surface.
 */

import { resetRegistryLoaderForTests } from "../../registry/registry-loader.js";
import { resetProductionWorkspaceRegistryBatchForTests } from "../../registry/sources/production-workspace-source.js";
import { resetExecutiveDecisionObservationStoreForTests } from "./ekls/executive-decision-observation-store.js";
import { resetExecutiveDecisionPluginHostForTests } from "./plugins/executive-decision-plugin-host.js";
import { resetExecutiveNotificationsForTests } from "./services/executive-notification-centre.js";
import { resetExecutiveDecisionStateForTests } from "./services/grand-king-executive-decision-centre-service.js";

export {
  GRAND_KING_EXECUTIVE_DECISION_CENTRE_VERSION,
  EXECUTIVE_DECISION_TYPES,
  EXECUTIVE_DECISION_STATUSES,
  EXECUTIVE_DOMAIN_IDS,
  EXECUTIVE_PRIORITIES,
  EXECUTIVE_DECISION_EKLS_KINDS,
  VALID_EXECUTIVE_DECISION_TRANSITIONS,
  type ExecutiveDecisionType,
  type ExecutiveDecisionStatus,
  type ExecutiveDomainId,
  type ExecutivePriority,
  type ExecutiveDecision,
  type ExecutiveRecommendation,
  type ExecutiveKpiSnapshot,
  type ExecutiveOperationsOverview,
  type ExecutiveBlockerSummary,
  type ExecutiveOpportunitySummary,
  type ExecutiveRiskSummary,
  type ExecutiveApprovalSummary,
  type ExecutiveTimelineEntry,
  type ExecutiveNotification,
  type ExecutiveDecisionEklsKind,
  type ExecutiveDecisionPluginManifest,
  isValidExecutiveDecisionTransition,
} from "./contracts/executive-decision-types.js";

export {
  COCKPIT_EXECUTIVE_DECISION_CENTRE_VIEW_ID,
  buildCockpitExecutiveDecisionCentreView,
  type CockpitExecutiveDecisionCentreView,
} from "./contracts/executive-decision-cockpit-contracts.js";

export {
  GRAND_KING_EXECUTIVE_DECISION_CENTRE_MODULE_ID,
  GRAND_KING_EXECUTIVE_DECISION_CENTRE_CAPABILITIES,
  createGrandKingExecutiveDecisionCentreModuleContract,
  type GrandKingExecutiveDecisionCentreCapability,
  type GrandKingExecutiveDecisionCentreModuleContract,
} from "./contract/executive-decision-centre-module.js";

export {
  resolveExecutivePolicies,
  resolveExecutiveDecisionDependencies,
  listExecutiveDecisionRegistryIds,
} from "./registry/executive-decision-registry-resolver.js";

export {
  validateExecutiveDecisionPillowGovernance,
  type ExecutiveDecisionPillowContext,
  type ExecutiveDecisionPillowResult,
} from "./governance/executive-decision-pillow-governance.js";

export {
  recordExecutiveDecisionEklsObservation,
  searchExecutiveDecisionEklsObservations,
  listExecutiveDecisionEklsKinds,
} from "./ekls/executive-decision-ekls-integration.js";

export { aggregateExecutiveKpis } from "./services/executive-kpi-aggregator.js";
export { generateExecutiveRecommendations } from "./services/decision-recommendation-engine.js";
export { buildGlobalOperationalDashboard } from "./services/global-operational-dashboard.js";
export { buildProductionBlockerDashboard } from "./services/production-blocker-dashboard.js";
export { buildProductionOpportunityDashboard } from "./services/production-opportunity-dashboard.js";
export { buildRiskDashboard } from "./services/risk-dashboard.js";
export { buildApprovalDashboard } from "./services/approval-dashboard.js";
export { buildOperationalTimeline } from "./services/operational-timeline.js";
export { listExecutiveNotifications, publishExecutiveNotifications } from "./services/executive-notification-centre.js";
export { transitionExecutiveDecisionStatus } from "./services/executive-decision-lifecycle-manager.js";

export {
  initializeExecutiveDecisionCentre,
  listExecutiveDecisions,
  getExecutiveDecision,
  getExecutiveOperationsOverview,
  createExecutiveDecision,
  executeExecutiveDecision,
  getExecutiveHealth,
  getExecutiveRecommendations,
  getExecutiveSummary,
  getExecutiveGlobalDashboard,
} from "./services/grand-king-executive-decision-centre-service.js";

export {
  registerExecutiveDecisionPlugin,
  listExecutiveDecisionPlugins,
} from "./plugins/executive-decision-plugin-host.js";

export { grandKingExecutiveDecisionCentreTools } from "./tools/executive-decision-centre-tools.js";

export function resetGrandKingExecutiveDecisionCentreHarnessForTests(): void {
  resetRegistryLoaderForTests();
  resetProductionWorkspaceRegistryBatchForTests();
  resetExecutiveDecisionStateForTests();
  resetExecutiveDecisionObservationStoreForTests();
  resetExecutiveDecisionPluginHostForTests();
  resetExecutiveNotificationsForTests();
  delete process.env.AUTOMATION_READINESS_BLOCKED;
  delete process.env.EXECUTIVE_BLOCKER_SIGNAL;
  delete process.env.EXECUTIVE_RISK_SIGNAL;
}
