/**
 * G5-01 / G5-02 / G5-03 / G5-04 / G5-05 / G5-06 / G5-07 / G5-08 / G5-09 / G5-10 — Business Automation module.
 */

import { resetTriggerAuditLogForTests } from "./audit/trigger-audit-recorder.js";
import { resetSchedulerAuditLogForTests } from "./audit/scheduler-audit-recorder.js";
import { resetOrchestratorAuditLogForTests } from "./audit/orchestrator-audit-recorder.js";
import { resetApprovalAuditLogForTests } from "./audit/approval-audit-recorder.js";
import { resetRecoveryAuditLogForTests } from "./audit/recovery-audit-recorder.js";
import {
  clearAutomationBrainDispatchForTests,
} from "./broker/brain-dispatch-adapter.js";
import { resetExecutionBrokerForTests } from "./broker/execution-broker.js";
import { resetOrchestratorPluginRegistryForTests } from "./orchestrator/orchestrator-plugin-registry.js";
import { resetWorkflowOrchestratorForTests } from "./orchestrator/workflow-orchestrator.js";
import { resetAutomationRunStoreForTests } from "./state/automation-run-store.js";
import { resetWorkflowSchedulerDispatchForTests } from "./scheduler/workflow-scheduler-dispatch.js";
import { resetSchedulerPluginRegistryForTests } from "./scheduler/scheduler-plugin-registry.js";
import { resetTriggerEngineForTests } from "./triggers/trigger-engine.js";
import { resetTriggerPluginRegistryForTests } from "./triggers/trigger-plugin-registry.js";
import { resetPillowApprovalRouterForTests } from "./approval/pillow-approval-router.js";
import { resetApprovalPluginRegistryForTests } from "./approval/approval-plugin-registry.js";
import { resetApprovalRequestStoreForTests } from "./approval/approval-request-store.js";
import { resetRecoveryEngineForTests } from "./recovery/recovery-engine.js";
import { resetRollbackEngineForTests } from "./recovery/rollback-engine.js";
import { resetRecoveryRecordStoreForTests } from "./recovery/recovery-record-store.js";
import { resetRecoveryPluginRegistryForTests } from "./recovery/recovery-plugin-registry.js";
import { resetGuardianRecoveryEventsForTests } from "./guardian/guardian-recovery-bridge.js";
import { resetAutomationCentrePluginRegistryForTests } from "./cockpit/automation-centre-plugin-registry.js";
import { resetEklsOutcomeIntegrationForTests } from "./outcome/ekls-outcome-integration.js";
import { resetAutomationOutcomeStoreForTests } from "./outcome/automation-outcome-store.js";
import { resetOutcomePluginRegistryForTests } from "./outcome/outcome-plugin-registry.js";
import { resetAutomationPluginHostForTests } from "./plugins/automation-plugin-host.js";
import { resetAutomationPluginDomainRouterForTests } from "./plugins/automation-plugin-domain-router.js";
import { resetPluginAuditLogForTests } from "./audit/plugin-audit-recorder.js";

export {
  listAutomationRegistryIds,
  resolveAutomationRegistry,
  resolveAllAutomationRegistries,
} from "./registry/automation-registry-resolver.js";

export {
  getTriggerEngine,
  resetTriggerEngineForTests,
  TriggerEngine,
} from "./triggers/trigger-engine.js";

export {
  evaluateAutomationTriggers,
  receiveAutomationTrigger,
  getAutomationTriggerStatus,
} from "./services/trigger-engine-service.js";

export {
  getAutomationQueueSnapshot,
  processSchedulerDueItems,
  dispatchNextQueuedAutomation,
  scheduleAutomationRetry,
  cancelScheduledAutomation,
  scheduleAutomationRecovery,
  resolveSchedulePolicyPreview,
} from "./services/scheduler-service.js";

export {
  pickupWaitingAutomation,
  advanceAutomationRun,
  runAutomationToCompletion,
  getAutomationRunStatus,
  getAutomationRunSnapshot,
  previewWorkflowDefinition,
  cancelAutomationRun,
  pauseAutomationRun,
} from "./services/orchestrator-service.js";

