export {
  EnterpriseExecutiveSituationalAwarenessEngine,
  createEnterpriseExecutiveSituationalAwarenessEngine,
  resetEnterpriseExecutiveSituationalAwarenessEngineForTesting,
  type EnterpriseExecutiveSituationalAwarenessEngineOptions,
} from "./engine.js";
export { EnterpriseExecutiveSituationalAwarenessEngineController } from "./enterprise-executive-situational-awareness-engine-controller.js";
export {
  EnterpriseExecutiveSituationalAwarenessEngineManager,
  resetEesaeSequenceForTesting,
  type EesaeRunReport,
} from "./enterprise-executive-situational-awareness-engine-manager.js";
export {
  IntegrationCoordinator,
  verifyIntegrations,
  type EnterpriseExecutiveSituationalAwarenessEngineDependencies,
} from "./integrations.js";
export {
  DEFAULT_EESAE_CONFIGURATION,
  buildEnterpriseExecutiveSituationalAwarenessEngineConfiguration,
  type EnterpriseExecutiveSituationalAwarenessEngineConfiguration,
} from "./configuration.js";
export { collectBoundaryViolations, hasBoundaryViolation } from "./mission-guard.js";
export {
  EESAE_SYSTEM_PATH,
  EESAE_ENGINE_ID,
  EESAE_METADATA_VERSION,
  EESAE_REPORT_VERSION,
  EESAE_MISSION_ID,
  EESAE_RUNTIME_VERSION,
  EESAE_IDENTITY,
  EESAE_CAPABILITIES,
  INTEGRATION_TARGETS,
} from "./paths.js";
export * from "./types.js";
export {
  evaluateSystemHealth,
  evaluatePerformanceIntelligence,
  evaluateBusinessIntelligence,
  evaluateAiWorkforceIntelligence,
  evaluateSelfAwareness,
  detectDeterioration,
  investigateRootCauses,
  estimateBusinessImpactAndUrgency,
  buildAwarenessState,
} from "./evidence-collector.js";
export { EesaeValidator, HealthMonitor, GateManager, validateBoundaries, validateGovernance } from "./audit-validator.js";
export { AuditStore, nextReportId, nextStateId, nextFindingId, nextEscalationId, nextRecommendationId, nextCycleId } from "./audit-store.js";
export {
  buildReport,
  buildGrandKingBriefing,
  buildBriefingText,
  buildCatalog,
  buildExecutiveSummary,
} from "./report-builder.js";
export {
  generateExecutiveRecommendations,
  escalateUnacknowledged,
  acknowledgeFinding,
} from "./recommendation-engine.js";
export { appendEesaeLog, getEesaeLogs, resetEesaeLogsForTesting } from "./eesae-logging.js";
