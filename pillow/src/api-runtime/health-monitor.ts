import type { ApiStore } from "./api-store.js";
import type { HealthStatus, ProviderHealthSummary } from "./types.js";

export class HealthMonitor {
  /** Derive provider health from recent traces. */
  assessProvider(store: ApiStore, apiId: string): ProviderHealthSummary {
    const provider = store.getProvider(apiId);
    const traces = store.listTracesForApi(apiId);
    const successCount = traces.filter(
      (t) => t.statusCode != null && t.statusCode >= 200 && t.statusCode < 400 && !t.rateLimited && !t.circuitOpen,
    ).length;
    const failureCount = traces.filter(
      (t) =>
        t.rateLimited ||
        t.circuitOpen ||
        t.errorClass != null ||
        (t.statusCode != null && t.statusCode >= 400),
    ).length;

    let healthStatus: HealthStatus = "unknown";
    if (traces.length === 0) {
      healthStatus = provider?.healthStatus === "standby" ? "standby" : "unknown";
    } else if (failureCount === 0) {
      healthStatus = "healthy";
    } else if (successCount > failureCount) {
      healthStatus = "degraded";
    } else {
      healthStatus = "unhealthy";
    }

    if (provider) {
      store.updateProvider(apiId, { healthStatus });
    }

    const lastSuccess = [...traces].reverse().find((t) => t.statusCode != null && t.statusCode < 400);
    const lastFailure = [...traces].reverse().find(
      (t) => t.errorClass != null || (t.statusCode != null && t.statusCode >= 400) || t.rateLimited || t.circuitOpen,
    );

    return {
      apiId,
      provider: provider?.provider ?? apiId,
      healthStatus,
      successCount,
      failureCount,
      lastSuccessAt: lastSuccess?.timestamp ?? provider?.lastSuccessfulRequest ?? null,
      lastFailureAt: lastFailure?.timestamp ?? provider?.lastFailedRequest ?? null,
      circuitState: provider?.circuitState ?? "closed",
      rateLimitStatus: provider?.rateLimitStatus ?? "ok",
    };
  }

  assessAll(store: ApiStore): ProviderHealthSummary[] {
    return store.listProviders().map((p) => this.assessProvider(store, p.apiId));
  }
}
