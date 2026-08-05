import type { MonitoringStore } from "./monitoring-store.js";
import { EnterpriseHealthAggregator } from "./enterprise-health-aggregator.js";
import type { HealthSnapshot } from "./types.js";

/** Factory health from stored evidence only — no fabrication. */
export class FactoryMonitor {
  private readonly aggregator = new EnterpriseHealthAggregator();

  monitor(store: MonitoringStore): HealthSnapshot {
    const components = store.listComponentsByType("factory");
    return this.aggregator.buildSnapshot("factory", components);
  }
}
