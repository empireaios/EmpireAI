/**
 * G7-02 — Grand King commerce operations service (commerce operation manager).
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { LUMINOUSYOU_BRAND_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import type {
  CommerceOperation,
  CommerceOperationHealthSummary,
  CommerceOperationRun,
  CommerceOperationsOverview,
} from "../contracts/commerce-operations-types.js";
import { GRAND_KING_COMMERCE_OPERATIONS_VERSION } from "../contracts/commerce-operations-types.js";
import { recordCommerceOperationsEklsObservation } from "../ekls/commerce-operations-ekls-integration.js";
import { validateCommerceOperationsPillowGovernance } from "../governance/commerce-operations-pillow-governance.js";
import { resolveCommerceOperationDependencies } from "../registry/commerce-operations-registry-resolver.js";
import { getAnalyticsOperationStatus } from "./controllers/analytics-operation-controller.js";
import { getLogisticsOperationStatus } from "./controllers/logistics-operation-controller.js";
import { getMarketplaceOperationStatus } from "./controllers/marketplace-operation-controller.js";
import { getPaymentOperationStatus } from "./controllers/payment-operation-controller.js";
import { getStorefrontOperationStatus } from "./controllers/storefront-operation-controller.js";
import { getSupplierOperationStatus } from "./controllers/supplier-operation-controller.js";
import { validateCommerceReadiness } from "./commerce-readiness-validator.js";
import { transitionCommerceOperationStatus } from "./operation-lifecycle-manager.js";
import { resolveProviderOperations } from "./provider-operation-registry.js";

const operationStore = new Map<string, CommerceOperation>();
let lastRun: CommerceOperationRun | undefined;

export function resetCommerceOperationsStateForTests(): void {
  operationStore.clear();
  lastRun = undefined;
}

function createOperationFromProvider(input: {
  provider: ReturnType<typeof resolveProviderOperations>[number];
  readiness: ReturnType<typeof validateCommerceReadiness>;
  dependencies: ReturnType<typeof resolveCommerceOperationDependencies>;
  correlationId: string;
}): CommerceOperation {
  const now = new Date().toISOString();
  const initialStatus = input.readiness.ready ? "ready" : "blocked";

  return {
    operationId: randomUUID(),
    workspaceId: GRAND_KING_WORKSPACE_ID,
    brandId: LUMINOUSYOU_BRAND_ID,
    providerId: input.provider.providerId,
    channelType: input.provider.channelType,
    operationType: input.provider.operationType,
    status: initialStatus,
    readinessReference: input.readiness.readinessReference,
    authorizationReference: input.readiness.authorizationReference,
    automationReference: input.dependencies.automationWorkflow,
    healthReference: `health:${input.provider.providerId}`,
    evidence: [{
      evidenceId: `ev-${input.provider.providerId}`,
      kind: "reference",
      summary: `Commerce provider ${input.provider.providerName} resolved from REG-CONNECTION-PROVIDER`,
      ref: input.provider.registryRef,
    }],
    risks: [],
    blockers: input.readiness.ready
      ? []
      : input.readiness.conditions.map((condition, index) => ({
          blockerId: `blocker-${input.provider.providerId}-${index}`,
          providerId: input.provider.providerId,
          severity: "critical" as const,
          message: condition,
          recommendation: "Resolve commerce readiness blockers",
        })),
    startedAt: now,
    updatedAt: now,
    correlationId: input.correlationId,
    governanceState: input.readiness.ready ? "pillow-approved" : "commerce-blocked",
  };
}

export function initializeCommerceOperations(context: RegistryLoaderContext = {}): CommerceOperationRun {
  const providers = resolveProviderOperations(context);
  const readiness = validateCommerceReadiness(context);
  const dependencies = resolveCommerceOperationDependencies(context);
  const correlationId = randomUUID();
  const runId = randomUUID();

  const operations = providers.map((provider) => {
    const op = createOperationFromProvider({ provider, readiness, dependencies, correlationId });
    operationStore.set(op.operationId, op);
    return op;
  });

  lastRun = {
    runId,
    correlationId,
    operations,
    runningCount: operations.filter((op) => op.status === "running").length,
    blockedCount: operations.filter((op) => op.status === "blocked").length,
    scannedAt: new Date().toISOString(),
    discoverySource: "REG-CONNECTION-PROVIDER",
  };

  return lastRun;
}

export function getLastCommerceOperationRun(): CommerceOperationRun | undefined {
  return lastRun;
}

export function getCommerceOperation(operationId: string): CommerceOperation | undefined {
  return operationStore.get(operationId);
}

export function listCommerceOperations(): CommerceOperation[] {
  return [...operationStore.values()];
}

export function getCommerceOperationsOverview(context: RegistryLoaderContext = {}): CommerceOperationsOverview {
  const operations = listCommerceOperations();
  const readiness = validateCommerceReadiness(context);
  return {
    frameworkVersion: GRAND_KING_COMMERCE_OPERATIONS_VERSION,
    providerCount: new Set(operations.map((op) => op.providerId)).size,
    operationCount: operations.length,
    runningOperations: operations.filter((op) => op.status === "running").length,
    productionEligible: readiness.productionEligible,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    brandId: LUMINOUSYOU_BRAND_ID,
    generatedAt: new Date().toISOString(),
  };
}

function updateOperation(operation: CommerceOperation): CommerceOperation {
  operationStore.set(operation.operationId, operation);
  return operation;
}

function requireGovernance(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  operation: "start" | "pause" | "resume" | "stop" | "overview";
}): void {
  const governance = validateCommerceOperationsPillowGovernance({
    ...input,
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    throw new Error(governance.reason);
  }
}

export function startCommerceOperation(input: {
  actorId: string;
  ownerId: string;
  operationId: string;
  pillowGovernance: true;
}): CommerceOperation {
  requireGovernance({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    ownerId: input.ownerId,
    operation: "start",
  });

  const operation = operationStore.get(input.operationId);
  if (!operation) throw new Error(`Commerce operation not found: ${input.operationId}`);

  const readiness = validateCommerceReadiness();
  if (!readiness.ready) throw new Error("Commerce operations not ready");

  const starting = transitionCommerceOperationStatus(operation, "starting", "pillow-approved");
  if (!starting.ok) throw new Error(starting.reason);

  const running = transitionCommerceOperationStatus(starting.operation, "running", "pillow-approved");
  if (!running.ok) throw new Error(running.reason);

  const updated = updateOperation(running.operation);
  recordCommerceOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: updated.workspaceId,
    operationId: updated.operationId,
    ownerId: input.ownerId,
    kind: "commerce_operation_started",
    summary: `Commerce operation ${updated.providerId} started`,
    pillowGovernance: true,
  });
  return updated;
}

export function pauseCommerceOperation(input: {
  actorId: string;
  ownerId: string;
  operationId: string;
  pillowGovernance: true;
}): CommerceOperation {
  requireGovernance({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    ownerId: input.ownerId,
    operation: "pause",
  });

  const operation = operationStore.get(input.operationId);
  if (!operation) throw new Error(`Commerce operation not found: ${input.operationId}`);

  const paused = transitionCommerceOperationStatus(operation, "paused", "pillow-approved");
  if (!paused.ok) throw new Error(paused.reason);

  const updated = updateOperation(paused.operation);
  recordCommerceOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: updated.workspaceId,
    operationId: updated.operationId,
    ownerId: input.ownerId,
    kind: "commerce_operation_paused",
    summary: `Commerce operation ${updated.providerId} paused`,
    pillowGovernance: true,
  });
  return updated;
}

export function resumeCommerceOperation(input: {
  actorId: string;
  ownerId: string;
  operationId: string;
  pillowGovernance: true;
}): CommerceOperation {
  requireGovernance({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    ownerId: input.ownerId,
    operation: "resume",
  });

  const operation = operationStore.get(input.operationId);
  if (!operation) throw new Error(`Commerce operation not found: ${input.operationId}`);

  const running = transitionCommerceOperationStatus(operation, "running", "pillow-approved");
  if (!running.ok) throw new Error(running.reason);

  const updated = updateOperation(running.operation);
  recordCommerceOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: updated.workspaceId,
    operationId: updated.operationId,
    ownerId: input.ownerId,
    kind: "commerce_operation_resumed",
    summary: `Commerce operation ${updated.providerId} resumed`,
    pillowGovernance: true,
  });
  return updated;
}

export function stopCommerceOperation(input: {
  actorId: string;
  ownerId: string;
  operationId: string;
  pillowGovernance: true;
}): CommerceOperation {
  requireGovernance({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    ownerId: input.ownerId,
    operation: "stop",
  });

  const operation = operationStore.get(input.operationId);
  if (!operation) throw new Error(`Commerce operation not found: ${input.operationId}`);

  const stopping = transitionCommerceOperationStatus(operation, "stopping", "pillow-approved");
  if (!stopping.ok) throw new Error(stopping.reason);

  const stopped = transitionCommerceOperationStatus(stopping.operation, "stopped", "pillow-approved");
  if (!stopped.ok) throw new Error(stopped.reason);

  const updated = updateOperation(stopped.operation);
  recordCommerceOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: updated.workspaceId,
    operationId: updated.operationId,
    ownerId: input.ownerId,
    kind: "commerce_operation_stopped",
    summary: `Commerce operation ${updated.providerId} stopped`,
    pillowGovernance: true,
  });
  return updated;
}

export function getCommerceOperationHealth(
  operationId: string,
  context: RegistryLoaderContext = {},
): CommerceOperationHealthSummary {
  const operation = operationStore.get(operationId);
  if (!operation) {
    return { score: 0, healthy: false, status: "not_ready", signals: [], blockers: [] };
  }

  const readiness = validateCommerceReadiness(context);
  let score = 100;
  if (!readiness.ready) score -= 30;
  if (operation.status === "blocked") score = 0;
  if (operation.status === "degraded" || operation.status === "incident") score = Math.min(score, 40);
  if (operation.status === "paused") score = Math.min(score, 70);
  if (process.env.COMMERCE_OPERATION_DEGRADED === "true") score = Math.min(score, 40);

  const healthy = score >= 70 && operation.status === "running";

  return {
    score,
    healthy,
    status: operation.status,
    signals: [`provider:${operation.providerId}`, `channel:${operation.channelType}`],
    blockers: operation.blockers,
  };
}

export function getCommerceOperationDependencies(context: RegistryLoaderContext = {}) {
  return resolveCommerceOperationDependencies(context);
}

export function getCommerceOperationSummary(context: RegistryLoaderContext = {}): string {
  const overview = getCommerceOperationsOverview(context);
  const operations = listCommerceOperations();
  return `Grand King Commerce Operations: ${overview.operationCount} operations, ${overview.runningOperations} running (eligible=${overview.productionEligible})`;
}

export function getExecutiveCommerceDashboard(context: RegistryLoaderContext = {}) {
  const operations = listCommerceOperations();
  return {
    marketplaceStatus: getMarketplaceOperationStatus(operations),
    supplierStatus: getSupplierOperationStatus(operations),
    storefrontStatus: getStorefrontOperationStatus(operations),
    paymentStatus: getPaymentOperationStatus(operations),
    logisticsStatus: getLogisticsOperationStatus(operations),
    analyticsStatus: getAnalyticsOperationStatus(operations),
  };
}

export function recordCommerceOperationLearning(input: {
  actorId: string;
  ownerId: string;
  operationId: string;
  summary: string;
  pillowGovernance: true;
}): void {
  recordCommerceOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    operationId: input.operationId,
    ownerId: input.ownerId,
    kind: "commerce_operation_learning",
    summary: input.summary,
    pillowGovernance: true,
  });
}

export function reportCommerceOperationIncident(input: {
  actorId: string;
  ownerId: string;
  operationId: string;
  summary: string;
  pillowGovernance: true;
}): CommerceOperation {
  const operation = operationStore.get(input.operationId);
  if (!operation) throw new Error(`Commerce operation not found: ${input.operationId}`);

  const incident = transitionCommerceOperationStatus(operation, "incident", "pillow-incident");
  if (!incident.ok) throw new Error(incident.reason);

  const updated = updateOperation(incident.operation);
  recordCommerceOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: updated.workspaceId,
    operationId: updated.operationId,
    ownerId: input.ownerId,
    kind: "commerce_operation_incident",
    summary: input.summary,
    pillowGovernance: true,
  });
  return updated;
}
