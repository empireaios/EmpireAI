/** P7-03 — Permanent Pillow User Experience. */
export const PILLOW_UX_MISSION = "P7-03" as const;

export type PillowUxPrinciple =
  | "natural_conversation"
  | "executive_first"
  | "context_aware"
  | "vision_aware"
  | "repository_aware"
  | "production_aware"
  | "journey_aware"
  | "business_aware"
  | "explain_before_acting"
  | "never_lose_context"
  | "never_require_repetition";

export const PILLOW_UX_PRINCIPLES: readonly PillowUxPrinciple[] = [
  "natural_conversation",
  "executive_first",
  "context_aware",
  "vision_aware",
  "repository_aware",
  "production_aware",
  "journey_aware",
  "business_aware",
  "explain_before_acting",
  "never_lose_context",
  "never_require_repetition",
] as const;

/** Session-scoped workspace context sent to Pillow host (mirrors backend schema). */
export type PillowWorkspaceContext = {
  screenPath: string;
  screenId: string;
  screenTitle: string;
  module?: string;
  workflow?: string;
  uxId?: string;
  purpose?: string;
  kpiLabel?: string | null;
  kpiValue?: string | null;
  pendingApprovals?: number;
  unreadNotifications?: number;
  navigationHistory?: string[];
  selectedRecords?: Array<{ type: string; id: string; label?: string }>;
  businessEntity?: Record<string, unknown>;
  extensionId?: string;
  /** P7-03 constitutional executive state */
  currentBusiness?: string | null;
  currentMission?: string | null;
  currentJourney?: string | null;
  currentRoadmapItem?: string | null;
  builderStatus?: string | null;
  supervisorStatus?: string | null;
  productionStatus?: string | null;
  guardianStatus?: string | null;
  repositoryFingerprint?: string | null;
  recommendations?: string[];
  risks?: string[];
  /** Client-held turns for continuity when host session was recreated under lag. */
  recentConversationTurns?: Array<{
    role: "grand-king" | "pillow" | "user" | "assistant";
    content: string;
  }>;
};

export type PillowPageContextOverride = {
  screenTitle?: string;
  module?: string;
  workflow?: string;
  extensionId?: string;
  kpiLabel?: string | null;
  kpiValue?: string | null;
  selectedRecords?: Array<{ type: string; id: string; label?: string }>;
  businessEntity?: Record<string, unknown>;
};

/** Explainability structure for proactive guidance (P7-03). */
export type PillowGuidanceItem = {
  id: string;
  kind: "recommendation" | "warning" | "risk" | "opportunity" | "recovery" | "mission";
  title: string;
  why: string;
  what: string;
  how: string;
  proof?: string;
  businessImpact?: string;
  engineeringImpact?: string;
  architectureImpact?: string;
  risk?: string;
  expectedBenefit?: string;
  suggestedPrompt?: string;
};

export type PillowExecutiveContextSnapshot = {
  currentBusiness: string | null;
  currentMission: string | null;
  currentJourney: string | null;
  currentRoadmapItem: string | null;
  builderStatus: string | null;
  supervisorStatus: string | null;
  productionStatus: string | null;
  guardianStatus: string | null;
  pendingApprovals: number;
  alertCount: number;
  recommendations: string[];
  risks: string[];
  nextExecutiveAction: string | null;
  grandKingSummary: string | null;
};
