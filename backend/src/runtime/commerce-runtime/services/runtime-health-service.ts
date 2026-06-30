import type { RuntimeHealthReport } from "../models/runtime-health.js";
import { COMMERCE_RUNTIME_EXECUTION_BLOCKED } from "../contract/commerce-runtime-module.js";
import { getCommerceRuntimeRepository } from "../repositories/sqlite-commerce-runtime-repository.js";
import { buildRuntimeRegistry } from "./runtime-registry-service.js";
import { getRuntimeEventStats } from "./runtime-event-bus-service.js";

export function buildRuntimeHealthReport(workspaceId: string, companyId: string): RuntimeHealthReport {
  const registry = buildRuntimeRegistry();
  const eventStats = getRuntimeEventStats(workspaceId, companyId);
  const queueStats = getCommerceRuntimeRepository().queueStats(workspaceId, companyId);
  const pendingPlans = getCommerceRuntimeRepository().listPlans(workspaceId, companyId).length;

  const kernelNames = [
    "marketplace",
    "supplier",
    "payment",
    "advertising",
    "logistics",
    "customer_service",
    "analytics",
    "agent",
  ];

  const kernels = kernelNames.map((kernel) => ({
    kernel,
    state: "BLOCKED" as const,
    adapterCount: registry.adapters.filter((a) => a.kind === kernel).length,
  }));

  return {
    runtime: {
      state: COMMERCE_RUNTIME_EXECUTION_BLOCKED ? "BLOCKED" : "HEALTHY",
      executionBlocked: true,
      summary: "CRT-001 commerce runtime active — planning and routing only",
    },
    adapters: {
      state: registry.totalAdapters > 0 ? "HEALTHY" : "WARNING",
      registered: registry.totalAdapters,
      blocked: registry.totalAdapters,
    },
    kernels,
    execution: {
      state: "BLOCKED",
      pendingPlans,
      queuedRequests: queueStats.total,
      blockedDispatches: queueStats.blocked,
    },
    events: {
      state: eventStats.deadLetter > 0 ? "DEGRADED" : "HEALTHY",
      received: eventStats.received,
      processed: eventStats.processed,
      deadLetter: eventStats.deadLetter,
    },
  };
}
