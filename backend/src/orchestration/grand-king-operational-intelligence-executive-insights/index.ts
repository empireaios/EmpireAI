/**
 * G7-09 — Grand King Operational Intelligence public surface.
 */

import { resetRegistryLoaderForTests } from "../../registry/registry-loader.js";
import { resetProductionWorkspaceRegistryBatchForTests } from "../../registry/sources/production-workspace-source.js";
import { resetOperationalIntelligenceObservationStoreForTests } from "./ekls/operational-intelligence-observation-store.js";
import { resetOperationalIntelligencePluginHostForTests } from "./plugins/operational-intelligence-plugin-host.js";
import { resetInsightStoreForTests } from "./services/insight-store.js";
import { resetOperationalIntelligenceStateForTests } from "./services/grand-king-operational-intelligence-executive-insights-service.js";

export {
  GRAND_KING_OPERATIONAL_INTELLIGENCE_VERSION,
  INTELLIGENCE_DOMAIN_IDS,
  INSIGHT_TYPES,
  INSIGHT_SEVERITIES,
  INSIGHT_PRIORITIES,
  EXECUTIVE_KPI_IDS,
  OPERATIONAL_INTELLIGENCE_EKLS_KINDS,
  type IntelligenceDomainId,
  type InsightType,
  type InsightSeverity,
  type InsightPriority,
  type ExecutiveKpiId,
  type ExecutiveInsight,
  type ExecutiveTrend,
  type ExecutiveOpportunity,
  type ExecutiveAnomaly,
  type ExecutivePrediction,
  type ExecutiveKpiSnapshot,
  type EmpireHealthScore,
  type ExecutiveBriefing,
  type CrossSystemCorrelation,
  type OperationalIntelligenceOverview,
  type OperationalIntelligenceEklsKind,
  type OperationalIntelligencePluginManifest,
  redactOperationalIntelligenceSecrets,
} from "./contracts/operational-intelligence-types.js";

export {
  COCKPIT_OPERATIONAL_INTELLIGENCE_VIEW_ID,
  buildCockpitOperationalIntelligenceView,
  type CockpitOperationalIntelligenceView,
} from "./contracts/operational-intelligence-cockpit-contracts.js";

export {
  GRAND_KING_OPERATIONAL_INTELLIGENCE_MODULE_ID,
  GRAND_KING_OPERATIONAL_INTELLIGENCE_CAPABILITIES,
  createGrandKingOperationalIntelligenceModuleContract,
  type GrandKingOperationalIntelligenceCapability,
  type GrandKingOperationalIntelligenceModuleContract,
} from "./contract/operational-intelligence-module.js";

export {
  resolveOperationalIntelligenceDependencies,
  listOperationalIntelligenceRegistryIds,
  deriveIntelligenceSignalFromRef,
  parseKpiFromRef,
  parseDomainFromRef,
  mapDomainToSubsystem,
} from "./registry/operational-intelligence-registry-resolver.js";

export {
  validateOperationalIntelligencePillowGovernance,
  type OperationalIntelligencePillowContext,
  type OperationalIntelligencePillowResult,
} from "./governance/operational-intelligence-pillow-governance.js";

export {
  recordOperationalIntelligenceEklsObservation,
  searchOperationalIntelligenceEklsObservations,
  listOperationalIntelligenceEklsKinds,
} from "./ekls/operational-intelligence-ekls-integration.js";

export { generateExecutiveInsights, listExecutiveInsights } from "./services/executive-insight-engine.js";
export { analyseBusinessHealth } from "./services/business-health-analyser.js";
export { analyseOperationalTrends } from "./services/operational-trend-analyser.js";
export { analyseOpportunities } from "./services/opportunity-analyser.js";
export { analyseAnomalies } from "./services/anomaly-analyser.js";
export { generateExecutiveRecommendations } from "./services/executive-recommendation-engine.js";
export { computeExecutiveKpiSnapshots, computeEmpireHealthScore } from "./services/executive-kpi-intelligence.js";
export { correlateCrossSystemSignals } from "./services/cross-system-correlation-engine.js";
export { generatePredictions } from "./services/prediction-engine.js";
export { generateExecutiveBriefing, getExecutiveIntelligenceSummary } from "./services/executive-briefing-generator.js";
export { buildExecutiveIntelligenceDashboard } from "./services/executive-intelligence-dashboard.js";

export {
  initializeOperationalIntelligence,
  getOperationalIntelligenceOverview,
  getOperationalIntelligenceStatus,
  getExecutiveInsight,
} from "./services/grand-king-operational-intelligence-executive-insights-service.js";

export {
  registerOperationalIntelligencePlugin,
  listOperationalIntelligencePlugins,
} from "./plugins/operational-intelligence-plugin-host.js";

export { grandKingOperationalIntelligenceTools } from "./tools/operational-intelligence-tools.js";

export function resetGrandKingOperationalIntelligenceHarnessForTests(): void {
  resetRegistryLoaderForTests();
  resetProductionWorkspaceRegistryBatchForTests();
  resetOperationalIntelligenceStateForTests();
  resetInsightStoreForTests();
  resetOperationalIntelligenceObservationStoreForTests();
  resetOperationalIntelligencePluginHostForTests();
}
