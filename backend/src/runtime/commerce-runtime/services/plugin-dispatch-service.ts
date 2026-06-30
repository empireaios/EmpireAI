import { randomUUID } from "node:crypto";

import { COMMERCE_RUNTIME_EXECUTION_BLOCKED } from "../contract/commerce-runtime-module.js";
import type { RuntimeOperation } from "../models/execution-request.js";
import { createExecutionPlan } from "./execution-planner-service.js";
import { getCommerceRuntimeRepository } from "../repositories/sqlite-commerce-runtime-repository.js";
import {
  getRuntimePluginRegistry,
  type PluginDispatchOutcome,
  type PluginDispatchResult,
} from "../../plugins/index.js";

export type PluginDispatchRequest = {
  workspaceId: string;
  companyId: string;
  operation: RuntimeOperation;
  pluginId?: string;
  businessId?: string;
  productId?: string;
  marketplaceId?: string;
};

/** B-005 — Plugin-aware dispatch. Execution remains BLOCKED. */
export function dispatchViaPlugin(request: PluginDispatchRequest): PluginDispatchResult {
  const registry = getRuntimePluginRegistry();
  const { plugin, capabilityId, reason } = registry.resolvePluginForCrtOperation(
    request.operation,
    request.pluginId ?? request.marketplaceId,
  );

  if (!plugin || !capabilityId) {
    const result: PluginDispatchResult = {
      dispatchId: randomUUID(),
      pluginId: request.pluginId ?? request.marketplaceId ?? "unknown",
      capabilityId: capabilityId ?? request.operation,
      outcome: "NOT_IMPLEMENTED",
      executionBlocked: true,
      message: reason,
      dispatchedAt: new Date().toISOString(),
    };
    persistDispatch(request, result);
    return result;
  }

  const cap = plugin.declareCapabilities().find((c) => c.capabilityId === capabilityId);
  if (!cap || cap.support === "UNSUPPORTED") {
    const result: PluginDispatchResult = {
      dispatchId: randomUUID(),
      pluginId: plugin.manifest.pluginId,
      capabilityId,
      outcome: "NOT_IMPLEMENTED",
      executionBlocked: true,
      message: `Capability ${capabilityId} unsupported on ${plugin.manifest.pluginId}`,
      dispatchedAt: new Date().toISOString(),
    };
    persistDispatch(request, result);
    return result;
  }

  const plan = createExecutionPlan({
    workspaceId: request.workspaceId,
    companyId: request.companyId,
    operation: request.operation,
    businessId: request.businessId,
    productId: request.productId,
    marketplaceId: request.marketplaceId ?? plugin.manifest.pluginId,
  });

  const isReady =
    cap.executionMode === "READY" &&
    plugin.manifest.certificationState === "CERTIFIED" &&
    !COMMERCE_RUNTIME_EXECUTION_BLOCKED;

  const outcome: PluginDispatchOutcome = isReady ? "READY" : "BLOCKED";

  const result: PluginDispatchResult = {
    dispatchId: randomUUID(),
    pluginId: plugin.manifest.pluginId,
    capabilityId,
    outcome,
    executionBlocked: outcome !== "READY" || COMMERCE_RUNTIME_EXECUTION_BLOCKED,
    planId: plan.planId,
    message:
      outcome === "READY"
        ? "Plugin certified and ready — awaiting live execution gate (COS-002+)"
        : `B-005 — plugin ${plugin.manifest.pluginId} resolved; execution blocked (architecture only)`,
    dispatchedAt: new Date().toISOString(),
  };

  persistDispatch(request, result);
  return result;
}

function persistDispatch(request: PluginDispatchRequest, result: PluginDispatchResult): void {
  getCommerceRuntimeRepository().saveQueueEntry({
    queueId: result.dispatchId,
    workspaceId: request.workspaceId,
    companyId: request.companyId,
    operation: request.operation,
    kernel: "marketplace",
    status: result.outcome,
    recordJson: JSON.stringify(result),
    requestedAt: result.dispatchedAt,
  });
}

export function lookupPluginCapabilitySupport(capabilityId: string) {
  return getRuntimePluginRegistry().lookupByCapability(capabilityId);
}

export function buildPluginRegistrySnapshot() {
  const registry = getRuntimePluginRegistry();
  return {
    plugins: registry.listPlugins(),
    enabled: registry.listEnabledPlugins(),
    health: registry.getAllHealth(),
    capabilityCoverage: registry.buildCapabilityCoverage(),
    certification: registry.lookupByCertification("UNCERTIFIED"),
  };
}
