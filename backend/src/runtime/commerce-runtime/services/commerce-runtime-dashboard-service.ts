import type { CommerceRuntimeDashboard } from "../models/runtime-health.js";
import { buildRuntimeHealthReport } from "./runtime-health-service.js";
import { buildRuntimeRegistry } from "./runtime-registry-service.js";
import { resolveAllOperationCoverage, listUnsupportedRequests } from "./capability-resolver-service.js";
import { listPendingPlans } from "./execution-planner-service.js";
import { getCommerceRuntimeRepository } from "../repositories/sqlite-commerce-runtime-repository.js";
import { buildPluginRegistrySnapshot } from "./plugin-dispatch-service.js";

export function buildCommerceRuntimeDashboard(
  workspaceId: string,
  companyId: string,
): CommerceRuntimeDashboard {
  const registry = buildRuntimeRegistry();
  const plans = listPendingPlans(workspaceId, companyId);
  const queue = getCommerceRuntimeRepository().listQueue(workspaceId, companyId);
  const pluginSnapshot = buildPluginRegistrySnapshot();
  const enabledIds = new Set(pluginSnapshot.enabled.map((p) => p.pluginId));

  const pluginExecutionStatus = { blocked: 0, notImplemented: 0, ready: 0 };
  for (const q of queue) {
    if (q.status === "BLOCKED") pluginExecutionStatus.blocked += 1;
    else if (q.status === "NOT_IMPLEMENTED") pluginExecutionStatus.notImplemented += 1;
    else if (q.status === "READY") pluginExecutionStatus.ready += 1;
  }

  return {
    moduleId: "commerce-runtime",
    missionId: "CRT-001",
    runtimeHealth: buildRuntimeHealthReport(workspaceId, companyId),
    registeredAdapters: registry.adapters.slice(0, 12).map((a) => ({
      adapterId: a.adapterId,
      displayName: a.displayName,
      kind: a.kind,
      lifecycle: a.lifecycle,
    })),
    executionQueue: queue.slice(0, 10).map((q) => ({
      requestId: q.queueId,
      operation: q.operation,
      kernel: q.kernel,
      status: q.status,
      requestedAt: q.requestedAt,
    })),
    pendingPlans: plans.slice(0, 10).map((p) => ({
      planId: p.planId,
      operation: p.operation,
      status: p.status,
      stepCount: p.steps.length,
      createdAt: p.createdAt,
    })),
    capabilityCoverage: resolveAllOperationCoverage(),
    unsupportedRequests: listUnsupportedRequests().slice(0, 8),
    runtimePlugins: pluginSnapshot.plugins.map((p) => ({
      pluginId: p.pluginId,
      displayName: p.displayName,
      category: p.category,
      version: p.version,
      lifecycle: p.lifecycle,
      certificationState: p.certificationState,
      executionState: p.executionState,
      enabled: enabledIds.has(p.pluginId),
    })),
    pluginCapabilityCoverage: pluginSnapshot.capabilityCoverage.map((c) => ({
      capabilityId: c.capabilityId,
      displayName: c.displayName,
      pluginCount: c.plugins.length,
    })),
    pluginExecutionStatus,
    computedAt: new Date().toISOString(),
  };
}
