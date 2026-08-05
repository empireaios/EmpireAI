import type { MonitoringStore } from "./monitoring-store.js";
import { EnterpriseHealthAggregator } from "./enterprise-health-aggregator.js";
import type { HealthSnapshot } from "./types.js";

/** Worker health from stored evidence only — no fabrication. */
export class WorkerMonitor {
  private readonly aggregator = new EnterpriseHealthAggregator();

  monitor(store: MonitoringStore): HealthSnapshot {
    const components = store.listComponentsByType("worker");
    return this.aggregator.buildSnapshot("worker", components);
  }
}
