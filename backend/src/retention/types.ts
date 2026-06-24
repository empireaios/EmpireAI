export type RetentionStatus = "active" | "paused" | "cancelled" | "preserved";

export type ExitSurvey = {
  reason: string;
  wouldReturn: boolean;
  feedback?: string;
  submittedAt: string;
};

export type RetentionState = {
  workspaceId: string;
  status: RetentionStatus;
  pausedAt: string | null;
  cancelledAt: string | null;
  preservedAt: string | null;
  exitSurvey: ExitSurvey | null;
  metadata: Record<string, unknown>;
  updatedAt: string;
};

export type RetentionRecommendation = {
  action: string;
  rationale: string;
  priority: "low" | "medium" | "high";
};
