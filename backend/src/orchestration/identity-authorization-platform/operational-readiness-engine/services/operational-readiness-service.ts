/**
 * G8-06 — Operational Readiness Engine main service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  OPERATIONAL_READINESS_ENGINE_VERSION,
  type ReadinessContext,
  type ReadinessResult,
} from "../contracts/readiness-types.js";
import { validateReadinessPillowGovernance } from "../governance/readiness-pillow-governance.js";
import { recordReadinessEklsObservation } from "../ekls/readiness-ekls-integration.js";
import { evaluateProviderReadiness } from "../evaluators/provider-readiness-evaluator.js";
import { evaluateWorkspaceReadiness, evaluateAccountHolderReadiness, evaluateBrandReadiness } from "../evaluators/workspace-readiness-evaluator.js";
import { evaluateWorkflowReadiness, evaluateAutomationReadiness } from "../evaluators/workflow-readiness-evaluator.js";
import { detectMissingRequirements } from "../services/missing-requirement-detector.js";
import { buildReadinessRecommendations } from "../services/readiness-recommendation-service.js";
import { computeReadinessScore, deriveReadinessLevel } from "../services/readiness-scoring-service.js";
import { resolveReadinessPolicyProfile } from "../registry/readiness-policy-resolver.js";

function requireGovernance(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId?: string;
  providerId?: string;
  operation: "evaluate" | "overview" | "blockers" | "recommendations";
}) {
  const governance = validateReadinessPillowGovernance({
    ...input,
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    throw new Error(governance.reason);
  }
  return governance;
}

function assembleResult(input: {
  workspaceId: string;
  context: ReadinessContext;
  accountHolderId?: string;
  providerId?: string;
  workflowId?: string;
  automationId?: string;
  brandId?: string;
  companyId?: string;
  required: string[];
  connected: string[];
  missing: string[];
  expired: string[];
  degraded: string[];
  states: ReturnType<typeof evaluateProviderReadiness>[];
  blockers: ReturnType<typeof detectMissingRequirements>["blockers"];
  missingCredentials: string[];
  missingPermissions: string[];
  missingScopes: string[];
  correlationId: string;
}): ReadinessResult {
  const score = computeReadinessScore({
    requiredCount: input.required.length,
    connectedCount: input.connected.length,
    expiredCount: input.expired.length,
    degradedCount: input.degraded.length,
    blockerCount: input.blockers.length,
  });
  const level = deriveReadinessLevel({
    score,
    expiredCount: input.expired.length,
    blockerCount: input.blockers.length,
    connectedCount: input.connected.length,
    requiredCount: input.required.length,
  });
  const recommendations = buildReadinessRecommendations(input.states);
  const warnings = input.degraded.map((id) => `Provider ${id} is degraded`);
  const evidence = [
    ...input.states.flatMap((s) => s.evidence),
    ...resolveReadinessPolicyProfile({ workspaceId: input.workspaceId }).registryRefs.map((r) => `registry:${r}`),
  ];

  return {
    readinessScore: score,
    readinessLevel: level,
    context: input.context,
    workspaceId: input.workspaceId,
    accountHolderId: input.accountHolderId,
    providerId: input.providerId,
    workflowId: input.workflowId,
    automationId: input.automationId,
    brandId: input.brandId,
    companyId: input.companyId,
    requiredProviders: input.required,
    connectedProviders: input.connected,
    missingProviders: input.missing,
    expiredProviders: input.expired,
    degradedProviders: input.degraded,
    missingCredentials: input.missingCredentials,
    missingPermissions: input.missingPermissions,
    missingScopes: input.missingScopes,
    blockingIssues: input.blockers,
    warnings,
    recommendedActions: recommendations,
    evidence,
    lastEvaluatedAt: new Date().toISOString(),
    correlationId: input.correlationId,
    governanceState: "pillow-governed",
  };
}

function recordEvaluationEvents(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  providerId?: string;
  result: ReadinessResult;
}) {
  recordReadinessEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    providerId: input.providerId,
    kind: "readiness_evaluated",
    summary: `Readiness evaluated: ${input.result.readinessLevel} (${input.result.readinessScore}%)`,
    pillowGovernance: true,
  });
  if (input.result.readinessLevel === "blocked") {
    recordReadinessEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      providerId: input.providerId,
      kind: "readiness_blocked",
      summary: `Readiness blocked with ${input.result.blockingIssues.length} blockers`,
      pillowGovernance: true,
    });
  }
  if (input.result.missingProviders.length > 0) {
    recordReadinessEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      providerId: input.providerId,
      kind: "readiness_requirement_missing",
      summary: `Missing providers: ${input.result.missingProviders.join(", ")}`,
      pillowGovernance: true,
    });
  }
  if (input.result.recommendedActions.length > 0) {
    recordReadinessEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      providerId: input.providerId,
      kind: "readiness_recommendation_generated",
      summary: `${input.result.recommendedActions.length} recommendations generated`,
      pillowGovernance: true,
    });
  }
}

export function evaluateReadinessOverview(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  accountHolderId?: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}) {
  requireGovernance({ ...input, operation: "overview" });
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const correlationId = randomUUID();
  const workspace = evaluateWorkspaceReadiness({ workspaceId: input.workspaceId, context: ctx, readinessContext: "workspace" });
  const missing = detectMissingRequirements({
    states: workspace.states,
    missingProviders: workspace.missing,
    context: ctx,
  });
  const result = assembleResult({
    workspaceId: input.workspaceId,
    context: "workspace",
    accountHolderId: input.accountHolderId,
    required: workspace.required,
    connected: workspace.connected,
    missing: workspace.missing,
    expired: workspace.expired,
    degraded: workspace.degraded,
    states: workspace.states,
    ...missing,
    correlationId,
  });
  recordEvaluationEvents({ actorId: input.actorId, workspaceId: input.workspaceId, ownerId: input.ownerId, result });
  return { frameworkVersion: OPERATIONAL_READINESS_ENGINE_VERSION, result };
}

export function evaluateReadinessForWorkspace(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}) {
  return evaluateReadinessOverview(input);
}

export function evaluateReadinessForAccountHolder(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  accountHolderId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}) {
  requireGovernance({ ...input, operation: "evaluate" });
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const correlationId = randomUUID();
  const holder = evaluateAccountHolderReadiness({
    workspaceId: input.workspaceId,
    accountHolderId: input.accountHolderId,
    context: ctx,
  });
  const missing = detectMissingRequirements({
    states: holder.states,
    missingProviders: holder.missing,
    context: ctx,
  });
  const result = assembleResult({
    workspaceId: input.workspaceId,
    context: "account_holder",
    accountHolderId: input.accountHolderId,
    required: holder.required,
    connected: holder.connected,
    missing: holder.missing,
    expired: holder.expired,
    degraded: holder.degraded,
    states: holder.states,
    ...missing,
    correlationId,
  });
  recordEvaluationEvents({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    result,
  });
  return { frameworkVersion: OPERATIONAL_READINESS_ENGINE_VERSION, result };
}

export function evaluateReadinessForProvider(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  providerId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}) {
  requireGovernance({ ...input, operation: "evaluate", providerId: input.providerId });
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const correlationId = randomUUID();
  const state = evaluateProviderReadiness({ providerId: input.providerId, workspaceId: input.workspaceId, context: ctx });
  const required = [input.providerId];
  const connected = state.connected ? [input.providerId] : [];
  const missing = state.connected ? [] : [input.providerId];
  const expired = state.expired ? [input.providerId] : [];
  const degraded = state.degraded ? [input.providerId] : [];
  const missingReq = detectMissingRequirements({ states: [state], missingProviders: missing, context: ctx });
  const result = assembleResult({
    workspaceId: input.workspaceId,
    context: "empire_platform",
    providerId: input.providerId,
    required,
    connected,
    missing,
    expired,
    degraded,
    states: [state],
    ...missingReq,
    correlationId,
  });
  recordEvaluationEvents({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    providerId: input.providerId,
    result,
  });
  return { frameworkVersion: OPERATIONAL_READINESS_ENGINE_VERSION, result };
}

export function evaluateReadinessForWorkflow(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  workflowId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}) {
  requireGovernance({ ...input, operation: "evaluate" });
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const correlationId = randomUUID();
  const workflow = evaluateWorkflowReadiness({ workspaceId: input.workspaceId, workflowId: input.workflowId, context: ctx });
  const missing = detectMissingRequirements({
    states: workflow.states,
    missingProviders: workflow.states.filter((s) => !s.connected).map((s) => s.providerId),
    context: ctx,
  });
  const result = assembleResult({
    workspaceId: input.workspaceId,
    context: "workflow",
    workflowId: input.workflowId,
    required: workflow.required,
    connected: workflow.states.filter((s) => s.connected).map((s) => s.providerId),
    missing: workflow.states.filter((s) => !s.connected).map((s) => s.providerId),
    expired: workflow.states.filter((s) => s.expired).map((s) => s.providerId),
    degraded: workflow.states.filter((s) => s.degraded).map((s) => s.providerId),
    states: workflow.states,
    ...missing,
    correlationId,
  });
  result.readinessLevel = workflow.level;
  result.readinessScore = workflow.score;
  recordEvaluationEvents({ actorId: input.actorId, workspaceId: input.workspaceId, ownerId: input.ownerId, result });
  return {
    frameworkVersion: OPERATIONAL_READINESS_ENGINE_VERSION,
    result,
    canExecute: workflow.canExecute,
    missingConnection: workflow.missingConnection,
    blockingAuthorization: workflow.blockingAuthorization,
    nextAction: workflow.nextAction,
  };
}

export function evaluateReadinessForAutomation(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  automationId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}) {
  requireGovernance({ ...input, operation: "evaluate" });
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const correlationId = randomUUID();
  const automation = evaluateAutomationReadiness({
    workspaceId: input.workspaceId,
    automationId: input.automationId,
    context: ctx,
  });
  const missing = detectMissingRequirements({
    states: automation.states,
    missingProviders: automation.states.filter((s) => !s.connected).map((s) => s.providerId),
    context: ctx,
  });
  const result = assembleResult({
    workspaceId: input.workspaceId,
    context: "automation",
    automationId: input.automationId,
    required: automation.required,
    connected: automation.states.filter((s) => s.connected).map((s) => s.providerId),
    missing: automation.states.filter((s) => !s.connected).map((s) => s.providerId),
    expired: automation.states.filter((s) => s.expired).map((s) => s.providerId),
    degraded: automation.states.filter((s) => s.degraded).map((s) => s.providerId),
    states: automation.states,
    ...missing,
    correlationId,
  });
  result.readinessLevel = automation.level;
  result.readinessScore = automation.score;
  recordEvaluationEvents({ actorId: input.actorId, workspaceId: input.workspaceId, ownerId: input.ownerId, result });
  return {
    frameworkVersion: OPERATIONAL_READINESS_ENGINE_VERSION,
    result,
    canExecute: automation.canExecute,
    missingConnection: automation.missingConnection,
    blockingAuthorization: automation.blockingAuthorization,
    nextAction: automation.nextAction,
  };
}

export function getReadinessBlockers(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}) {
  requireGovernance({ ...input, operation: "blockers" });
  const overview = evaluateReadinessOverview(input);
  return {
    frameworkVersion: OPERATIONAL_READINESS_ENGINE_VERSION,
    blockers: overview.result.blockingIssues,
    expiredProviders: overview.result.expiredProviders,
    missingProviders: overview.result.missingProviders,
    correlationId: overview.result.correlationId,
  };
}

export function getReadinessRecommendations(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}) {
  requireGovernance({ ...input, operation: "recommendations" });
  const overview = evaluateReadinessOverview(input);
  return {
    frameworkVersion: OPERATIONAL_READINESS_ENGINE_VERSION,
    recommendations: overview.result.recommendedActions,
    nextRequiredAction: overview.result.recommendedActions[0]?.action ?? "none",
    correlationId: overview.result.correlationId,
  };
}

export function evaluateReadinessForBrand(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  brandId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}) {
  requireGovernance({ ...input, operation: "evaluate" });
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const correlationId = randomUUID();
  const brand = evaluateBrandReadiness({ workspaceId: input.workspaceId, brandId: input.brandId, context: ctx });
  const missing = detectMissingRequirements({
    states: brand.states,
    missingProviders: brand.missing,
    context: ctx,
  });
  const result = assembleResult({
    workspaceId: input.workspaceId,
    context: "brand",
    brandId: input.brandId,
    required: brand.required,
    connected: brand.connected,
    missing: brand.missing,
    expired: brand.expired,
    degraded: brand.degraded,
    states: brand.states,
    ...missing,
    correlationId,
  });
  recordEvaluationEvents({ actorId: input.actorId, workspaceId: input.workspaceId, ownerId: input.ownerId, result });
  return { frameworkVersion: OPERATIONAL_READINESS_ENGINE_VERSION, result };
}

export function getOperationalReadinessEngineVersion(): string {
  return OPERATIONAL_READINESS_ENGINE_VERSION;
}
