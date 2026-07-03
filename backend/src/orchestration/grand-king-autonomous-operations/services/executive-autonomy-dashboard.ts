/**
 * G7-07 — Executive autonomy dashboard backend.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { routeAutonomousDecisions } from "./autonomous-decision-router.js";
import { buildAutonomousQueue, monitorAutonomousOperations } from "./autonomous-execution-monitor.js";
import { listAutonomousOperationHistory, listAutonomousOperations } from "./autonomous-operation-store.js";
import { getAutonomousOperationsOverview } from "./grand-king-autonomous-operations-service.js";

export function buildExecutiveAutonomyDashboard(context: RegistryLoaderContext = {}) {
  const overview = getAutonomousOperationsOverview(context);
  const operations = listAutonomousOperations();
  const queue = buildAutonomousQueue();
  const health = monitorAutonomousOperations();
  const recommendations = routeAutonomousDecisions(context);
  const history = listAutonomousOperationHistory();

  return {
    overview,
    operations,
    queue,
    health,
    recommendations,
    history,
    domains: 10,
    computedAt: new Date().toISOString(),
  };
}

export function getExecutiveAutonomySummary(context: RegistryLoaderContext = {}): string {
  const dashboard = buildExecutiveAutonomyDashboard(context);
  return [
    `Grand King autonomous operations — ${dashboard.operations.length} operations tracked.`,
    `${dashboard.queue.length} queued, ${dashboard.health.healthyCount} healthy, ${dashboard.health.criticalCount} critical.`,
    `${dashboard.recommendations.length} autonomous recommendations routed from G7 stack.`,
  ].join(" ");
}
