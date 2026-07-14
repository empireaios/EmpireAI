import {
  assembleGrandKingExecutiveCockpit,
  buildFallbackGrandKingExecutiveCockpit,
  getCockpitConfiguration,
  getCockpitAuditHistory,
} from "@empireai/pillow";
import type {
  GrandKingExecutiveCockpit,
  ExecutiveDashboardWidget,
  CockpitEngineConfiguration,
} from "@empireai/pillow";

/** Fallback Grand King Executive Cockpit when Pillow session is unavailable. */
export function collectGrandKingExecutiveCockpitSnapshot() {
  const cockpit = buildFallbackGrandKingExecutiveCockpit();
  return {
    computedAt: new Date().toISOString(),
    missionId: "E5-15",
    live: false,
    grandKingExecutiveCockpit: cockpit,
  };
}

export function getGovernanceChainStatus(): {
  computedAt: string;
  governanceChainScore: number;
  governanceEnginesActive: number;
  governanceEnginesTotal: number;
  governanceChain: GrandKingExecutiveCockpit["governanceChain"];
} {
  const cockpit = buildFallbackGrandKingExecutiveCockpit();
  return {
    computedAt: new Date().toISOString(),
    governanceChainScore: cockpit.governanceChainScore,
    governanceEnginesActive: cockpit.governanceEnginesActive,
    governanceEnginesTotal: cockpit.governanceEnginesTotal,
    governanceChain: cockpit.governanceChain,
  };
}

export function getGrandKingExecutiveReport() {
  const cockpit = buildFallbackGrandKingExecutiveCockpit();
  return {
    computedAt: new Date().toISOString(),
    report: cockpit.executiveReport,
    metrics: cockpit.metrics,
    monitoring: cockpit.monitoringStatus,
  };
}

export function getExecutiveDashboardWidgets(): {
  computedAt: string;
  widgets: ExecutiveDashboardWidget[];
  totalWidgetCount: number;
  healthyWidgetCount: number;
} {
  const cockpit = buildFallbackGrandKingExecutiveCockpit();
  return {
    computedAt: new Date().toISOString(),
    widgets: cockpit.executiveDashboardWidgets,
    totalWidgetCount: cockpit.totalWidgetCount,
    healthyWidgetCount: cockpit.healthyWidgetCount,
  };
}

export function getGrandKingExecutiveCockpitHistory(): {
  computedAt: string;
  auditHistory: ReturnType<typeof getCockpitAuditHistory>;
  configuration: CockpitEngineConfiguration;
} {
  return {
    computedAt: new Date().toISOString(),
    auditHistory: getCockpitAuditHistory(100),
    configuration: getCockpitConfiguration(),
  };
}

export function getGrandKingExecutiveCockpitHealth() {
  const cockpit = buildFallbackGrandKingExecutiveCockpit();
  return {
    computedAt: new Date().toISOString(),
    health: cockpit.healthStatus,
    metrics: cockpit.metrics,
    engineHealth: cockpit.engineHealth,
    cockpitHealth: cockpit.cockpitHealth,
  };
}

export { assembleGrandKingExecutiveCockpit, buildFallbackGrandKingExecutiveCockpit };
