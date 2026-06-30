import { createHash, randomUUID } from "node:crypto";

import { DOMAIN_SUBJECT_RELEVANCE } from "../data/default-executives.js";
import type {
  DebateContextInput,
  ExecutiveConflict,
  ExecutiveConsensus,
  ExecutiveCouncilSession,
  ExecutiveDecision,
  ExecutiveOpinion,
} from "../models/executive-core.js";
import { getExecutiveCouncilRepository } from "../repositories/sqlite-executive-council-repository.js";
import { getActiveExecutives, incrementExecutiveRecommendationCount } from "./executive-registry-service.js";

const STANCE_OPTIONS = ["PROCEED", "PROCEED_WITH_CAUTION", "DEFER", "REJECT"] as const;

function hashSeed(input: string): number {
  const hex = createHash("sha256").update(input).digest("hex").slice(0, 8);
  return parseInt(hex, 16);
}

function stanceFromSeed(seed: number, relevance: number): (typeof STANCE_OPTIONS)[number] {
  const adjusted = (seed % 100) + relevance * 20;
  if (adjusted >= 85) return "PROCEED";
  if (adjusted >= 65) return "PROCEED_WITH_CAUTION";
  if (adjusted >= 40) return "DEFER";
  return "REJECT";
}

function buildOpinion(
  executive: { executiveId: string; title: string; domain: string; focusAreas: string[] },
  context: DebateContextInput,
  relevance: number,
): ExecutiveOpinion {
  const seed = hashSeed(`${executive.executiveId}:${context.topic}:${context.summary}`);
  const stance = stanceFromSeed(seed, relevance);
  const confidence = Math.min(95, Math.max(35, Math.round(relevance * 60 + (seed % 35))));
  const primaryFocus = executive.focusAreas[0] ?? executive.domain;

  const recommendation =
    stance === "PROCEED"
      ? `Proceed with ${context.topic} — ${primaryFocus} signals are favorable.`
      : stance === "PROCEED_WITH_CAUTION"
        ? `Proceed with guardrails on ${context.topic}; monitor ${primaryFocus} metrics closely.`
        : stance === "DEFER"
          ? `Defer ${context.topic} until ${primaryFocus} readiness improves.`
          : `Do not proceed with ${context.topic} — ${primaryFocus} risk exceeds tolerance.`;

  return {
    opinionId: randomUUID(),
    executiveId: executive.executiveId,
    executiveTitle: executive.title,
    recommendation,
    confidence,
    reasoning: `${executive.title} evaluated ${context.subjectType} context through ${executive.domain} lens (relevance ${Math.round(relevance * 100)}%).`,
    supportingEvidence: [
      `Context: ${context.summary.slice(0, 120)}`,
      `Domain focus: ${executive.focusAreas.join(", ")}`,
      ...(context.metrics ? [`Key metric: ${Object.entries(context.metrics)[0]?.join("=")}`] : []),
    ],
    risks:
      stance === "REJECT" || stance === "DEFER"
        ? [`${primaryFocus} exposure may exceed acceptable thresholds`, "Insufficient validation for current phase"]
        : [`Monitor ${primaryFocus} during execution`],
    expectedOutcome:
      stance === "PROCEED" || stance === "PROCEED_WITH_CAUTION"
        ? `Positive ${executive.domain} impact on ${context.topic}`
        : `Avoid premature commitment; preserve optionality`,
    concerns: stance === "PROCEED" ? [] : [`${executive.title} recommends ${stance.replace(/_/g, " ").toLowerCase()}`],
    expectedImpact: `${stance} — confidence ${confidence}% from ${executive.domain} perspective`,
    recordedAt: new Date().toISOString(),
  };
}

function deriveConsensus(opinions: ExecutiveOpinion[]): ExecutiveConsensus {
  const proceed = opinions.filter((o) => o.recommendation.startsWith("Proceed with") && !o.recommendation.includes("guardrails")).length;
  const cautious = opinions.filter((o) => o.recommendation.includes("guardrails")).length;
  const defer = opinions.filter((o) => o.recommendation.startsWith("Defer")).length;
  const reject = opinions.filter((o) => o.recommendation.startsWith("Do not")).length;
  const total = opinions.length;
  const proceedTotal = proceed + cautious * 0.5;

  if (proceed >= total * 0.75) return "CONSENSUS";
  if (proceedTotal >= total * 0.55) return "MAJORITY";
  if (reject >= total * 0.4 && proceed >= total * 0.3) return "CONFLICT";
  if (reject >= total * 0.35 || defer >= total * 0.4) return "ESCALATION_REQUIRED";
  return "SPLIT_DECISION";
}

function detectConflicts(topic: string, opinions: ExecutiveOpinion[]): ExecutiveConflict[] {
  const proceed = opinions.filter((o) => o.recommendation.startsWith("Proceed"));
  const reject = opinions.filter((o) => o.recommendation.startsWith("Do not") || o.recommendation.startsWith("Defer"));
  if (proceed.length === 0 || reject.length === 0) return [];

  return [
    {
      conflictId: randomUUID(),
      topic,
      opposingExecutives: [...proceed.slice(0, 3).map((o) => o.executiveId), ...reject.slice(0, 3).map((o) => o.executiveId)],
      summary: `${proceed.length} executives favor action; ${reject.length} recommend caution or rejection`,
      severity: reject.length >= proceed.length ? "HIGH" : "MEDIUM",
    },
  ];
}

/** EC-003 — Executive Debate Engine (architecture only, no LLM). */
export function runExecutiveDebate(
  workspaceId: string,
  companyId: string,
  context: DebateContextInput,
): ExecutiveCouncilSession {
  const executives = getActiveExecutives(workspaceId, companyId);
  const subjectType = context.subjectType ?? "general";

  const opinions: ExecutiveOpinion[] = executives.map((exec) => {
    const relevanceMap = DOMAIN_SUBJECT_RELEVANCE[exec.domain] ?? {};
    const relevance = relevanceMap[subjectType] ?? 0.5;
    return buildOpinion(exec, context, relevance);
  });

  for (const opinion of opinions) {
    incrementExecutiveRecommendationCount(workspaceId, companyId, opinion.executiveId);
  }

  const consensus = deriveConsensus(opinions);
  const conflicts = detectConflicts(context.topic, opinions);
  const majorityOpinion = [...opinions].sort((a, b) => b.confidence - a.confidence)[0];

  const decision: ExecutiveDecision = {
    decisionId: randomUUID(),
    sessionId: "",
    topic: context.topic,
    consensus,
    majorityRecommendation: majorityOpinion?.recommendation,
    dissentingOpinions: opinions.filter((o) => o.recommendation.startsWith("Do not") || o.recommendation.startsWith("Defer")),
    awaitingSoulApproval: true,
    recordedAt: new Date().toISOString(),
  };

  const session: ExecutiveCouncilSession = {
    sessionId: randomUUID(),
    workspaceId,
    companyId,
    topic: context.topic,
    subjectType,
    subjectId: context.subjectId,
    contextSummary: context.summary,
    opinions,
    consensus,
    conflicts,
    decision: { ...decision, sessionId: "" },
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
  session.decision = { ...decision, sessionId: session.sessionId };

  getExecutiveCouncilRepository().saveSession(session);
  return session;
}

export function getLatestDebateSession(workspaceId: string, companyId: string): ExecutiveCouncilSession | null {
  return getExecutiveCouncilRepository().getLatestSession(workspaceId, companyId);
}

export function listDebateSessions(workspaceId: string, companyId: string): ExecutiveCouncilSession[] {
  return getExecutiveCouncilRepository().listSessions(workspaceId, companyId);
}
