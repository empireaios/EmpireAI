/**
 * G4-04 — Engine Center eight-section contract.
 * Overview · Health · Current Activity · Dependencies · Executive Audit ·
 * Configuration · Future Expansion · Next Actions
 */

import type { EnginePanelView } from "./cockpit-panel-views.js";
import { buildEngineAiInsight, type AiInsightContract } from "./cockpit-interaction-layer.js";
import {
  COCKPIT_ENGINE_IDS,
  loadAllEnginePanels,
  loadEnginePanelView,
  type EngineCenterPanelId,
} from "./cockpit-panel-views.js";
import { buildCrossEngineAwareness, type CrossEngineAwareness } from "./executive-dashboard-integration.js";

export type EngineCenterId = EngineCenterPanelId;

export type EngineCenterSection = {
  available: boolean;
  status: string;
  dependency: string | null;
  nextAction: string;
  headline?: string | null;
  items?: Array<{ label: string; value: string; status?: string; timestamp?: string }>;
  metrics?: Array<{ label: string; value: string }>;
  artifactRef?: string | null;
};

export type EngineCenterView = EnginePanelView & {
  route: string;
  /** G4-07 — structured AI insight contract (no LLM) */
  aiInsight: AiInsightContract;
  sections: {
    overview: EngineCenterSection;
    health: EngineCenterSection;
    currentActivity: EngineCenterSection;
    dependencies: EngineCenterSection;
    executiveAudit: EngineCenterSection;
    configuration: EngineCenterSection;
    futureExpansion: EngineCenterSection;
    nextActions: EngineCenterSection;
  };
  /** Cross-navigation between engine centers (G4-04). */
  siblingEngines: Array<{ engineId: string; displayName: string; route: string }>;
  /** G4-05 — upstream/downstream, related engines and missions */
  crossEngine: CrossEngineAwareness;
};

export const ENGINE_CENTER_ROUTES: Record<EngineCenterId, string> = {
  supplier: "/cockpit/intelligence/suppliers",
  marketplace: "/cockpit/intelligence/marketplace",
  storefront: "/cockpit/commerce/store",
  advertising: "/cockpit/commerce/marketing",
  payment: "/cockpit/finance/billing",
  logistics: "/cockpit/operations/fulfillment",
  analytics: "/cockpit/finance/profit",
  "quantitative-intelligence": "/cockpit/intelligence/discovery",
  "pillow-supervisor": "/cockpit/development/pillow",
};

export const ENGINE_CENTER_IDS: readonly EngineCenterId[] = [
  "supplier",
  "marketplace",
  "storefront",
  "advertising",
  "payment",
  "logistics",
  "analytics",
  "quantitative-intelligence",
  "pillow-supervisor",
];

const FUTURE_EXPANSION_SLOTS: Record<EngineCenterId, Array<{ label: string; value: string }>> = {
  supplier: [
    { label: "Multi-supplier failover", value: "Architecture slot — post V1" },
    { label: "Supplier scorecards", value: "Slot reserved for REAL backlog" },
  ],
  marketplace: [
    { label: "shopee-sg channel", value: "B6-01c architecture provision" },
    { label: "shopify channel", value: "Architecture provision only" },
  ],
  storefront: [
    { label: "Multi-brand storefronts", value: "Slot reserved" },
    { label: "A/B theme testing", value: "Post PROOF-001 expansion" },
  ],
  advertising: [
    { label: "Meta live connector", value: "Optional pre-PROOF-001" },
    { label: "Google Ads channel", value: "Architecture slot" },
  ],
  payment: [
    { label: "Multi-currency treasury", value: "Post V1 expansion" },
    { label: "Payout automation", value: "Slot reserved" },
  ],
  logistics: [
    { label: "Multi-carrier routing", value: "Post CJ live expansion" },
    { label: "Returns automation", value: "Slot reserved" },
  ],
  analytics: [
    { label: "GA4 / pixel live sync", value: "Optional telemetry expansion" },
    { label: "Cohort LTV models", value: "Post PROOF-001" },
  ],
  "quantitative-intelligence": [
    { label: "Full discovery scoring board", value: "G4-04 partial — PIE scores live" },
    { label: "Trend forecast overlays", value: "Architecture slot" },
  ],
  "pillow-supervisor": [
    { label: "Natural-language Pillow reasoning", value: "Pillow package — not G4-04 scope" },
    { label: "Executive Learning loop", value: "Explicit not-implemented" },
  ],
};

function unavailableSection(
  status: string,
  dependency: string,
  nextAction: string,
): EngineCenterSection {
  return { available: false, status, dependency, nextAction };
}

function buildConfigurationSection(panel: EnginePanelView): EngineCenterSection {
  const configRows =
    panel.detailRows?.filter((r) =>
      /configured|pending|credential|token|mode|production|B6/i.test(`${r.label} ${r.value}`),
    ) ?? [];

  if (configRows.length === 0 && panel.dependencies.length === 0) {
    return unavailableSection(
      "No runtime configuration surface exposed for this engine",
      "Brain engine loader",
      panel.nextAction,
    );
  }

  return {
    available: true,
    status: panel.implemented ? "Runtime configuration verified" : "Partial configuration",
    dependency: panel.dependencies[0] ?? null,
    nextAction: panel.nextAction,
    items: [
      ...configRows.map((r) => ({ label: r.label, value: r.value, status: r.status })),
      ...panel.dependencies.slice(0, 4).map((d) => ({ label: "Dependency", value: d })),
    ],
  };
}

