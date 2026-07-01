import { apiRequest } from "./client";

export interface PillowExecutiveRecommendation {
  recommendationId: string;
  debateId?: string;
  currentObjective: string | null;
  recommendation: string;
  reason: string;
  confidence: number;
  expectedProfitImpact: string;
  expectedEngineeringCost: string;
  expectedRisk: string;
  objectiveAlignment: string;
  status: string;
}

export interface ExecutiveOpinionRecord {
  opinionId: string;
  perspectiveId: string;
  title: string;
  stance: string;
  recommendation: string;
  reasoning: string;
  risks: string[];
  alternatives: string[];
  confidence: number;
  challengesAssumptions?: string[];
}

export interface ExecutiveDissentRecord {
  dissentId: string;
  perspectiveId: string;
  title: string;
  minorityOpinion: string;
  reason: string;
  confidence: number;
  tradeOff?: string;
}

export interface PillowExecutiveDebate {
  debateId: string;
  topic: string;
  proposalSummary: string;
  opinions: ExecutiveOpinionRecord[];
  dissents: ExecutiveDissentRecord[];
  debateCompletedAt: string;
}

export async function fetchExecutiveDebate(
  debateId: string,
  workspaceId = "grand-king-workspace",
): Promise<{ debate: PillowExecutiveDebate }> {
  return apiRequest(
    `/api/pillow/executive-council/debate/${debateId}?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export async function decideExecutiveRecommendation(
  recommendationId: string,
  outcome: "approved" | "rejected" | "deferred",
  workspaceId = "grand-king-workspace",
  notes?: string,
): Promise<{ record: { status: string }; cursorRule: string }> {
  return apiRequest(
    `/api/pillow/executive-council/recommendation/${recommendationId}/decide`,
    {
      method: "POST",
      body: JSON.stringify({ workspaceId, outcome, notes }),
    },
  );
}
