/**
 * G4-09 — Global AI Assistant (Cockpit framework only).
 * Persistent assistant that auto-assembles executive context and delegates
 * all reasoning to the G4-07 AI Interaction Layer — no duplicated business logic.
 */

import { buildObjectiveDashboard } from "../../orchestration/objective-management-engine/services/objective-management-service.js";
import { loadExecutiveHomeView } from "./cockpit-panel-views.js";
import {
  ENGINE_CENTER_ROUTES,
  type EngineCenterId,
} from "./engine-center-views.js";
import {
  handleCockpitInteraction,
  loadCockpitInteractionContext,
  resolveCockpitScreenContext,
  type AiInsightEvidence,
  type CockpitInteractionIntent,
  type CockpitInteractionRequest,
  type CockpitInteractionResponse,
} from "./cockpit-interaction-layer.js";

const DEFAULT_COMPANY = "co-grand-king";

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
  engineCenterId: EngineCenterId | null;
  engineCenterName: string | null;
  activeMissionCount: number;
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
  /** G4-07 page insight — not duplicated */
  pageInsightSummary: string;
  futureChannels: string[];
};

export type GlobalAssistantRequest = {
  action: GlobalAssistantAction;
  screenPath: string;
  query?: string;
  targetType?: CockpitInteractionRequest["targetType"];
  targetId?: string;
  label?: string;
  value?: string;
};

/** G4-09 — Every assistant response exposes these five fields. */
export type GlobalAssistantResponse = {
  action: GlobalAssistantAction;
  currentContext: string;
  reason: string;
  supportingEvidence: AiInsightEvidence[];
  recommendedNextAction: string;
  confidence: "high" | "medium" | "low" | "unavailable";
  suggestedFollowUps: string[];
  /** G4-07 delegation trace */
  interactionIntent: CockpitInteractionIntent;
  interactionSummary: string;
  computedAt: string;
  futureCapabilities: string[];
};

const FUTURE_CHANNELS = [
  "Voice conversation channel",
  "Screen awareness / DOM context",
  "Live walkthrough guidance",
  "Pillow Supervisor collaboration",
  "Quantitative Intelligence Engine scoring",
  "External LLM provider adapters",
];

const GLOBAL_ASSISTANT_ACTIONS: GlobalAssistantAction[] = [
  "ask",
  "explain",
  "recommend",
  "summarise",
  "next_action",
];

export function resolveEngineCenterFromPath(screenPath: string): EngineCenterId | null {
  const normalized = screenPath.split("?")[0] ?? screenPath;
  for (const [id, route] of Object.entries(ENGINE_CENTER_ROUTES)) {
    if (normalized === route || normalized.startsWith(`${route}/`)) {
      return id as EngineCenterId;
    }
  }
  return null;
}

function buildExecutiveContext(
  workspaceId: string,
  screenPath: string,
  companyId: string,
): GlobalAssistantExecutiveContext {
  const screen = resolveCockpitScreenContext(screenPath);
  const home = loadExecutiveHomeView(workspaceId, companyId);
  const engineId = resolveEngineCenterFromPath(screenPath);
  const objectiveDashboard = buildObjectiveDashboard(workspaceId, companyId);
  const activeMissions = objectiveDashboard.activeObjectives;

  const engineCenterName = engineId
    ? home.engineSummaries.find((e) => e.engineId === engineId)?.displayName ??
      screen.screenTitle
    : null;

  const topMission = activeMissions[0] ?? null;
  const topAlert = home.executiveAlerts[0] ?? null;

  const contextSummary = [
    screen.screenTitle,
    engineCenterName ? `Engine: ${engineCenterName}` : null,
    activeMissions.length > 0 ? `${activeMissions.length} active mission(s)` : "No active missions",
    home.executiveAlerts.length > 0
      ? `${home.executiveAlerts.length} alert(s)`
      : "No open alerts",
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    screenPath: screen.screenPath,
    screenId: screen.screenId,
    screenTitle: screen.screenTitle,
    department: screen.department,
    engineCenterId: engineId,
    engineCenterName,
    activeMissionCount: activeMissions.length,
    topMissionTitle: topMission?.title ?? null,
    alertCount: home.executiveAlerts.length,
    topAlertLabel: topAlert?.label ?? null,
    nextExecutiveAction: home.nextExecutiveAction,
    contextSummary,
  };
}

function mapAskQueryToIntent(query: string): CockpitInteractionIntent {
  const q = query.toLowerCase();
  if (q.includes("recommend") || q.includes("next action")) return "recommend_next_action";
  if (q.includes("alert")) return "explain_alert";
  if (q.includes("health") || q.includes("supplier") || q.includes("marketplace")) {
    return "explain_engine_health";
  }
  if (q.includes("revenue") || q.includes("metric")) return "explain_metric";
  return "explain_panel";
}

