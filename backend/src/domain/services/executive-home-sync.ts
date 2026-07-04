/**
 * Executive Home assembly with event-loop yields between heavy sync stages.
 */
import {
  buildExecutiveAlerts,
  buildExecutiveApprovalRoutes,
  buildExecutiveDependencyGraph,
  buildExecutiveTimeline,
} from "./executive-dashboard-integration.js";
import {
  buildExecutiveSummaryCards,
  COCKPIT_ENGINE_IDS,
  type EnginePanelView,
  type ExecutiveAttentionItem,
  type ExecutiveHomeView,
  loadEnginePanelView,
  loadPillowSupervisorView,
} from "./cockpit-panel-views.js";
import { loadDashboardView } from "./module-views.js";
import {
  loadOperationalCommandViewAsync,
  loadOperationalCommandView,
} from "./operational-command-view.js";

const DEFAULT_COMPANY = "co-grand-king";

const yieldEventLoop = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

export async function assembleExecutiveHomeViewAsync(
  workspaceId: string,
  companyId: string | undefined,
  env: NodeJS.ProcessEnv,
  trace: Record<string, number>,
): Promise<ExecutiveHomeView> {
  let stageStart = performance.now();
  const mark = (name: string) => {
    trace[name] = Math.round(performance.now() - stageStart);
    stageStart = performance.now();
  };

  await yieldEventLoop();
  const command = await loadOperationalCommandViewAsync(workspaceId, companyId, env);
  mark("commandMs");

  await yieldEventLoop();
  const portfolio = loadDashboardView(workspaceId);
  mark("portfolioMs");

  const engineSummaries: EnginePanelView[] = [];
  const panelById: Record<string, EnginePanelView> = {};
  for (const engineId of COCKPIT_ENGINE_IDS) {
    await yieldEventLoop();
    const panel = loadEnginePanelView(engineId, workspaceId, env);
    engineSummaries.push(panel);
    panelById[engineId] = panel;
  }
  mark("enginePanelsMs");

  const openBlockers = Object.values(command.certificationBlockers).filter(
    (blocker) => blocker.status !== "closed",
  );
  const top = openBlockers[0] ?? null;

  await yieldEventLoop();
  const pillow = loadPillowSupervisorView(workspaceId, env);
  mark("pillowSupervisorMs");

  const company = companyId ?? DEFAULT_COMPANY;

  await yieldEventLoop();
  const summaryCards = buildExecutiveSummaryCards(
    workspaceId,
    company,
    command,
    portfolio,
    engineSummaries,
    env,
  );
  mark("summaryCardsMs");

  const executiveAlerts = buildExecutiveAlerts(
    command,
    pillow.pendingApprovals,
    engineSummaries,
  );
  const attentionItems: ExecutiveAttentionItem[] = executiveAlerts.map((alert) => ({
    id: alert.id,
    label: alert.label,
    severity: alert.severity,
    href: alert.href,
    engineId: alert.engineId,
  }));

  await yieldEventLoop();
  const quantitativePanel = loadEnginePanelView("quantitative-intelligence", workspaceId, env);
  await yieldEventLoop();
  const pillowEnginePanel = loadEnginePanelView("pillow-supervisor", workspaceId, env);
  panelById["quantitative-intelligence"] = quantitativePanel;
  panelById["pillow-supervisor"] = pillowEnginePanel;

  await yieldEventLoop();
  const executiveTimeline = buildExecutiveTimeline(
    workspaceId,
    company,
    portfolio,
    env,
    panelById,
  );
  mark("timelineMs");

  await yieldEventLoop();
  const approvalRoutes = buildExecutiveApprovalRoutes(workspaceId, command, env);
  mark("approvalRoutesMs");

  const extraPanels = [quantitativePanel, pillowEnginePanel];
  mark("extraPanelsMs");

  await yieldEventLoop();
  const dependencyGraph = buildExecutiveDependencyGraph([...engineSummaries, ...extraPanels]);
  mark("dependencyGraphMs");

  const alertsCard = summaryCards.find((card) => card.id === "executive-alerts");
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

  return {
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
  };
}

