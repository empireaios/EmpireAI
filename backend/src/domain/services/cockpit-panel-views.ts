/**
 * G4-02 — Cockpit live panel views (normalized engine contract).
 * Every engine panel exposes: currentState, health, progress, nextAction, executiveAudit, dependencies.
 */

import {
  assessB6CredentialImplementation,
  assessProductionInfrastructureReadiness,
  assessVersion1OperationalActivation,
  hasAmazonMarketplaceEnvCredentials,
  hasCjDropshippingEnvCredentials,
  hasCredentialVaultKey,
  hasStripeProductionCredentials,
  isAmazonLiveCommerceActivated,
  isCjLiveCommerceActivated,
  isLiveCommerceProductionMode,
} from "../../orchestration/version-1-activation/index.js";
import { buildEsisDashboard } from "../../orchestration/empire-self-inspection/services/esis-dashboard-service.js";
import {
  ensurePillowApprovalTables,
  SqlitePillowApprovalRepository,
} from "../../orchestration/pillow-approval/repository/sqlite-pillow-approval-repository.js";
import { getObjectiveReportingSummary } from "../../orchestration/objective-management-engine/services/objective-management-service.js";
import { resolveLiveCommerceIntegrationMode } from "../../orchestration/reality-integration/live-commerce/config.js";
import { AMAZON_MARKETPLACE_REGISTRY_IDS } from "../../orchestration/reality-integration/live-commerce/amazon-marketplace-profiles.js";
import { buildObjectiveDashboard } from "../../orchestration/objective-management-engine/services/objective-management-service.js";
import { enrichExecutiveHomeViewP704 } from "./executive-home-p7-04.js";
import {
  loadAiCeoView,
  loadDashboardView,
  loadFinanceView,
  loadIntegrationsView,
  loadIntelligenceView,
  loadMarketingView,
  loadAdsView,
  loadOrdersView,
  loadStoreView,
  loadSuppliersView,
} from "./module-views.js";
import {
  loadLaunchView,
  loadOperationalCommandView,
} from "./operational-command-view.js";
import { loadProductIntelligenceEngineViewForWorkspace } from "./product-intelligence-engine-views.js";
import { loadMarketIntelligenceEngineViewForWorkspace } from "./market-intelligence-engine-views.js";
import { loadSupplierIntelligenceEngineViewForWorkspace } from "./supplier-intelligence-engine-views.js";
import { loadFinancialIntelligenceEngineViewForWorkspace } from "./financial-intelligence-engine-views.js";
import { loadQuantitativeIntelligenceEngineViewForWorkspace } from "./quantitative-intelligence-engine-views.js";
import { loadAdvertisingIntelligenceEngineViewForWorkspace } from "./advertising-intelligence-engine-views.js";
import { loadCustomerIntelligenceEngineViewForWorkspace } from "./customer-intelligence-engine-views.js";
import { loadRiskIntelligenceEngineViewForWorkspace } from "./risk-intelligence-engine-views.js";
import { loadDecisionIntelligenceEngineViewForWorkspace } from "./decision-intelligence-engine-views.js";
import { loadExecutiveIntelligenceOrchestratorViewForWorkspace } from "./executive-intelligence-orchestrator-views.js";
import {
  applyCardEngineCenterLinks,
  buildCrossEngineAwareness,
  buildExecutiveAlerts,
  buildExecutiveApprovalRoutes,
  buildExecutiveDependencyGraph,
  buildExecutiveTimeline,
  type ExecutiveAlert,
  type ExecutiveApprovalRoute,
  type ExecutiveDependencyGraph,
  type ExecutiveTimelineEvent,
} from "./executive-dashboard-integration.js";
import { buildGlobalExecutionTimeline } from "../../runtime/global-execution-timeline/services/global-execution-timeline-service.js";
import {
  cooperativeYield,
  waitForEventLoopCapacity,
} from "../../runtime/event-loop-cooperative.js";

export type EnginePanelHealth = "HEALTHY" | "WARNING" | "FAILED" | "NOT_IMPLEMENTED" | "UNKNOWN";

export type { ExecutiveAlert } from "./executive-dashboard-integration.js";

export type EnginePanelView = {
  engineId: string;
  displayName: string;
  computedAt: string;
  dataMode: "live" | "sandbox" | "demo";
  implemented: boolean;
  currentState: string;
  health: EnginePanelHealth;
  progress: { percent: number; label: string };
  nextAction: string;
  executiveAudit: { summary: string; artifactRef: string | null };
  dependencies: string[];
  metrics?: Array<{ label: string; value: string }>;
  detailRows?: Array<{ label: string; value: string; status?: string }>;
};

/** G4-06 — live executive widget contract metadata */
export type ExecutiveWidgetDataMode = "live" | "sandbox" | "unavailable";

export const EXECUTIVE_WIDGET_REFRESH_SECONDS = 45;

export type ExecutiveSummaryCard = {
  id: string;
  /** G4-06 canonical widget identifier */
  widgetId: string;
  title: string;
  available: boolean;
  /** G4-06 — verified runtime values present (not placeholder UI) */
  liveDataAvailable: boolean;
  dataMode: ExecutiveWidgetDataMode;
  dataSource: string;
  refreshSeconds: number;
  futureEnhancement: string;
  primaryValue: string | null;
  status: string;
  dependency: string | null;
  nextAction: string;
  href: string | null;
  health: string | null;
  items: Array<{ label: string; value: string; timestamp?: string }>;
  /** G4-05 — linked Engine Center when applicable */
  engineCenterId?: string | null;
};

export type ExecutiveAttentionItem = {
  id: string;
  label: string;
  severity: "critical" | "warning" | "info";
  href: string | null;
  engineId?: string | null;
};

export type ExecutiveHomeView = {
  computedAt: string;
  greeting: {
    displayNameHint: string;
    topBlocker: string | null;
    topBlockerHref: string | null;
  };
  command: ReturnType<typeof loadOperationalCommandView>;
  portfolio: ReturnType<typeof loadDashboardView>;
  engineSummaries: EnginePanelView[];
  /** G4-03 — King's operating summary cards */
  summaryCards: ExecutiveSummaryCard[];
  attentionItems: ExecutiveAttentionItem[];
  nextExecutiveAction: string;
  /** G4-05 — integrated executive dashboard */
  executiveTimeline: ExecutiveTimelineEvent[];
  executiveAlerts: ExecutiveAlert[];
  approvalRoutes: ExecutiveApprovalRoute[];
  dependencyGraph: ExecutiveDependencyGraph;
  /** P7-04 — constitutional command centre */
  architectureVersion: "P7-04";
  executiveBrief: import("./executive-home-p7-04.js").ExecutiveHomeBrief;
  centreSummaries: import("./executive-home-p7-04.js").ExecutiveHomeCentreSummaries;
};

export type MissionCentreView = {
  computedAt: string;
  oms: ReturnType<typeof getObjectiveReportingSummary>;
  blockers: Array<{ id: string; label: string; detail: string; status: string }>;
  pendingApprovals: Array<{
    approvalId: string;
    title: string;
    summary: string;
    type: string;
    status: string;
  }>;
  missions: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
    priority: string;
  }>;
};

export type ExecutiveAuditView = {
  computedAt: string;
  certificationBlockers: ReturnType<typeof loadOperationalCommandView>["certificationBlockers"];
  b6: ReturnType<typeof assessB6CredentialImplementation>;
  infrastructure: ReturnType<typeof assessProductionInfrastructureReadiness>;
  activation: ReturnType<typeof assessVersion1OperationalActivation>;
  esis: ReturnType<typeof buildEsisDashboard>;
};

export type PillowSupervisorView = {
  computedAt: string;
  deliveryMode: string;
  productionModeEnabled: boolean;
  pendingApprovals: number;
  recentApprovals: Array<{ approvalId: string; title: string; status: string; type: string }>;
  capabilityNote: string;
};

const DEFAULT_COMPANY = "co-grand-king";

export const COCKPIT_ENGINE_IDS = [
  "supplier",
  "marketplace",
  "storefront",
  "advertising",
  "payment",
  "logistics",
  "analytics",
] as const;

/** G4-04 — All navigable engine centers (includes QIE + Pillow). */
export const ENGINE_CENTER_PANEL_IDS = [
  ...COCKPIT_ENGINE_IDS,
  "quantitative-intelligence",
  "pillow-supervisor",
] as const;

export type CockpitEngineId = (typeof COCKPIT_ENGINE_IDS)[number];
export type EngineCenterPanelId = (typeof ENGINE_CENTER_PANEL_IDS)[number];

function resolveHealthFromPercent(percent: number, blockers: number): EnginePanelHealth {
  if (blockers > 2) return "FAILED";
  if (percent >= 80) return "HEALTHY";
  if (percent >= 40) return "WARNING";
  if (percent > 0) return "WARNING";
  return "UNKNOWN";
}

function liveCommerceMode(): "live" | "sandbox" | "demo" {
  const mode = resolveLiveCommerceIntegrationMode();
  if (mode === "production") return "live";
  if (mode === "sandbox") return "sandbox";
  return "demo";
}

