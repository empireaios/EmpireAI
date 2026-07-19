import { buildSupplierFrameworkConfiguration } from "@empireai/pillow";
import type {
  FrameworkRunReport as SupplierFrameworkRunReport,
  SupplierFrameworkState,
} from "@empireai/pillow";

function buildOfflineSupplierFrameworkState(): SupplierFrameworkState {
  const configuration = buildSupplierFrameworkConfiguration();
  return {
    engineVersion: "PILLOW-SF-001",
    missionId: "R2-01",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    registeredSuppliers: [],
    health: {
      status: "standby",
      healthScore: 50,
      frameworkEnabled: configuration.enabled,
      registeredSuppliers: 0,
      activeSuppliers: 0,
      suspendedSuppliers: 0,
      failedSuppliers: 0,
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      totalEventsRouted: 0,
      rateLimitedEvents: 0,
      dataAbstractions: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Supplier Framework snapshot when Pillow session is unavailable. */
export function collectSupplierFrameworkSnapshot() {
  const engine = buildOfflineSupplierFrameworkState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-01",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      registeredSupplierCount: 0,
      activeSupplierCount: 0,
      totalEventsRouted: 0,
      rateLimitedEvents: 0,
      recoveryAttempts: 0,
      recentLogs: [],
    },
    latestReport: null as SupplierFrameworkRunReport | null,
    registeredSuppliers: [],
  };
}
