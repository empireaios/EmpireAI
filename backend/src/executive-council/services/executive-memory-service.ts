import { getSoulFile, captureSoulRuntimeMemory, listSoulFileChangeHistory } from "../../foundation/soul-file/index.js";
import type { ExecutiveAccountabilityRecord } from "../models/executive-accountability.js";
import type { ExecutiveCouncilSession } from "../models/executive-core.js";
import { getExecutiveCouncilRepository } from "../repositories/sqlite-executive-council-repository.js";

/** EC-004 — Executive memory reuses Soul; no duplicated Soul memory. */
export function recallExecutiveLearningReferences(workspaceId: string): string[] {
  try {
    const soul = getSoulFile(workspaceId);
    const lessons = soul.runtimeMemory.lessonsLearned ?? [];
    const milestones = soul.runtimeMemory.businessMilestones ?? [];
    return [
      ...lessons.slice(-5).map((e) => e.summary),
      ...milestones.slice(-3).map((e) => e.summary),
    ];
  } catch {
    return [];
  }
}

export function captureExecutiveLearningToSoul(
  workspaceId: string,
  session: ExecutiveCouncilSession,
  actor = "executive-council",
): void {
  try {
    captureSoulRuntimeMemory({
      workspaceId,
      actor,
      memoryKey: "lessonsLearned",
      entry: {
        title: `Executive Council: ${session.topic}`,
        summary: `Consensus ${session.consensus} — ${session.opinions.length} executive opinions recorded`,
        source: "executive-council",
        payload: {
          sessionId: session.sessionId,
          consensus: session.consensus,
          topic: session.topic,
        },
      },
    });
  } catch {
    // Soul may not be initialized in validation harness
  }
}

export function getExecutiveDecisionHistory(
  workspaceId: string,
  companyId: string,
): ExecutiveCouncilSession[] {
  return getExecutiveCouncilRepository().listSessions(workspaceId, companyId, 50);
}

export function getExecutiveAccountabilityHistory(
  workspaceId: string,
  companyId: string,
  executiveId?: string,
): ExecutiveAccountabilityRecord[] {
  return getExecutiveCouncilRepository().listAccountability(workspaceId, companyId, executiveId);
}

export function getSoulChangeReferences(workspaceId: string, limit = 5): string[] {
  try {
    return listSoulFileChangeHistory(workspaceId, limit).map((c) => c.summary);
  } catch {
    return [];
  }
}

export function buildExecutiveMemorySummary(workspaceId: string, companyId: string, executiveId: string) {
  const sessions = getExecutiveDecisionHistory(workspaceId, companyId);
  const accountability = getExecutiveAccountabilityHistory(workspaceId, companyId, executiveId);
  const soulRefs = recallExecutiveLearningReferences(workspaceId);

  const executiveOpinions = sessions.flatMap((s) => s.opinions.filter((o) => o.executiveId === executiveId));
  const resolved = accountability.filter((a) => a.outcome !== "UNKNOWN");
  const successRate =
    resolved.length > 0
      ? Math.round((resolved.filter((a) => a.outcome === "CORRECT").length / resolved.length) * 100)
      : undefined;

  return {
    executiveId,
    historicalRecommendations: executiveOpinions.length,
    decisionHistory: sessions.length,
    accuracy: successRate,
    successRate,
    commercialOutcomes: accountability.filter((a) => a.commercialResult).map((a) => a.commercialResult!),
    learningReferences: soulRefs,
    soulIntegrated: true,
  };
}
