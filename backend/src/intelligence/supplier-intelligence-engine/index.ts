export * from "./types.js";
export * from "./mock-catalog.js";
export * from "./score-computers.js";
export * from "./recommendation-engine.js";
export * from "./supplier-guard.js";
export {
  compareSuppliers,
  discoverSuppliers,
  evaluateSupplier,
  supplierIntelligenceEvaluationEngine,
  SupplierIntelligenceEvaluationEngine,
} from "./supplier-intelligence-engine.js";
export {
  registerSupplierIntelligenceModule,
  supplierIntelligenceModule,
  SupplierIntelligenceModule,
} from "./module-contract.js";
export {
  G3_03_SCHEMA_VERSION,
  G3_03_CAPABILITIES,
  G3_03_ENGINE_INTEGRATIONS,
  G3_03_DATA_FLOW,
  buildSupplierIntelligenceEngineArchitecture,
  loadSupplierIntelligenceEngineView,
  resolveRegistryDiscoveredSuppliers,
  mapEvaluationToAnalysisContract,
  rankSupplierAnalysisContracts,
  buildSupplierComparison,
  type SupplierIntelligenceAnalysisContract,
  type SupplierIntelligenceEngineArchitecture,
  type SupplierIntelligenceEngineView,
} from "./engine-architecture.js";
