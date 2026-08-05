import type { ApiStore } from "./api-store.js";
import type {
  AuthenticationStatusSummary,
  FailureSummary,
  RateLimitSummary,
  RequestStatistics,
  RetrySummary,
} from "./types.js";

export class MetricsCollector {
  collect(store: ApiStore) {
    return {
      totalProviders: store.listProviders().length,
      totalConnections: store.listConnections().length,
      activeConnections: store.listActiveConnections().length,
      totalTraces: store.listTraces().length,
      totalReports: store.listReports().length,
    };
  }

  buildRequestStatistics(store: ApiStore): RequestStatistics {
    const traces = store.listTraces();
    const successful = traces.filter(
      (t) => t.statusCode != null && t.statusCode >= 200 && t.statusCode < 400 && !t.rateLimited && !t.circuitOpen,
    );
    const failed = traces.filter(
      (t) =>
        t.rateLimited ||
        t.circuitOpen ||
        t.errorClass != null ||
        (t.statusCode != null && t.statusCode >= 400),
    );
    const last = traces.at(-1);
    return {
      totalRequests: traces.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      rateLimitedRequests: traces.filter((t) => t.rateLimited).length,
      retriedRequests: traces.filter((t) => t.attempt > 1).length,
      liveCallsExecuted: traces.filter((t) => t.liveCallExecuted).length,
      structuralOnlyRequests: traces.filter((t) => !t.liveCallExecuted).length,
      lastRequestAt: last?.timestamp ?? null,
    };
  }

  buildFailureSummary(store: ApiStore): FailureSummary {
    const traces = store.listTraces();
    const byErrorClass: Record<string, number> = {};
    let totalFailures = 0;
    for (const t of traces) {
      if (t.errorClass || t.rateLimited || t.circuitOpen || (t.statusCode != null && t.statusCode >= 400)) {
        totalFailures += 1;
        const key = t.errorClass ?? (t.rateLimited ? "rate_limited" : t.circuitOpen ? "circuit_open" : `http_${t.statusCode}`);
        byErrorClass[key] = (byErrorClass[key] ?? 0) + 1;
      }
    }
    return {
      totalFailures,
      byErrorClass,
      circuitOpenCount: traces.filter((t) => t.circuitOpen).length,
    };
  }

  buildRetrySummary(store: ApiStore): RetrySummary {
    const traces = store.listTraces();
    const retried = traces.filter((t) => t.attempt > 1);
    const exhausted = traces.filter((t) => t.attempt >= t.maxAttempts && (t.errorClass != null || (t.statusCode != null && t.statusCode >= 400)));
    const avg =
      traces.length === 0
        ? 0
        : traces.reduce((sum, t) => sum + t.attempt, 0) / traces.length;
    return {
      totalRetries: retried.length,
      exhaustedRetries: exhausted.length,
      averageAttempts: avg,
    };
  }

  buildAuthenticationStatus(store: ApiStore): AuthenticationStatusSummary {
    const traces = store.listTraces();
    return {
      authenticated: traces.filter((t) => t.authStatus === "authenticated").length,
      rejected: traces.filter((t) => t.authStatus === "rejected").length,
      skipped: traces.filter((t) => t.authStatus === "skipped").length,
      refreshStructural: traces.filter((t) => t.authStatus === "refresh_structural").length,
    };
  }

  buildRateLimitSummary(store: ApiStore): RateLimitSummary {
    const providers = store.listProviders();
    return {
      ok: providers.filter((p) => p.rateLimitStatus === "ok").length,
      approaching: providers.filter((p) => p.rateLimitStatus === "approaching").length,
      exceeded: providers.filter((p) => p.rateLimitStatus === "exceeded").length,
    };
  }
}