export function loadSupplierEnginePanel(
  workspaceId: string,
  env: NodeJS.ProcessEnv = process.env,
): EnginePanelView {
  const suppliersView = loadSuppliersView(workspaceId);
  const cjConfigured = hasCjDropshippingEnvCredentials(env);
  const cjLive = isCjLiveCommerceActivated(env);
  const b6 = assessB6CredentialImplementation(env);
  const cjItem = b6.items.find((i) => i.id === "B6-02");
  const progress = cjItem?.verified ? 100 : cjItem?.configured ? 65 : 15;
  const integrations = loadIntegrationsView(workspaceId);
  const cjConnector = integrations.integrations.find((i) =>
    String(i.name).includes("cj"),
  );

  return {
    engineId: "supplier",
    displayName: "Supplier Engine",
    computedAt: new Date().toISOString(),
    dataMode: liveCommerceMode(),
    implemented: true,
    currentState: cjLive
      ? "CJ Dropshipping live fulfilment activated"
      : cjConfigured
        ? "CJ API key configured — production mode pending"
        : "CJ credentials not injected (B6-02)",
    health: cjLive ? "HEALTHY" : cjConfigured ? "WARNING" : "FAILED",
    progress: {
      percent: progress,
      label: cjItem?.detail ?? "Configure CJ_API_KEY on Railway",
    },
    nextAction: cjLive
      ? "Monitor supplier catalog sync and fulfilment health"
      : (cjItem?.detail ?? "B6-02 — Inject CJ_API_KEY on Railway"),
    executiveAudit: {
      summary: `B6-02 ${cjItem?.status ?? "PENDING"} · ${suppliersView.suppliers.length} supplier row(s) in domain store`,
      artifactRef: "artifacts/b6-02-cj-dropshipping-executive-audit.md",
    },
    dependencies: [
      "CREDENTIAL_VAULT_KEY (B6-04)",
      "LIVE_COMMERCE_INTEGRATION_MODE=production",
      cjConnector ? `Connector: ${cjConnector.name} (${cjConnector.status})` : "CJ connector not connected",
    ],
    metrics: suppliersView.metrics.map((m) => ({ label: m.label, value: m.value })),
    detailRows: suppliersView.suppliers.slice(0, 5).map((s) => ({
      label: s.name,
      value: `${s.reliability}% reliable · ${s.avgShip}`,
      status: s.status,
    })),
  };
}

export function loadMarketplaceEnginePanel(
  workspaceId: string,
  env: NodeJS.ProcessEnv = process.env,
): EnginePanelView {
  const b6 = assessB6CredentialImplementation(env);
  const amazonUs = b6.items.find((i) => i.id === "B6-01a");
  const amazonSg = b6.items.find((i) => i.id === "B6-01b");
  const amazonLive = isAmazonLiveCommerceActivated(env);
  const usOk = hasAmazonMarketplaceEnvCredentials("amazon-us", env);
  const sgOk = hasAmazonMarketplaceEnvCredentials("amazon-sg", env);
  const progress = amazonLive ? 100 : usOk && sgOk ? 70 : usOk || sgOk ? 45 : 10;
  const integrations = loadIntegrationsView(workspaceId);

  const channelRows = AMAZON_MARKETPLACE_REGISTRY_IDS.map((id) => ({
    label: id,
    value: hasAmazonMarketplaceEnvCredentials(id, env) ? "Credentials configured" : "Refresh token pending",
    status: hasAmazonMarketplaceEnvCredentials(id, env) ? "configured" : "pending",
  }));

  return {
    engineId: "marketplace",
    displayName: "Marketplace Engine",
    computedAt: new Date().toISOString(),
    dataMode: liveCommerceMode(),
    implemented: true,
    currentState: amazonLive
      ? "Amazon US + SG live commerce paths enabled"
      : usOk || sgOk
        ? "Partial Amazon region credentials — both NA + FE required"
        : "Amazon SP-API credentials pending (B6-01a/b)",
    health: amazonLive ? "HEALTHY" : usOk && sgOk ? "WARNING" : "FAILED",
    progress: {
      percent: progress,
      label: `US: ${amazonUs?.status ?? "PENDING"} · SG: ${amazonSg?.status ?? "PENDING"}`,
    },
    nextAction: amazonLive
      ? "Validate marketplace connections per channel (amazon-us, amazon-sg)"
      : (b6.nextHighestImpactAction.includes("B6-01")
          ? b6.nextHighestImpactAction
          : "B6-01a/b — Inject shared LWA + NA/FE refresh tokens"),
    executiveAudit: {
      summary: `ADR-052 V1 channels · shopee-sg architecture pending B6-01c`,
      artifactRef: "artifacts/b6-01d-amazon-multi-region-foundation-executive-audit.md",
    },
    dependencies: [
      "AMAZON_SP_API_CLIENT_ID + CLIENT_SECRET (shared)",
      "AMAZON_SP_API_REFRESH_TOKEN_NA + _FE",
      `Live commerce mode: ${resolveLiveCommerceIntegrationMode()}`,
      ...integrations.integrations
        .filter((i) => String(i.name).includes("amazon") || String(i.type) === "marketplace")
        .slice(0, 3)
        .map((i) => `${i.name}: ${i.status}`),
    ],
    detailRows: [
      ...channelRows,
      { label: "shopee-sg", value: "Not yet implemented in B6-01D scope", status: "pending" },
      { label: "shopify", value: "Architecture provision only", status: "pending" },
    ],
  };
}

export function loadStorefrontEnginePanel(workspaceId: string): EnginePanelView {
  const store = loadStoreView(workspaceId);
  const launch = loadLaunchView(workspaceId);
  const storeStep = launch.workflowSteps.find((s) => s.id === "store");
  const progress = storeStep?.progress ?? (store.buildingCompany?.progress ?? 0);

  return {
    engineId: "storefront",
    displayName: "Storefront Engine",
    computedAt: new Date().toISOString(),
    dataMode: "live",
    implemented: true,
    currentState: store.buildingCompany
      ? `Building ${store.buildingCompany.name} (${store.buildingCompany.progress}% complete)`
      : launch.launchStatus,
    health: resolveHealthFromPercent(progress, launch.blockingCount),
    progress: {
      percent: progress,
      label: storeStep?.description ?? launch.focusDetail,
    },
    nextAction:
      launch.blockingCount > 0
        ? launch.blockers[0]?.title ?? "Resolve launch blockers on Commerce → Launch"
        : store.buildingCompany
          ? "Continue store manufacturing pipeline"
          : "Begin storefront blueprint on Commerce → Store",
    executiveAudit: {
      summary: `Launch decision: ${launch.launchDecision} · ${launch.blockingCount} blocker(s)`,
      artifactRef: null,
    },
    dependencies: launch.deploymentChecklist.slice(0, 4).map((c) => `${c.label}: ${c.status}`),
    metrics: store.buildStages.map((s) => ({
      label: s.stage,
      value: `${s.progress}% · ${s.status}`,
    })),
  };
}

export function loadAdvertisingEnginePanel(workspaceId: string): EnginePanelView {
  const ads = loadAdsView(workspaceId);
  const marketing = loadMarketingView(workspaceId);
  const implemented = true;
  const activeCampaigns = marketing.campaigns.filter((c) => c.status === "active").length;
  const progress = activeCampaigns > 0 ? 55 : marketing.campaigns.length > 0 ? 35 : 10;

  return {
    engineId: "advertising",
    displayName: "Advertising Engine",
    computedAt: new Date().toISOString(),
    dataMode: "live",
    implemented,
    currentState:
      activeCampaigns > 0
        ? `${activeCampaigns} active campaign(s) · Meta ads connector architecture ready`
        : "Campaign data in domain store — live Meta connector optional pre-PROOF-001",
    health: activeCampaigns > 0 ? "HEALTHY" : "WARNING",
    progress: {
      percent: progress,
      label: `${marketing.metrics[0]?.value ?? "0"} active campaigns`,
    },
    nextAction:
      activeCampaigns > 0
        ? "Review ROAS and ad spend pacing on Commerce → Ads"
        : "Optional pre-PROOF: configure Meta Ads connector (B6 not required for PROOF-001 path)",
    executiveAudit: {
      summary: "GO-002 Phase 7 — Advertising optional before first profit proof",
      artifactRef: null,
    },
    dependencies: [
      "Storefront deployed",
      "Product listing live",
      "Meta Ads connector (optional pre-PROOF)",
    ],
    metrics: [...ads.metrics, ...marketing.metrics.slice(0, 2)].map((m) => ({
      label: m.label,
      value: m.value,
    })),
    detailRows: ads.channels.map((c) => ({
      label: c.channel,
      value: `${c.spend} · ROAS ${c.roas}`,
      status: c.status,
    })),
  };
}

export function loadPaymentEnginePanel(
  workspaceId: string,
  env: NodeJS.ProcessEnv = process.env,
): EnginePanelView {
  const finance = loadFinanceView(workspaceId);
  const stripeConfigured = hasStripeProductionCredentials(env);
  const b6 = assessB6CredentialImplementation(env);
  const stripeItem = b6.items.find((i) => i.id === "B6-03");
  const vaultOk = hasCredentialVaultKey(env);
  const progress = stripeItem?.verified ? 100 : stripeItem?.configured ? 75 : 20;

  return {
    engineId: "payment",
    displayName: "Payment Engine",
    computedAt: new Date().toISOString(),
    dataMode: stripeItem?.verified ? "live" : "sandbox",
    implemented: true,
    currentState: stripeItem?.verified
      ? "Stripe live keys verified (sk_live)"
      : stripeConfigured
        ? "Stripe keys present — confirm sk_live for production"
        : "Stripe credentials pending (B6-03)",
    health: stripeItem?.verified ? "HEALTHY" : stripeConfigured ? "WARNING" : "FAILED",
    progress: {
      percent: progress,
      label: stripeItem?.detail ?? "Configure STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET",
    },
    nextAction: stripeItem?.verified
      ? "Monitor checkout webhooks on Finance → Billing"
      : (stripeItem?.detail ?? "B6-03 — Configure Stripe production keys"),
    executiveAudit: {
      summary: `B6-03 ${stripeItem?.status ?? "PENDING"} · Vault ${vaultOk ? "configured" : "missing"}`,
      artifactRef: "artifacts/b6-03-stripe-production-executive-audit.md",
    },
    dependencies: [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      vaultOk ? "CREDENTIAL_VAULT_KEY present" : "CREDENTIAL_VAULT_KEY required (B6-04)",
    ],
    metrics: finance.metrics.map((m) => ({ label: m.label, value: m.value })),
  };
}

