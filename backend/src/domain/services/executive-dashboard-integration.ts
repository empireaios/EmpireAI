/**
 * G4-05 — Executive Dashboard Integration
 * Dependency graph, cross-engine awareness, timeline aggregation, alert/approval routing.
 */

import { buildObjectiveDashboard } from "../../orchestration/objective-management-engine/services/objective-management-service.js";
import { buildGlobalExecutionTimeline } from "../../runtime/global-execution-timeline/services/global-execution-timeline-service.js";
import {
  loadEnginePanelView,
  loadPillowSupervisorView,
  type EnginePanelView,
} from "./cockpit-panel-views.js";
import { ENGINE_CENTER_ROUTES, type EngineCenterId } from "./engine-center-views.js";
import {
  loadDashboardView,
  loadFinanceView,
  loadMarketingView,
  loadOrdersView,
  loadStoreView,
} from "./module-views.js";
import type { loadOperationalCommandView } from "./operational-command-view.js";

export type ExecutiveTimelineEvent = {
  id: string;
  sourceEngine: EngineCenterId | "portfolio" | "oms";
  sourceLabel: string;
  title: string;
  summary: string;
  timestamp: string;
  href: string;
};

export type ExecutiveAlert = {
  id: string;
  label: string;
  severity: "critical" | "warning" | "info";
  engineId: EngineCenterId | null;
  href: string;
};

export type ExecutiveApprovalRoute = {
  id: string;
  title: string;
  summary: string;
  type: string;
  workflowHref: string;
  engineId: EngineCenterId | null;
};

export type DependencyGraphNode = {
  engineId: EngineCenterId;
  displayName: string;
  route: string;
  health: string;
};

export type DependencyGraphEdge = {
  from: EngineCenterId;
  to: EngineCenterId;
  label: string;
};

export type ExecutiveDependencyGraph = {
  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];
};

export type CrossEngineAwareness = {
  upstream: Array<{ engineId: EngineCenterId; displayName: string; route: string; reason: string }>;
  downstream: Array<{ engineId: EngineCenterId; displayName: string; route: string; reason: string }>;
  relatedEngines: Array<{ engineId: EngineCenterId; displayName: string; route: string; health: string }>;
  relatedMissions: Array<{ id: string; title: string; progress: number; status: string; href: string }>;
};

/** V1 engine center IDs — canonical graph node set (G4-05 / G4-08). */
export const V1_ENGINE_IDS = [
  "supplier",
  "marketplace",
  "storefront",
  "advertising",
  "payment",
  "logistics",
  "analytics",
  "quantitative-intelligence",
  "pillow-supervisor",
] as const satisfies readonly EngineCenterId[];

/** V1 commercial spine — architecture relationships (G4-01). */
export const V1_DEPENDENCY_EDGES: DependencyGraphEdge[] = [
  { from: "supplier", to: "logistics", label: "Fulfilment supply" },
  { from: "supplier", to: "marketplace", label: "Catalog sourcing" },
  { from: "marketplace", to: "storefront", label: "Channel listings" },
  { from: "storefront", to: "advertising", label: "Traffic destination" },
  { from: "storefront", to: "payment", label: "Checkout surface" },
  { from: "payment", to: "analytics", label: "Revenue telemetry" },
  { from: "logistics", to: "analytics", label: "Fulfilment telemetry" },
  { from: "advertising", to: "analytics", label: "Conversion telemetry" },
  { from: "quantitative-intelligence", to: "supplier", label: "Scoring input" },
  { from: "quantitative-intelligence", to: "marketplace", label: "Opportunity signals" },
  { from: "pillow-supervisor", to: "supplier", label: "Approval gate" },
  { from: "pillow-supervisor", to: "marketplace", label: "Approval gate" },
];

export const ENGINE_DISPLAY_NAMES: Record<EngineCenterId, string> = {
  supplier: "Supplier Engine",
  marketplace: "Marketplace Engine",
  storefront: "Storefront Engine",
  advertising: "Advertising Engine",
  payment: "Payment Engine",
  logistics: "Logistics Engine",
  analytics: "Analytics Engine",
  "quantitative-intelligence": "Quantitative Intelligence",
  "pillow-supervisor": "Pillow Supervisor",
};