function actionToInteractionIntent(
  action: GlobalAssistantAction,
  query?: string,
  targetType?: CockpitInteractionRequest["targetType"],
): CockpitInteractionIntent {
  if (action === "recommend" || action === "next_action") return "recommend_next_action";
  if (action === "summarise") return "explain_panel";
  if (action === "explain") {
    if (targetType === "alert") return "explain_alert";
    return "explain_panel";
  }
  if (action === "ask" && query) return mapAskQueryToIntent(query);
  return "explain_panel";
}

function buildSummariseInteraction(
  workspaceId: string,
  screenPath: string,
  companyId: string,
  executive: GlobalAssistantExecutiveContext,
): CockpitInteractionResponse {
  const interaction = loadCockpitInteractionContext(workspaceId, screenPath, companyId);
  const home = loadExecutiveHomeView(workspaceId, companyId);

  const summaryParts = [
    `You are on ${executive.screenTitle} (${executive.screenId}).`,
    executive.engineCenterName
      ? `Active Engine Center: ${executive.engineCenterName}.`
      : null,
    executive.activeMissionCount > 0
      ? `${executive.activeMissionCount} active mission(s) — top: ${executive.topMissionTitle}.`
      : "No active missions in OMS.",
    executive.alertCount > 0
      ? `${executive.alertCount} executive alert(s) — top: ${executive.topAlertLabel}.`
      : "No open executive alerts.",
    `Next executive action: ${executive.nextExecutiveAction}`,
  ].filter(Boolean);

  return {
    intent: "explain_panel",
    summary: summaryParts.join(" "),
    insight: {
      currentInsight: interaction.pageInsight.currentInsight,
      recommendedAction: home.nextExecutiveAction,
      confidence: executive.alertCount > 0 ? "medium" : "high",
      confidenceScore: executive.alertCount > 0 ? 55 : 80,
      reasoningSource: "executive-home + cockpit-interaction aggregates (G4-07 delegation)",
      supportingEvidence: [
        ...interaction.pageInsight.supportingEvidence.slice(0, 4),
        ...home.executiveAlerts.slice(0, 3).map((a) => ({
          source: "executive-alert",
          label: a.label,
          value: a.severity,
          href: a.href,
        })),
        ...(executive.topMissionTitle
          ? [
              {
                source: "oms",
                label: "Top mission",
                value: executive.topMissionTitle,
                href: "/cockpit/missions",
              },
            ]
          : []),
      ],
      computedAt: new Date().toISOString(),
      interactionChannel: "cockpit-interaction",
      futureCapabilities: FUTURE_CHANNELS,
    },
    suggestedFollowUps: [
      "Recommend next action",
      "Explain top alert",
      "Explain engine health",
    ],
  };
}

function toGlobalAssistantResponse(
  action: GlobalAssistantAction,
  executive: GlobalAssistantExecutiveContext,
  interaction: CockpitInteractionResponse,
): GlobalAssistantResponse {
  return {
    action,
    currentContext: executive.contextSummary,
    reason: interaction.insight.reasoningSource,
    supportingEvidence: interaction.insight.supportingEvidence,
    recommendedNextAction: interaction.insight.recommendedAction,
    confidence: interaction.insight.confidence,
    suggestedFollowUps: interaction.suggestedFollowUps,
    interactionIntent: interaction.intent,
    interactionSummary: interaction.summary,
    computedAt: new Date().toISOString(),
    futureCapabilities: FUTURE_CHANNELS,
  };
}

export function loadGlobalAssistantContext(
  workspaceId: string,
  screenPath: string,
  companyId = DEFAULT_COMPANY,
): GlobalAssistantContext {
  const interaction = loadCockpitInteractionContext(workspaceId, screenPath, companyId);
  const executive = buildExecutiveContext(workspaceId, screenPath, companyId);

  return {
    computedAt: new Date().toISOString(),
    schemaVersion: "g4-09-v1",
    executiveContext: executive,
    availableActions: GLOBAL_ASSISTANT_ACTIONS,
    suggestedPrompts: [
      "Explain this page",
      "Why is this alert shown?",
      "Summarise my current context",
      "Recommend next action",
      "What should I do next?",
    ],
    bridgeTargets: interaction.bridgeTargets,
    pageInsightSummary: interaction.pageInsight.currentInsight,
    futureChannels: FUTURE_CHANNELS,
  };
}

export function handleGlobalAssistantRequest(
  workspaceId: string,
  request: GlobalAssistantRequest,
  companyId = DEFAULT_COMPANY,
): GlobalAssistantResponse {
  const executive = buildExecutiveContext(workspaceId, request.screenPath, companyId);

  let interaction: CockpitInteractionResponse;

  if (request.action === "summarise") {
    interaction = buildSummariseInteraction(
      workspaceId,
      request.screenPath,
      companyId,
      executive,
    );
  } else {
    const intent = actionToInteractionIntent(
      request.action,
      request.query,
      request.targetType,
    );
    interaction = handleCockpitInteraction(workspaceId, {
      intent,
      screenPath: request.screenPath,
      targetType: request.targetType,
      targetId: request.targetId,
      label: request.label ?? request.query,
      value: request.value,
    }, companyId);
  }

  return toGlobalAssistantResponse(request.action, executive, interaction);
}
