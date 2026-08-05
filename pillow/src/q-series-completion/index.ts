export {
  QSeriesCompletion,
  createQSeriesCompletion,
  resetQSeriesCompletionForTesting,
  type QSeriesCompletionOptions,
} from "./engine.js";
export { QSeriesCompletionController } from "./q-series-completion-controller.js";
export { QSeriesCompletionManager } from "./q-series-completion-manager.js";
export {
  IntegrationCoordinator,
  verifyIntegrations,
  type QSeriesCompletionDependencies,
} from "./integrations.js";
export {
  DEFAULT_Q_SERIES_COMPLETION_CONFIGURATION,
  buildQSeriesCompletionConfiguration,
  type QSeriesCompletionConfiguration,
} from "./configuration.js";
export { isForbiddenMissionId, isGkAuthorised } from "./mission-guard.js";
export {
  Q_SERIES_COMPLETION_SYSTEM_PATH,
  Q_SERIES_COMPLETION_ID,
  QSCPT_METADATA_VERSION,
  Q_SERIES_COMPLETION_REPORT_VERSION,
  QSCPT_MISSION_ID,
  Q_SERIES_COMPLETION_RUNTIME_VERSION,
  QSCPT_CAPABILITIES,
  COMPLETION_CLASSIFICATIONS,
  FINAL_COMPLETION_DECISIONS,
  Q11_MISSION_INVENTORY,
} from "./paths.js";
export * from "./types.js";
export {
  verifyMissionCompletion,
  verifyWorkforceCapabilities,
  verifyRuntimeIntegration,
  verifyGovernanceCompliance,
  verifyCertificationCompletion,
  verifyProductionReadiness,
  aggregateFinalCompletionEvidence,
  classifyCompletionReadiness,
  produceFinalCompletionDecision,
} from "./evidence-collector.js";
export { QscptValidator, HealthMonitor, GateManager } from "./audit-validator.js";
export { AuditStore, nextReportId, resetQscptSequenceForTesting } from "./audit-store.js";
export { buildCatalog, buildReport } from "./report-builder.js";
export { appendQscptLog, getQscptLogs, resetQscptLogsForTesting } from "./qscpt-logging.js";
