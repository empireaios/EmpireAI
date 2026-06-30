export {
  SIMULATION_LAUNCH_RECOMMENDATIONS,
  SCENARIO_HORIZONS,
  SCENARIO_CASES,
  financialForecastSchema,
  commercialForecastSchema,
  scenarioProjectionSchema,
  simulationRiskAnalysisSchema,
  capitalProtectionSchema,
  simulationRecommendationSchema,
  businessSimulationRecordSchema,
  businessSimulationComparisonSchema,
  businessSimulationDashboardSchema,
  businessSimulationSummarySchema,
} from "./models/business-simulation.js";
export type {
  SimulationLaunchRecommendation,
  ScenarioHorizon,
  ScenarioCase,
  FinancialForecast,
  CommercialForecast,
  ScenarioProjection,
  SimulationRiskAnalysis,
  CapitalProtection,
  SimulationRecommendation,
  BusinessSimulationRecord,
  BusinessSimulationComparison,
  BusinessSimulationDashboard,
  BusinessSimulationSummary,
} from "./models/business-simulation.js";

export { runBusinessSimulation, RECOMMENDATION_RANK } from "./services/business-simulation-engine.js";

export {
  SqliteBusinessSimulationRepository,
  getBusinessSimulationRepository,
  resetBusinessSimulationRepository,
} from "./repositories/sqlite-business-simulation-repository.js";

export {
  BusinessSimulationNotFoundError,
  BusinessSimulationBlockedError,
  runBusinessSimulationForBuild,
  getBusinessSimulation,
  getBusinessSimulationForecast,
  getBusinessSimulationRecommendation,
  compareBusinessSimulations,
  buildBusinessSimulationSummary,
  buildBusinessSimulationDashboard,
} from "./services/business-simulation-service.js";

export { registerBusinessSimulationRoutes } from "./routes/business-simulation-routes.js";
export { businessSimulationEngineTools } from "./tools/business-simulation-tools.js";

export {
  BUSINESS_SIMULATION_ENGINE_MODULE_ID,
  BUSINESS_SIMULATION_ENGINE_CAPABILITIES,
  createBusinessSimulationEngineModuleContract,
} from "./contract/business-simulation-module.js";
export type { BusinessSimulationEngineCapability } from "./contract/business-simulation-module.js";
