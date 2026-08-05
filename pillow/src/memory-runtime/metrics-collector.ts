import type { MemoryStore } from "./memory-store.js";
import type {
  DecisionHistorySummary,
  MemoryHealth,
  PreviousResultSummary,
  RetrievalStatistics,
  VersionSummary,
} from "./types.js";

export class MetricsCollector {
  collect(store: MemoryStore): {
    totalEntries: number;
    activeEntries: number;
    archivedEntries: number;
    totalVersions: number;
    totalQueries: number;
  } {
    const entries = store.listEntries();
    const retrievals = store.listRetrievalResults();
    const totalVersions = entries.reduce((sum, e) => sum + e.versions.length, 0);

    return {
      totalEntries: entries.length,
      activeEntries: entries.filter((e) => e.retentionStatus === "active").length,
      archivedEntries: entries.filter((e) => e.retentionStatus === "archived").length,
      totalVersions,
      totalQueries: retrievals.length,
    };
  }

  buildHealth(store: MemoryStore): MemoryHealth {
    const metrics = this.collect(store);
    const healthScore = Math.max(0, 100 - metrics.archivedEntries * 2);

    let status: MemoryHealth["status"] = "healthy";
    if (metrics.totalEntries === 0) status = "standby";
    if (metrics.archivedEntries > metrics.activeEntries) status = "degraded";

    return {
      status,
      healthScore,
      totalEntries: metrics.totalEntries,
      activeEntries: metrics.activeEntries,
      archivedEntries: metrics.archivedEntries,
      totalVersions: metrics.totalVersions,
      notes: [
        `Entries: ${metrics.totalEntries}, Versions: ${metrics.totalVersions}, Queries: ${metrics.totalQueries}`,
      ],
    };
  }

  buildDecisionHistorySummary(store: MemoryStore): DecisionHistorySummary {
    const decisions = store.listEntries().filter((e) => e.memoryType === "decision_history");
    const byMission: Record<string, number> = {};
    for (const d of decisions) {
      const key = d.missionId ?? "_unknown";
      byMission[key] = (byMission[key] ?? 0) + 1;
    }
    const latest = decisions.at(-1);
    return {
      totalDecisions: decisions.length,
      byMission,
      latestDecisionAt: latest?.createdAt ?? null,
    };
  }

  buildPreviousResultSummary(store: MemoryStore): PreviousResultSummary {
    const results = store.listEntries().filter((e) => e.memoryType === "previous_result");
    const byWorker: Record<string, number> = {};
    for (const r of results) {
      const key = r.worker ?? "_unknown";
      byWorker[key] = (byWorker[key] ?? 0) + 1;
    }
    const latest = results.at(-1);
    return {
      totalResults: results.length,
      byWorker,
      latestResultAt: latest?.createdAt ?? null,
    };
  }

  buildVersionSummary(store: MemoryStore): VersionSummary {
    const entries = store.listEntries();
    const totalVersions = entries.reduce((sum, e) => sum + e.versions.length, 0);
    const entriesWithMultipleVersions = entries.filter((e) => e.versions.length > 1).length;
    const maxVersionNumber = entries.reduce((max, e) => Math.max(max, e.currentVersion), 0);
    return { totalVersions, entriesWithMultipleVersions, maxVersionNumber };
  }

  buildRetrievalStatistics(store: MemoryStore): RetrievalStatistics {
    const retrievals = store.listRetrievalResults();
    const totalMatchCount = retrievals.reduce((sum, r) => sum + r.matchCount, 0);
    const last = retrievals.at(-1);
    return {
      totalQueries: retrievals.length,
      totalRetrievals: retrievals.length,
      lastRetrievalAt: last?.retrievedAt ?? null,
      averageMatchCount: retrievals.length ? totalMatchCount / retrievals.length : 0,
    };
  }
}