const CARD_ENGINE_MAP: Record<string, EngineCenterId | null> = {
  "empire-health": "analytics",
  "revenue-today": "analytics",
  "marketplace-status": "marketplace",
  "supplier-status": "supplier",
  "active-missions": null,
  "executive-alerts": null,
  "pillow-status": "pillow-supervisor",
  "pending-kings-approval": "pillow-supervisor",
  "ai-recommendations": "quantitative-intelligence",
  "executive-timeline": null,
};

function blockerToEngineId(blockerId: string): EngineCenterId | null {
  if (blockerId === "B6" || blockerId.startsWith("B6")) {
    return "marketplace";
  }
  if (blockerId === "B5") return "analytics";
  return null;
}

export function buildExecutiveDependencyGraph(
  engineSummaries: EnginePanelView[],
): ExecutiveDependencyGraph {
  const summaryById = new Map(engineSummaries.map((e) => [e.engineId, e]));
  const nodes: DependencyGraphNode[] = V1_ENGINE_IDS.map((id) => {
    const panel = summaryById.get(id);
    return {
      engineId: id,
      displayName: ENGINE_DISPLAY_NAMES[id],
      route: ENGINE_CENTER_ROUTES[id],
      health: panel?.health ?? "UNKNOWN",
    };
  });

  return { nodes, edges: V1_DEPENDENCY_EDGES };
}

export function buildExecutiveTimeline(
  workspaceId: string,
  companyId: string,
  portfolio: ReturnType<typeof loadDashboardView>,
  env: NodeJS.ProcessEnv = process.env,
): ExecutiveTimelineEvent[] {
  const events: ExecutiveTimelineEvent[] = [];
  const now = new Date().toISOString();

  const pillow = loadPillowSupervisorView(workspaceId, env);
  for (const row of pillow.recentApprovals.slice(0, 4)) {
    events.push({
      id: `tl-pillow-${row.approvalId}`,
      sourceEngine: "pillow-supervisor",
      sourceLabel: "Pillow",
      title: row.title,
      summary: `${row.status} · ${row.type}`,
      timestamp: now,
      href: ENGINE_CENTER_ROUTES["pillow-supervisor"],
    });
  }

  const supplierPanel = loadEnginePanelView("supplier", workspaceId, env);
  for (const row of supplierPanel.detailRows?.slice(0, 3) ?? []) {
    events.push({
      id: `tl-supplier-${row.label}`,
      sourceEngine: "supplier",
      sourceLabel: "Supplier",
      title: row.label,
      summary: row.value,
      timestamp: now,
      href: ENGINE_CENTER_ROUTES.supplier,
    });
  }

  const marketplacePanel = loadEnginePanelView("marketplace", workspaceId, env);
  for (const row of marketplacePanel.detailRows?.slice(0, 3) ?? []) {
    events.push({
      id: `tl-marketplace-${row.label}`,
      sourceEngine: "marketplace",
      sourceLabel: "Marketplace",
      title: row.label,
      summary: row.value,
      timestamp: now,
      href: ENGINE_CENTER_ROUTES.marketplace,
    });
  }

  const store = loadStoreView(workspaceId);
  for (const stage of store.buildStages.slice(0, 3)) {
    events.push({
      id: `tl-storefront-${stage.stage}`,
      sourceEngine: "storefront",
      sourceLabel: "Storefront",
      title: stage.stage,
      summary: `${stage.progress}% · ${stage.status}`,
      timestamp: now,
      href: ENGINE_CENTER_ROUTES.storefront,
    });
  }

  const marketing = loadMarketingView(workspaceId);
  for (const c of marketing.campaigns.slice(0, 3)) {
    events.push({
      id: `tl-advertising-${c.id}`,
      sourceEngine: "advertising",
      sourceLabel: "Advertising",
      title: c.name,
      summary: `${c.status} · reach ${c.reach}`,
      timestamp: now,
      href: ENGINE_CENTER_ROUTES.advertising,
    });
  }

  const finance = loadFinanceView(workspaceId);
  events.push({
    id: "tl-payment-profit-today",
    sourceEngine: "payment",
    sourceLabel: "Payment",
    title: "Order profit today",
    summary: finance.orderProfitToday,
    timestamp: now,
    href: ENGINE_CENTER_ROUTES.payment,
  });

  const orders = loadOrdersView(workspaceId);
  for (const o of orders.orders.slice(0, 3)) {
    events.push({
      id: `tl-logistics-${o.id}`,
      sourceEngine: "logistics",
      sourceLabel: "Logistics",
      title: o.product,
      summary: `${o.status} · ${o.total}`,
      timestamp: o.date,
      href: ENGINE_CENTER_ROUTES.logistics,
    });
  }

  const analyticsPanel = loadEnginePanelView("analytics", workspaceId, env);
  events.push({
    id: "tl-analytics-proof",
    sourceEngine: "analytics",
    sourceLabel: "Analytics",
    title: "PROOF-001 tracker",
    summary: analyticsPanel.currentState,
    timestamp: now,
    href: ENGINE_CENTER_ROUTES.analytics,
  });

  for (const item of portfolio.recentActivity.slice(0, 4)) {
    events.push({
      id: `tl-activity-${item.id}`,
      sourceEngine: "portfolio",
      sourceLabel: "Portfolio",
      title: item.agent,
      summary: item.action,
      timestamp: item.timestamp,
      href: "/cockpit",
    });
  }

  const globalTimeline = buildGlobalExecutionTimeline(workspaceId, companyId);
  for (const e of globalTimeline.events.slice(0, 4)) {
    events.push({
      id: e.eventId,
      sourceEngine: "oms",
      sourceLabel: "OMS",
      title: e.title,
      summary: e.summary,
      timestamp: e.scheduledAt,
      href: "/cockpit/missions",
    });
  }

  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 24);
}

