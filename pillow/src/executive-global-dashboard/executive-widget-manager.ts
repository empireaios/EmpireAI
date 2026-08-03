/** X4-10 — Executive Widget Manager. */

import type { ExecutiveGlobalDashboardConfiguration } from "./configuration.js";
import {
  buildDashboardSnapshot,
  computeStructuralDashboardSignals,
} from "./structural-signals.js";
import type {
  DashboardAnalysisInput,
  DashboardSnapshot,
  DashboardWidget,
} from "./types.js";

export class ExecutiveWidgetManager {
  displayWidget(
    widget: DashboardWidget,
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
    dependencyReadyCount: number,
  ): DashboardSnapshot {
    if (!config.dashboardWidgetConfigurationEnabled) {
      throw new Error("Dashboard widget configuration disabled");
    }
    const signals = computeStructuralDashboardSignals(
      { ...input, widgetFocus: widget },
      config,
      dependencyReadyCount,
    );
    return buildDashboardSnapshot({
      ...signals,
      recommendationSummary: `Display widget ${widget} for ${signals.companyReference}`,
    });
  }
}