export function loadLogisticsEnginePanel(
  workspaceId: string,
  env: NodeJS.ProcessEnv = process.env,
): EnginePanelView {
  const orders = loadOrdersView(workspaceId);
  const cjLive = isCjLiveCommerceActivated(env);
  const processing = orders.metrics.find((m) => m.label === "Processing");
  const shipped = orders.metrics.find((m) => m.label === "Shipped");
  const progress = cjLive ? 70 : hasCjDropshippingEnvCredentials(env) ? 40 : 10;

  return {
    engineId: "logistics",
    displayName: "Logistics Engine",
    computedAt: new Date().toISOString(),
    dataMode: liveCommerceMode(),
    implemented: true,
    currentState: cjLive
      ? `CJ fulfilment path active · ${processing?.value ?? "0"} orders processing`
      : "CJ fulfilment gated until B6-02 + production mode",
    health: cjLive ? "HEALTHY" : hasCjDropshippingEnvCredentials(env) ? "WARNING" : "FAILED",
    progress: {
      percent: progress,
      label: `${shipped?.value ?? "0"} shipped · ${orders.orders.length} recent order(s)`,
    },
    nextAction: cjLive
      ? "Review fulfilment queue on Operations → Fulfillment"
      : "Complete B6-02 CJ credentials before live fulfilment",
    executiveAudit: {
      summary: "live-cj-fulfillment module gated by B6 + King approval",
      artifactRef: null,
    },
    dependencies: [
      "Supplier Engine (CJ) configured",
      "Order pipeline active",
      "LIVE_COMMERCE_INTEGRATION_MODE=production",
    ],
    metrics: orders.metrics.map((m) => ({ label: m.label, value: m.value })),
    detailRows: orders.orders.slice(0, 5).map((o) => ({
      label: o.id,
      value: `${o.product} · ${o.total}`,
      status: o.status,
    })),
  };
}

export function loadAnalyticsEnginePanel(workspaceId: string): EnginePanelView {
  const dashboard = loadDashboardView(workspaceId);
  const finance = loadFinanceView(workspaceId);
  const command = loadOperationalCommandView(workspaceId);
  const progress = command.proof001.progressPercent;

  return {
    engineId: "analytics",
    displayName: "Analytics Engine",
    computedAt: new Date().toISOString(),
    dataMode: "live",
    implemented: true,
    currentState: `PROOF-001 ${command.proof001.stagesPassed}/${command.proof001.totalStages} stages · Portfolio ${dashboard.companies.length} companies`,
    health: command.proof001.achieved
      ? "HEALTHY"
      : progress >= 50
        ? "WARNING"
        : "UNKNOWN",
    progress: {
      percent: progress,
      label: command.proof001.detail,
    },
    nextAction: command.proof001.achieved
      ? "PROOF-001 achieved — monitor profit on Finance → Profit"
      : (command.oms.nextHighestImpactAction ?? "Advance V1 commercial spine to first revenue"),
    executiveAudit: {
      summary: `SUCCESS-001 ${command.success001.progressPercent}% · Net profit $${command.success001.currentNetProfitUsd}`,
      artifactRef: "artifacts/b6-03-stripe-production-executive-audit.md",
    },
    dependencies: [
      "Payment Engine (Stripe)",
      "Order + fulfilment telemetry",
      "Analytics conversion engine (optional GA4/pixel)",
    ],
    metrics: [
      ...dashboard.portfolioMetrics.slice(0, 2),
      ...finance.metrics.slice(0, 2),
    ].map((m) => ({ label: m.label, value: m.value })),
  };
}

export function loadEnginePanelView(
  engineId: EngineCenterPanelId,
  workspaceId: string,
  env: NodeJS.ProcessEnv = process.env,
): EnginePanelView {
  switch (engineId) {
    case "supplier":
      return loadSupplierEnginePanel(workspaceId, env);
    case "marketplace":
      return loadMarketplaceEnginePanel(workspaceId, env);
    case "storefront":
      return loadStorefrontEnginePanel(workspaceId);
    case "advertising":
      return loadAdvertisingEnginePanel(workspaceId);
    case "payment":
      return loadPaymentEnginePanel(workspaceId, env);
    case "logistics":
      return loadLogisticsEnginePanel(workspaceId, env);
    case "analytics":
      return loadAnalyticsEnginePanel(workspaceId);
    case "quantitative-intelligence":
      return loadQuantitativeIntelligenceEnginePanel(workspaceId);
    case "pillow-supervisor":
      return loadPillowSupervisorEnginePanel(workspaceId, env);
    default: {
      const _exhaustive: never = engineId;
      return {
        engineId: String(_exhaustive),
        displayName: String(_exhaustive),
        computedAt: new Date().toISOString(),
        dataMode: "demo",
        implemented: false,
        currentState: "Awaiting implementation",
        health: "NOT_IMPLEMENTED",
        progress: { percent: 0, label: "Not wired" },
        nextAction: "Engine panel not registered",
        executiveAudit: { summary: "Not implemented", artifactRef: null },
        dependencies: [],
      };
    }
  }
}

export function loadAllEnginePanels(
  workspaceId: string,
  env: NodeJS.ProcessEnv = process.env,
): EnginePanelView[] {
  return COCKPIT_ENGINE_IDS.map((id) => loadEnginePanelView(id, workspaceId, env));
}

function engineById(panels: EnginePanelView[], id: CockpitEngineId): EnginePanelView | undefined {
  return panels.find((p) => p.engineId === id);
}

function buildAttentionItems(
  command: ReturnType<typeof loadOperationalCommandView>,
  pillowPending: number,
  engineSummaries: EnginePanelView[],
): ExecutiveAttentionItem[] {
  const items: ExecutiveAttentionItem[] = [];

  for (const blocker of Object.values(command.certificationBlockers)) {
    if (blocker.status === "closed") continue;
    items.push({
      id: blocker.id,
      label: `${blocker.id}: ${blocker.detail}`,
      severity: blocker.status === "open" ? "critical" : "warning",
      href: blocker.id.startsWith("B6")
        ? "/cockpit/infrastructure/integrations"
        : blocker.id === "B5"
          ? "/cockpit/infrastructure/health"
          : "/cockpit/governance/v1",
    });
  }

  if (command.pendingApprovals.count > 0) {
    const top = command.pendingApprovals.top;
    items.push({
      id: "pending-approval",
      label: top
        ? `${command.pendingApprovals.count} approval(s) waiting — ${top.title}`
        : `${command.pendingApprovals.count} approval(s) waiting for King's decision`,
      severity: "warning",
      href: "/cockpit/development/approvals",
    });
  }

  if (pillowPending > 0) {
    items.push({
      id: "pillow-pending",
      label: `${pillowPending} Pillow approval(s) in queue`,
      severity: "warning",
      href: "/cockpit/development/pillow",
    });
  }

  for (const engine of engineSummaries) {
    if (engine.health === "FAILED") {
      items.push({
        id: `engine-${engine.engineId}`,
        label: `${engine.displayName} — ${engine.currentState}`,
        severity: "critical",
        href: engineHref(engine.engineId),
      });
    }
  }

  if (command.oms.overallHealth === "RED") {
    items.push({
      id: "oms-red",
      label: `OMS health RED — ${command.oms.currentBlocker ?? command.oms.activeObjective}`,
      severity: "critical",
      href: "/cockpit/missions",
    });
  }

  return items.slice(0, 8);
}

function engineHref(engineId: string): string {
  switch (engineId) {
    case "supplier":
      return "/cockpit/intelligence/suppliers";
    case "marketplace":
      return "/cockpit/intelligence/marketplace";
    case "storefront":
      return "/cockpit/commerce/store";
    case "advertising":
      return "/cockpit/commerce/marketing";
    case "payment":
      return "/cockpit/finance/billing";
    case "logistics":
      return "/cockpit/operations/fulfillment";
    case "analytics":
      return "/cockpit/finance/profit";
    case "quantitative-intelligence":
      return "/cockpit/intelligence/discovery";
    case "pillow-supervisor":
      return "/cockpit/development/pillow";
    default:
      return "/cockpit";
  }
}

type ExecutiveSummaryCardInputs = {
  esis: ReturnType<typeof buildEsisDashboard>;
  orders: ReturnType<typeof loadOrdersView>;
  finance: ReturnType<typeof loadFinanceView>;
  aiCeo: ReturnType<typeof loadAiCeoView>;
  oms: ReturnType<typeof getObjectiveReportingSummary>;
  objectiveDashboard: ReturnType<typeof buildObjectiveDashboard>;
  pillow: ReturnType<typeof loadPillowSupervisorView>;
  timeline: ReturnType<typeof buildGlobalExecutionTimeline>;
};

