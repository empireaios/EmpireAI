export {
  G3_07_SCHEMA_VERSION,
  G3_07_CAPABILITIES,
  G3_07_ENGINE_INTEGRATIONS,
  G3_07_DATA_FLOW,
  buildCustomerIntelligenceDiscoveryView,
  buildCustomerIntelligenceEngineArchitecture,
  loadCustomerIntelligenceEngineView,
  resolveRegistryDiscoveredCustomers,
  rankCustomerAnalysisContracts,
  buildCustomerComparison,
  type CustomerIntelligenceAnalysisContract,
  type CustomerIntelligenceEngineArchitecture,
  type CustomerIntelligenceEngineView,
} from "./engine-architecture.js";
export { customerIntelligenceEngineModule } from "./module-contract.js";
