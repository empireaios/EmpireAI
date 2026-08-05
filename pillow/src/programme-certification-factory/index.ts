export {
  ProgrammeCertificationFactory,
  createProgrammeCertificationFactory,
  resetProgrammeCertificationFactoryForTesting,
  type ProgrammeCertificationFactoryOptions,
  type ProgrammeSeriesCertification,
} from "./engine.js";
export { ProgrammeCertificationFactoryController } from "./programme-certification-factory-controller.js";
export { ProgrammeCertificationFactoryManager } from "./programme-certification-factory-manager.js";
export {
  IntegrationCoordinator,
  verifyIntegrations,
  type ProgrammeCertificationFactoryDependencies,
} from "./integrations.js";
export {
  DEFAULT_PROGRAMME_CERTIFICATION_FACTORY_CONFIGURATION,
  buildProgrammeCertificationFactoryConfiguration,
  type ProgrammeCertificationFactoryConfiguration,
} from "./configuration.js";
export { isForbiddenMissionId } from "./mission-guard.js";
export {
  PROGRAMME_CERTIFICATION_FACTORY_SYSTEM_PATH,
  PROGRAMME_CERTIFICATION_FACTORY_ID,
  PCFCT_METADATA_VERSION,
  PROGRAMME_CERTIFICATION_FACTORY_REPORT_VERSION,
  PCFCT_MISSION_ID,
  PROGRAMME_CERTIFICATION_FACTORY_RUNTIME_VERSION,
  PCFCT_CAPABILITIES,
  CONSTITUTIONAL_PROGRAMME_CATALOG,
  CONSTITUTIONAL_PROGRAMME_CODES,
} from "./paths.js";
export * from "./types.js";
export {
  discoverApprovedProgrammes,
  auditProgrammeRepository,
  classifyMissions,
  compareAgainstRoadmapEvidence,
  produceProgrammeGapAnalysis,
  generateCompletionRecommendations,
  verifyCompletionAfterCorrections,
  consumeQ1306Contract,
  buildProgrammeCertification,
  detectRemainingConstitutionalExceptions,
  validateBoundaries,
  validateGovernance,
} from "./evidence-collector.js";
export { PcfctValidator, HealthMonitor, GateManager } from "./audit-validator.js";
export { AuditStore, nextReportId, nextCertificationId, nextFinalCertificationId, resetPcfctSequenceForTesting } from "./audit-store.js";
export { buildCatalog, buildReport, buildFinalRepositoryConstitutionalCertification } from "./report-builder.js";
export { appendPcfctLog, getPcfctLogs, resetPcfctLogsForTesting } from "./pcfct-logging.js";