export function buildExecutiveAlerts(
  command: ReturnType<typeof loadOperationalCommandView>,
  pillowPending: number,
  engineSummaries: EnginePanelView[],
): ExecutiveAlert[] {
  const alerts: ExecutiveAlert[] = [];

  for (const blocker of Object.values(command.certificationBlockers)) {
    if (blocker.status === "closed") continue;
    const engineId = blockerToEngineId(blocker.id);
    alerts.push({
      id: blocker.id,
      label: `${blocker.id}: ${blocker.detail}`,
      severity: blocker.status === "open" ? "critical" : "warning",
      engineId,
      href: engineId
        ? ENGINE_CENTER_ROUTES[engineId]
        : blocker.id.startsWith("B6")
          ? "/cockpit/infrastructure/integrations"
          : "/cockpit/governance/v1",
    });
  }

  if (command.pendingApprovals.count > 0) {
    alerts.push({
      id: "executive-approval",
      label: `${command.pendingApprovals.count} executive decision(s) pending`,
      severity: "warning",
      engineId: null,
      href: "/cockpit/command",
    });
  }

  if (pillowPending > 0) {
    alerts.push({
      id: "pillow-approval",
      label: `${pillowPending} Pillow approval(s) waiting`,
      severity: "warning",
      engineId: "pillow-supervisor",
      href: "/cockpit/development/approvals",
    });
  }

  for (const engine of engineSummaries) {
    if (engine.health === "FAILED") {
      const eid = engine.engineId as EngineCenterId;
      alerts.push({
        id: `engine-${engine.engineId}`,
        label: `${engine.displayName} — ${engine.currentState}`,
        severity: "critical",
        engineId: eid,
        href: ENGINE_CENTER_ROUTES[eid] ?? "/cockpit",
      });
    }
  }

  if (command.oms.overallHealth === "RED") {
    alerts.push({
      id: "oms-red",
      label: `OMS RED — ${command.oms.currentBlocker ?? command.oms.activeObjective}`,
      severity: "critical",
      engineId: null,
      href: "/cockpit/missions",
    });
  }

  return alerts.slice(0, 12);
}

export function buildExecutiveApprovalRoutes(
  workspaceId: string,
  command: ReturnType<typeof loadOperationalCommandView>,
  env: NodeJS.ProcessEnv = process.env,
): ExecutiveApprovalRoute[] {
  const routes: ExecutiveApprovalRoute[] = [];
  const pillow = loadPillowSupervisorView(workspaceId, env);

  if (command.pendingApprovals.top) {
    const top = command.pendingApprovals.top;
    routes.push({
      id: top.approvalId,
      title: top.title,
      summary: top.summary,
      type: top.type,
      workflowHref: "/cockpit/command",
      engineId: null,
    });
  }

  for (const row of pillow.recentApprovals.filter((r) => r.status === "Pending").slice(0, 6)) {
    routes.push({
      id: row.approvalId,
      title: row.title,
      summary: `${row.type} approval`,
      type: row.type,
      workflowHref: "/cockpit/development/approvals",
      engineId: "pillow-supervisor",
    });
  }

  return routes;
}

