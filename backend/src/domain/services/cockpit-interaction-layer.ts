/**
 * G4-07 — AI Interaction Layer (framework only).
 * Assembles structured insights from existing Brain aggregates — no LLM business logic.
 * Bridge: Grand King · Pillow Supervisor · Executive Engines · Brain · Cockpit.
 */

import type { EnginePanelView } from "./cockpit-panel-views.js";
import { loadExecutiveHomeView } from "./cockpit-panel-views.js";
import {
  ENGINE_CENTER_ROUTES,
  loadEngineCenterView as loadFullEngineCenterView,
  type EngineCenterId,
} from "./engine-center-views.js";

export type AiInsightConfidence = "high" | "medium" | "low" | "unavailable";

export type AiInsightEvidence = {
  source: string;
  label: string;
  value: string;
  href?: string | null;
};

/** G4-07 — Every Engine Center + panel exposes this contract. */
export type AiInsightContract = {
  currentInsight: string;
  recommendedAction: string;
  confidence: AiInsightConfidence;
  confidenceScore: number | null;
  reasoningSource: string;
  supportingEvidence: AiInsightEvidence[];
  computedAt: string;
  interactionChannel:
    | "brain-aggregate"
    | "engine-center"
    | "executive-home"
    | "cockpit-interaction";
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

const COCKPIT_SCREEN_REGISTRY: Array<{
  pathPrefix: string;
  screenId: string;
  screenTitle: string;
  department: string;
  boundModules: string[];
}> = [
  { pathPrefix: "/cockpit", screenId: "SCR-001", screenTitle: "Executive Home", department: "executive", boundModules: ["executive-home", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/relationship", screenId: "SCR-015", screenTitle: "Executive Relationship Graph", department: "executive", boundModules: ["executive-relationship-graph", "cockpit-interaction", "cockpit-global-assistant"] },
  { pathPrefix: "/cockpit/command", screenId: "SCR-010", screenTitle: "Command Centre", department: "command", boundModules: ["cockpit-command", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/missions", screenId: "SCR-020", screenTitle: "Mission Centre", department: "missions", boundModules: ["cockpit-missions", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/intelligence/suppliers", screenId: "SCR-110", screenTitle: "Supplier Intelligence Engine", department: "intelligence", boundModules: ["supplier-intelligence-engine", "cockpit-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/intelligence/marketplace", screenId: "SCR-111", screenTitle: "Marketplace Engine", department: "intelligence", boundModules: ["cockpit-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/intelligence/discovery", screenId: "SCR-112", screenTitle: "Quantitative Intelligence Engine", department: "intelligence", boundModules: ["quantitative-intelligence-engine", "cockpit-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/intelligence/products", screenId: "SCR-100", screenTitle: "Product Intelligence Engine", department: "intelligence", boundModules: ["cockpit-intelligence", "product-intelligence-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/intelligence/markets", screenId: "SCR-104", screenTitle: "Market Intelligence Engine", department: "intelligence", boundModules: ["market-intelligence-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/commerce/store", screenId: "SCR-200", screenTitle: "Storefront Engine", department: "commerce", boundModules: ["cockpit-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/commerce/marketing", screenId: "SCR-202", screenTitle: "Advertising Engine", department: "commerce", boundModules: ["cockpit-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/commerce/ad-intelligence", screenId: "SCR-106", screenTitle: "Advertising Intelligence Engine", department: "commerce", boundModules: ["advertising-intelligence-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/intelligence/customers", screenId: "SCR-107", screenTitle: "Customer Intelligence Engine", department: "intelligence", boundModules: ["customer-intelligence-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/intelligence/risk", screenId: "SCR-108", screenTitle: "Risk Intelligence Engine", department: "intelligence", boundModules: ["risk-intelligence-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/intelligence/decisions", screenId: "SCR-109", screenTitle: "Decision Intelligence Engine", department: "intelligence", boundModules: ["decision-intelligence-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/intelligence/executive", screenId: "SCR-110", screenTitle: "Executive Intelligence Orchestrator", department: "intelligence", boundModules: ["executive-intelligence-orchestrator", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/finance/billing", screenId: "SCR-401", screenTitle: "Payment Engine", department: "finance", boundModules: ["cockpit-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/finance/profit", screenId: "SCR-400", screenTitle: "Analytics Engine", department: "finance", boundModules: ["cockpit-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/finance/intelligence", screenId: "SCR-105", screenTitle: "Financial Intelligence Engine", department: "finance", boundModules: ["financial-intelligence-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/operations/automation", screenId: "SCR-303", screenTitle: "Automation Centre", department: "operations", boundModules: ["cockpit-automation", "business-automation", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/operations/authorizations", screenId: "SCR-304", screenTitle: "Authorization Centre", department: "operations", boundModules: ["cockpit-authorization-centre", "identity-authorization", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/operations/fulfillment", screenId: "SCR-301", screenTitle: "Logistics Engine", department: "operations", boundModules: ["cockpit-engine", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/development/pillow", screenId: "SCR-800", screenTitle: "Pillow Supervisor", department: "development", boundModules: ["cockpit-engine", "cockpit-pillow", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/development/approvals", screenId: "SCR-801", screenTitle: "King's Approvals", department: "development", boundModules: ["cockpit-interaction"] },
  { pathPrefix: "/cockpit/governance", screenId: "SCR-700", screenTitle: "Governance", department: "governance", boundModules: ["cockpit-audit", "cockpit-interaction"] },
  { pathPrefix: "/cockpit/infrastructure", screenId: "SCR-600", screenTitle: "Infrastructure", department: "infrastructure", boundModules: ["integrations", "cockpit-interaction"] },
];

const DEFAULT_INTENTS: CockpitInteractionIntent[] = [
  "explain_panel",
  "explain_alert",
  "explain_metric",
  "recommend_next_action",
  "explain_engine_health",
];

function healthToConfidence(health: string): { confidence: AiInsightConfidence; score: number | null } {
  const h = health.toUpperCase();
  if (h === "HEALTHY" || h === "GREEN") return { confidence: "high", score: 85 };
  if (h === "WARNING" || h === "YELLOW") return { confidence: "medium", score: 55 };
  if (h === "FAILED" || h === "RED" || h === "BLOCKED") return { confidence: "low", score: 25 };
  if (h === "NOT_IMPLEMENTED") return { confidence: "unavailable", score: null };
  return { confidence: "medium", score: 50 };
}

function panelEvidence(panel: EnginePanelView): AiInsightEvidence[] {
  const rows: AiInsightEvidence[] = [];
  for (const m of panel.metrics ?? []) {
    rows.push({ source: panel.engineId, label: m.label, value: m.value });
  }
  for (const r of panel.detailRows ?? []) {
    rows.push({ source: panel.engineId, label: r.label, value: r.value });
  }
  for (const d of panel.dependencies.slice(0, 4)) {
    rows.push({ source: "dependency", label: "Dependency", value: d });
  }
  return rows.slice(0, 8);
}

const FUTURE_CAPABILITIES = [
  "Natural language queries via Pillow Supervisor",
  "Voice interaction channel",
  "Proactive recommendation push (GC-03)",
  "Generative reasoning (explicitly out of G4-07 scope)",
];

/** G4-07 — Build AI insight from an engine panel (no LLM). */
export function buildEngineAiInsight(
  panel: EnginePanelView,
  channel: AiInsightContract["interactionChannel"] = "engine-center",
): AiInsightContract {
  const { confidence, score } = healthToConfidence(panel.health);
  return {
    currentInsight: `${panel.displayName} is ${panel.health}: ${panel.currentState}`,
    recommendedAction: panel.nextAction,
    confidence,
    confidenceScore: score ?? panel.progress.percent,
    reasoningSource: panel.executiveAudit.summary || `${panel.engineId} engine panel · ${panel.dataMode} mode`,
    supportingEvidence: panelEvidence(panel),
    computedAt: panel.computedAt,
    interactionChannel: channel,
    futureCapabilities: FUTURE_CAPABILITIES,
  };
}

export function resolveCockpitScreenContext(screenPath: string): CockpitScreenContext {
  const normalized = screenPath.split("?")[0] ?? screenPath;
  const sorted = [...COCKPIT_SCREEN_REGISTRY].sort((a, b) => b.pathPrefix.length - a.pathPrefix.length);
  const match =
    sorted.find((e) => normalized === e.pathPrefix || normalized.startsWith(`${e.pathPrefix}/`)) ??
    sorted.find((e) => e.pathPrefix === "/cockpit" && normalized.startsWith("/cockpit"));

  if (!match) {
    return {
      screenPath: normalized,
      screenId: "SCR-000",
      screenTitle: "Cockpit",
      department: "executive",
      boundModules: ["cockpit-interaction"],
      availableIntents: DEFAULT_INTENTS,
    };
  }

  return {
    screenPath: normalized,
    screenId: match.screenId,
    screenTitle: match.screenTitle,
    department: match.department,
    boundModules: match.boundModules,
    availableIntents: DEFAULT_INTENTS,
  };
}

function engineIdFromPath(path: string): EngineCenterId | null {
  for (const [id, route] of Object.entries(ENGINE_CENTER_ROUTES)) {
    if (path === route || path.startsWith(`${route}/`)) {
      return id as EngineCenterId;
    }
  }
  return null;
}

function defaultPageInsight(
  workspaceId: string,
  screen: CockpitScreenContext,
  companyId?: string,
): AiInsightContract {
  const home = loadExecutiveHomeView(workspaceId, companyId);
  return {
    currentInsight: home.nextExecutiveAction,
    recommendedAction: home.nextExecutiveAction,
    confidence: home.attentionItems.some((a) => a.severity === "critical") ? "low" : "medium",
    confidenceScore: 60,
    reasoningSource: "executive-home aggregate · OMS + certification register",
    supportingEvidence: home.attentionItems.slice(0, 5).map((a) => ({
      source: "executive-home",
      label: a.label,
      value: a.severity,
      href: a.href,
    })),
    computedAt: home.computedAt,
    interactionChannel: "executive-home",
    futureCapabilities: FUTURE_CAPABILITIES,
  };
}

export function loadCockpitInteractionContext(
  workspaceId: string,
  screenPath: string,
  companyId?: string,
): CockpitInteractionContext {
  const screen = resolveCockpitScreenContext(screenPath);
  const engineId = engineIdFromPath(screen.screenPath);

  let pageInsight: AiInsightContract;
  if (engineId) {
    const center = loadFullEngineCenterView(engineId, workspaceId, process.env, companyId);
    pageInsight = buildEngineAiInsight(center, "engine-center");
  } else {
    pageInsight = defaultPageInsight(workspaceId, screen, companyId);
  }

  return {
    computedAt: new Date().toISOString(),
    screen,
    pageInsight,
    suggestedPrompts: [
      "Explain this panel",
      "Why is this alert shown?",
      "Recommend next action",
      "Explain supplier health",
      "Explain marketplace health",
    ],
    bridgeTargets: [
      { id: "brain", label: "EmpireAI Brain", module: "brain/dispatch" },
      { id: "pillow-supervisor", label: "Pillow Supervisor", module: "cockpit-pillow" },
      { id: "executive-home", label: "Executive Home", module: "executive-home" },
      { id: "cockpit-engine", label: "Engine Centers", module: "cockpit-engine" },
    ],
  };
}

export function handleCockpitInteraction(
  workspaceId: string,
  request: CockpitInteractionRequest,
  companyId?: string,
): CockpitInteractionResponse {
  const screen = resolveCockpitScreenContext(request.screenPath);
  const home = loadExecutiveHomeView(workspaceId, companyId);
  const engineId =
    request.targetType === "engine" && request.targetId
      ? (request.targetId as EngineCenterId)
      : engineIdFromPath(request.screenPath);

  let insight: AiInsightContract;
  let summary: string;
  const followUps: string[] = [];

  if (request.intent === "recommend_next_action") {
    summary = home.nextExecutiveAction;
    insight = {
      currentInsight: home.nextExecutiveAction,
      recommendedAction: home.nextExecutiveAction,
      confidence: "high",
      confidenceScore: 80,
      reasoningSource: "OMS nextHighestImpactAction · command aggregate",
      supportingEvidence: home.summaryCards.slice(0, 3).map((c) => ({
        source: c.dataSource,
        label: c.title,
        value: c.nextAction,
        href: c.href,
      })),
      computedAt: home.computedAt,
      interactionChannel: "executive-home",
      futureCapabilities: FUTURE_CAPABILITIES,
    };
    followUps.push("Explain executive alerts", "Why is revenue declining?");
  } else if (request.intent === "explain_alert" || request.targetId?.startsWith("B")) {
    const alert =
      home.executiveAlerts.find((a) => a.id === request.targetId) ??
      home.executiveAlerts[0];
    summary = alert
      ? `${alert.label} — routed to ${alert.engineId ?? "governance workflow"}`
      : "No open executive alerts.";
    insight = {
      currentInsight: alert?.label ?? "No alerts",
      recommendedAction: alert?.href ? `Open ${alert.href}` : "Review Command Centre",
      confidence: alert ? "high" : "unavailable",
      confidenceScore: alert ? 90 : null,
      reasoningSource: "executive-home.executiveAlerts · certification register",
      supportingEvidence: home.executiveAlerts.slice(0, 5).map((a) => ({
        source: "alert",
        label: a.label,
        value: a.severity,
        href: a.href,
      })),
      computedAt: home.computedAt,
      interactionChannel: "executive-home",
      futureCapabilities: FUTURE_CAPABILITIES,
    };
    followUps.push("Recommend next action", "Explain this panel");
  } else if (request.intent === "explain_engine_health" && engineId) {
    const center = loadFullEngineCenterView(engineId, workspaceId, process.env, companyId);
    insight = buildEngineAiInsight(center, "engine-center");
    summary = `${center.displayName}: ${center.health} — ${center.currentState}`;
    followUps.push(`Explain ${center.displayName} dependencies`, "Recommend next action");
  } else if (request.targetId && home.summaryCards.some((c) => c.id === request.targetId)) {
    const card = home.summaryCards.find((c) => c.id === request.targetId)!;
    summary = `${card.title}: ${card.status}`;
    insight = {
      currentInsight: card.liveDataAvailable
        ? `${card.title} — ${card.primaryValue ?? card.status}`
        : card.status,
      recommendedAction: card.nextAction,
      confidence: card.liveDataAvailable ? "high" : "medium",
      confidenceScore: card.liveDataAvailable ? 75 : 40,
      reasoningSource: card.dataSource,
      supportingEvidence: [
        ...card.items.map((i) => ({
          source: card.dataSource,
          label: i.label,
          value: i.value,
          href: card.href,
        })),
        { source: "dependency", label: "Dependency", value: card.dependency ?? "—" },
      ],
      computedAt: home.computedAt,
      interactionChannel: "executive-home",
      futureCapabilities: FUTURE_CAPABILITIES,
    };
    followUps.push("Why is this alert shown?", "Recommend next action");
  } else if (engineId) {
    const center = loadFullEngineCenterView(engineId, workspaceId, process.env, companyId);
    insight = buildEngineAiInsight(center, "engine-center");
    summary = `This panel shows ${center.displayName} runtime state from Brain module cockpit-engine.`;
    followUps.push("Explain engine health", "Recommend next action");
  } else if (request.label?.toLowerCase().includes("revenue")) {
    const card = home.summaryCards.find((c) => c.id === "revenue-today");
    summary = card
      ? `Revenue summary: ${card.primaryValue ?? card.status}. ${card.nextAction}`
      : "Revenue data unavailable — see Finance → Profit.";
    insight = {
      currentInsight: card?.status ?? "Revenue metrics unavailable",
      recommendedAction: card?.nextAction ?? "Open Finance → Profit",
      confidence: card?.liveDataAvailable ? "medium" : "unavailable",
      confidenceScore: card?.liveDataAvailable ? 65 : null,
      reasoningSource: card?.dataSource ?? "order repository",
      supportingEvidence: (card?.items ?? []).map((i) => ({
        source: "revenue",
        label: i.label,
        value: i.value,
      })),
      computedAt: home.computedAt,
      interactionChannel: "executive-home",
      futureCapabilities: FUTURE_CAPABILITIES,
    };
    followUps.push("Explain PROOF-001 progress", "Recommend next action");
  } else {
    summary = `${screen.screenTitle}: ${home.nextExecutiveAction}`;
    insight = defaultPageInsight(workspaceId, screen, companyId);
    followUps.push("Explain this panel", "Why is this alert shown?");
  }

  return {
    intent: request.intent,
    summary,
    insight,
    suggestedFollowUps: followUps,
  };
}
