import type { ToolStore } from "./tool-store.js";
import type {
  FailureSummary,
  InvocationStatistics,
  PermissionStatusSummary,
  RetrySummary,
} from "./types.js";

export class MetricsCollector {
  collect(store: ToolStore) {
    return {
      totalTools: store.listTools().length,
      totalConnections: store.listConnections().length,
      activeConnections: store.listActiveConnections().length,
      totalInvocations: store.listInvocations().length,
      totalReports: store.listReports().length,
    };
  }

  buildInvocationStatistics(store: ToolStore): InvocationStatistics {
    const invocations = store.listInvocations();
    const last = invocations.at(-1);
    return {
      totalInvocations: invocations.length,
      successfulInvocations: invocations.filter((i) => i.status === "success").length,
      failedInvocations: invocations.filter(
        (i) => i.status === "failed" || i.status === "unavailable",
      ).length,
      deniedInvocations: invocations.filter((i) => i.status === "denied").length,
      retriedInvocations: invocations.filter((i) => i.attempt > 1).length,
      liveExecutions: invocations.filter((i) => i.liveExecution).length,
      structuralOnlyInvocations: invocations.filter((i) => !i.liveExecution).length,
      lastInvocationAt: last?.timestamp ?? null,
    };
  }

  buildFailureSummary(store: ToolStore): FailureSummary {
    const invocations = store.listInvocations();
    const byErrorClass: Record<string, number> = {};
    let totalFailures = 0;
    for (const i of invocations) {
      if (i.status === "failed" || i.status === "unavailable") {
        totalFailures += 1;
        const key = i.errorClass ?? i.status;
        byErrorClass[key] = (byErrorClass[key] ?? 0) + 1;
      }
    }
    return {
      totalFailures,
      byErrorClass,
      unavailableCount: invocations.filter((i) => i.status === "unavailable").length,
    };
  }

  buildRetrySummary(store: ToolStore): RetrySummary {
    const invocations = store.listInvocations();
    const retried = invocations.filter((i) => i.attempt > 1);
    const exhausted = invocations.filter(
      (i) =>
        i.attempt >= i.maxAttempts &&
        (i.status === "failed" || i.status === "unavailable"),
    );
    const avg =
      invocations.length === 0
        ? 0
        : invocations.reduce((sum, i) => sum + i.attempt, 0) / invocations.length;
    return {
      totalRetries: retried.length,
      exhaustedRetries: exhausted.length,
      averageAttempts: avg,
    };
  }

  buildPermissionStatus(store: ToolStore): PermissionStatusSummary {
    const invocations = store.listInvocations();
    const tools = store.listTools();
    return {
      granted: invocations.filter((i) => i.permissionGranted).length,
      denied: invocations.filter((i) => i.status === "denied" || !i.permissionGranted).length,
      highRiskApproved: tools.filter((t) => t.permissionPolicy.highRisk).length,
    };
  }
}