export {
  evaluateAutomationApprovalRequirement,
  submitAutomationApproval,
  grantAutomationApproval,
  rejectAutomationApproval,
  cancelAutomationApproval,
  getAutomationApprovalStatus,
  getCockpitAutomationApprovalStatus,
  getAutomationApprovalSnapshot,
  resolveAutomationApprovalPolicyPreview,
  expireDueAutomationApprovals,
} from "./services/approval-router-service.js";

export {
  resolveRecoveryPolicyPreview,
  previewRecoveryStrategy,
  getAutomationRecoveryStatus,
  getAutomationRollbackStatus,
  getCockpitAutomationRecoveryStatus,
  handleAutomationRecovery,
  simulateAutomationFailure,
} from "./services/recovery-service.js";

export {
  createBusinessAutomationModuleContract,
  BUSINESS_AUTOMATION_MODULE_ID,
  BUSINESS_AUTOMATION_CAPABILITIES,
} from "./contract/business-automation-module.js";

export {
  createBusinessAutomationProgrammeCertification,
  BUSINESS_AUTOMATION_PROGRAMME_ID,
  BUSINESS_AUTOMATION_MISSIONS,
} from "./contract/business-automation-programme-certification.js";

export { businessAutomationTools } from "./tools/business-automation-tools.js";

export {
  triggerPluginRegistry,
  resetTriggerPluginRegistryForTests,
} from "./triggers/trigger-plugin-registry.js";

export {
  schedulerPluginRegistry,
  resetSchedulerPluginRegistryForTests,
} from "./scheduler/scheduler-plugin-registry.js";

export {
  orchestratorPluginRegistry,
  resetOrchestratorPluginRegistryForTests,
} from "./orchestrator/orchestrator-plugin-registry.js";

export {
  approvalPluginRegistry,
  resetApprovalPluginRegistryForTests,
} from "./approval/approval-plugin-registry.js";

export {
  recoveryPluginRegistry,
  resetRecoveryPluginRegistryForTests,
} from "./recovery/recovery-plugin-registry.js";

export {
  getRecoveryEngine,
  resetRecoveryEngineForTests,
  RecoveryEngine,
} from "./recovery/recovery-engine.js";

export {
  getRollbackEngine,
  resetRollbackEngineForTests,
  RollbackEngine,
  captureExecutionSnapshot,
} from "./recovery/rollback-engine.js";

export {
  resolveRecoveryPolicy,
  classifyFailureCategory,
  selectRecoveryStrategy,
} from "./recovery/recovery-policy-resolver.js";

export {
  recordRecoveryAuditEvent,
  listRecoveryAuditEvents,
  resetRecoveryAuditLogForTests,
} from "./audit/recovery-audit-recorder.js";

export {
  notifyGuardianRecoveryEvent,
  listGuardianRecoveryEvents,
  resetGuardianRecoveryEventsForTests,
} from "./guardian/guardian-recovery-bridge.js";

export {
  getPillowApprovalRouter,
  resetPillowApprovalRouterForTests,
  PillowApprovalRouter,
} from "./approval/pillow-approval-router.js";

export { routeApprovalRequirement } from "./triggers/approval-router.js";

export {
  resolveApprovalPolicy,
  computeApprovalExpiry,
} from "./approval/approval-policy-resolver.js";

export {
  recordTriggerAuditEvent,
  listTriggerAuditEvents,
  resetTriggerAuditLogForTests,
} from "./audit/trigger-audit-recorder.js";

export {
  recordSchedulerAuditEvent,
  listSchedulerAuditEvents,
  resetSchedulerAuditLogForTests,
} from "./audit/scheduler-audit-recorder.js";

export {
  recordOrchestratorAuditEvent,
  listOrchestratorAuditEvents,
  resetOrchestratorAuditLogForTests,
} from "./audit/orchestrator-audit-recorder.js";

export {
  recordApprovalAuditEvent,
  listApprovalAuditEvents,
  resetApprovalAuditLogForTests,
} from "./audit/approval-audit-recorder.js";

