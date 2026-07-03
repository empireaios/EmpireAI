/**
 * G7-00 — Grand King live operations service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type {
  LiveOperation,
  LiveOperationRun,
  LiveOperationsOverview,
} from "../contracts/live-operations-types.js";
import { GRAND_KING_LIVE_OPERATIONS_VERSION } from "../contracts/live-operations-types.js";
import { recordLiveOperationsEklsObservation } from "../ekls/live-operations-ekls-integration.js";
import { validateLiveOperationsPillowGovernance } from "../governance/live-operations-pillow-governance.js";
import {
  resolveGrandKingOperatingProfile,
  resolveLiveEnvironmentProfile,
  resolveLiveOperationDomains,
} from "../registry/live-operations-registry-resolver.js";
import { transitionLiveOperationState } from "./live-operation-state-engine.js";
import { validateProductionEligibilityGate } from "./production-eligibility-gate.js";

const operationStore = new Map<string, LiveOperation>();
let lastRun: LiveOperationRun | undefined;

export function resetLiveOperationsStateForTests(): void {
  operationStore.clear();
  lastRun = undefined;
}

function buildReferences(domain: ReturnType<typeof resolveLiveOperationDomains>[number]): {
  providerReferences: LiveOperation["providerReferences"];
  automationReferences: LiveOperation["automationReferences"];
  commerceReferences: LiveOperation["commerceReferences"];
} {
  return {
    providerReferences: domain.providerRef ? [{ providerId: domain.providerRef, ref: domain.providerRef }] : [],
    automationReferences: domain.automationRegistryRef
      ? [{ workflowId: domain.automationRegistryRef, ref: domain.automationRegistryRef }]
      : [],
    commerceReferences: domain.commerceRegistryRef
      ? [{ registryId: domain.commerceRegistryRef, ref: domain.commerceRegistryRef }]
      : [],
  };
}

function createOperationFromDomain(input: {
  domain: ReturnType<typeof resolveLiveOperationDomains>[number];
  profile: ReturnType<typeof resolveGrandKingOperatingProfile>;
  envProfile: ReturnType<typeof resolveLiveEnvironmentProfile>;
  gate: ReturnType<typeof validateProductionEligibilityGate>;
  correlationId: string;
}): LiveOperation {
  const now = new Date().toISOString();
  const refs = buildReferences(input.domain);
  const initialStatus = input.gate.eligible ? "ready" : "blocked";
  return {
    operationId: randomUUID(),
    workspaceId: input.profile.workspaceId,
    accountHolderId: input.profile.accountHolderId,
    companyId: input.profile.companyId,
    brandId: input.profile.brandId,
    environment: input.envProfile.environment,
    operationType: input.domain.operationType,
    status: initialStatus,
    readinessReference: input.gate.readinessReference,
    certificationReference: input.gate.certificationReference,
    providerReferences: refs.providerReferences,
    automationReferences: refs.automationReferences,
    commerceReferences: refs.commerceReferences,
    evidence: [{
      evidenceId: `ev-${input.domain.domainRowId}`,
      kind: "reference",
      summary: `Live operation domain ${input.domain.domainId} resolved from registry`,
      ref: input.domain.domainRowId,
    }],
    risks: [],
    blockers: input.gate.eligible
      ? []
      : [{
          blockerId: `blocker-${input.domain.domainId}`,
          domainId: input.domain.domainId,
          severity: "critical",
          message: input.gate.reason,
          recommendation: "Complete G6 production readiness certification",
        }],
    startedAt: now,
    updatedAt: now,
    correlationId: input.correlationId,
    governanceState: input.gate.eligible ? "pillow-approved" : "production-blocked",
  };
}

export function initializeLiveOperations(context: RegistryLoaderContext = {}): LiveOperationRun {
  const domains = resolveLiveOperationDomains(context);
  const profile = resolveGrandKingOperatingProfile(context);
  const envProfile = resolveLiveEnvironmentProfile(context);
  const gate = validateProductionEligibilityGate(context);
  const correlationId = randomUUID();
  const runId = randomUUID();

  const operations = domains.map((domain) => {
    const op = createOperationFromDomain({ domain, profile, envProfile, gate, correlationId });
    operationStore.set(op.operationId, op);
    return op;
  });

  lastRun = {
    runId,
    correlationId,
    operations,
    activeCount: operations.filter((op) => op.status === "active").length,
    blockedCount: operations.filter((op) => op.status === "blocked").length,
    scannedAt: new Date().toISOString(),
    discoverySource: "REG-LIVE-OPERATIONS-DOMAIN",
  };

  return lastRun;
}

export function getLiveOperationsOverview(context: RegistryLoaderContext = {}): LiveOperationsOverview {
  const domains = resolveLiveOperationDomains(context);
  const profile = resolveGrandKingOperatingProfile(context);
  const envProfile = resolveLiveEnvironmentProfile(context);
  const gate = validateProductionEligibilityGate(context);
  const operations = [...operationStore.values()];

  return {
    frameworkVersion: GRAND_KING_LIVE_OPERATIONS_VERSION,
    domainCount: domains.length,
    operationCount: operations.length,
    activeOperations: operations.filter((op) => op.status === "active").length,
    productionEligible: gate.eligible,
    grandKingProfileId: profile.profileId,
    environmentProfileId: envProfile.profileId,
    generatedAt: new Date().toISOString(),
  };
}

export function getLastLiveOperationRun(): LiveOperationRun | undefined {
  return lastRun;
}

export function getLiveOperation(operationId: string): LiveOperation | undefined {
  return operationStore.get(operationId);
}

export function listLiveOperations(): LiveOperation[] {
  return [...operationStore.values()];
}

function updateOperation(operation: LiveOperation): LiveOperation {
  operationStore.set(operation.operationId, operation);
  if (lastRun) {
    const operations = [...operationStore.values()];
    lastRun = {
      ...lastRun,
      operations,
      activeCount: operations.filter((op) => op.status === "active").length,
      blockedCount: operations.filter((op) => op.status === "blocked").length,
      scannedAt: new Date().toISOString(),
    };
  }
  return operation;
}

function ensureInitialized(context: RegistryLoaderContext): LiveOperation[] {
  if (operationStore.size === 0) {
    initializeLiveOperations(context);
  }
  return listLiveOperations();
}

export function startLiveOperation(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  operationId: string;
  accountHolderId: string;
  pillowGovernance: true;
}): LiveOperation {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const governance = validateLiveOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    accountHolderId: input.accountHolderId,
    operation: "start",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    throw new Error(governance.reason);
  }

  const gate = validateProductionEligibilityGate(context);
  if (!gate.eligible) {
    throw new Error(gate.reason);
  }

  ensureInitialized(context);
  const operation = operationStore.get(input.operationId);
  if (!operation) {
    throw new Error(`Live operation not found: ${input.operationId}`);
  }

  const fromStatus = operation.status === "not_started" ? "ready" : operation.status;
  const base = fromStatus !== operation.status
    ? updateOperation({ ...operation, status: "ready", updatedAt: new Date().toISOString() })
    : operation;

  const transition = transitionLiveOperationState(base, "active", "pillow-approved");
  if (!transition.ok) {
    throw new Error(transition.reason);
  }

  recordLiveOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operationId: transition.operation.operationId,
    accountHolderId: input.accountHolderId,
    kind: "live_operation_started",
    summary: `Live operation ${transition.operation.operationType} started`,
    pillowGovernance: true,
  });

  return updateOperation(transition.operation);
}

export function pauseLiveOperation(input: {
  actorId: string;
  workspaceId: string;
  operationId: string;
  accountHolderId: string;
  pillowGovernance: true;
}): LiveOperation {
  const governance = validateLiveOperationsPillowGovernance({ ...input, operation: "pause" });
  if (!governance.allowed) throw new Error(governance.reason);

  const operation = operationStore.get(input.operationId);
  if (!operation) throw new Error(`Live operation not found: ${input.operationId}`);

  const transition = transitionLiveOperationState(operation, "paused", "pillow-approved");
  if (!transition.ok) throw new Error(transition.reason);

  recordLiveOperationsEklsObservation({
    ...input,
    kind: "live_operation_paused",
    summary: `Live operation ${operation.operationType} paused`,
    pillowGovernance: true,
  });

  return updateOperation(transition.operation);
}

export function resumeLiveOperation(input: {
  actorId: string;
  workspaceId: string;
  operationId: string;
  accountHolderId: string;
  pillowGovernance: true;
}): LiveOperation {
  const governance = validateLiveOperationsPillowGovernance({ ...input, operation: "resume" });
  if (!governance.allowed) throw new Error(governance.reason);

  const operation = operationStore.get(input.operationId);
  if (!operation) throw new Error(`Live operation not found: ${input.operationId}`);

  const transition = transitionLiveOperationState(operation, "active", "pillow-approved");
  if (!transition.ok) throw new Error(transition.reason);

  recordLiveOperationsEklsObservation({
    ...input,
    kind: "live_operation_resumed",
    summary: `Live operation ${operation.operationType} resumed`,
    pillowGovernance: true,
  });

  return updateOperation(transition.operation);
}

export function blockLiveOperation(input: {
  actorId: string;
  workspaceId: string;
  operationId: string;
  accountHolderId: string;
  reason: string;
  pillowGovernance: true;
}): LiveOperation {
  const governance = validateLiveOperationsPillowGovernance({ ...input, operation: "block" });
  if (!governance.allowed) throw new Error(governance.reason);

  const operation = operationStore.get(input.operationId);
  if (!operation) throw new Error(`Live operation not found: ${input.operationId}`);

  const blocked: LiveOperation = {
    ...operation,
    status: "blocked",
    updatedAt: new Date().toISOString(),
    governanceState: "pillow-blocked",
    blockers: [
      ...operation.blockers,
      {
        blockerId: randomUUID(),
        domainId: operation.operationType,
        severity: "high",
        message: input.reason,
      },
    ],
  };

  recordLiveOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operationId: blocked.operationId,
    accountHolderId: input.accountHolderId,
    kind: "live_operation_blocked",
    summary: input.reason,
    pillowGovernance: true,
  });

  return updateOperation(blocked);
}

export function getLiveOperationEvidence(): LiveOperation["evidence"] {
  return listLiveOperations().flatMap((op) => op.evidence);
}

export function getLiveOperationRisks(): LiveOperation["risks"] {
  return listLiveOperations().flatMap((op) => op.risks);
}

export function getLiveOperationNextActions(context: RegistryLoaderContext = {}): string[] {
  const gate = validateProductionEligibilityGate(context);
  const operations = listLiveOperations();
  const actions: string[] = [];

  if (!gate.eligible) {
    actions.push("Complete G6 production readiness certification before live operations");
    return actions;
  }

  if (operations.length === 0) {
    actions.push("Initialize live operations from registry");
    return actions;
  }

  const ready = operations.filter((op) => op.status === "ready");
  if (ready.length > 0) {
    actions.push(`Start ${ready.length} ready live operation(s)`);
  }

  const paused = operations.filter((op) => op.status === "paused");
  if (paused.length > 0) {
    actions.push(`Review ${paused.length} paused operation(s) for resume`);
  }

  const incidents = operations.filter((op) => op.status === "incident" || op.status === "degraded");
  if (incidents.length > 0) {
    actions.push(`Address ${incidents.length} incident/degraded operation(s)`);
  }

  if (actions.length === 0) {
    actions.push("Monitor active live operations");
  }

  return actions;
}
