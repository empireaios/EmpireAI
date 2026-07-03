/**
 * G4-08 — Executive Relationship Graph
 * Extensible empire-wide relationship model — V1 engines as nodes, live health/missions/blockers.
 * No graph animations; architecture, interaction, and navigation only.
 */

import { buildObjectiveDashboard } from "../../orchestration/objective-management-engine/services/objective-management-service.js";
import {
  loadAllEnginePanels,
  loadEnginePanelView,
  loadPillowSupervisorView,
  type EnginePanelView,
} from "./cockpit-panel-views.js";
import { loadOperationalCommandView } from "./operational-command-view.js";
import {
  buildExecutiveAlerts,
  buildExecutiveDependencyGraph,
  ENGINE_DISPLAY_NAMES,
  MISSION_ENGINE_KEYWORDS,
  V1_DEPENDENCY_EDGES,
  V1_ENGINE_IDS,
} from "./executive-dashboard-integration.js";
import { ENGINE_CENTER_ROUTES, type EngineCenterId } from "./engine-center-views.js";

const DEFAULT_COMPANY = "co-grand-king";

/** V1 node kinds — engine nodes are live; others reserved for future expansion. */
export type RelationshipNodeKind =
  | "engine"
  | "company"
  | "brand"
  | "product"
  | "marketplace"
  | "supplier";

export type RelationshipEdgeKind =
  | "depends_on"
  | "feeds"
  | "upstream"
  | "downstream"
  | "active_mission"
  | "blocking_issue";

export type RelationshipGraphMissionLink = {
  id: string;
  title: string;
  progress: number;
  status: string;
  href: string;
};

export type RelationshipGraphBlockerLink = {
  id: string;
  label: string;
  severity: "critical" | "warning" | "info";
  href: string;
};

export type RelationshipGraphEngineRef = {
  engineId: EngineCenterId;
  label: string;
  route: string;
  edgeLabel: string;
};

export type RelationshipGraphNode = {
  id: string;
  kind: RelationshipNodeKind;
  label: string;
  route: string | null;
  engineId: EngineCenterId | null;
  department: string;
  health: string;
  currentState: string | null;
  dependencies: string[];
  upstream: RelationshipGraphEngineRef[];
  downstream: RelationshipGraphEngineRef[];
  activeMissions: RelationshipGraphMissionLink[];
  blockingIssues: RelationshipGraphBlockerLink[];
};

export type RelationshipGraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: RelationshipEdgeKind;
  label: string;
};

export type ExecutiveRelationshipGraphSummary = {
  totalEngines: number;
  healthyEngines: number;
  enginesWithBlockers: number;
  activeMissionLinks: number;
  dependencyEdges: number;
};

export type ExecutiveRelationshipGraphFutureExpansion = {
  nodeKinds: RelationshipNodeKind[];
  edgeKinds: RelationshipEdgeKind[];
  registrationPattern: string;
  notes: string[];
};

export type ExecutiveRelationshipGraphView = {
  computedAt: string;
  schemaVersion: "g4-08-v1";
  nodes: RelationshipGraphNode[];
  edges: RelationshipGraphEdge[];
  summary: ExecutiveRelationshipGraphSummary;
  futureExpansion: ExecutiveRelationshipGraphFutureExpansion;
};

const ENGINE_DEPARTMENTS: Record<EngineCenterId, string> = {
  supplier: "Intelligence",
  marketplace: "Intelligence",
  "quantitative-intelligence": "Intelligence",
  storefront: "Commerce",
  advertising: "Commerce",
  payment: "Finance",
  analytics: "Finance",
  logistics: "Operations",
  "pillow-supervisor": "Development",
};

const FUTURE_NODE_KINDS: RelationshipNodeKind[] = [
  "company",
  "brand",
  "product",
  "marketplace",
  "supplier",
];

function engineNodeId(engineId: EngineCenterId): string {
  return `engine:${engineId}`;
}

function missionsForEngine(
  engineId: EngineCenterId,
  workspaceId: string,
  companyId: string,
): RelationshipGraphMissionLink[] {
  const objectiveDashboard = buildObjectiveDashboard(workspaceId, companyId);
  const keywords = MISSION_ENGINE_KEYWORDS[engineId] ?? [];
  const matched = objectiveDashboard.activeObjectives.filter((obj) => {
    const hay = `${obj.title} ${obj.objectiveId}`.toLowerCase();
    return keywords.some((k) => hay.includes(k));
  });

  const source =
    matched.length > 0
      ? matched.slice(0, 6)
      : objectiveDashboard.activeObjectives.slice(0, 2);

  return source.map((obj) => ({
    id: obj.objectiveId,
    title: obj.title,
    progress: obj.currentProgressPercent,
    status: obj.status,
    href: "/cockpit/missions",
  }));
}

function buildEngineRefs(
  engineId: EngineCenterId,
  direction: "upstream" | "downstream",
): RelationshipGraphEngineRef[] {
  const edges =
    direction === "upstream"
      ? V1_DEPENDENCY_EDGES.filter((e) => e.to === engineId)
      : V1_DEPENDENCY_EDGES.filter((e) => e.from === engineId);

  return edges.map((edge) => {
    const refId = direction === "upstream" ? edge.from : edge.to;
    return {
      engineId: refId,
      label: ENGINE_DISPLAY_NAMES[refId],
      route: ENGINE_CENTER_ROUTES[refId],
      edgeLabel: edge.label,
    };
  });
}

