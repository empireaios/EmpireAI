/** X2-06 — Executive recommendation engine. */

import { appendEpdLog } from "./epd-logging.js";
import type {
  CapitalAllocationSummary,
  EnterpriseHealthSummary,
  ExecutiveAlert,
  ExecutiveRecommendation,
  PortfolioKpiSummary,
} from "./types.js";

export class ExecutiveRecommendationEngine {
  generateAlerts(input: {
    health: EnterpriseHealthSummary;
    kpis: PortfolioKpiSummary;
    capital: CapitalAllocationSummary;
    alertHealthScoreThreshold: number;
  }): ExecutiveAlert[] {
    const alerts: ExecutiveAlert[] = [];
    const now = new Date().toISOString();

    if (input.health.overallHealthScore < input.alertHealthScoreThreshold) {
      alerts.push({
        alertId: `epd-alert-${Date.now()}-health`,
        timestamp: now,
        severity: input.health.overallHealthScore < 40 ? "critical" : "warning",
        source: "enterprise-health",
        message: `Enterprise health score ${input.health.overallHealthScore} below threshold`,
        structuralSignalOnly: true,
      });
    }
    if (input.capital.availablePoolUnits <= 0) {
      alerts.push({
        alertId: `epd-alert-${Date.now()}-capital`,
        timestamp: now,
        severity: "critical",
        source: "capital-distribution",
        message: "Capital pool has no available units",
        structuralSignalOnly: true,
      });
    }
    if (input.capital.highRiskSignals > 0) {
      alerts.push({
        alertId: `epd-alert-${Date.now()}-risk`,
        timestamp: now,
        severity: "warning",
        source: "capital-risk",
        message: `${input.capital.highRiskSignals} high capital risk signal(s)`,
        structuralSignalOnly: true,
      });
    }
    if (input.kpis.companiesMeasured === 0) {
      alerts.push({
        alertId: `epd-alert-${Date.now()}-kpi`,
        timestamp: now,
        severity: "info",
        source: "portfolio-performance",
        message: "No companies measured for portfolio KPIs yet",
        structuralSignalOnly: true,
      });
    }

    appendEpdLog({
      event: "executive_alerts",
      level: alerts.length > 0 ? "warn" : "info",
      details: `Generated ${alerts.length} executive alert(s)`,
    });

    return alerts;
  }

  generateRecommendations(input: {
    health: EnterpriseHealthSummary;
    kpis: PortfolioKpiSummary;
    capital: CapitalAllocationSummary;
    alerts: ExecutiveAlert[];
  }): ExecutiveRecommendation[] {
    const recommendations: ExecutiveRecommendation[] = [];
    const now = new Date().toISOString();

    if (input.kpis.overallKpiScore < 60) {
      recommendations.push({
        recommendationId: `epd-rec-${Date.now()}-kpi`,
        timestamp: now,
        source: "portfolio-performance",
        recommendationType: "improve_performance",
        rationale: "Portfolio KPI score below executive target band",
        priority: "high",
        structuralSignalOnly: true,
      });
    }
    if (input.capital.availablePoolUnits < 100) {
      recommendations.push({
        recommendationId: `epd-rec-${Date.now()}-pool`,
        timestamp: now,
        source: "capital-distribution",
        recommendationType: "increase_pool",
        rationale: "Increase structural capital pool capacity for growth opportunities",
        priority: "medium",
        structuralSignalOnly: true,
      });
    }
    if (input.health.status === "degraded") {
      recommendations.push({
        recommendationId: `epd-rec-${Date.now()}-health`,
        timestamp: now,
        source: "enterprise-health",
        recommendationType: "stabilize_portfolio",
        rationale: "Enterprise health degraded — review underperforming companies",
        priority: "high",
        structuralSignalOnly: true,
      });
    }
    if (recommendations.length === 0) {
      recommendations.push({
        recommendationId: `epd-rec-${Date.now()}-maintain`,
        timestamp: now,
        source: "executive-dashboard",
        recommendationType: "maintain",
        rationale: "Portfolio oversight healthy — continue scheduled monitoring",
        priority: "low",
        structuralSignalOnly: true,
      });
    }

    appendEpdLog({
      event: "recommendation_generation",
      level: "info",
      details: `Generated ${recommendations.length} executive recommendation(s)`,
    });

    return recommendations;
  }
}
