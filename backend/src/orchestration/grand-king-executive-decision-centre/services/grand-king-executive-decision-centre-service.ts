/**
 * G7-04 — Grand King Executive Decision Centre service (executive command manager).
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { GRAND_KING_ACCOUNT_HOLDER_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";
import type {
  ExecutiveDecision,
  ExecutiveDecisionType,
  ExecutiveOperationsOverview,
  ExecutiveRecommendation,
} from "../contracts/executive-decision-types.js";
import { GRAND_KING_EXECUTIVE_DECISION_CENTRE_VERSION } from "../contracts/executive-decision-types.js";
import { recordExecutiveDecisionEklsObservation } from "../ekls/executive-decision-ekls-integration.js";
import { validateExecutiveDecisionPillowGovernance } from "../governance/executive-decision-pillow-governance.js";
import { resolveExecutiveDecisionDependencies } from "../registry/executive-decision-registry-resolver.js";
import { transitionExecutiveDecisionStatus } from "./executive-decision-lifecycle-manager.js";
import { aggregateExecutiveKpis } from "./executive-kpi-aggregator.js";
import { generateExecutiveRecommendations } from "./decision-recommendation-engine.js";
import { buildGlobalOperationalDashboard } from "./global-operational-dashboard.js";
import { publishExecutiveNotifications } from "./executive-notification-centre.js";
import { buildRiskDashboard } from "./risk-dashboard.js";

const decisionStore = new Map<string, ExecutiveDecision>();
let cachedRecommendations: ExecutiveRecommendation[] = [];

export function resetExecutiveDecisionStateForTests(): void {
  decisionStore.clear();
  cachedRecommendations = [];
}

export function initializeExecutiveDecisionCentre(context: RegistryLoaderContext = {}): {
  decisions: ExecutiveDecision[];
  recommendations: ExecutiveRecommendation[];
} {
  cachedRecommendations = generateExecutiveRecommendations(context);
  publishExecutiveNotifications(context);

  for (const rec of cachedRecommendations) {
    const decision = createDecisionFromRecommendation(rec, context);
    decisionStore.set(decision.decisionId, decision);
  }

  const risks = buildRiskDashboard(context);
  if (risks.riskCount > 0) {
    recordExecutiveDecisionEklsObservation({
      actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      decisionId: "risk-scan",
      ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
      kind: "executive_risk_detected",
      summary: `${risks.riskCount} executive risks detected`,
      pillowGovernance: true,
    });
  }

  recordExecutiveDecisionEklsObservation({
    actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    decisionId: "init",
    ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
    kind: "executive_recommendation_generated",
    summary: `${cachedRecommendations.length} executive recommendations generated`,
    pillowGovernance: true,
  });

  return {
    decisions: listExecutiveDecisions(),
    recommendations: cachedRecommendations,
  };
}

function createDecisionFromRecommendation(
  rec: ExecutiveRecommendation,
  context: RegistryLoaderContext,
): ExecutiveDecision {
  const deps = resolveExecutiveDecisionDependencies(context);
  const now = new Date().toISOString();
  return {
    decisionId: randomUUID(),
    decisionType: rec.decisionType,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    accountHolderId: GRAND_KING_ACCOUNT_HOLDER_ID,
    sourceModule: "grand-king-executive-decision-centre",
    targetModule: rec.domainId,
    priority: rec.priority,
    status: "pending",
    recommendedAction: rec.recommendedAction,
    approvalReference: deps.executivePolicy,
    riskReference: deps.riskScoringRefs[0] ?? "risk:production-blocker",
    evidence: [{
      evidenceId: `ev-${rec.recommendationId}`,
      kind: "reference",
      summary: rec.summary,
      ref: rec.ruleReference,
    }],
    createdAt: now,
    correlationId: randomUUID(),
    governanceState: "pillow-pending",
    domainId: rec.domainId,
  };
}

export function listExecutiveDecisions(): ExecutiveDecision[] {
  return [...decisionStore.values()];
}

export function getExecutiveDecision(decisionId: string): ExecutiveDecision | undefined {
  return decisionStore.get(decisionId);
}

export function getExecutiveOperationsOverview(context: RegistryLoaderContext = {}): ExecutiveOperationsOverview {
  const kpis = aggregateExecutiveKpis(context);
  const decisions = listExecutiveDecisions();
  return {
    frameworkVersion: GRAND_KING_EXECUTIVE_DECISION_CENTRE_VERSION,
    domainCount: 14,
    pendingDecisions: decisions.filter((d) => d.status === "pending").length,
    activeRecommendations: cachedRecommendations.length,
    empireHealthScore: kpis.empireHealthScore,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    accountHolderId: GRAND_KING_ACCOUNT_HOLDER_ID,
    generatedAt: new Date().toISOString(),
  };
}

function requireGovernance(input: {
  actorId: string;
  ownerId: string;
  operation: "overview" | "approve" | "reject" | "execute" | "override";
}): void {
  const governance = validateExecutiveDecisionPillowGovernance({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    ownerId: input.ownerId,
    operation: input.operation,
    pillowGovernance: true,
  });
  if (!governance.allowed) throw new Error(governance.reason);
}

export function executeExecutiveDecision(input: {
  actorId: string;
  ownerId: string;
  decisionId: string;
  decisionType: ExecutiveDecisionType;
  pillowGovernance: true;
}): ExecutiveDecision {
  requireGovernance({ actorId: input.actorId, ownerId: input.ownerId, operation: "execute" });

  const decision = decisionStore.get(input.decisionId);
  if (!decision) throw new Error(`Executive decision not found: ${input.decisionId}`);

  let targetStatus: ExecutiveDecision["status"] = "executing";

  switch (input.decisionType) {
    case "approve":
    case "acknowledge":
    case "review":
    case "delegate": {
      const approved = transitionExecutiveDecisionStatus(decision, "approved", "pillow-approved", input.decisionType);
      if (!approved.ok) throw new Error(approved.reason);
      const completed = transitionExecutiveDecisionStatus(approved.decision, "completed", "pillow-executed", input.decisionType);
      if (!completed.ok) throw new Error(completed.reason);
      decisionStore.set(decision.decisionId, completed.decision);
      recordExecutiveDecisionEklsObservation({
        actorId: input.actorId,
        workspaceId: GRAND_KING_WORKSPACE_ID,
        decisionId: decision.decisionId,
        ownerId: input.ownerId,
        kind: "executive_decision_completed",
        summary: `Executive decision ${input.decisionType} executed for ${decision.targetModule}`,
        pillowGovernance: true,
      });
      recordExecutiveDecisionEklsObservation({
        actorId: input.actorId,
        workspaceId: GRAND_KING_WORKSPACE_ID,
        decisionId: decision.decisionId,
        ownerId: input.ownerId,
        kind: "executive_learning_recorded",
        summary: `Executive learning recorded for ${decision.domainId}`,
        pillowGovernance: true,
      });
      return completed.decision;
    }
    case "reject": {
      const rejected = transitionExecutiveDecisionStatus(decision, "rejected", "pillow-rejected", input.decisionType);
      if (!rejected.ok) throw new Error(rejected.reason);
      decisionStore.set(decision.decisionId, rejected.decision);
      recordExecutiveDecisionEklsObservation({
        actorId: input.actorId,
        workspaceId: GRAND_KING_WORKSPACE_ID,
        decisionId: decision.decisionId,
        ownerId: input.ownerId,
        kind: "executive_decision_rejected",
        summary: `Executive decision rejected for ${decision.targetModule}`,
        pillowGovernance: true,
      });
      return rejected.decision;
    }
    case "escalate": {
      targetStatus = "escalated";
      break;
    }
    default:
      targetStatus = "executing";
  }

  const transition = transitionExecutiveDecisionStatus(
    decision,
    targetStatus,
    "pillow-executed",
    input.decisionType,
  );
  if (!transition.ok) throw new Error(transition.reason);

  decisionStore.set(decision.decisionId, transition.decision);

  recordExecutiveDecisionEklsObservation({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    decisionId: decision.decisionId,
    ownerId: input.ownerId,
    kind: "executive_decision_completed",
    summary: `Executive decision ${input.decisionType} executed for ${decision.targetModule}`,
    pillowGovernance: true,
  });

  return transition.decision;
}

export function createExecutiveDecision(input: {
  actorId: string;
  ownerId: string;
  decisionType: ExecutiveDecisionType;
  targetModule: string;
  recommendedAction: string;
  priority?: ExecutiveDecision["priority"];
  pillowGovernance: true;
}): ExecutiveDecision {
  requireGovernance({ actorId: input.actorId, ownerId: input.ownerId, operation: "approve" });

  const deps = resolveExecutiveDecisionDependencies();
  const now = new Date().toISOString();
  const decision: ExecutiveDecision = {
    decisionId: randomUUID(),
    decisionType: input.decisionType,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    accountHolderId: GRAND_KING_ACCOUNT_HOLDER_ID,
    sourceModule: "grand-king-executive-decision-centre",
    targetModule: input.targetModule,
    priority: input.priority ?? "medium",
    status: "pending",
    recommendedAction: input.recommendedAction,
    approvalReference: deps.executivePolicy,
    riskReference: deps.riskScoringRefs[0] ?? "risk:production-blocker",
    evidence: [],
    createdAt: now,
    correlationId: randomUUID(),
    governanceState: "pillow-pending",
  };

  decisionStore.set(decision.decisionId, decision);
  recordExecutiveDecisionEklsObservation({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    decisionId: decision.decisionId,
    ownerId: input.ownerId,
    kind: "executive_decision_created",
    summary: `Executive decision ${input.decisionType} created for ${input.targetModule}`,
    pillowGovernance: true,
  });

  return decision;
}

export function getExecutiveHealth(context: RegistryLoaderContext = {}) {
  return aggregateExecutiveKpis(context);
}

export function getExecutiveRecommendations(context: RegistryLoaderContext = {}) {
  if (cachedRecommendations.length === 0) {
    cachedRecommendations = generateExecutiveRecommendations(context);
  }
  return cachedRecommendations;
}

export function getExecutiveSummary(context: RegistryLoaderContext = {}): string {
  const overview = getExecutiveOperationsOverview(context);
  return `Grand King Executive Decision Centre: ${overview.pendingDecisions} pending decisions, empire health ${overview.empireHealthScore}`;
}

export function getExecutiveGlobalDashboard(context: RegistryLoaderContext = {}) {
  return buildGlobalOperationalDashboard(context);
}
