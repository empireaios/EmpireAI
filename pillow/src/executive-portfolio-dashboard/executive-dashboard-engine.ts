/** X2-06 — Executive dashboard engine. */

import { appendEpdLog } from "./epd-logging.js";
import { EPD_METADATA_VERSION } from "./paths.js";
import type {
  CapitalAllocationSummary,
  CompanySummary,
  DrillDownView,
  EnterpriseHealthSummary,
  ExecutiveAlert,
  ExecutiveRecommendation,
  GrowthSummary,
  PortfolioDashboardSnapshot,
  PortfolioKpiSummary,
  PortfolioSummary,
} from "./types.js";
import type { ExecutiveWidgetManager } from "./executive-widget-manager.js";

export class ExecutiveDashboardEngine {
  private latestSnapshot: PortfolioDashboardSnapshot | null = null;

  constructor(private readonly widgets: ExecutiveWidgetManager) {}

  getLatestSnapshot(): PortfolioDashboardSnapshot | null {
    return this.latestSnapshot;
  }

  buildSnapshot(input: {
    portfolio: PortfolioSummary;
    companies: CompanySummary;
    kpis: PortfolioKpiSummary;
    capital: CapitalAllocationSummary;
    growth: GrowthSummary;
    health: EnterpriseHealthSummary;
    alerts: ExecutiveAlert[];
    recommendations: ExecutiveRecommendation[];
    drillDown?: DrillDownView | null;
  }): PortfolioDashboardSnapshot {
    const widgets = this.widgets.buildWidgets({
      portfolio: input.portfolio,
      companies: input.companies,
      kpis: input.kpis,
      capital: input.capital,
      growth: input.growth,
      health: input.health,
      alertCount: input.alerts.length,
      recommendationCount: input.recommendations.length,
    });

    const snapshot: PortfolioDashboardSnapshot = {
      dashboardId: `epd-dash-${Date.now()}`,
      timestamp: new Date().toISOString(),
      portfolioSummary: input.portfolio,
      companySummary: input.companies,
      portfolioKpiSummary: input.kpis,
      capitalAllocationSummary: input.capital,
      growthSummary: input.growth,
      enterpriseHealthSummary: input.health,
      executiveAlerts: input.alerts,
      executiveRecommendations: input.recommendations,
      widgets,
      drillDown: input.drillDown ?? null,
      validationStatus: "passed",
      metadataVersion: EPD_METADATA_VERSION,
      structuralSignalOnly: true,
      unauthorizedAccess: false,
    };

    this.latestSnapshot = snapshot;
    appendEpdLog({
      event: "dashboard_refresh",
      level: "info",
      details: `Dashboard ${snapshot.dashboardId} refreshed · widgets=${widgets.length}`,
    });
    return snapshot;
  }

  buildDrillDown(input: {
    focus: DrillDownView["focus"];
    focusReference: string;
    snapshot: PortfolioDashboardSnapshot;
  }): DrillDownView {
    const details: string[] = [];
    switch (input.focus) {
      case "company":
        details.push(`Company focus: ${input.focusReference}`);
        details.push(`Total companies: ${input.snapshot.companySummary.totalCompanies}`);
        details.push(`Active companies: ${input.snapshot.companySummary.activeCompanies}`);
        break;
      case "kpi":
        details.push(`KPI focus: ${input.focusReference}`);
        details.push(`Overall KPI: ${input.snapshot.portfolioKpiSummary.overallKpiScore}`);
        details.push(
          `Average performance: ${input.snapshot.portfolioKpiSummary.averagePerformanceScore}`,
        );
        break;
      case "capital":
        details.push(`Capital focus: ${input.focusReference}`);
        details.push(`Available units: ${input.snapshot.capitalAllocationSummary.availablePoolUnits}`);
        details.push(
          `Approved units: ${input.snapshot.capitalAllocationSummary.totalApprovedUnits}`,
        );
        break;
      case "knowledge":
        details.push(`Knowledge focus: ${input.focusReference}`);
        details.push(`Knowledge assets: ${input.snapshot.growthSummary.knowledgeAssets}`);
        details.push(`Shared knowledge: ${input.snapshot.growthSummary.sharedKnowledge}`);
        break;
      default:
        details.push(`Portfolio focus: ${input.focusReference}`);
        details.push(
          `Modules: ${input.snapshot.portfolioSummary.registeredModules} registered`,
        );
        details.push(`Health: ${input.snapshot.enterpriseHealthSummary.overallHealthScore}`);
    }

    return {
      drillDownId: `epd-dd-${Date.now()}`,
      timestamp: new Date().toISOString(),
      focus: input.focus,
      focusReference: input.focusReference,
      details,
      structuralSignalOnly: true,
    };
  }

  resetForTesting(): void {
    this.latestSnapshot = null;
  }
}