function loadExecutiveSummaryCardInputsSync(
  workspaceId: string,
  companyId: string,
  env: NodeJS.ProcessEnv,
): ExecutiveSummaryCardInputs {
  return {
    esis: buildEsisDashboard(workspaceId, companyId),
    orders: loadOrdersView(workspaceId),
    finance: loadFinanceView(workspaceId),
    aiCeo: loadAiCeoView(workspaceId),
    oms: getObjectiveReportingSummary(workspaceId, companyId),
    objectiveDashboard: buildObjectiveDashboard(workspaceId, companyId),
    pillow: loadPillowSupervisorView(workspaceId, env),
    timeline: buildGlobalExecutionTimeline(workspaceId, companyId),
  };
}

/** Production Brain dispatch — skips repo-scanning ESIS and global timeline (built separately). */
export async function buildExecutiveSummaryCardsForDispatchAsync(
  workspaceId: string,
  companyId: string,
  command: ReturnType<typeof loadOperationalCommandView>,
  portfolio: ReturnType<typeof loadDashboardView>,
  engineSummaries: EnginePanelView[],
  env: NodeJS.ProcessEnv,
  pillow: ReturnType<typeof loadPillowSupervisorView>,
): Promise<ExecutiveSummaryCard[]> {
  await cooperativeYield();
  const orders = loadOrdersView(workspaceId);
  await cooperativeYield();
  const finance = loadFinanceView(workspaceId);
  await cooperativeYield();
  const aiCeo = loadAiCeoView(workspaceId);
  await cooperativeYield();
  await waitForEventLoopCapacity();

  const healthyEngines = engineSummaries.filter((e) => e.health === "HEALTHY").length;
  const totalEngines = engineSummaries.length;
  const opsScore = command.operationalReadiness.percent;
  const opsState = command.operationalReadiness.passed ? "HEALTHY" : "WARNING";

  const esisStub: ExecutiveSummaryCardInputs["esis"] = {
    workspaceId,
    companyId,
    reviewTimestamp: null,
    systemHealth: {
      state: opsState as "HEALTHY" | "WARNING",
      score: opsScore,
      summary: command.operationalReadiness.detail,
    },
    architectureHealth: {
      state: "UNKNOWN",
      score: opsScore,
      summary: `${healthyEngines}/${totalEngines} engines healthy`,
    },
    commerceHealth: {
      state: (command.commerceReadiness.blockingCount > 0 ? "WARNING" : "HEALTHY") as "HEALTHY" | "WARNING",
      score: command.commerceReadiness.score ?? opsScore,
      summary: command.commerceReadiness.launchDecision,
    },
    frontendHealth: { state: "UNKNOWN", score: 50, summary: "Dispatch lite path — full ESIS on refresh" },
    backendHealth: {
      state: opsState as "HEALTHY" | "WARNING",
      score: opsScore,
      summary: command.operationalReadiness.detail,
    },
    validationHealth: { state: "UNKNOWN", score: 50, summary: "Skipped on dispatch lite path" },
    productionReadiness: {
      state: command.operationalReadiness.passed ? "HEALTHY" : "WARNING",
      score: opsScore,
      summary: command.operationalReadiness.detail,
    },
    summary: command.operationalReadiness.detail,
  };

  const objectiveDashboardStub = {
    activeObjectives: command.oms.activeObjective
      ? [
          {
            title: command.oms.activeObjective,
            currentProgressPercent: command.oms.progress,
            status: command.oms.overallHealth,
          },
        ]
      : [],
  } as unknown as ReturnType<typeof buildObjectiveDashboard>;

  const timelineStub = {
    events: [],
    upcomingCount: 0,
    eventCount: 0,
  } as unknown as ReturnType<typeof buildGlobalExecutionTimeline>;

  return buildExecutiveSummaryCardsWithInputs(
    command,
    portfolio,
    engineSummaries,
    env,
    {
      esis: esisStub,
      orders,
      finance,
      aiCeo,
      oms: command.oms,
      objectiveDashboard: objectiveDashboardStub,
      pillow,
      timeline: timelineStub,
    },
  );
}

