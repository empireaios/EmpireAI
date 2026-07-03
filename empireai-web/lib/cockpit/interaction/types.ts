/** G4-07 — AI Interaction Layer types (mirrors backend cockpit-interaction-layer). */

export type AiInsightConfidence = "high" | "medium" | "low" | "unavailable";

export type AiInsightEvidence = {
  source: string;
  label: string;
  value: string;
  href?: string | null;
};

export type AiInsightContract = {
  currentInsight: string;
  recommendedAction: string;
  confidence: AiInsightConfidence;
  confidenceScore: number | null;
  reasoningSource: string;
  supportingEvidence: AiInsightEvidence[];
  computedAt: string;
  interactionChannel: string;
  futureCapabilities: string[];
};

export type CockpitInteractionIntent =
  | "explain_panel"
  | "explain_alert"
  | "explain_metric"
  | "recommend_next_action"
  | "explain_engine_health";

export type CockpitScreenContext = {
  screenPath: string;
  screenId: string;
  screenTitle: string;
  department: string;
  boundModules: string[];
  availableIntents: CockpitInteractionIntent[];
};

export type CockpitInteractionContext = {
  computedAt: string;
  screen: CockpitScreenContext;
  pageInsight: AiInsightContract;
  suggestedPrompts: string[];
  bridgeTargets: Array<{ id: string; label: string; module: string }>;
};

export type CockpitInteractionRequest = {
  intent: CockpitInteractionIntent;
  screenPath: string;
  targetType?: "widget" | "panel" | "alert" | "engine" | "section" | "page";
  targetId?: string;
  label?: string;
  value?: string;
};

export type CockpitInteractionResponse = {
  intent: CockpitInteractionIntent;
  summary: string;
  insight: AiInsightContract;
  suggestedFollowUps: string[];
};

export type CockpitInteractionTarget = {
  targetType: CockpitInteractionRequest["targetType"];
  targetId?: string;
  label: string;
  value?: string;
};
