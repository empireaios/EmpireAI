export {
  ImplementationRecoveryPlanner,
  createImplementationRecoveryPlanner,
  resetImplementationRecoveryPlannerForTesting,
  type ImplementationRecoveryPlannerOptions,
} from "./engine.js";
export { ImplementationRecoveryPlannerController } from "./implementation-recovery-planner-controller.js";
export { ImplementationRecoveryPlannerManager } from "./implementation-recovery-planner-manager.js";
export {
  IntegrationCoordinator,
  verifyIntegrations,
  type ImplementationRecoveryPlannerDependencies,
} from "./integrations.js";
export {
  DEFAULT_IMPLEMENTATION_RECOVERY_PLANNER_CONFIGURATION,
  buildImplementationRecoveryPlannerConfiguration,
  type ImplementationRecoveryPlannerConfiguration,
} from "./configuration.js";
export { isForbiddenMissionId } from "./mission-guard.js";
export {
  IMPLEMENTATION_RECOVERY_PLANNER_SYSTEM_PATH,
  IMPLEMENTATION_RECOVERY_PLANNER_ID,
  IRPLN_METADATA_VERSION,
  IMPLEMENTATION_RECOVERY_PLANNER_REPORT_VERSION,
  IRPLN_MISSION_ID,
  IMPLEMENTATION_RECOVERY_PLANNER_RUNTIME_VERSION,
  IRPLN_CAPABILITIES,
  RECOVERY_SPEC_SECTIONS,
} from "./paths.js";
export * from "./types.js";
export {
  detectInterruptedOrIncompleteMission,
  consumeQ1305Contract,
  resolveApprovedMissionSpecification,
  analyseCurrentRepositoryState,
  compareAgainstApprovedSpecification,
  detectCompletedWork,
  detectPartialWork,
  detectMissingImplementation,
  detectConflictingImplementation,
  generateRecoveryStrategy,
  generateRecoveryPlan,
  generateRecoverySpecification,
  verifyRecoveryPrerequisite,
  validateBoundaries,
  validateGovernance,
} from "./evidence-collector.js";
export { IrplnValidator, HealthMonitor, GateManager } from "./audit-validator.js";
export { AuditStore, nextReportId, nextRecoveryId, resetIrplnSequenceForTesting } from "./audit-store.js";
export { buildCatalog, buildReport } from "./report-builder.js";
export { appendIrplnLog, getIrplnLogs, resetIrplnLogsForTesting } from "./irpln-logging.js";
