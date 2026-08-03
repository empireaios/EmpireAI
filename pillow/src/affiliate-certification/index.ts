export {
  AffiliateCertification,
  createAffiliateCertification,
  resetAffiliateCertificationForTesting,
  type AffiliateCertificationOptions,
} from "./engine.js";
export { AffiliateCertificationController } from "./affiliate-certification-controller.js";
export { AffiliateCertificationManager } from "./certification-manager.js";
export {
  IntegrationCoordinator,
  type AffiliateCertificationDependencies,
  type Q8WorkerDependencies,
} from "./integrations.js";
export {
  DEFAULT_AFFILIATE_CERTIFICATION_CONFIGURATION,
  buildAffiliateCertificationConfiguration,
  type AffiliateCertificationConfiguration,
} from "./configuration.js";
export { Q8_MISSIONS, listMissionIds, getMission, getMissionByDependencyKey } from "./mission-catalog.js";
export {
  AFFILIATE_CERTIFICATION_SYSTEM_PATH,
  AFFILIATE_CERTIFICATION_ID,
  AFCRT_METADATA_VERSION,
  AFFILIATE_CERTIFICATION_REPORT_VERSION,
  AFCRT_MISSION_ID,
  AFFILIATE_CERTIFICATION_IDENTITY,
  Q8_MISSION_CATALOG,
  CRITICAL_MISSION_IDS,
  INTEGRATION_TARGETS,
  AFCRT_CAPABILITIES,
  COMPONENT_STATUSES,
  CERTIFICATION_DECISIONS,
  AUDIT_STATUSES,
} from "./paths.js";
export * from "./types.js";
export { collectRepositoryEvidence, collectMissionEvidence } from "./evidence-collector.js";
export { probeWorker } from "./worker-probe.js";
export { classifyComponent, classifyMissionDeferred } from "./component-classifier.js";
export { verifyIntegrations } from "./integration-verifier.js";
export {
  evaluateGovernanceCompliance,
  evaluateOperationalReadiness,
  evaluateProductionReadiness,
  evaluateReportingCapability,
  evaluateWorkflowCompleteness,
} from "./readiness-evaluator.js";
export { evaluateCertificationGates } from "./certification-gates.js";
export { AfcrtValidator, HealthMonitor, RecoveryManager } from "./certification-validator.js";
export { CertificationStore, nextReportId, resetAfcrtSequenceForTesting } from "./certification-store.js";
export {
  buildCatalog,
  buildDeliverableVerification,
  buildReport,
  buildRisksAndFindings,
  buildTraceabilityRefs,
  computeConfidenceScore,
  mapDecisionToAuditStatus,
} from "./report-builder.js";
export { appendAfcrtLog, getAfcrtLogs, resetAfcrtLogsForTesting } from "./afcrt-logging.js";
