import type { MonitoringStore } from "./monitoring-store.js";
import { EnterpriseHealthAggregator } from "./enterprise-health-aggregator.js";
import type { HealthSnapshot } from "./types.js";

/** Tool health from stored evidence only — no fabrication. */
export class ToolMonitor {
  private readonly aggregator = new EnterpriseHealthAggregator();

  monitor(store: MonitoringStore): HealthSnapshot {
    const components = store.listComponentsByType("tool");
    return this.aggregator.buildSnapshot("tool", components);
  }
}
