/** X4-10 — Global Dashboard Engine. */

import type { ExecutiveGlobalDashboardConfiguration } from "./configuration.js";
import { WorldwideMetricsAggregator } from "./worldwide-metrics-aggregator.js";
import { ExecutiveWidgetManager } from "./executive-widget-manager.js";
import type {
  DashboardAnalysisInput,
  DashboardSnapshot,
  DashboardWidget,
} from "./types.js";

export class GlobalDashboardEngine {
  private readonly aggregator = new WorldwideMetricsAggregator();
  private readonly widgets = new ExecutiveWidgetManager();

  refreshDashboard(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
    dependencyReadyCount: number,
  ): DashboardSnapshot {
    return this.aggregator.aggregate(input, config, dependencyReadyCount);
  }

  displayWidget(
    widget: DashboardWidget,
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
    dependencyReadyCount: number,
  ): DashboardSnapshot {
    return this.widgets.displayWidget(widget, input, config, dependencyReadyCount);
  }
}
