/**
 * Non-blocking Executive Home loader for production Brain dispatch.
 * Yields the event loop between aggregation stages so /health/live stays responsive.
 */
import { logger } from "../../config/logger.js";
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
import { loadOperationalCommandView } from "./operational-command-view.js";

const DEFAULT_COMPANY = "co-grand-king";
const CACHE_TTL_MS = 60_000;
const DISPATCH_TIMEOUT_MS = Number(process.env.EXECUTIVE_HOME_DISPATCH_TIMEOUT_MS ?? 90_000);

const breathe = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

type CacheEntry = { expires: number; view: ExecutiveHomeView };

const viewCache = new Map<string, CacheEntry>();

export type ExecutiveHomeDispatchPayload = ExecutiveHomeView & {
  _trace?: Record<string, number>;
  _cached?: boolean;
  _fallback?: boolean;
};

function cacheKey(workspaceId: string, companyId?: string): string {
  return `${workspaceId}:${companyId ?? DEFAULT_COMPANY}`;
}

function getCachedView(key: string): ExecutiveHomeView | null {
  const entry = viewCache.get(key);
  if (!entry || entry.expires <= Date.now()) {
    return null;
  }
  return entry.view;
}

function setCachedView(key: string, view: ExecutiveHomeView): void {
  viewCache.set(key, { expires: Date.now() + CACHE_TTL_MS, view });
}

async function assembleExecutiveHomeView(
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

  await breathe();
  const command = loadOperationalCommandView(workspaceId, companyId, env);
  await breathe();
  mark("commandMs");

  const portfolio = loadDashboardView(workspaceId);
  await breathe();
  mark("portfolioMs");

  const engineSummaries: EnginePanelView[] = [];
  for (const engineId of COCKPIT_ENGINE_IDS) {
    engineSummaries.push(loadEnginePanelView(engineId, workspaceId, env));
    await breathe();
  }
  mark("enginePanelsMs");

  const openBlockers = Object.values(command.certificationBlockers).filter(
    (blocker) => blocker.status !== "closed",
  );
  const top = openBlockers[0] ?? null;

  const pillow = loadPillowSupervisorView(workspaceId, env);
  await breathe();
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
  await breathe();
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

  const executiveTimeline = buildExecutiveTimeline(workspaceId, company, portfolio, env);
  await breathe();
  mark("timelineMs");

  const approvalRoutes = buildExecutiveApprovalRoutes(workspaceId, command, env);
  await breathe();
  mark("approvalRoutesMs");

  const extraPanels = [
    loadEnginePanelView("quantitative-intelligence", workspaceId, env),
    loadEnginePanelView("pillow-supervisor", workspaceId, env),
  ];
  await breathe();
  mark("extraPanelsMs");

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

async function buildMinimalFallbackView(
  workspaceId: string,
  companyId: string | undefined,
  env: NodeJS.ProcessEnv,
): Promise<ExecutiveHomeView> {
  const command = loadOperationalCommandView(workspaceId, companyId, env);
  await breathe();
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

export async function loadExecutiveHomeForDispatch(
  workspaceId: string,
  companyId?: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ExecutiveHomeDispatchPayload> {
  const key = cacheKey(workspaceId, companyId);
  const cached = getCachedView(key);
  if (cached) {
    return {
      ...cached,
      _cached: true,
      _trace: { cacheHitMs: 0, totalMs: 0 },
      _fallback: false,
    };
  }

  const started = performance.now();
  const trace: Record<string, number> = {};

  try {
    const view = await Promise.race([
      assembleExecutiveHomeView(workspaceId, companyId, env, trace),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("EXECUTIVE_HOME_TIMEOUT")), DISPATCH_TIMEOUT_MS);
      }),
    ]);

    trace.totalMs = Math.round(performance.now() - started);
    setCachedView(key, view);
    logger.info({ workspaceId, trace }, "Executive home dispatch completed");

    return { ...view, _trace: trace, _cached: false, _fallback: false };
  } catch (error) {
    trace.totalMs = Math.round(performance.now() - started);
    const stale = getCachedView(key);

    if (stale) {
      logger.warn(
        { workspaceId, trace, error: error instanceof Error ? error.message : String(error) },
        "Executive home dispatch failed — serving stale cache",
      );
      return { ...stale, _trace: trace, _cached: true, _fallback: true };
    }

    const fallback = await buildMinimalFallbackView(workspaceId, companyId, env);
    logger.warn(
      { workspaceId, trace, error: error instanceof Error ? error.message : String(error) },
      "Executive home dispatch failed — serving minimal fallback",
    );
    return { ...fallback, _trace: trace, _cached: false, _fallback: true };
  }
}

/** Test-only */
export function clearExecutiveHomeViewCache(): void {
  viewCache.clear();
}
