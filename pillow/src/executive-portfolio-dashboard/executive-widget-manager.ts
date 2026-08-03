/** X2-06 — Executive widget manager. */

import type {
  CapitalAllocationSummary,
  CompanySummary,
  DashboardWidget,
  EnterpriseHealthSummary,
  GrowthSummary,
  PortfolioKpiSummary,
  PortfolioSummary,
} from "./types.js";

export class ExecutiveWidgetManager {
  buildWidgets(input: {
    portfolio: PortfolioSummary;
    companies: CompanySummary;
    kpis: PortfolioKpiSummary;
    capital: CapitalAllocationSummary;
    growth: GrowthSummary;
    health: EnterpriseHealthSummary;
    alertCount: number;
    recommendationCount: number;
  }): DashboardWidget[] {
    const now = new Date().toISOString();
    return [
      {
        widgetId: "epd-w-portfolio",
        widgetType: "portfolio_summary",
        title: "Portfolio Modules",
        value: input.portfolio.registeredModules,
        unit: "modules",
        status: input.portfolio.activeModules > 0 ? "ok" : "warning",
        refreshedAt: now,
      },
      {
        widgetId: "epd-w-companies",
        widgetType: "company_performance",
        title: "Companies",
        value: input.companies.totalCompanies,
        unit: "companies",
        status: input.companies.activeCompanies > 0 ? "ok" : "empty",
        refreshedAt: now,
      },
      {
        widgetId: "epd-w-kpis",
        widgetType: "portfolio_kpis",
        title: "Overall KPI Score",
        value: input.kpis.overallKpiScore,
        unit: "score",
        status: input.kpis.overallKpiScore >= 60 ? "ok" : "warning",
        refreshedAt: now,
      },
      {
        widgetId: "epd-w-capital",
        widgetType: "capital_allocation",
        title: "Available Capital Units",
        value: input.capital.availablePoolUnits,
        unit: "units",
        status: input.capital.availablePoolUnits > 0 ? "ok" : "critical",
        refreshedAt: now,
      },
      {
        widgetId: "epd-w-growth",
        widgetType: "portfolio_growth",
        title: "Growth Index",
        value: input.growth.averageGrowthIndex,
        unit: "index",
        status: input.growth.averageGrowthIndex >= 50 ? "ok" : "warning",
        refreshedAt: now,
      },
      {
        widgetId: "epd-w-health",
        widgetType: "company_health",
        title: "Enterprise Health",
        value: input.health.overallHealthScore,
        unit: "score",
        status:
          input.health.status === "healthy"
            ? "ok"
            : input.health.status === "degraded"
              ? "warning"
              : "critical",
        refreshedAt: now,
      },
      {
        widgetId: "epd-w-alerts",
        widgetType: "enterprise_alerts",
        title: "Executive Alerts",
        value: input.alertCount,
        unit: "alerts",
        status: input.alertCount === 0 ? "ok" : input.alertCount > 3 ? "critical" : "warning",
        refreshedAt: now,
      },
      {
        widgetId: "epd-w-recs",
        widgetType: "enterprise_recommendations",
        title: "Recommendations",
        value: input.recommendationCount,
        unit: "items",
        status: input.recommendationCount > 0 ? "ok" : "empty",
        refreshedAt: now,
      },
      {
        widgetId: "epd-w-summary",
        widgetType: "executive_summary",
        title: "Executive Summary",
        value: `${input.companies.totalCompanies} companies · KPI ${input.kpis.overallKpiScore}`,
        unit: "text",
        status: "ok",
        refreshedAt: now,
      },
    ];
  }
}
