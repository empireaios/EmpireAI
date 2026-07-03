/**
 * G7-07 — Grand King Autonomous Operations service (autonomous operation manager).
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { GRAND_KING_ACCOUNT_HOLDER_ID, LUMINOUSYOU_BRAND_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";
import type { AutonomousOperation, AutonomousOperationsOverview } from "../contracts/autonomous-operations-types.js";
import {
  AUTONOMOUS_DOMAIN_IDS,
  GRAND_KING_AUTONOMOUS_OPERATIONS_VERSION,
} from "../contracts/autonomous-operations-types.js";
import { recordAutonomousEklsObservation } from "../ekls/autonomous-operations-ekls-integration.js";
import { validateAutonomousOperationsPillowGovernance } from "../governance/autonomous-operations-pillow-governance.js";
import {
  deriveAutonomySignalFromRef,
  resolveAutonomousOperationDependencies,
  resolveOperationTypeForDomain,
} from "../registry/autonomous-operations-registry-resolver.js";
import {
  appendAutonomousOperation,
  getAutonomousOperation,
  listAutonomousOperations,
  transitionAutonomousOperationStatus,
} from "./autonomous-operation-store.js";
import { evaluateAutonomyPolicy } from "./autonomy-policy-evaluator.js";
import { evaluateAutonomyApproval, resolveInitialExecutionStatus } from "./autonomy-approval-evaluator.js";
import { routeAutonomousDecisions } from "./autonomous-decision-router.js";
import {
  scheduleAutonomousOperation,
  startAutonomousExecution,
  completeAutonomousExecution,
} from "./autonomous-execution-scheduler.js";
import { validateAutonomousSafety } from "./autonomous-safety-validator.js";
import { rollbackAutonomousOperation } from "./autonomous-rollback-integration.js";
import { recordAutonomousLearningBaseline } from "./autonomous-learning-integration.js";

let initialized = false;

export function resetAutonomousOperationsStateForTests(): void {
  initialized = false;
}

function createAutonomousOperation(input: {
  domainId: (typeof AUTONOMOUS_DOMAIN_IDS)[number];
  recommendedAction: string;
  autonomyLevel: AutonomousOperation["autonomyLevel"];
  deps: ReturnType<typeof resolveAutonomousOperationDependencies>;
  correlationId: string;
}): AutonomousOperation {
  const now = new Date().toISOString();
  const signal = input.deps.readinessSignals.reduce(
    (sum, ref) => sum + deriveAutonomySignalFromRef(ref),
    0,
  );
  const riskScore = Math.round((1 - signal / Math.max(input.deps.readinessSignals.length, 1)) * 100);
  const approval = evaluateAutonomyApproval({ autonomyLevel: input.autonomyLevel, riskScore });
  const executionStatus = resolveInitialExecutionStatus(input.autonomyLevel, approval.requiresApproval);

  return {
    autonomousOperationId: randomUUID(),
    workspaceId: GRAND_KING_WORKSPACE_ID,
    brandId: LUMINOUSYOU_BRAND_ID,
    operationType: resolveOperationTypeForDomain(input.domainId),
    domainId: input.domainId,
    autonomyLevel: input.autonomyLevel,
    approvalPolicy: approval.approvalPolicy,
    executionStatus,
    healthStatus: "unknown",
    riskScore,
    estimatedImpact: Math.round(signal * 100),
    recommendedAction: input.recommendedAction,
    rollbackReference: `rollback:pending:${input.domainId}`,
    evidence: [{
      evidenceId: `ev-${input.domainId}`,
      kind: "reference",
      summary: `Autonomous operation resolved from registry policies`,
      ref: input.deps.automationPolicy,
    }],
    createdAt: now,
    updatedAt: now,
    correlationId: input.correlationId,
    governanceState: approval.requiresApproval ? "pillow-approval-pending" : "pillow-scheduled",
  };
}

export function initializeAutonomousOperations(context: RegistryLoaderContext = {}): {
  operations: AutonomousOperation[];
  overview: AutonomousOperationsOverview;
} {
  if (initialized) {
    return {
      operations: listAutonomousOperations(),
      overview: getAutonomousOperationsOverview(context),
    };
  }

  const deps = resolveAutonomousOperationDependencies(context);
  const correlationId = randomUUID();
  const routed = routeAutonomousDecisions(context);
  const operations: AutonomousOperation[] = [];

  for (const rec of routed) {
    const policy = evaluateAutonomyPolicy(rec.domainId, context);
    if (!policy.eligible) continue;

    const operation = createAutonomousOperation({
      domainId: rec.domainId,
      recommendedAction: rec.recommendedAction,
      autonomyLevel: rec.autonomyLevel,
      deps,
      correlationId,
    });

    appendAutonomousOperation(operation);
    operations.push(operation);

    const safety = validateAutonomousSafety(operation, context);
    if (safety.safe && operation.executionStatus === "scheduled") {
      scheduleAutonomousOperation({
        operation,
        actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
        ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
        context,
      });
      const running = startAutonomousExecution({
        autonomousOperationId: operation.autonomousOperationId,
        actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
        ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
        context,
      });
      completeAutonomousExecution({
        autonomousOperationId: running.autonomousOperationId,
        executedAction: rec.recommendedAction,
        actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
        ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
      });
    } else {
      recordAutonomousEklsObservation({
        actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
        workspaceId: GRAND_KING_WORKSPACE_ID,
        autonomousOperationId: operation.autonomousOperationId,
        ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
        kind: "autonomous_operation_started",
        summary: `Autonomous operation ${operation.executionStatus}: ${rec.recommendedAction}`,
        pillowGovernance: true,
      });
    }
  }

  recordAutonomousLearningBaseline();
  initialized = true;

  return {
    operations: listAutonomousOperations(),
    overview: getAutonomousOperationsOverview(context),
  };
}

export function getAutonomousOperationsOverview(context: RegistryLoaderContext = {}): AutonomousOperationsOverview {
  const operations = listAutonomousOperations();
  return {
    frameworkVersion: GRAND_KING_AUTONOMOUS_OPERATIONS_VERSION,
    domainCount: AUTONOMOUS_DOMAIN_IDS.length,
    activeOperations: operations.filter((op) => op.executionStatus === "running").length,
    queuedOperations: operations.filter((op) =>
      ["waiting", "scheduled", "approval_pending"].includes(op.executionStatus),
    ).length,
    pausedOperations: operations.filter((op) => op.executionStatus === "paused").length,
    failedOperations: operations.filter((op) => op.executionStatus === "failed").length,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    accountHolderId: GRAND_KING_ACCOUNT_HOLDER_ID,
    generatedAt: new Date().toISOString(),
  };
}

export function pauseAutonomousOperation(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  autonomousOperationId: string;
  pillowGovernance: true;
}): AutonomousOperation {
  const pillow = validateAutonomousOperationsPillowGovernance({
    ...input,
    operation: "pause",
  });
  if (!pillow.allowed) throw new Error(pillow.reason);
  return transitionAutonomousOperationStatus(input.autonomousOperationId, "paused", "Operation paused");
}

export function resumeAutonomousOperation(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  autonomousOperationId: string;
  pillowGovernance: true;
}): AutonomousOperation {
  const pillow = validateAutonomousOperationsPillowGovernance({
    ...input,
    operation: "resume",
  });
  if (!pillow.allowed) throw new Error(pillow.reason);
  const op = getAutonomousOperation(input.autonomousOperationId);
  const target = op?.executionStatus === "scheduled" ? "scheduled" : "running";
  return transitionAutonomousOperationStatus(input.autonomousOperationId, target, "Operation resumed");
}

export function cancelAutonomousOperation(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  autonomousOperationId: string;
  pillowGovernance: true;
}): AutonomousOperation {
  return rollbackAutonomousOperation(input);
}

export function getAutonomousOperationStatus(context: RegistryLoaderContext = {}) {
  const deps = resolveAutonomousOperationDependencies(context);
  return {
    frameworkVersion: GRAND_KING_AUTONOMOUS_OPERATIONS_VERSION,
    initialized,
    overview: getAutonomousOperationsOverview(context),
    registryIds: deps,
    programmeStatus: "autonomous-operations-established",
  };
}

export {
  getAutonomousOperation,
  listAutonomousOperations,
  rollbackAutonomousOperation,
};
