export {
  ProductionCertificationCore,
  createProductionCertificationCore,
  resetProductionCertificationCoreForTesting,
  type ProductionCertificationCoreOptions,
} from "./engine.js";
export { ProductionCertificationCoreController } from "./production-certification-core-controller.js";
export { ProductionCertificationCoreManager } from "./certification-manager.js";
export {
  IntegrationCoordinator,
  type ProductionCertificationCoreDependencies,
  type Q10RuntimeDependencies,
} from "./integrations.js";
export {
  DEFAULT_PRODUCTION_CERTIFICATION_CORE_CONFIGURATION,
  buildProductionCertificationCoreConfiguration,
  type ProductionCertificationCoreConfiguration,
} from "./configuration.js";
export {
  PROGRAMMES,
  listProgrammeIds,
  getProgramme,
  isForbiddenMissionId,
} from "./programme-catalog.js";
export {
  PRODUCTION_CERTIFICATION_CORE_SYSTEM_PATH,
  PRODUCTION_CERTIFICATION_CORE_ID,
  PCCRT_METADATA_VERSION,
  PRODUCTION_CERTIFICATION_CORE_REPORT_VERSION,
  PCCRT_MISSION_ID,
  PRODUCTION_CERTIFICATION_CORE_RUNTIME_VERSION,
  PRODUCTION_CERTIFICATION_CORE_IDENTITY,
  PROGRAMME_CATALOG,
  Q10_RUNTIME_IDS,
  FACTORY_KEYS,
  COMPONENT_TYPES,
  INTEGRATION_TARGETS,
  PCCRT_CAPABILITIES,
  CERTIFICATION_STATUSES,
  CERTIFICATION_DECISIONS,
  AUDIT_STATUSES,
} from "./paths.js";
export * from "./types.js";
export {
  collectFactoryDiscovery,
  collectWorkerDiscovery,
  collectRuntimeDiscovery,
} from "./evidence-collector.js";
export { probeWorker } from "./worker-probe.js";
export { evaluateProgramme, type ProgrammeEvaluationContext } from "./component-classifier.js";
export { verifyIntegrations } from "./integration-verifier.js";
export {
  evaluateGovernanceResults,
  evaluateReportingResults,
  buildFactorySummary,
  buildWorkerSummary,
  buildRuntimeSummary,
  evaluateReadinessSummary,
  buildEvidenceSummary,
} from "./readiness-evaluator.js";
export { evaluateCertificationGates } from "./certification-gates.js";
export { PccrtValidator, HealthMonitor, RecoveryManager } from "./certification-validator.js";
export { CertificationStore, nextReportId, resetPccrtSequenceForTesting } from "./certification-store.js";
export {
  buildCatalog,
  buildReport,
  buildRisksAndFindings,
  computeConfidenceScore,
  mapDecisionToAuditStatus,
} from "./report-builder.js";
export { appendPccrtLog, getPccrtLogs, resetPccrtLogsForTesting } from "./pccrt-logging.js";
