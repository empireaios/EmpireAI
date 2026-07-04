export {
  ContinuousEvolutionEngine,
  createContinuousEvolutionEngine,
  CONTINUOUS_EVOLUTION_CONTRACT_PATH,
} from "./engine.js";
export { inspectDueDiligence } from "./due-diligence-inspector.js";
export { scanSelfImprovement } from "./self-improvement-scanner.js";
export { discoverOpportunities, getOpportunityThreshold } from "./opportunity-discovery.js";
export { detectRisks } from "./risk-detector.js";
export { planAutonomousOptimisation } from "./autonomous-optimizer.js";
export { rankExecutiveRecommendations } from "./executive-recommender.js";
export { trackEmpireEvolution } from "./evolution-tracker.js";
export {
  buildContinuousEvolutionReport,
  certifyVersion1,
  formatContinuousEvolutionReport,
} from "./executive-reporter.js";
export type {
  InspectionDomain,
  DueDiligenceFinding,
  DueDiligenceCoverage,
  ImprovementCategory,
  ImprovementBacklogItem,
  SelfImprovementReport,
  OpportunityType,
  DiscoveredOpportunity,
  OpportunityDiscoveryReport,
  RiskCategory,
  DetectedRisk,
  RiskDetectionReport,
  OptimisationPlan,
  AutonomousOptimisationReport,
  ExecutiveRecommendation,
  EmpireEvolutionMetrics,
  Version1FinalCertification,
  ContinuousEvolutionReport,
  ContinuousEvolutionState,
  ContinuousEvolutionDeps,
} from "./types.js";
