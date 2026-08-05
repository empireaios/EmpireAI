export {
  SecurityAudit,
  createSecurityAudit,
  resetSecurityAuditForTesting,
  type SecurityAuditOptions,
} from "./engine.js";
export { SecurityAuditController } from "./security-audit-controller.js";
export { SecurityAuditManager } from "./security-audit-manager.js";
export {
  IntegrationCoordinator,
  type SecurityAuditDependencies,
} from "./integrations.js";
export {
  DEFAULT_SECURITY_AUDIT_CONFIGURATION,
  buildSecurityAuditConfiguration,
  type SecurityAuditConfiguration,
} from "./configuration.js";
export { isForbiddenMissionId } from "./mission-guard.js";
export {
  SECURITY_AUDIT_SYSTEM_PATH,
  SECURITY_AUDIT_ID,
  SECART_METADATA_VERSION,
  SECURITY_AUDIT_REPORT_VERSION,
  SECART_MISSION_ID,
  SECURITY_AUDIT_RUNTIME_VERSION,
  SECURITY_AUDIT_IDENTITY,
  SECURITY_COMPONENT_KEYS,
  SECURITY_COMPONENT_LABELS,
  SECURITY_COMPONENT_TYPES,
  REQUIRED_SECURITY_COMPONENT_KEYS,
  OPTIONAL_SECURITY_COMPONENT_KEYS,
  INTEGRATION_TARGETS,
  SECART_CAPABILITIES,
  CHECK_STATUSES,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  AUDIT_STATUSES,
} from "./paths.js";
export * from "./types.js";
export { collectSecurityComponentDiscovery } from "./security-discovery.js";
export {
  classifyComponentDimensions,
  classifySecurityReadiness,
  assessComponent,
  classifyAuthenticationWorker,
  classifyAuthorizationWorker,
  classifyAuthorityMatrix,
  classifyApiRuntime,
  classifyToolRuntime,
  classifyAuditRuntime,
  classifyMonitoringRuntime,
  classifyProductionCertificationCore,
  classifyExecutiveReportingRuntime,
  classifySecretManagement,
} from "./security-classifier.js";
export { verifyIntegrations } from "./integration-verifier.js";
export {
  evaluateGovernanceSummary,
  evaluateAuthenticationSummary,
  evaluateAuthorizationSummary,
  evaluateSecretManagementSummary,
  evaluateApiSecuritySummary,
  evaluateDataProtectionSummary,
  evaluateRuntimeSecuritySummary,
  evaluateOperationalSecuritySummary,
  evaluateSecurityReadinessSummary,
} from "./security-evaluator.js";
export { evaluateSecurityReadinessGates } from "./security-gates.js";
export { SecartValidator, HealthMonitor, RecoveryManager } from "./audit-validator.js";
export { AuditStore, nextReportId, resetSecartSequenceForTesting } from "./audit-store.js";
export {
  buildCatalog,
  buildReport,
  buildOutstandingRisks,
  buildCriticalFindings,
  computeConfidenceScore,
  mapDecisionToAuditStatus,
} from "./report-builder.js";
export { appendSecartLog, getSecartLogs, resetSecartLogsForTesting } from "./secart-logging.js";
