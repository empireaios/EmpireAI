export {
  G3_08_SCHEMA_VERSION,
  G3_08_CAPABILITIES,
  G3_08_ENGINE_INTEGRATIONS,
  G3_08_DATA_FLOW,
  buildRiskIntelligenceDiscoveryView,
  buildRiskIntelligenceEngineArchitecture,
  loadRiskIntelligenceEngineView,
  resolveRegistryDiscoveredRisks,
  rankRiskAnalysisContracts,
  buildRiskComparison,
  type RiskIntelligenceAnalysisContract,
  type RiskIntelligenceEngineArchitecture,
  type RiskIntelligenceEngineView,
} from "./engine-architecture.js";
export { riskIntelligenceEngineModule } from "./module-contract.js";