export async function buildMinimalExecutiveHomeFallbackAsync(
  workspaceId: string,
  companyId: string | undefined,
  env: NodeJS.ProcessEnv,
): Promise<ExecutiveHomeView> {
  await yieldEventLoop();
  const command = await loadOperationalCommandViewAsync(workspaceId, companyId, env);
  await yieldEventLoop();
  const portfolio = loadDashboardView(workspaceId);
  return {
    computedAt: new Date().toISOString(),
    greeting: {
      displayNameHint: "Grand King",
      topBlocker: "Executive Home aggregation timed out — partial data shown",
      topBlockerHref: null,
    },
    command,
    portfolio,
    engineSummaries: [],
    summaryCards: [],
    attentionItems: [],
    nextExecutiveAction:
      command.oms.nextHighestImpactAction ??
      command.nextExecutiveApproval ??
      "Refresh Executive Home in a moment",
    executiveTimeline: [],
    executiveAlerts: [],
    approvalRoutes: [],
    dependencyGraph: { nodes: [], edges: [] },
  };
}

/** Sync path retained for callers outside dispatch (tests, interaction layer). */
export function assembleExecutiveHomeViewSync(
  workspaceId: string,
  companyId: string | undefined,
  env: NodeJS.ProcessEnv,
  trace: Record<string, number>,
): ExecutiveHomeView {
  let stageStart = performance.now();
  const mark = (name: string) => {
    trace[name] = Math.round(performance.now() - stageStart);
    stageStart = performance.now();
  };

  const command = loadOperationalCommandView(workspaceId, companyId, env);
  mark("commandMs");
  const portfolio = loadDashboardView(workspaceId);
  mark("portfolioMs");

  const engineSummaries = COCKPIT_ENGINE_IDS.map((engineId) =>
    loadEnginePanelView(engineId, workspaceId, env),
  );
  mark("enginePanelsMs");

  const pillow = loadPillowSupervisorView(workspaceId, env);
  mark("pillowSupervisorMs");
  const company = companyId ?? DEFAULT_COMPANY;
  const summaryCards = buildExecutiveSummaryCards(
    workspaceId,
    company,
    command,
    portfolio,
    engineSummaries,
    env,
  );
  mark("summaryCardsMs");

  const executiveAlerts = buildExecutiveAlerts(
    command,
    pillow.pendingApprovals,
    engineSummaries,
  );
  const panelById = Object.fromEntries(engineSummaries.map((panel) => [panel.engineId, panel]));
  const quantitativePanel = loadEnginePanelView("quantitative-intelligence", workspaceId, env);
  const pillowEnginePanel = loadEnginePanelView("pillow-supervisor", workspaceId, env);
  panelById["quantitative-intelligence"] = quantitativePanel;
  panelById["pillow-supervisor"] = pillowEnginePanel;

  const executiveTimeline = buildExecutiveTimeline(
    workspaceId,
    company,
    portfolio,
    env,
    panelById,
  );
  mark("timelineMs");

  const approvalRoutes = buildExecutiveApprovalRoutes(workspaceId, command, env);
  mark("approvalRoutesMs");
  const dependencyGraph = buildExecutiveDependencyGraph([
    ...engineSummaries,
    quantitativePanel,
    pillowEnginePanel,
  ]);
  mark("dependencyGraphMs");

  const openBlockers = Object.values(command.certificationBlockers).filter(
    (blocker) => blocker.status !== "closed",
  );
  const top = openBlockers[0] ?? null;

  return {
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
    attentionItems: executiveAlerts.map((alert) => ({
      id: alert.id,
      label: alert.label,
      severity: alert.severity,
      href: alert.href,
      engineId: alert.engineId,
    })),
    nextExecutiveAction:
      command.oms.nextHighestImpactAction ??
      command.nextExecutiveApproval ??
      top?.detail ??
      (command.proof001.achieved
        ? "Monitor revenue and scale top-performing ventures"
        : command.proof001.detail),
    executiveTimeline,
    executiveAlerts,
    approvalRoutes,
    dependencyGraph,
  };
}

export function buildMinimalExecutiveHomeFallback(
  workspaceId: string,
  companyId: string | undefined,
  env: NodeJS.ProcessEnv,
): ExecutiveHomeView {
  const command = loadOperationalCommandView(workspaceId, companyId, env);
  const portfolio = loadDashboardView(workspaceId);
  return {
    computedAt: new Date().toISOString(),
    greeting: {
      displayNameHint: "Grand King",
      topBlocker: "Executive Home aggregation timed out — partial data shown",
      topBlockerHref: null,
    },
    command,
    portfolio,
    engineSummaries: [],
    summaryCards: [],
    attentionItems: [],
    nextExecutiveAction:
      command.oms.nextHighestImpactAction ??
      command.nextExecutiveApproval ??
      "Refresh Executive Home in a moment",
    executiveTimeline: [],
    executiveAlerts: [],
    approvalRoutes: [],
    dependencyGraph: { nodes: [], edges: [] },
  };
}
