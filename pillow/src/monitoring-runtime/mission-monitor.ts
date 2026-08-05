import type { MonitoringStore } from "./monitoring-store.js";
import { EnterpriseHealthAggregator } from "./enterprise-health-aggregator.js";
import type { HealthSnapshot } from "./types.js";

/** Mission health from stored evidence only — no fabrication. */
export class MissionMonitor {
  private readonly aggregator = new EnterpriseHealthAggregator();

  monitor(store: MonitoringStore): HealthSnapshot {
    const components = store.listComponentsByType("mission");
    return this.aggregator.buildSnapshot("mission", components);
  }
}
