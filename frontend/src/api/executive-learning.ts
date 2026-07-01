import { apiRequest } from "./client";

export type ExecutiveLearningCategory = "A" | "B" | "C" | "D";

export type ExecutiveLearningStatus =
  | "pending_confirmation"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "archived"
  | "merged"
  | "expired";

export interface PendingExecutiveLearning {
  learningId: string;
  workspaceId: string;
  title: string;
  description: string;
  category: ExecutiveLearningCategory;
  status: ExecutiveLearningStatus;
  observation: string;
  evidence: string[];
  confidence: number;
  reasoningAreas: string[];
  impactSummary: string;
  source: string;
  discoveredAt: string;
  updatedAt: string;
  requiresGrandKingApproval: boolean;
}

export interface ExecutiveKnowledgeEntry {
  learningId: string;
  workspaceId: string;
  title: string;
  category: ExecutiveLearningCategory;
  description: string;
  source: string;
  confidence: number;
  discoveredAt: string;
  approvedAt: string;
  approvedBy: string;
  status: "approved" | "archived" | "superseded";
  reasoningAreas: string[];
  affectedReasoningAreas: string[];
}

export interface ExecutiveLearningReviewStats {
  newLearnings: number;
  pendingConfirmation: number;
  rejected: number;
  approved: number;
  archived: number;
  expired: number;
}

export interface ExecutiveLearningReview {
  stats: ExecutiveLearningReviewStats;
  pending: PendingExecutiveLearning[];
  knowledgeBase: ExecutiveKnowledgeEntry[];
  missionId: string;
}

export async function fetchExecutiveLearningReview(
  workspaceId = "grand-king-workspace",
): Promise<ExecutiveLearningReview> {
  return apiRequest<ExecutiveLearningReview>(
    `/api/pillow/executive-learning/review?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export async function approveExecutiveLearning(
  learningId: string,
  workspaceId = "grand-king-workspace",
): Promise<{ knowledge: ExecutiveKnowledgeEntry }> {
  return apiRequest(`/api/pillow/executive-learning/${learningId}/approve`, {
    method: "POST",
    body: JSON.stringify({ workspaceId }),
  });
}

export async function rejectExecutiveLearning(
  learningId: string,
  notes?: string,
  workspaceId = "grand-king-workspace",
): Promise<{ learning: PendingExecutiveLearning }> {
  return apiRequest(`/api/pillow/executive-learning/${learningId}/reject`, {
    method: "POST",
    body: JSON.stringify({ workspaceId, notes }),
  });
}

export async function editExecutiveLearning(
  learningId: string,
  patch: { title?: string; description?: string; category?: ExecutiveLearningCategory },
  workspaceId = "grand-king-workspace",
): Promise<{ learning: PendingExecutiveLearning }> {
  return apiRequest(`/api/pillow/executive-learning/${learningId}`, {
    method: "PATCH",
    body: JSON.stringify({ workspaceId, ...patch }),
  });
}

export async function archiveExecutiveLearning(
  learningId: string,
  workspaceId = "grand-king-workspace",
): Promise<{ learning: PendingExecutiveLearning | ExecutiveKnowledgeEntry }> {
  return apiRequest(`/api/pillow/executive-learning/${learningId}/archive`, {
    method: "POST",
    body: JSON.stringify({ workspaceId }),
  });
}

export async function mergeExecutiveLearnings(input: {
  sourceLearningIds: string[];
  targetTitle: string;
  targetDescription: string;
  workspaceId?: string;
}): Promise<{ learning: PendingExecutiveLearning }> {
  return apiRequest("/api/pillow/executive-learning/merge", {
    method: "POST",
    body: JSON.stringify({
      workspaceId: input.workspaceId ?? "grand-king-workspace",
      sourceLearningIds: input.sourceLearningIds,
      targetTitle: input.targetTitle,
      targetDescription: input.targetDescription,
    }),
  });
}
