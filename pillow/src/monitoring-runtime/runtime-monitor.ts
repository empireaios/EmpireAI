import type { MonitoringStore } from "./monitoring-store.js";
import { EnterpriseHealthAggregator } from "./enterprise-health-aggregator.js";
import type { HealthSnapshot } from "./types.js";

/** Runtime service health from stored evidence only — no fabrication. */
export class RuntimeMonitor {
  private readonly aggregator = new EnterpriseHealthAggregator();

  monitor(store: MonitoringStore): HealthSnapshot {
    const components = store.listComponentsByType("runtime_service");
    return this.aggregator.buildSnapshot("runtime_service", components);
  }
}
