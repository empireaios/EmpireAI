/** G4-09 — Global AI Assistant types (mirrors backend cockpit-global-assistant). */

export type GlobalAssistantAction =
  | "ask"
  | "explain"
  | "recommend"
  | "summarise"
  | "next_action";

export type GlobalAssistantExecutiveContext = {
  screenPath: string;
  screenId: string;
  screenTitle: string;
  department: string;
  engineCenterId: string | null;
  engineCenterName: string | null;
  activeMissionCount: number;
  /** Canonical pending approvals — never confuse with activeMissionCount. */
  pendingApprovals?: number;
  topMissionTitle: string | null;
  alertCount: number;
  topAlertLabel: string | null;
  nextExecutiveAction: string;
  contextSummary: string;
};

export type GlobalAssistantContext = {
  computedAt: string;
  schemaVersion: "g4-09-v1";
  executiveContext: GlobalAssistantExecutiveContext;
  availableActions: GlobalAssistantAction[];
  suggestedPrompts: string[];
  bridgeTargets: Array<{ id: string; label: string; module: string }>;
  pageInsightSummary: string;
  futureChannels: string[];
};

export type AiInsightEvidence = {
  source: string;
  label: string;
  value: string;
  href?: string | null;
};

export type GlobalAssistantResponse = {
  action: GlobalAssistantAction;
  currentContext: string;
  reason: string;
  supportingEvidence: AiInsightEvidence[];
  recommendedNextAction: string;
  confidence: "high" | "medium" | "low" | "unavailable";
  suggestedFollowUps: string[];
  interactionIntent: string;
  interactionSummary: string;
  computedAt: string;
  futureCapabilities: string[];
};

export type GlobalAssistantTarget = {
  targetType?: "widget" | "panel" | "alert" | "engine" | "section" | "page";
  targetId?: string;
  label: string;
  value?: string;
};
