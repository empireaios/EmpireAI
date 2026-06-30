import type { DebateContextInput } from "../../../executive-council/models/executive-core.js";
import { buildExecutiveVisualDebate } from "../../executive-visual-debate/services/executive-visual-debate-service.js";
import type { SoulDecisionChamber } from "../models/soul-decision-chamber.js";

/** REAL-056 — Soul decision chamber (recommendation only, neverExecute). */
export function buildSoulDecisionChamber(
  workspaceId: string,
  companyId: string,
  context: DebateContextInput,
): SoulDecisionChamber {
  const debate = buildExecutiveVisualDebate(workspaceId, companyId, context);

  return {
    moduleId: "soul-decision-chamber",
    missionId: "REAL-056",
    workspaceId,
    companyId,
    topic: debate.topic,
    subjectType: debate.subjectType,
    neverExecute: true,
    soulRecommendation: debate.soulRecommendation,
    debateId: debate.debateId,
    reusedModules: ["executive-visual-debate", "executive-council", "soul-runtime"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
