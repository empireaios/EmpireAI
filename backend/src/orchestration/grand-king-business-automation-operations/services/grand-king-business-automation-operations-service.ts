/**
 * G7-03 — Grand King business automation operations service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { LUMINOUSYOU_BRAND_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";
import type {
  AutomationOperation,
  AutomationOperationHealthSummary,
  AutomationOperationRun,
  AutomationOperationsOverview,
} from "../contracts/automation-operations-types.js";
import { GRAND_KING_BUSINESS_AUTOMATION_OPERATIONS_VERSION } from "../contracts/automation-operations-types.js";
import type { AutomationOperationsDomainDefinition } from "../data/automation-operations-domain-seed.js";
import { recordAutomationOperationsEklsObservation } from "../ekls/automation-operations-ekls-integration.js";
import { validateAutomationOperationsPillowGovernance } from "../governance/automation-operations-pillow-governance.js";
import {
  resolveAutomationOperationDependencies,
  resolveAutomationOperationDomains,
  resolveAutomationRegistryRefs,
} from "../registry/automation-operations-registry-resolver.js";
import { integrateApprovalQueue } from "./approval-queue-integration.js";
import { evaluateAggregateAutomationHealth, evaluateAutomationOperationHealth } from "./automation-health-evaluator.js";
import { transitionAutomationOperationStatus } from "./automation-lifecycle-manager.js";
import { validateAutomationReadiness } from "./automation-readiness-validator.js";
import { launchProductionWorkflow } from "./production-workflow-launcher.js";
import { integrateRecoveryOperations } from "./recovery-integration.js";
import { integrateProductionScheduler } from "./production-scheduler-integration.js";
import { monitorWorkflowExecutions } from "./workflow-execution-monitor.js";

const operationStore = new Map<string, AutomationOperation>();
let lastRun: AutomationOperationRun | undefined;

export function resetAutomationOperationsStateForTests(): void {
  operationStore.clear();
  lastRun = undefined;
}

function createOperationFromDomain(input: {
  domain: AutomationOperationsDomainDefinition;
  readiness: ReturnType<typeof validateAutomationReadiness>;
  refs: ReturnType<typeof resolveAutomationRegistryRefs>;
  correlationId: string;
}): AutomationOperation {
  const now = new Date().toISOString();
  const initialStatus = input.readiness.ready ? "ready" : "blocked";

  return {
    automationOperationId: randomUUID(),
    workflowRunId: "",
    workflowId: input.refs.workflowId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    brandId: LUMINOUSYOU_BRAND_ID,
    triggerId: input.refs.triggerId,
    queueId: input.refs.queueId,
    approvalId: input.refs.approvalId,
    recoveryId: input.refs.recoveryId,
    executionStatus: initialStatus,
    healthStatus: initialStatus === "ready" ? "healthy" : "unknown",
    readinessReference: input.readiness.readinessReference,
    evidence: [{
      evidenceId: `ev-${input.domain.domainId}`,
      kind: "reference",
      summary: `Automation domain ${input.domain.domainName} resolved from ${input.domain.primaryRegistryId}`,
      ref: input.domain.primaryRegistryId,
    }],
    risks: [],
    blockers: input.readiness.ready
      ? []
      : input.readiness.conditions.map((condition, index) => ({
          blockerId: `blocker-${input.domain.domainId}-${index}`,
          domainId: input.domain.domainId,
          severity: "critical" as const,
          message: condition,
          recommendation: "Resolve automation readiness blockers",
        })),
    startedAt: now,
    correlationId: input.correlationId,
    governanceState: input.readiness.ready ? "pillow-approved" : "automation-blocked",
    domainId: input.domain.domainId,
    domainName: input.domain.domainName,
  };
}

export function initializeAutomationOperations(context: RegistryLoaderContext = {}): AutomationOperationRun {
  const domains = resolveAutomationOperationDomains();
  const readiness = validateAutomationReadiness(context);
  const refs = resolveAutomationRegistryRefs(context);
  const correlationId = randomUUID();
  const runId = randomUUID();

  const operations = domains.map((domain) => {
    const op = createOperationFromDomain({ domain, readiness, refs, correlationId });
    operationStore.set(op.automationOperationId, op);
    return op;
  });

  lastRun = {
    runId,
    correlationId,
    operations,
    executingCount: operations.filter((op) => op.executionStatus === "executing").length,
    blockedCount: operations.filter((op) => op.executionStatus === "blocked").length,
    scannedAt: new Date().toISOString(),
    discoverySource: "REG-AUTOMATION-WORKFLOW",
  };

  return lastRun;
}

export function getLastAutomationOperationRun(): AutomationOperationRun | undefined {
  return lastRun;
}

export function getAutomationOperation(automationOperationId: string): AutomationOperation | undefined {
  return operationStore.get(automationOperationId);
}

export function listAutomationOperations(): AutomationOperation[] {
  return [...operationStore.values()];
}

export function getAutomationOperationsOverview(context: RegistryLoaderContext = {}): AutomationOperationsOverview {
  const operations = listAutomationOperations();
  const readiness = validateAutomationReadiness(context);
  return {
    frameworkVersion: GRAND_KING_BUSINESS_AUTOMATION_OPERATIONS_VERSION,
    domainCount: resolveAutomationOperationDomains().length,
    operationCount: operations.length,
    executingOperations: operations.filter((op) => op.executionStatus === "executing").length,
    productionEligible: readiness.productionEligible,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    brandId: LUMINOUSYOU_BRAND_ID,
    generatedAt: new Date().toISOString(),
  };
}

function requireGovernance(input: {
  actorId: string;
  ownerId: string;
  operation: "start" | "pause" | "resume" | "cancel" | "overview";
}): void {
  const governance = validateAutomationOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    ownerId: input.ownerId,
    operation: input.operation,
    pillowGovernance: true,
  });
  if (!governance.allowed) throw new Error(governance.reason);
}

function updateOperation(operation: AutomationOperation): AutomationOperation {
  operationStore.set(operation.automationOperationId, operation);
  return operation;
}

export function startAutomationOperation(input: {
  actorId: string;
  ownerId: string;
  automationOperationId: string;
  pillowGovernance: true;
}): AutomationOperation {
  requireGovernance({ actorId: input.actorId, ownerId: input.ownerId, operation: "start" });

  const operation = operationStore.get(input.automationOperationId);
  if (!operation) throw new Error(`Automation operation not found: ${input.automationOperationId}`);

  const readiness = validateAutomationReadiness();
  if (!readiness.ready) throw new Error("Automation operations not ready");

  const launched = launchProductionWorkflow(operation);
  if (!launched.ok) throw new Error(launched.reason);

  const updated = updateOperation(launched.operation);
  recordAutomationOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: updated.workspaceId,
    automationOperationId: updated.automationOperationId,
    ownerId: input.ownerId,
    kind: "automation_operation_started",
    summary: `Automation operation ${updated.domainName} started`,
    pillowGovernance: true,
  });
  return updated;
}

export function pauseAutomationOperation(input: {
  actorId: string;
  ownerId: string;
  automationOperationId: string;
  pillowGovernance: true;
}): AutomationOperation {
  requireGovernance({ actorId: input.actorId, ownerId: input.ownerId, operation: "pause" });

  const operation = operationStore.get(input.automationOperationId);
  if (!operation) throw new Error(`Automation operation not found: ${input.automationOperationId}`);

  const paused = transitionAutomationOperationStatus(operation, "paused", "pillow-approved");
  if (!paused.ok) throw new Error(paused.reason);

  const updated = updateOperation({ ...paused.operation, healthStatus: "degraded" });
  recordAutomationOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: updated.workspaceId,
    automationOperationId: updated.automationOperationId,
    ownerId: input.ownerId,
    kind: "automation_operation_paused",
    summary: `Automation operation ${updated.domainName} paused`,
    pillowGovernance: true,
  });
  return updated;
}

export function resumeAutomationOperation(input: {
  actorId: string;
  ownerId: string;
  automationOperationId: string;
  pillowGovernance: true;
}): AutomationOperation {
  requireGovernance({ actorId: input.actorId, ownerId: input.ownerId, operation: "resume" });

  const operation = operationStore.get(input.automationOperationId);
  if (!operation) throw new Error(`Automation operation not found: ${input.automationOperationId}`);

  const executing = transitionAutomationOperationStatus(operation, "executing", "pillow-approved");
  if (!executing.ok) throw new Error(executing.reason);

  const updated = updateOperation({ ...executing.operation, healthStatus: "healthy" });
  recordAutomationOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: updated.workspaceId,
    automationOperationId: updated.automationOperationId,
    ownerId: input.ownerId,
    kind: "automation_operation_resumed",
    summary: `Automation operation ${updated.domainName} resumed`,
    pillowGovernance: true,
  });
  return updated;
}

export function cancelAutomationOperation(input: {
  actorId: string;
  ownerId: string;
  automationOperationId: string;
  pillowGovernance: true;
}): AutomationOperation {
  requireGovernance({ actorId: input.actorId, ownerId: input.ownerId, operation: "cancel" });

  const operation = operationStore.get(input.automationOperationId);
  if (!operation) throw new Error(`Automation operation not found: ${input.automationOperationId}`);

  const cancelled = transitionAutomationOperationStatus(operation, "cancelled", "pillow-cancelled");
  if (!cancelled.ok) throw new Error(cancelled.reason);

  const updated = updateOperation({ ...cancelled.operation, healthStatus: "unknown" });
  recordAutomationOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: updated.workspaceId,
    automationOperationId: updated.automationOperationId,
    ownerId: input.ownerId,
    kind: "automation_operation_completed",
    summary: `Automation operation ${updated.domainName} cancelled`,
    pillowGovernance: true,
  });
  return updated;
}

export function getAutomationOperationHealth(
  automationOperationId: string,
  context: RegistryLoaderContext = {},
): AutomationOperationHealthSummary {
  const operation = operationStore.get(automationOperationId);
  if (!operation) {
    return {
      score: 0,
      healthy: false,
      healthStatus: "unknown",
      executionStatus: "blocked",
      signals: [],
      blockers: [],
    };
  }
  return evaluateAutomationOperationHealth(operation, context);
}

export function getAutomationOperationDependencies(context: RegistryLoaderContext = {}) {
  return resolveAutomationOperationDependencies(context);
}

export function getAutomationOperationSummary(context: RegistryLoaderContext = {}): string {
  const overview = getAutomationOperationsOverview(context);
  return `Grand King Business Automation Operations: ${overview.operationCount} operations, ${overview.executingOperations} executing (eligible=${overview.productionEligible})`;
}

export function getExecutiveAutomationDashboard(context: RegistryLoaderContext = {}) {
  const operations = listAutomationOperations();
  return {
    workflowQueue: integrateProductionScheduler(operations),
    activeExecutions: monitorWorkflowExecutions(operations),
    approvals: integrateApprovalQueue(operations),
    recoveries: integrateRecoveryOperations(operations),
    automationHealth: evaluateAggregateAutomationHealth(operations, context),
  };
}

export function recordAutomationOperationLearning(input: {
  actorId: string;
  ownerId: string;
  automationOperationId: string;
  summary: string;
  pillowGovernance: true;
}): void {
  recordAutomationOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    automationOperationId: input.automationOperationId,
    ownerId: input.ownerId,
    kind: "automation_operation_learning",
    summary: input.summary,
    pillowGovernance: true,
  });
}

export function failAutomationOperation(input: {
  actorId: string;
  ownerId: string;
  automationOperationId: string;
  reason: string;
  pillowGovernance: true;
}): AutomationOperation {
  const operation = operationStore.get(input.automationOperationId);
  if (!operation) throw new Error(`Automation operation not found: ${input.automationOperationId}`);

  const failed = transitionAutomationOperationStatus(operation, "failed", "pillow-failed");
  if (!failed.ok) throw new Error(failed.reason);

  const updated = updateOperation({ ...failed.operation, healthStatus: "unhealthy" });
  recordAutomationOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: updated.workspaceId,
    automationOperationId: updated.automationOperationId,
    ownerId: input.ownerId,
    kind: "automation_operation_failed",
    summary: input.reason,
    pillowGovernance: true,
  });
  return updated;
}

export function recoverAutomationOperation(input: {
  actorId: string;
  ownerId: string;
  automationOperationId: string;
  pillowGovernance: true;
}): AutomationOperation {
  const operation = operationStore.get(input.automationOperationId);
  if (!operation) throw new Error(`Automation operation not found: ${input.automationOperationId}`);

  const recovering = transitionAutomationOperationStatus(operation, "recovering", "pillow-recovery");
  if (!recovering.ok) throw new Error(recovering.reason);

  const executing = transitionAutomationOperationStatus(recovering.operation, "executing", "pillow-approved");
  if (!executing.ok) throw new Error(executing.reason);

  const updated = updateOperation({ ...executing.operation, healthStatus: "healthy" });
  recordAutomationOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: updated.workspaceId,
    automationOperationId: updated.automationOperationId,
    ownerId: input.ownerId,
    kind: "automation_operation_recovered",
    summary: `Automation operation ${updated.domainName} recovered`,
    pillowGovernance: true,
  });
  return updated;
}
