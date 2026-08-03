/** X4-10 — Worldwide Metrics Aggregator. */

import type { ExecutiveGlobalDashboardConfiguration } from "./configuration.js";
import {
  buildDashboardSnapshot,
  computeStructuralDashboardSignals,
} from "./structural-signals.js";
import type { DashboardAnalysisInput, DashboardSnapshot } from "./types.js";

export class WorldwideMetricsAggregator {
  aggregate(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
    dependencyReadyCount: number,
  ): DashboardSnapshot {
    const signals = computeStructuralDashboardSignals(
      input,
      config,
      dependencyReadyCount,
    );
    return buildDashboardSnapshot(
      signals,
      input.validated === true ? "passed" : "failed",
    );
  }
}