function buildRelationshipNodes(
  engineSummaries: EnginePanelView[],
  alertsByEngine: Map<EngineCenterId, RelationshipGraphBlockerLink[]>,
  workspaceId: string,
  companyId: string,
): RelationshipGraphNode[] {
  const summaryById = new Map(engineSummaries.map((e) => [e.engineId, e]));

  return V1_ENGINE_IDS.map((engineId) => {
    const panel = summaryById.get(engineId);
    const upstream = buildEngineRefs(engineId, "upstream");
    const downstream = buildEngineRefs(engineId, "downstream");

    return {
      id: engineNodeId(engineId),
      kind: "engine" as const,
      label: ENGINE_DISPLAY_NAMES[engineId],
      route: ENGINE_CENTER_ROUTES[engineId],
      engineId,
      department: ENGINE_DEPARTMENTS[engineId],
      health: panel?.health ?? "UNKNOWN",
      currentState: panel?.currentState ?? null,
      dependencies: panel?.dependencies ?? [],
      upstream,
      downstream,
      activeMissions: missionsForEngine(engineId, workspaceId, companyId),
      blockingIssues: alertsByEngine.get(engineId) ?? [],
    };
  });
}

function buildRelationshipEdges(
  nodes: RelationshipGraphNode[],
): RelationshipGraphEdge[] {
  const edges: RelationshipGraphEdge[] = [];

  for (const dep of V1_DEPENDENCY_EDGES) {
    const fromId = engineNodeId(dep.from);
    const toId = engineNodeId(dep.to);
    edges.push({
      id: `dep-${dep.from}-${dep.to}`,
      from: fromId,
      to: toId,
      kind: "depends_on",
      label: dep.label,
    });
    edges.push({
      id: `feeds-${dep.from}-${dep.to}`,
      from: fromId,
      to: toId,
      kind: "feeds",
      label: dep.label,
    });
    edges.push({
      id: `upstream-${dep.from}-${dep.to}`,
      from: fromId,
      to: toId,
      kind: "upstream",
      label: `${ENGINE_DISPLAY_NAMES[dep.from]} → ${ENGINE_DISPLAY_NAMES[dep.to]}`,
    });
    edges.push({
      id: `downstream-${dep.from}-${dep.to}`,
      from: fromId,
      to: toId,
      kind: "downstream",
      label: `${ENGINE_DISPLAY_NAMES[dep.from]} → ${ENGINE_DISPLAY_NAMES[dep.to]}`,
    });
  }

  for (const node of nodes) {
    if (!node.engineId) continue;

    for (const mission of node.activeMissions) {
      edges.push({
        id: `mission-${node.engineId}-${mission.id}`,
        from: engineNodeId(node.engineId),
        to: `mission:${mission.id}`,
        kind: "active_mission",
        label: mission.title,
      });
    }

    for (const blocker of node.blockingIssues) {
      edges.push({
        id: `blocker-${blocker.id}-${node.engineId}`,
        from: `blocker:${blocker.id}`,
        to: engineNodeId(node.engineId),
        kind: "blocking_issue",
        label: blocker.label,
      });
    }
  }

  return edges;
}

function buildSummary(nodes: RelationshipGraphNode[], edges: RelationshipGraphEdge[]): ExecutiveRelationshipGraphSummary {
  const engineNodes = nodes.filter((n) => n.kind === "engine");
  return {
    totalEngines: engineNodes.length,
    healthyEngines: engineNodes.filter((n) => n.health === "HEALTHY").length,
    enginesWithBlockers: engineNodes.filter((n) => n.blockingIssues.length > 0).length,
    activeMissionLinks: edges.filter((e) => e.kind === "active_mission").length,
    dependencyEdges: V1_DEPENDENCY_EDGES.length,
  };
}

export function loadExecutiveRelationshipGraphView(
  workspaceId: string,
  companyId = DEFAULT_COMPANY,
  env: NodeJS.ProcessEnv = process.env,
): ExecutiveRelationshipGraphView {
  const command = loadOperationalCommandView(workspaceId, companyId, env);
  const pillow = loadPillowSupervisorView(workspaceId, env);
  const engineSummaries = [
    ...loadAllEnginePanels(workspaceId, env),
    loadEnginePanelView("quantitative-intelligence", workspaceId, env),
    loadEnginePanelView("pillow-supervisor", workspaceId, env),
  ];

  const alerts = buildExecutiveAlerts(command, pillow.pendingApprovals, engineSummaries);
  const alertsByEngine = new Map<EngineCenterId, RelationshipGraphBlockerLink[]>();
  for (const alert of alerts) {
    if (!alert.engineId) continue;
    const list = alertsByEngine.get(alert.engineId) ?? [];
    list.push({
      id: alert.id,
      label: alert.label,
      severity: alert.severity,
      href: alert.href,
    });
    alertsByEngine.set(alert.engineId, list);
  }

  const nodes = buildRelationshipNodes(engineSummaries, alertsByEngine, workspaceId, companyId);
  const edges = buildRelationshipEdges(nodes);

  return {
    computedAt: new Date().toISOString(),
    schemaVersion: "g4-08-v1",
    nodes,
    edges,
    summary: buildSummary(nodes, edges),
    futureExpansion: {
      nodeKinds: FUTURE_NODE_KINDS,
      edgeKinds: [
        "depends_on",
        "feeds",
        "upstream",
        "downstream",
        "active_mission",
        "blocking_issue",
      ],
      registrationPattern:
        "Register new nodes via RelationshipGraphNode.kind + id prefix; append edges without changing V1_ENGINE_IDS spine.",
      notes: [
        "Companies, brands, products, marketplaces, and suppliers slot in as additional node kinds.",
        "New Version 2+ engines append to V1_ENGINE_IDS or a parallel engine registry — graph schema unchanged.",
        "Force-directed layout and animations are out of scope for G4-08.",
      ],
    },
  };
}