/** Yields between each heavy data source so auth and /health/live stay responsive. */
export async function buildExecutiveSummaryCardsAsync(
  workspaceId: string,
  companyId: string,
  command: ReturnType<typeof loadOperationalCommandView>,
  portfolio: ReturnType<typeof loadDashboardView>,
  engineSummaries: EnginePanelView[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<ExecutiveSummaryCard[]> {
  await cooperativeYield();
  const esis = buildEsisDashboard(workspaceId, companyId);
  await cooperativeYield();
  const orders = loadOrdersView(workspaceId);
  await cooperativeYield();
  const finance = loadFinanceView(workspaceId);
  await cooperativeYield();
  const aiCeo = loadAiCeoView(workspaceId);
  await cooperativeYield();
  const oms = getObjectiveReportingSummary(workspaceId, companyId);
  await cooperativeYield();
  const objectiveDashboard = buildObjectiveDashboard(workspaceId, companyId);
  await cooperativeYield();
  const pillow = loadPillowSupervisorView(workspaceId, env);
  await cooperativeYield();
  await waitForEventLoopCapacity();
  const timeline = buildGlobalExecutionTimeline(workspaceId, companyId);
  await cooperativeYield();
  return buildExecutiveSummaryCardsWithInputs(
    command,
    portfolio,
    engineSummaries,
    env,
    { esis, orders, finance, aiCeo, oms, objectiveDashboard, pillow, timeline },
  );
}

export function buildExecutiveSummaryCards(
  workspaceId: string,
  companyId: string,
  command: ReturnType<typeof loadOperationalCommandView>,
  portfolio: ReturnType<typeof loadDashboardView>,
  engineSummaries: EnginePanelView[],
  env: NodeJS.ProcessEnv = process.env,
): ExecutiveSummaryCard[] {
  return buildExecutiveSummaryCardsWithInputs(
    command,
    portfolio,
    engineSummaries,
    env,
    loadExecutiveSummaryCardInputsSync(workspaceId, companyId, env),
  );
}

function buildExecutiveSummaryCardsWithInputs(
  command: ReturnType<typeof loadOperationalCommandView>,
  portfolio: ReturnType<typeof loadDashboardView>,
  engineSummaries: EnginePanelView[],
  env: NodeJS.ProcessEnv,
  inputs: ExecutiveSummaryCardInputs,
): ExecutiveSummaryCard[] {
  const { esis, orders, finance, aiCeo, oms, objectiveDashboard, pillow, timeline } = inputs;

  const profitTodayMetric = orders.metrics.find((m) => m.label === "Profit Today");
  const profitToday = profitTodayMetric?.value ?? finance.orderProfitToday;

  const marketplace = engineById(engineSummaries, "marketplace");
  const supplier = engineById(engineSummaries, "supplier");

  const openBlockers = Object.values(command.certificationBlockers).filter(
    (b) => b.status !== "closed",
  );

  const healthyEngines = engineSummaries.filter((e) => e.health === "HEALTHY").length;
  const totalEngines = engineSummaries.length;

  const timelineItems = [
    ...portfolio.recentActivity.slice(0, 3).map((a) => ({
      label: a.agent,
      value: a.action,
      timestamp: a.timestamp,
    })),
    ...timeline.events.slice(0, 4).map((e) => ({
      label: e.title,
      value: e.summary,
      timestamp: e.scheduledAt,
    })),
  ].slice(0, 5);

  const cards: ExecutiveSummaryCard[] = [
    {
      id: "empire-health",
      widgetId: "G4-06-W01",
      title: "Empire Health",
      available: true,
      liveDataAvailable: Boolean(esis.systemHealth),
      dataMode: "live",
      dataSource: "ESIS dashboard · operational command · engine summaries",
      refreshSeconds: EXECUTIVE_WIDGET_REFRESH_SECONDS,
      futureEnhancement: "Real-time ESIS domain streaming · GC-03 alert push",
      primaryValue: `${esis.systemHealth?.score ?? 0}%`,
      status: `${esis.systemHealth?.state ?? "UNKNOWN"} · Ops readiness ${command.operationalReadiness.percent}%`,
      dependency: esis.systemHealth?.summary ?? esis.summary ?? "ESIS inspection",
      nextAction: command.operationalReadiness.passed
        ? "Monitor ESIS domains on Governance → Decisions"
        : command.operationalReadiness.detail,
      href: "/cockpit/governance/decisions",
      health: esis.systemHealth.state.toUpperCase(),
      items: [
        { label: "Commerce", value: `${esis.commerceHealth?.score ?? 0}% · ${esis.commerceHealth?.state ?? "UNKNOWN"}` },
        {
          label: "Production readiness",
          value: `${esis.productionReadiness?.score ?? 0}% · ${esis.productionReadiness?.state ?? "UNKNOWN"}`,
        },
        { label: "Engines healthy", value: `${healthyEngines}/${totalEngines}` },
      ],
    },
    {
      id: "revenue-today",
      widgetId: "G4-06-W04",
      title: "Revenue Summary",
      available: true,
      liveDataAvailable: Boolean(profitTodayMetric ?? finance.orderProfitToday),
      dataMode: isLiveCommerceProductionMode(env) ? "live" : "sandbox",
      dataSource: "Order repository · finance ledger · profitTodayCents",
      refreshSeconds: EXECUTIVE_WIDGET_REFRESH_SECONDS,
      futureEnhancement: "Stripe webhook real-time revenue ticker",
      primaryValue: profitToday,
      status: `${orders.metrics.find((m) => m.label === "Today")?.value ?? "0"} order(s) today`,
      dependency: "Order repository · profitTodayCents",
      nextAction: command.proof001.achieved
        ? "Review Finance → Profit for MTD trajectory"
        : command.proof001.detail,
      href: "/cockpit/finance/profit",
      health: command.proof001.achieved ? "HEALTHY" : "WARNING",
      items: [
        { label: "PROOF-001", value: `${command.proof001.stagesPassed}/${command.proof001.totalStages} stages` },
        { label: "Net profit (runtime)", value: `$${command.success001.currentNetProfitUsd}` },
      ],
    },
    {
      id: "marketplace-status",
      widgetId: "G4-06-W02",
      title: "Marketplace Health",
      available: Boolean(marketplace),
      liveDataAvailable: Boolean(marketplace?.implemented && marketplace.detailRows?.length),
      dataMode: marketplace?.dataMode === "live" ? "live" : marketplace ? "sandbox" : "unavailable",
      dataSource: "Marketplace engine panel · Amazon SP-API readiness",
      refreshSeconds: EXECUTIVE_WIDGET_REFRESH_SECONDS,
      futureEnhancement: "Live SP-API connection health polling",
      primaryValue: marketplace ? `${marketplace.progress.percent}%` : null,
      status: marketplace?.currentState ?? "Engine panel unavailable",
      dependency: marketplace?.dependencies[0] ?? "Amazon SP-API credentials (B6-01a/b)",
      nextAction: marketplace?.nextAction ?? "Load marketplace engine panel via Brain",
      href: "/cockpit/intelligence/marketplace",
      health: marketplace?.health ?? null,
      items: (marketplace?.detailRows ?? []).slice(0, 3).map((r) => ({
        label: r.label,
        value: r.value,
      })),
    },
    {
      id: "supplier-status",
      widgetId: "G4-06-W03",
      title: "Supplier Health",
      available: Boolean(supplier),
      liveDataAvailable: Boolean(supplier?.implemented && supplier.detailRows?.length),
      dataMode: supplier?.dataMode === "live" ? "live" : supplier ? "sandbox" : "unavailable",
      dataSource: "Supplier engine panel · CJ Dropshipping readiness",
      refreshSeconds: EXECUTIVE_WIDGET_REFRESH_SECONDS,
      futureEnhancement: "Live CJ API health + fulfilment rate sync",
      primaryValue: supplier ? `${supplier.progress.percent}%` : null,
      status: supplier?.currentState ?? "Engine panel unavailable",
      dependency: supplier?.dependencies[0] ?? "CJ Dropshipping credentials (B6-02)",
      nextAction: supplier?.nextAction ?? "Load supplier engine panel via Brain",
      href: "/cockpit/intelligence/suppliers",
      health: supplier?.health ?? null,
      items: (supplier?.detailRows ?? []).slice(0, 3).map((r) => ({
        label: r.label,
        value: r.value,
      })),
    },
    {
      id: "active-missions",
      widgetId: "G4-06-W05",
      title: "Active Missions",
      available: true,
      liveDataAvailable: objectiveDashboard.activeObjectives.length > 0,
      dataMode: "live",
      dataSource: "Objective Management System · objective dashboard",
      refreshSeconds: EXECUTIVE_WIDGET_REFRESH_SECONDS,
      futureEnhancement: "Mission Centre SSE progress updates",
      primaryValue: String(objectiveDashboard.activeObjectives.length),
      status: oms.activeObjective,
      dependency: "Objective Management System (OMS)",
      nextAction: oms.nextHighestImpactAction ?? "Open Mission Centre for full queue",
      href: "/cockpit/missions",
      health: oms.overallHealth,
      items: objectiveDashboard.activeObjectives.slice(0, 4).map((obj) => ({
        label: obj.title,
        value: `${obj.currentProgressPercent}% · ${obj.status}`,
      })),
    },
    {
      id: "executive-alerts",
      widgetId: "G4-06-W07",
      title: "Executive Alerts",
      available: true,
      liveDataAvailable: true,
      dataMode: "live",
      dataSource: "Certification register B5–B8 · pending approvals · engine health",
      refreshSeconds: EXECUTIVE_WIDGET_REFRESH_SECONDS,
      futureEnhancement: "GC-03 Notification Centre push routing",
      primaryValue: String(openBlockers.length + (command.pendingApprovals.count > 0 ? 1 : 0)),
      status:
        openBlockers.length === 0 && command.pendingApprovals.count === 0
          ? "No open certification or approval alerts"
          : `${openBlockers.length} certification · ${command.pendingApprovals.count} approval`,
      dependency: "B5–B8 certification register · Pillow approval repository",
      nextAction: openBlockers[0]?.detail ?? "Review alerts on Command Centre",
      href: "/cockpit/command",
      health: openBlockers.some((b) => b.status === "open") ? "FAILED" : "HEALTHY",
      items: openBlockers.slice(0, 4).map((b) => ({
        label: b.id,
        value: b.detail,
      })),
    },
    {
      id: "pillow-status",
      widgetId: "G4-06-W06",
      title: "Pillow Status",
      available: true,
      liveDataAvailable: true,
      dataMode: pillow.productionModeEnabled ? "live" : "sandbox",
      dataSource: "Pillow supervisor view · approval repository",
      refreshSeconds: EXECUTIVE_WIDGET_REFRESH_SECONDS,
      futureEnhancement: "Pillow session runtime SSE · council debate feed",
      primaryValue: String(pillow.pendingApprovals),
      status: pillow.productionModeEnabled
        ? "Production mode enabled"
        : "Dry-run readiness — EMPIRE_V1_OPERATIONAL_READY not set",
      dependency: "Pillow approval runtime (ADR-049)",
      nextAction:
        pillow.pendingApprovals > 0
          ? "Review pending Pillow approvals on Development → Pillow"
          : pillow.capabilityNote.split(".")[0] ?? "Monitor Pillow supervisor",
      href: "/cockpit/development/pillow",
      health: pillow.pendingApprovals > 0 ? "WARNING" : "HEALTHY",
      items: pillow.recentApprovals.slice(0, 3).map((r) => ({
        label: r.title,
        value: `${r.status} · ${r.type}`,
      })),
    },
    {
      id: "pending-kings-approval",
      widgetId: "G4-06-W08",
      title: "Pending King's Approval",
      available: true,
      liveDataAvailable: true,
      dataMode: "live",
      dataSource: "Decision repository · Pillow approval queue",
      refreshSeconds: EXECUTIVE_WIDGET_REFRESH_SECONDS,
      futureEnhancement: "One-click sovereign approve from Executive Home",
      primaryValue: String(command.pendingApprovals.count + pillow.pendingApprovals),
      status:
        command.pendingApprovals.count + pillow.pendingApprovals === 0
          ? "No items awaiting sovereign approval"
          : `${command.pendingApprovals.count} executive · ${pillow.pendingApprovals} Pillow`,
      dependency: "Decision repository · Pillow approval queue",
      nextAction:
        command.pendingApprovals.top?.title ??
        (pillow.pendingApprovals > 0
          ? "Review Pillow approval queue"
          : "Portfolio fully authorized"),
      href: "/cockpit/development/approvals",
      health: command.pendingApprovals.count + pillow.pendingApprovals > 0 ? "WARNING" : "HEALTHY",
      items: [
        ...(command.pendingApprovals.top
          ? [{ label: "Top executive", value: command.pendingApprovals.top.title }]
          : []),
        ...pillow.recentApprovals
          .filter((r) => r.status === "Pending")
          .slice(0, 3)
          .map((r) => ({ label: r.type, value: r.title })),
      ],
    },
    {
      id: "ai-recommendations",
      widgetId: "G4-06-W10",
      title: "AI Recommendation Summary",
      available: true,
      liveDataAvailable: aiCeo.briefing.priorities.length > 0,
      dataMode: "sandbox",
      dataSource: "AI CEO repository · portfolio briefing (no generative AI in G4-06)",
      refreshSeconds: EXECUTIVE_WIDGET_REFRESH_SECONDS,
      futureEnhancement: "Generative AI CEO briefing via Pillow NL reasoning",
      primaryValue: String(aiCeo.briefing.priorities.length),
      status: aiCeo.briefing.headline,
      dependency: "AI CEO repository · portfolio briefing (no generative AI in G4-06)",
      nextAction:
        oms.nextHighestImpactAction ??
        aiCeo.briefing.priorities[0]?.title ??
        "Request briefing on Command Centre",
      href: "/cockpit/command",
      health: "HEALTHY",
      items: aiCeo.briefing.priorities.slice(0, 3).map((p) => ({
        label: p.title,
        value: `${p.impact} impact · ${p.status}`,
      })),
    },
    {
      id: "executive-timeline",
      widgetId: "G4-06-W09",
      title: "Recent Executive Timeline",
      available: timelineItems.length > 0,
      liveDataAvailable: timelineItems.length > 0,
      dataMode: timelineItems.length > 0 ? "live" : "unavailable",
      dataSource: "Activity repository · global-execution-timeline · portfolio recentActivity",
      refreshSeconds: EXECUTIVE_WIDGET_REFRESH_SECONDS,
      futureEnhancement: "Cross-engine timeline SSE · force-directed graph sync",
      primaryValue: timelineItems.length > 0 ? String(timeline.eventCount) : null,
      status:
        timelineItems.length > 0
          ? `${timeline.upcomingCount} upcoming · ${portfolio.recentActivity.length} recent activity`
          : "No timeline or activity events in domain store",
      dependency: "Activity repository · global-execution-timeline",
      nextAction:
        timelineItems.length > 0
          ? "Open Mission Centre for full objective timeline"
          : "Seed pipeline products or agent activity to populate timeline",
      href: "/cockpit/missions",
      health: timeline.upcomingCount > 0 ? "WARNING" : "HEALTHY",
      items: timelineItems,
    },
  ];

  applyCardEngineCenterLinks(cards);
  return cards;
}

export function loadExecutiveHomeView(
  workspaceId: string,
  companyId?: string,
  env: NodeJS.ProcessEnv = process.env,
): ExecutiveHomeView {
  const command = loadOperationalCommandView(workspaceId, companyId, env);
  const portfolio = loadDashboardView(workspaceId);
  const engineSummaries = loadAllEnginePanels(workspaceId, env);

  const openBlockers = Object.values(command.certificationBlockers).filter(
    (b) => b.status !== "closed",
  );
  const top = openBlockers[0] ?? null;

  const pillow = loadPillowSupervisorView(workspaceId, env);
  const company = companyId ?? DEFAULT_COMPANY;
  const summaryCards = buildExecutiveSummaryCards(
    workspaceId,
    company,
    command,
    portfolio,
    engineSummaries,
    env,
  );
  const executiveAlerts = buildExecutiveAlerts(command, pillow.pendingApprovals, engineSummaries);
  const attentionItems: ExecutiveAttentionItem[] = executiveAlerts.map((a) => ({
    id: a.id,
    label: a.label,
    severity: a.severity,
    href: a.href,
    engineId: a.engineId,
  }));
  const executiveTimeline = buildExecutiveTimeline(workspaceId, company, portfolio, env);
  const approvalRoutes = buildExecutiveApprovalRoutes(workspaceId, command, env);
  const dependencyGraph = buildExecutiveDependencyGraph([
    ...engineSummaries,
    loadEnginePanelView("quantitative-intelligence", workspaceId, env),
    loadEnginePanelView("pillow-supervisor", workspaceId, env),
  ]);

  const alertsCard = summaryCards.find((c) => c.id === "executive-alerts");
  if (alertsCard && executiveAlerts.length > 0) {
    alertsCard.href = executiveAlerts[0]?.href ?? alertsCard.href;
    alertsCard.engineCenterId = executiveAlerts[0]?.engineId ?? null;
  }

  const nextExecutiveAction =
    command.oms.nextHighestImpactAction ??
    command.nextExecutiveApproval ??
    top?.detail ??
    (command.proof001.achieved
      ? "Monitor revenue and scale top-performing ventures"
      : command.proof001.detail);

  return enrichExecutiveHomeViewP704({
    computedAt: new Date().toISOString(),
    greeting: {
      displayNameHint: "Grand King",
      topBlocker: top ? `${top.id}: ${top.detail}` : null,
      topBlockerHref: top?.id.startsWith("B6")
        ? "/cockpit/infrastructure/integrations"
        : top?.id === "B5"
          ? "/cockpit/infrastructure/health"
          : "/cockpit/governance/v1",
    },
    command,
    portfolio,
    engineSummaries,
    summaryCards,
    attentionItems,
    nextExecutiveAction,
    executiveTimeline,
    executiveAlerts,
    approvalRoutes,
    dependencyGraph,
  });
}

export function loadMissionCentreView(
  workspaceId: string,
  companyId = DEFAULT_COMPANY,
  env: NodeJS.ProcessEnv = process.env,
): MissionCentreView {
  const command = loadOperationalCommandView(workspaceId, companyId, env);
  const oms = getObjectiveReportingSummary(workspaceId, companyId);
  const objectiveDashboard = buildObjectiveDashboard(workspaceId, companyId);

  ensurePillowApprovalTables();
  const pillowRepo = new SqlitePillowApprovalRepository();
  const pendingRows = pillowRepo.listApprovals(workspaceId, { status: "Pending" });

  const blockers = Object.values(command.certificationBlockers)
    .filter((b) => b.status !== "closed")
    .map((b) => ({
      id: b.id,
      label: b.label,
      detail: b.detail,
      status: b.status,
    }));

  const missions = objectiveDashboard.activeObjectives.slice(0, 12).map((obj) => ({
    id: obj.objectiveId,
    title: obj.title,
    status: obj.status,
    progress: obj.currentProgressPercent,
    priority: obj.executivePriority,
  }));

  return {
    computedAt: new Date().toISOString(),
    oms,
    blockers,
    pendingApprovals: pendingRows.slice(0, 10).map((row) => ({
      approvalId: row.approvalId,
      title: row.proposal.title,
      summary: row.proposal.summary,
      type: row.type,
      status: row.status,
    })),
    missions,
  };
}

export function loadExecutiveAuditView(
  workspaceId: string,
  companyId = DEFAULT_COMPANY,
  env: NodeJS.ProcessEnv = process.env,
): ExecutiveAuditView {
  const command = loadOperationalCommandView(workspaceId, companyId, env);
  return {
    computedAt: new Date().toISOString(),
    certificationBlockers: command.certificationBlockers,
    b6: assessB6CredentialImplementation(env),
    infrastructure: assessProductionInfrastructureReadiness(env),
    activation: assessVersion1OperationalActivation(env),
    esis: buildEsisDashboard(workspaceId, companyId),
  };
}

export function loadPillowSupervisorView(
  workspaceId: string,
  env: NodeJS.ProcessEnv = process.env,
): PillowSupervisorView {
  ensurePillowApprovalTables();
  const pillowRepo = new SqlitePillowApprovalRepository();
  const pending = pillowRepo.listApprovals(workspaceId, { status: "Pending" });
  const recent = pillowRepo.listApprovals(workspaceId, {}).slice(0, 8);

  return {
    computedAt: new Date().toISOString(),
    deliveryMode: "ADR-049 Delivery 1–3 — structured command interface (no autonomous AI logic in G4-02)",
    productionModeEnabled: env.EMPIRE_V1_OPERATIONAL_READY === "true",
    pendingApprovals: pending.length,
    recentApprovals: recent.map((r) => ({
      approvalId: r.approvalId,
      title: r.proposal.title,
      status: r.status,
      type: r.type,
    })),
    capabilityNote:
      "Natural-language chat is live via Pillow host session and GlobalAiAssistantPanel on Development → Pillow. Supervisor tab exposes runtime approval state.",
  };
}

export function loadIntelligenceEnginePanel(workspaceId: string): EnginePanelView {
  const intel = loadIntelligenceView(workspaceId);
  const engineView = loadProductIntelligenceEngineViewForWorkspace(workspaceId);
  const productCount = intel.products.length;
  const progress = productCount > 0 ? 60 : 10;

  return {
    engineId: "product-intelligence",
    displayName: "Product Intelligence Engine",
    computedAt: new Date().toISOString(),
    dataMode: "live",
    implemented: true,
    currentState: engineView.executiveSummary,
    health: productCount > 0 ? "HEALTHY" : "WARNING",
    progress: {
      percent: progress,
      label: intel.metrics[1]?.value ?? "Confidence pending",
    },
    nextAction: engineView.nextExecutiveAction,
    executiveAudit: {
      summary: "G3-01 Product Intelligence Engine — discovery, scoring, ranking, executive recommendations",
      artifactRef: "artifacts/g3-01-product-intelligence-engine-executive-audit.md",
    },
    dependencies: [
      "Supplier Engine (CJ availability)",
      "Marketplace Engine (registry-discovered channels)",
      "Quantitative Intelligence Engine",
      "Advertising Engine",
      "Analytics Engine",
    ],
    metrics: [
      ...intel.metrics.map((m) => ({ label: m.label, value: m.value })),
      { label: "G3-01 capabilities", value: String(engineView.architecture.capabilities.length) },
      { label: "V1 sources", value: String(engineView.architecture.sources.length) },
    ],
    detailRows: engineView.topRanked.slice(0, 5).map((p) => ({
      label: p.productName,
      value: `Intel ${p.intelligenceScore} · Profit ${p.profitScore} · Risk ${p.riskScore}`,
      status: p.recommendation,
    })),
  };
}

export function loadMarketIntelligenceEnginePanel(workspaceId: string): EnginePanelView {
  const engineView = loadMarketIntelligenceEngineViewForWorkspace(workspaceId);
  const marketCount = engineView.analysedMarkets.length;
  const progress = marketCount > 0 ? 55 : 10;

  return {
    engineId: "market-intelligence",
    displayName: "Market Intelligence Engine",
    computedAt: new Date().toISOString(),
    dataMode: "sandbox",
    implemented: true,
    currentState: engineView.executiveSummary,
    health: marketCount > 0 ? "HEALTHY" : "WARNING",
    progress: {
      percent: progress,
      label: `${engineView.countryMarkets.length} countries · ${engineView.channelMarkets.length} channels`,
    },
    nextAction: engineView.nextExecutiveAction,
    executiveAudit: {
      summary: "G3-02 Market Intelligence Engine — market demand, trends, country and marketplace opportunity analysis",
      artifactRef: "artifacts/g3-02-market-intelligence-engine-executive-audit.md",
    },
    dependencies: [
      "Product Intelligence Engine (category trend signals)",
      "Marketplace Engine (registry-discovered channels)",
      "Quantitative Intelligence Engine",
      "Advertising Engine",
      "Analytics Engine",
    ],
    metrics: [
      { label: "Markets analysed", value: String(marketCount) },
      { label: "G3-02 capabilities", value: String(engineView.architecture.capabilities.length) },
      { label: "Registry countries", value: String(engineView.architecture.marketDiscovery.countries.length) },
      { label: "Registry channels", value: String(engineView.architecture.marketDiscovery.intelligenceSources.length) },
    ],
    detailRows: engineView.topOpportunities.slice(0, 5).map((m) => ({
      label: m.marketName,
      value: `Opp ${m.opportunityScore} · Growth ${m.growthScore} · Risk ${m.riskScore}`,
      status: m.recommendation,
    })),
  };
}

export function loadSupplierIntelligenceEnginePanel(workspaceId: string): EnginePanelView {
  const engineView = loadSupplierIntelligenceEngineViewForWorkspace(workspaceId);
  const supplierCount = engineView.analysedSuppliers.length;
  const progress = supplierCount > 0 ? 58 : 10;

  return {
    engineId: "supplier-intelligence",
    displayName: "Supplier Intelligence Engine",
    computedAt: new Date().toISOString(),
    dataMode: "sandbox",
    implemented: true,
    currentState: engineView.executiveSummary,
    health: supplierCount > 0 ? "HEALTHY" : "WARNING",
    progress: {
      percent: progress,
      label: `${engineView.architecture.discoveredSupplierCount} registry-discovered suppliers`,
    },
    nextAction: engineView.nextExecutiveAction,
    executiveAudit: {
      summary: "G3-03 Supplier Intelligence Engine — scoring, reliability, risk, and executive recommendations",
      artifactRef: "artifacts/g3-03-supplier-intelligence-engine-executive-audit.md",
    },
    dependencies: [
      "Supplier Engine (CJ fulfilment)",
      "Marketplace Engine (listing constraints)",
      "Product Intelligence Engine",
      "Quantitative Intelligence Engine",
      "Logistics Engine",
    ],
    metrics: [
      { label: "Suppliers analysed", value: String(supplierCount) },
      { label: "G3-03 capabilities", value: String(engineView.architecture.capabilities.length) },
      { label: "Registry suppliers", value: String(engineView.architecture.supplierDiscovery.supplierProviders.length) },
      { label: "SELL recommendations", value: String(engineView.analysedSuppliers.filter((s) => s.recommendation === "SELL").length) },
    ],
    detailRows: engineView.topRanked.slice(0, 5).map((s) => ({
      label: s.supplierName,
      value: `Score ${s.supplierScore} · Reliability ${s.reliability} · Risk ${s.risk}`,
      status: s.recommendation,
    })),
  };
}

export function loadFinancialIntelligenceEnginePanel(workspaceId: string): EnginePanelView {
  const engineView = loadFinancialIntelligenceEngineViewForWorkspace(workspaceId);
  const scenarioCount = engineView.analysedScenarios.length;
  const progress = scenarioCount > 0 ? 52 : 10;

  return {
    engineId: "financial-intelligence",
    displayName: "Financial Intelligence Engine",
    computedAt: new Date().toISOString(),
    dataMode: "sandbox",
    implemented: true,
    currentState: engineView.executiveSummary,
    health: scenarioCount > 0 ? "HEALTHY" : "WARNING",
    progress: {
      percent: progress,
      label: `${engineView.architecture.financialDiscovery.revenueChannels.length} revenue channels modelled`,
    },
    nextAction: engineView.nextExecutiveAction,
    executiveAudit: {
      summary: "G3-04 Financial Intelligence Engine — revenue, margin, cash flow, ROI modelling and executive recommendations",
      artifactRef: "artifacts/g3-04-financial-intelligence-engine-executive-audit.md",
    },
    dependencies: [
      "Payment Engine (registry payment providers)",
      "Analytics Engine (order profit telemetry)",
      "Quantitative Intelligence Engine",
      "Advertising Engine (ad spend ROI)",
    ],
    metrics: [
      { label: "Scenarios analysed", value: String(scenarioCount) },
      { label: "G3-04 capabilities", value: String(engineView.architecture.capabilities.length) },
      { label: "Payment providers", value: String(engineView.architecture.financialDiscovery.paymentProviders.length) },
      { label: "INVEST recommendations", value: String(engineView.analysedScenarios.filter((s) => s.recommendation === "INVEST").length) },
    ],
    detailRows: engineView.topOpportunities.slice(0, 5).map((s) => ({
      label: s.scenarioName,
      value: `Score ${s.financialScore} · Margin ${s.marginProjection}% · ROI ${s.roi}%`,
      status: s.recommendation,
    })),
  };
}

export function loadAdvertisingIntelligenceEnginePanel(workspaceId: string): EnginePanelView {
  const engineView = loadAdvertisingIntelligenceEngineViewForWorkspace(workspaceId);
  const campaignCount = engineView.analysedCampaigns.length;
  const progress = campaignCount > 0 ? 58 : 12;

  return {
    engineId: "advertising-intelligence",
    displayName: "Advertising Intelligence Engine",
    computedAt: new Date().toISOString(),
    dataMode: "sandbox",
    implemented: true,
    currentState: engineView.executiveSummary,
    health: campaignCount > 0 ? "HEALTHY" : "WARNING",
    progress: {
      percent: progress,
      label: `${engineView.architecture.advertisingDiscovery.advertisingProviders.length} registry ad providers`,
    },
    nextAction: engineView.nextExecutiveAction,
    executiveAudit: {
      summary: "G3-06 Advertising Intelligence Engine — ROAS, CAC, budget allocation, scaling recommendations",
      artifactRef: "artifacts/g3-06-advertising-intelligence-engine-executive-audit.md",
    },
    dependencies: [
      "Advertising Engine (campaign domain store)",
      "Financial Intelligence Engine",
      "Quantitative Intelligence Engine",
      "Analytics Engine",
    ],
    metrics: [
      { label: "Campaigns analysed", value: String(campaignCount) },
      { label: "G3-06 capabilities", value: String(engineView.architecture.capabilities.length) },
      { label: "SCALE recommendations", value: String(engineView.analysedCampaigns.filter((c) => c.recommendation === "SCALE").length) },
      { label: "Audience countries", value: String(engineView.architecture.advertisingDiscovery.advertisingCountries.length) },
    ],
    detailRows: engineView.topPerformers.slice(0, 5).map((c) => ({
      label: c.campaignName,
      value: `Score ${c.advertisingScore} · ROAS ${c.roas}× · CAC ${c.cacScore}`,
      status: c.recommendation,
    })),
  };
}

export function loadCustomerIntelligenceEnginePanel(workspaceId: string): EnginePanelView {
  const engineView = loadCustomerIntelligenceEngineViewForWorkspace(workspaceId);
  const customerCount = engineView.analysedCustomers.length;
  const progress = customerCount > 0 ? 56 : 12;

  return {
    engineId: "customer-intelligence",
    displayName: "Customer Intelligence Engine",
    computedAt: new Date().toISOString(),
    dataMode: "sandbox",
    implemented: true,
    currentState: engineView.executiveSummary,
    health: customerCount > 0 ? "HEALTHY" : "WARNING",
    progress: {
      percent: progress,
      label: `${engineView.architecture.customerDiscovery.customerServiceProviders.length} registry CRM providers`,
    },
    nextAction: engineView.nextExecutiveAction,
    executiveAudit: {
      summary: "G3-07 Customer Intelligence Engine — segmentation, churn, LTV, satisfaction, executive recommendations",
      artifactRef: "artifacts/g3-07-customer-intelligence-engine-executive-audit.md",
    },
    dependencies: [
      "Marketplace Engine (registry buyer segments)",
      "Analytics Engine (order profit telemetry)",
      "Advertising Engine (acquisition cohort context)",
    ],
    metrics: [
      { label: "Customers analysed", value: String(customerCount) },
      { label: "G3-07 capabilities", value: String(engineView.architecture.capabilities.length) },
      { label: "RETAIN recommendations", value: String(engineView.analysedCustomers.filter((c) => c.recommendation === "RETAIN").length) },
      { label: "Marketplace segments", value: String(engineView.architecture.customerDiscovery.marketplaceSegments.length) },
    ],
    detailRows: engineView.topSegments.slice(0, 5).map((c) => ({
      label: c.customerName,
      value: `Score ${c.customerScore} · LTV ${c.ltvScore} · Churn risk ${c.churnRiskScore}`,
      status: c.recommendation,
    })),
  };
}

export function loadRiskIntelligenceEnginePanel(workspaceId: string): EnginePanelView {
  const engineView = loadRiskIntelligenceEngineViewForWorkspace(workspaceId);
  const riskCount = engineView.assessedRisks.length;
  const progress = riskCount > 0 ? 58 : 12;

  return {
    engineId: "risk-intelligence",
    displayName: "Risk Intelligence Engine",
    computedAt: new Date().toISOString(),
    dataMode: "sandbox",
    implemented: true,
    currentState: engineView.executiveSummary,
    health: riskCount > 0 ? "HEALTHY" : "WARNING",
    progress: {
      percent: progress,
      label: `${engineView.architecture.riskDiscovery.policyProviders.length} policy frameworks monitored`,
    },
    nextAction: engineView.nextExecutiveAction,
    executiveAudit: {
      summary: "G3-08 Risk Intelligence Engine — continuous marketplace, supplier, financial, operational, policy, growth risk assessment",
      artifactRef: "artifacts/g3-08-risk-intelligence-engine-executive-audit.md",
    },
    dependencies: [
      "Market Intelligence Engine",
      "Supplier Intelligence Engine",
      "Financial Intelligence Engine",
      "Guardian (policy validation)",
    ],
    metrics: [
      { label: "Risks assessed", value: String(riskCount) },
      { label: "G3-08 capabilities", value: String(engineView.architecture.capabilities.length) },
      {
        label: "HIGH/CRITICAL",
        value: String(
          engineView.assessedRisks.filter((r) => r.severity === "HIGH" || r.severity === "CRITICAL").length,
        ),
      },
      { label: "Marketplace channels", value: String(engineView.architecture.riskDiscovery.marketplaceProviders.length) },
    ],
    detailRows: engineView.topRisks.slice(0, 5).map((r) => ({
      label: r.riskName,
      value: `Score ${r.riskScore} · ${r.severity} · P${r.probability}%`,
      status: r.severity,
    })),
  };
}

export function loadDecisionIntelligenceEnginePanel(workspaceId: string): EnginePanelView {
  const engineView = loadDecisionIntelligenceEngineViewForWorkspace(workspaceId);
  const progress = engineView.feedsAvailable >= 6 ? 62 : engineView.feedsAvailable >= 4 ? 40 : 15;

  return {
    engineId: "decision-intelligence",
    displayName: "Decision Intelligence Engine",
    computedAt: new Date().toISOString(),
    dataMode: "sandbox",
    implemented: true,
    currentState: engineView.executiveSummary,
    health: engineView.feedsAvailable >= 6 ? "HEALTHY" : engineView.feedsAvailable >= 4 ? "WARNING" : "FAILED",
    progress: {
      percent: progress,
      label: `${engineView.feedsAvailable}/8 executive engines orchestrated`,
    },
    nextAction: engineView.nextExecutiveAction,
    executiveAudit: {
      summary: "G3-09 Decision Intelligence Engine — orchestrates G3-01–G3-08, never calculates raw data",
      artifactRef: "artifacts/g3-09-decision-intelligence-engine-executive-audit.md",
    },
    dependencies: [
      "Product Intelligence Engine (G3-01)",
      "Market Intelligence Engine (G3-02)",
      "Supplier Intelligence Engine (G3-03)",
      "Financial Intelligence Engine (G3-04)",
      "Quantitative Intelligence Engine (G3-05)",
      "Advertising Intelligence Engine (G3-06)",
      "Customer Intelligence Engine (G3-07)",
      "Risk Intelligence Engine (G3-08)",
    ],
    metrics: [
      { label: "Final recommendation", value: engineView.decision.finalRecommendation },
      { label: "Decision confidence", value: `${engineView.decision.decisionConfidence}%` },
      { label: "Engines available", value: `${engineView.feedsAvailable}/8` },
      { label: "Evidence items", value: String(engineView.decision.supportingEvidence.length) },
    ],
    detailRows: engineView.decision.engineFeeds
      .filter((f) => f.available)
      .slice(0, 5)
      .map((f) => ({
        label: f.engineLabel,
        value: `${f.topRecommendation ?? "math-only"} · confidence ${f.confidence}`,
        status: f.missionRef,
      })),
  };
}

export function loadExecutiveIntelligenceOrchestratorPanel(workspaceId: string): EnginePanelView {
  const engineView = loadExecutiveIntelligenceOrchestratorViewForWorkspace(workspaceId);
  const service = engineView.unifiedService;
  const progress = service.enginesAvailable >= 8 ? 68 : service.enginesAvailable >= 6 ? 48 : 20;

  return {
    engineId: "executive-intelligence-orchestrator",
    displayName: "Executive Intelligence Orchestrator",
    computedAt: new Date().toISOString(),
    dataMode: "sandbox",
    implemented: true,
    currentState: engineView.executiveSummary,
    health: service.enginesAvailable >= 8 ? "HEALTHY" : service.enginesAvailable >= 6 ? "WARNING" : "FAILED",
    progress: {
      percent: progress,
      label: `${service.enginesAvailable}/9 engines · 5 consumer channels`,
    },
    nextAction: engineView.nextExecutiveAction,
    executiveAudit: {
      summary: "G3-10 Executive Intelligence Orchestrator — coordinates G3 suite, owns no business logic",
      artifactRef: "artifacts/g3-10-executive-intelligence-orchestrator-executive-audit.md",
    },
    dependencies: [
      "G3-01 Product Intelligence through G3-09 Decision Intelligence",
      "Cockpit · Pillow · Global AI Assistant · Business Automation · Executive Reports",
    ],
    metrics: [
      { label: "Engines coordinated", value: `${service.enginesAvailable}/9` },
      { label: "Final recommendation", value: service.decisionSnapshot.finalRecommendation },
      { label: "Decision confidence", value: `${service.decisionSnapshot.decisionConfidence}%` },
      { label: "Consumer channels", value: String(service.consumerDeliveries.length) },
    ],
    detailRows: service.consumerDeliveries.map((d) => ({
      label: d.consumerLabel,
      value: d.payloadSummary.slice(0, 100),
      status: d.deliveryMode,
    })),
  };
}

/** G3-05 — Quantitative Intelligence Engine (Discovery). */
export function loadQuantitativeIntelligenceEnginePanel(workspaceId: string): EnginePanelView {
  const engineView = loadQuantitativeIntelligenceEngineViewForWorkspace(workspaceId);
  const modelCount = engineView.modelResults.length;
  const progress = modelCount >= 8 ? 60 : 15;

  return {
    engineId: "quantitative-intelligence",
    displayName: "Quantitative Intelligence Engine",
    computedAt: new Date().toISOString(),
    dataMode: "sandbox",
    implemented: true,
    currentState: engineView.summary,
    health: modelCount >= 8 ? "HEALTHY" : "WARNING",
    progress: {
      percent: progress,
      label: `${modelCount} mathematical models · no executive decisions`,
    },
    nextAction: engineView.nextReviewAction,
    executiveAudit: {
      summary: "G3-05 Quantitative Intelligence Engine — statistics, forecasting, probability, simulation",
      artifactRef: "artifacts/g3-05-quantitative-intelligence-engine-executive-audit.md",
    },
    dependencies: [
      "Product Intelligence Engine (score inputs)",
      "Market Intelligence Engine (opportunity inputs)",
      "Supplier Intelligence Engine (trust inputs)",
      "Financial Intelligence Engine (scenario inputs)",
    ],
    metrics: [
      { label: "Models computed", value: String(modelCount) },
      { label: "G3-05 capabilities", value: String(engineView.architecture.capabilities.length) },
      { label: "Decision policy", value: "Math only" },
      {
        label: "Meta confidence",
        value: String(
          engineView.modelResults.find((r) => r.modelKind === "confidence_modelling")?.outputs
            .metaConfidence ?? "—",
        ),
      },
    ],
    detailRows: engineView.modelResults.slice(0, 6).map((r) => ({
      label: r.model,
      value: `Confidence ${r.confidence} · ${Object.keys(r.outputs).length} outputs`,
      status: r.modelKind,
    })),
  };
}

/** G4-04 — Pillow Supervisor as engine center. */
export function loadPillowSupervisorEnginePanel(
  workspaceId: string,
  env: NodeJS.ProcessEnv = process.env,
): EnginePanelView {
  const pillow = loadPillowSupervisorView(workspaceId, env);

  return {
    engineId: "pillow-supervisor",
    displayName: "Pillow Supervisor",
    computedAt: pillow.computedAt,
    dataMode: "live",
    implemented: true,
    currentState: `${pillow.pendingApprovals} pending approval(s) · ${pillow.deliveryMode.split("—")[0]?.trim()}`,
    health: pillow.pendingApprovals > 0 ? "WARNING" : "HEALTHY",
    progress: {
      percent: pillow.productionModeEnabled ? 85 : 50,
      label: pillow.productionModeEnabled
        ? "Production mode enabled"
        : "Dry-run readiness",
    },
    nextAction:
      pillow.pendingApprovals > 0
        ? "Review Pillow approval queue on Development → Approvals"
        : pillow.capabilityNote.split(".")[0] ?? "Monitor Pillow runtime",
    executiveAudit: {
      summary:
        "Pillow NL chat (SCR-800) via /api/pillow/chat; approval runtime (ADR-049) on Supervisor tab",
      artifactRef: null,
    },
    dependencies: [
      "Pillow approval repository",
      "EMPIRE_V1_OPERATIONAL_READY for production mode",
      "Mission Centre approval triage",
    ],
    metrics: [
      { label: "Pending approvals", value: String(pillow.pendingApprovals) },
      {
        label: "Production mode",
        value: pillow.productionModeEnabled ? "Enabled" : "Dry-run",
      },
    ],
    detailRows: pillow.recentApprovals.slice(0, 6).map((r) => ({
      label: r.title,
      value: `${r.status} · ${r.type}`,
      status: r.status,
    })),
  };
}
