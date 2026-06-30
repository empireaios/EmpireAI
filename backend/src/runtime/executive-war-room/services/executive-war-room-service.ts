import type { DebateContextInput } from "../../../executive-council/models/executive-core.js";
import { buildExecutiveVisualDebate } from "../../executive-visual-debate/services/executive-visual-debate-service.js";
import type { ExecutiveWarRoom } from "../models/executive-war-room.js";

const DEFAULT_CONTEXT: DebateContextInput = {
  topic: "Executive War Room — USD 100K net profit path",
  subjectType: "general",
  summary: "REAL-055 visual executive war room — Grand King decides, Soul recommends only",
};

/** REAL-055 — Executive war room (visual debate, no chat, autoExecuteBlocked). */
export function buildExecutiveWarRoom(
  workspaceId: string,
  companyId: string,
  context: DebateContextInput = DEFAULT_CONTEXT,
): ExecutiveWarRoom {
  const debate = buildExecutiveVisualDebate(workspaceId, companyId, context);

  return {
    moduleId: "executive-war-room",
    missionId: "REAL-055",
    workspaceId,
    companyId,
    topic: debate.topic,
    visualMode: true,
    autoExecuteBlocked: true,
    chiefCards: debate.chiefCards,
    soulRecommendation: debate.soulRecommendation,
    grandKingDecision: {
      decision: "PENDING",
      decidedAt: null,
      rationale: debate.grandKingDecision?.rationale,
    },
    debateId: debate.debateId,
    reusedModules: ["executive-visual-debate", "executive-council"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