export {
  dispatchToWorkflowScheduler,
  peekSchedulerQueue,
  resetWorkflowSchedulerDispatchForTests,
} from "./scheduler/workflow-scheduler-dispatch.js";

export {
  getWorkflowScheduler,
  WorkflowScheduler,
} from "./scheduler/workflow-scheduler.js";

export {
  getWorkflowOrchestrator,
  WorkflowOrchestrator,
} from "./orchestrator/workflow-orchestrator.js";

export {
  getExecutionBroker,
  ExecutionBroker,
} from "./broker/execution-broker.js";

export {
  resolveExecutorBinding,
  parseExecutorRef,
} from "./broker/executor-resolver.js";

export {
  setAutomationBrainDispatch,
  clearAutomationBrainDispatchForTests,
  dispatchThroughBrain,
} from "./broker/brain-dispatch-adapter.js";

export {
  getAutomationQueue,
  AutomationQueue,
} from "./queue/automation-queue.js";

export {
  getAutomationRunStore,
  AutomationRunStore,
} from "./state/automation-run-store.js";

export {
  resolveSchedulePolicy,
  computeScheduledTime,
  computeExecutionDeadline,
} from "./scheduler/schedule-policy-resolver.js";

export {
  resolveWorkflowDefinition,
  validateWorkflowDependencies,
  topologicalSort,
} from "./orchestrator/dag-resolver.js";

export type { AutomationRegistryRowBase } from "../../registry/types/automation-registry-types.js";

export type {
  TriggerCategory,
  TriggerContext,
  TriggerIntakeRequest,
  TriggerEvaluation,
  AutomationRequest,
  CockpitTriggerStatusSnapshot,
} from "./contracts/trigger-types.js";

export type {
  QueuedAutomationRequest,
  QueueExecutionState,
  QueueSnapshot,
  ScheduleMode,
  ResolvedSchedulePolicy,
} from "./contracts/scheduler-types.js";

export type {
  AutomationRun,
  ExecutionContext,
  RunSnapshot,
  StepResult,
  WorkflowLifecycleState,
  ResolvedWorkflowDefinition,
} from "./contracts/orchestrator-types.js";

export type {
  AutomationApprovalRequest,
  ApprovalState,
  CockpitApprovalStatusSnapshot,
  ResolvedApprovalPolicy,
} from "./contracts/approval-types.js";

export type {
  FailureCategory,
  RecoveryState,
  RecoveryRecord,
  RollbackContext,
  RecoveryOutcome,
  CockpitRecoveryStatusSnapshot,
  ResolvedRecoveryPolicy,
} from "./contracts/recovery-types.js";

export type { TriggerEngineContract } from "./contracts/trigger-engine-contract.js";

export {
  loadAutomationCentreView,
  loadAutomationDetailView,
  loadAutomationTimelineView,
} from "./cockpit/automation-centre-view-loader.js";

export {
  createCockpitAutomationModuleContract,
  COCKPIT_AUTOMATION_MODULE_ID,
  COCKPIT_AUTOMATION_CAPABILITIES,
} from "./contract/cockpit-automation-module.js";

export { cockpitAutomationTools } from "./tools/cockpit-automation-tools.js";

export {
  automationCentrePluginRegistry,
  resetAutomationCentrePluginRegistryForTests,
} from "./cockpit/automation-centre-plugin-registry.js";

export type {
  AutomationCentreView,
  AutomationDetailView,
  AutomationTimelineView,
} from "./cockpit/contracts/automation-centre-types.js";

export {
  resolveAutomationCentreNotifications,
  resolveAutomationCentreRegistryHealth,
} from "./cockpit/automation-centre-registry-resolver.js";

export {
  getEklsOutcomeIntegration,
  resetEklsOutcomeIntegrationForTests,
  EklsOutcomeIntegration,
} from "./outcome/ekls-outcome-integration.js";

export {
  getAutomationLearningRecord,
  searchAutomationLearning,
  getRelatedAutomationExecutions,
  previewOutcomePolicy,
} from "./services/ekls-outcome-service.js";

export { resolveOutcomePolicy } from "./outcome/outcome-policy-resolver.js";