export const MISSION_ENGINE_KEYWORDS: Record<EngineCenterId, string[]> = {
  supplier: ["supplier", "cj", "b6-02", "fulfil"],
  marketplace: ["marketplace", "amazon", "b6-01", "channel"],
  storefront: ["store", "storefront", "launch", "manufactur"],
  advertising: ["ad", "marketing", "meta", "campaign"],
  payment: ["stripe", "payment", "billing", "b6-03"],
  logistics: ["logistic", "fulfillment", "order", "ship"],
  analytics: ["proof", "analytics", "revenue", "profit"],
  "quantitative-intelligence": ["discover", "intelligence", "score", "product"],
  "pillow-supervisor": ["pillow", "approval", "govern"],
};

export function buildCrossEngineAwareness(
  engineId: EngineCenterId,
  workspaceId: string,
  companyId: string,
  engineSummaries: EnginePanelView[],
): CrossEngineAwareness {
  const summaryById = new Map(engineSummaries.map((e) => [e.engineId, e]));
  const upstreamIds = V1_DEPENDENCY_EDGES.filter((e) => e.to === engineId).map((e) => e.from);
  const downstreamIds = V1_DEPENDENCY_EDGES.filter((e) => e.from === engineId).map((e) => e.to);

  const toEntry = (id: EngineCenterId, reason: string) => ({
    engineId: id,
    displayName: ENGINE_DISPLAY_NAMES[id],
    route: ENGINE_CENTER_ROUTES[id],
    reason,
  });

  const upstream = upstreamIds.map((id) => {
    const edge = V1_DEPENDENCY_EDGES.find((e) => e.from === id && e.to === engineId);
    return toEntry(id, edge?.label ?? "Upstream dependency");
  });

  const downstream = downstreamIds.map((id) => {
    const edge = V1_DEPENDENCY_EDGES.find((e) => e.from === engineId && e.to === id);
    return toEntry(id, edge?.label ?? "Downstream consumer");
  });

  const relatedIds = new Set<EngineCenterId>([...upstreamIds, ...downstreamIds]);
  if (engineId !== "pillow-supervisor") {
    relatedIds.add("pillow-supervisor");
  }
  relatedIds.delete(engineId);

  const relatedEngines = [...relatedIds].map((id) => {
    const panel = summaryById.get(id);
    return {
      engineId: id,
      displayName: ENGINE_DISPLAY_NAMES[id],
      route: ENGINE_CENTER_ROUTES[id],
      health: panel?.health ?? "UNKNOWN",
    };
  });

  const objectiveDashboard = buildObjectiveDashboard(workspaceId, companyId);
  const keywords = MISSION_ENGINE_KEYWORDS[engineId] ?? [];
  let relatedMissions = objectiveDashboard.activeObjectives
    .filter((obj) => {
      const hay = `${obj.title} ${obj.objectiveId}`.toLowerCase();
      return keywords.some((k) => hay.includes(k));
    })
    .slice(0, 6)
    .map((obj) => ({
      id: obj.objectiveId,
      title: obj.title,
      progress: obj.currentProgressPercent,
      status: obj.status,
      href: "/cockpit/missions",
    }));

  if (relatedMissions.length === 0 && objectiveDashboard.activeObjectives.length > 0) {
    relatedMissions = objectiveDashboard.activeObjectives.slice(0, 3).map((obj) => ({
      id: obj.objectiveId,
      title: obj.title,
      progress: obj.currentProgressPercent,
      status: obj.status,
      href: "/cockpit/missions",
    }));
  }

  return { upstream, downstream, relatedEngines, relatedMissions };
}

export function applyCardEngineCenterLinks(
  cards: Array<{ id: string; href: string | null; engineCenterId?: string | null }>,
): void {
  for (const card of cards) {
    const engineId = CARD_ENGINE_MAP[card.id];
    card.engineCenterId = engineId;
    if (engineId) {
      card.href = ENGINE_CENTER_ROUTES[engineId];
    }
    if (card.id === "executive-timeline") {
      card.href = "/cockpit#executive-timeline";
    }
    if (card.id === "active-missions") {
      card.href = "/cockpit/missions";
    }
    if (card.id === "pending-kings-approval") {
      card.href = "/cockpit/development/approvals";
    }
    if (card.id === "executive-alerts") {
      card.href = "/cockpit#executive-alerts";
    }
  }
}

export { CARD_ENGINE_MAP };
