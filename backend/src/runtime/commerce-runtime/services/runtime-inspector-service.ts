import { createCommerceRuntimeModuleContract } from "../contract/commerce-runtime-module.js";
import { buildRuntimeHealthReport } from "./runtime-health-service.js";
import { buildRuntimeRegistry } from "./runtime-registry-service.js";
import { resolveAllOperationCoverage, listUnsupportedRequests } from "./capability-resolver-service.js";
import { listPendingPlans } from "./execution-planner-service.js";
import { getCommerceRuntimeRepository } from "../repositories/sqlite-commerce-runtime-repository.js";
import { buildPluginRegistrySnapshot } from "./plugin-dispatch-service.js";

export function inspectCommerceRuntime(workspaceId: string, companyId: string) {
  const contract = createCommerceRuntimeModuleContract();
  const registry = buildRuntimeRegistry();
  const health = buildRuntimeHealthReport(workspaceId, companyId);
  const plans = listPendingPlans(workspaceId, companyId);
  const queue = getCommerceRuntimeRepository().listQueue(workspaceId, companyId);
  const pluginSnapshot = buildPluginRegistrySnapshot();

  return {
    moduleId: contract.moduleId,
    missionId: contract.missionId,
    protection: contract.protection,
    integratesWith: contract.integratesWith,
    health,
    registry: {
      totalAdapters: registry.totalAdapters,
      byKind: registry.byKind,
      agentCount: registry.agents.length,
    },
    capabilityCoverage: resolveAllOperationCoverage(),
    unsupportedRequests: listUnsupportedRequests(),
    pendingPlanCount: plans.length,
    queueDepth: queue.length,
    runtimePlugins: {
      registered: pluginSnapshot.plugins.length,
      enabled: pluginSnapshot.enabled.length,
      capabilityCoverage: pluginSnapshot.capabilityCoverage,
      certificationPending: pluginSnapshot.certification.length,
      health: pluginSnapshot.health,
    },
    inspectedAt: new Date().toISOString(),
  };
}

export function buildEsisRuntimeInspectionPayload(workspaceId: string, companyId: string) {
  const inspection = inspectCommerceRuntime(workspaceId, companyId);
  return {
    module: "commerce-runtime",
    missionId: "CRT-001",
    state: inspection.health.runtime.state,
    executionBlocked: true,
    adapterCount: inspection.registry.totalAdapters,
    pluginCount: inspection.runtimePlugins.registered,
    pluginEnabled: inspection.runtimePlugins.enabled,
    pendingPlans: inspection.pendingPlanCount,
    queueDepth: inspection.queueDepth,
    summary: inspection.health.runtime.summary,
  };
}