export {
  outcomePluginRegistry,
  resetOutcomePluginRegistryForTests,
} from "./outcome/outcome-plugin-registry.js";

export { eklsOutcomeTools } from "./tools/ekls-outcome-tools.js";

export type {
  AutomationLearningRecord,
  AutomationLearningSearchResult,
  ResolvedOutcomePolicy,
  KnowledgeLifecycleState,
} from "./contracts/ekls-outcome-types.js";

export {
  getAutomationPluginHost,
  resetAutomationPluginHostForTests,
  AutomationPluginHost,
} from "./plugins/automation-plugin-host.js";

export {
  getAutomationPluginDomainRouter,
  resetAutomationPluginDomainRouterForTests,
} from "./plugins/automation-plugin-domain-router.js";

export { resolveAutomationPluginRegistryPolicy } from "./plugins/automation-plugin-registry-resolver.js";

export {
  discoverAutomationPlugins,
  registerAutomationPlugin,
  enableAutomationPlugin,
  disableAutomationPlugin,
  unloadAutomationPlugin,
  getAutomationPlugin,
  listAutomationPlugins,
  listAutomationPluginCapabilities,
  previewAutomationPluginRegistryPolicy,
} from "./services/automation-plugin-service.js";

export { automationPluginTools } from "./tools/automation-plugin-tools.js";

export { listPluginAuditEvents } from "./audit/plugin-audit-recorder.js";

export {
  AUTOMATION_PLUGIN_LIFECYCLE_STATES,
  AUTOMATION_PLUGIN_CATEGORIES,
} from "./contracts/automation-plugin-types.js";

export type {
  AutomationPluginManifest,
  AutomationPluginRecord,
  AutomationPluginCategory,
  AutomationPluginLifecycleState,
  AutomationPluginCapabilitySummary,
  ResolvedAutomationPluginPolicy,
} from "./contracts/automation-plugin-types.js";

export type { AutomationPluginHookBundle } from "./plugins/automation-plugin-domain-router.js";

export {
  AUTOMATION_REGISTRY_IDS,
  REG_AUTOMATION_TRIGGER,
  REG_AUTOMATION_WORKFLOW,
  REG_AUTOMATION_SCHEDULE,
  REG_AUTOMATION_POLICY,
  REG_AUTOMATION_APPROVAL,
  REG_AUTOMATION_EXECUTOR,
  REG_AUTOMATION_RECOVERY,
  REG_AUTOMATION_NOTIFICATION,
  REG_AUTOMATION_REPORT,
  REG_AUTOMATION_MONITOR,
  type AutomationRegistryId,
} from "../../registry/types/registry-ids.js";

export function resetBusinessAutomationHarnessForTests(): void {
  resetTriggerEngineForTests();
  resetTriggerAuditLogForTests();
  resetTriggerPluginRegistryForTests();
  resetWorkflowSchedulerDispatchForTests();
  resetSchedulerPluginRegistryForTests();
  resetSchedulerAuditLogForTests();
  resetWorkflowOrchestratorForTests();
  resetExecutionBrokerForTests();
  resetOrchestratorPluginRegistryForTests();
  resetOrchestratorAuditLogForTests();
  resetAutomationRunStoreForTests();
  clearAutomationBrainDispatchForTests();
  resetPillowApprovalRouterForTests();
  resetApprovalPluginRegistryForTests();
  resetApprovalRequestStoreForTests();
  resetApprovalAuditLogForTests();
  resetRecoveryEngineForTests();
  resetRollbackEngineForTests();
  resetRecoveryRecordStoreForTests();
  resetRecoveryPluginRegistryForTests();
  resetRecoveryAuditLogForTests();
  resetGuardianRecoveryEventsForTests();
  resetAutomationCentrePluginRegistryForTests();
  resetEklsOutcomeIntegrationForTests();
  resetAutomationOutcomeStoreForTests();
  resetOutcomePluginRegistryForTests();
  resetAutomationPluginHostForTests();
  resetAutomationPluginDomainRouterForTests();
  resetPluginAuditLogForTests();
}