function buildSections(panel: EnginePanelView, engineId: EngineCenterId): EngineCenterView["sections"] {
  const activityItems =
    panel.detailRows?.map((r) => ({
      label: r.label,
      value: r.value,
      status: r.status,
    })) ?? [];

  return {
    overview: panel.implemented
      ? {
          available: true,
          status: panel.progress.label,
          dependency: null,
          nextAction: panel.nextAction,
          headline: panel.currentState,
          metrics: panel.metrics,
        }
      : unavailableSection(panel.currentState, panel.dependencies[0] ?? "Engine runtime", panel.nextAction),

    health: {
      available: true,
      status: `${panel.health} · ${panel.progress.percent}%`,
      dependency: panel.dataMode === "live" ? "Live commerce / domain runtime" : `Data mode: ${panel.dataMode}`,
      nextAction: panel.health === "FAILED" ? panel.nextAction : "Monitor health on Executive Home engine strip",
      headline: panel.health,
      metrics: [{ label: "Progress", value: `${panel.progress.percent}%` }],
    },

    currentActivity:
      activityItems.length > 0
        ? {
            available: true,
            status: `${activityItems.length} active row(s) in domain store`,
            dependency: "Domain repositories",
            nextAction: panel.nextAction,
            items: activityItems,
          }
        : unavailableSection(
            "No current activity rows in domain store",
            "Order / catalog / approval repositories",
            panel.nextAction,
          ),

    dependencies:
      panel.dependencies.length > 0
        ? {
            available: true,
            status: `${panel.dependencies.length} dependency(ies) tracked`,
            dependency: null,
            nextAction: panel.nextAction,
            items: panel.dependencies.map((d) => ({ label: "Requires", value: d })),
          }
        : unavailableSection("No dependencies registered", "Engine loader", panel.nextAction),

    executiveAudit: panel.executiveAudit.summary
      ? {
          available: true,
          status: panel.executiveAudit.summary,
          dependency: "Executive audit artifacts",
          nextAction: panel.executiveAudit.artifactRef
            ? `Review ${panel.executiveAudit.artifactRef}`
            : panel.nextAction,
          headline: panel.executiveAudit.summary,
          artifactRef: panel.executiveAudit.artifactRef,
        }
      : unavailableSection("No executive audit summary", "cockpit-audit / B6 tracker", panel.nextAction),

    configuration: buildConfigurationSection(panel),

    futureExpansion: {
      available: true,
      status: "Expansion slots reserved — no placeholder business metrics",
      dependency: "G4-01 architecture map",
      nextAction: "Extend engine loader without UI redesign",
      items: FUTURE_EXPANSION_SLOTS[engineId],
    },

    nextActions: {
      available: true,
      status: panel.nextAction,
      dependency: panel.implemented ? null : panel.dependencies[0] ?? null,
      nextAction: panel.nextAction,
      headline: panel.nextAction,
      items: panel.implemented
        ? [{ label: "Primary", value: panel.nextAction }]
        : [{ label: "Unblock", value: panel.nextAction }],
    },
  };
}

function siblingEngines(currentId: EngineCenterId): EngineCenterView["siblingEngines"] {
  const labels: Record<EngineCenterId, string> = {
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

  return ENGINE_CENTER_IDS.filter((id) => id !== currentId).map((id) => ({
    engineId: id,
    displayName: labels[id],
    route: ENGINE_CENTER_ROUTES[id],
  }));
}

export function loadEngineCenterView(
  engineId: EngineCenterId,
  workspaceId: string,
  env: NodeJS.ProcessEnv = process.env,
  companyId = "co-grand-king",
): EngineCenterView {
  const panel = loadEnginePanelView(engineId, workspaceId, env);
  const route = ENGINE_CENTER_ROUTES[engineId];
  const engineSummaries = loadAllEnginePanels(workspaceId, env);
  engineSummaries.push(
    loadEnginePanelView("quantitative-intelligence", workspaceId, env),
    loadEnginePanelView("pillow-supervisor", workspaceId, env),
  );

  return {
    ...panel,
    engineId,
    route,
    aiInsight: buildEngineAiInsight(panel, "engine-center"),
    sections: buildSections(panel, engineId),
    siblingEngines: siblingEngines(engineId),
    crossEngine: buildCrossEngineAwareness(engineId, workspaceId, companyId, engineSummaries),
  };
}

export function listEngineCenterSummaries(
  workspaceId: string,
  env: NodeJS.ProcessEnv = process.env,
): Array<{ engineId: EngineCenterId; displayName: string; route: string; health: string }> {
  return ENGINE_CENTER_IDS.map((id) => {
    const panel = loadEnginePanelView(id, workspaceId, env);
    return {
      engineId: id,
      displayName: panel.displayName,
      route: ENGINE_CENTER_ROUTES[id],
      health: panel.health,
    };
  });
}

/** V1 commerce engines only — Executive Home unchanged per G4-04 scope. */
export { COCKPIT_ENGINE_IDS };
