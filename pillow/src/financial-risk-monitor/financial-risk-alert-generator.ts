/** R3-15 — Financial risk alert generator. */

import type { FinancialRiskMonitorConfiguration } from "./configuration.js";
import type { FinancialRiskAlert, FinancialRiskRecord } from "./types.js";
import type { HealthAssessment } from "./financial-health-engine.js";

export class FinancialRiskAlertGenerator {
  generateFromHealth(
    record: FinancialRiskRecord,
    health: HealthAssessment,
    config: FinancialRiskMonitorConfiguration,
  ): FinancialRiskAlert[] {
    const alerts: FinancialRiskAlert[] = [];

    if (!config.alertRulesEnabled) return alerts;

    if (health.liquidityStatus === "critical") {
      alerts.push(this.buildAlert(record, "critical", "liquidity", "Critical liquidity risk detected", true));
    } else if (health.liquidityStatus === "warning") {
      alerts.push(this.buildAlert(record, "high", "liquidity", "Liquidity risk warning", false));
    }

    if (health.profitabilityStatus === "critical") {
      alerts.push(this.buildAlert(record, "critical", "profitability", "Critical profitability risk detected", true));
    } else if (health.profitabilityStatus === "warning") {
      alerts.push(this.buildAlert(record, "medium", "profitability", "Profitability risk warning", false));
    }

    if (health.budgetStatus === "critical") {
      alerts.push(this.buildAlert(record, "high", "budget", "Budget threshold breach detected", true));
    } else if (health.budgetStatus === "warning") {
      alerts.push(this.buildAlert(record, "medium", "budget", "Budget utilization warning", false));
    }

    if (record.riskScore >= config.compositeRiskThreshold) {
      alerts.push(this.buildAlert(
        record,
        record.riskScore >= config.compositeRiskThreshold * 1.2 ? "critical" : "high",
        "composite",
        `Composite risk score ${record.riskScore} exceeds threshold ${config.compositeRiskThreshold}`,
        true,
      ));
    }

    return alerts;
  }

  detectThresholdBreaches(
    record: FinancialRiskRecord,
    config: FinancialRiskMonitorConfiguration,
  ): FinancialRiskAlert[] {
    const alerts: FinancialRiskAlert[] = [];

    for (const rule of config.riskThresholds) {
      const categoryScore = this.getCategoryScore(record, rule.category);
      if (categoryScore >= rule.criticalThreshold) {
        alerts.push(this.buildAlert(
          record,
          "critical",
          rule.category,
          `${rule.label}: critical threshold breached (${categoryScore} >= ${rule.criticalThreshold})`,
          true,
        ));
      } else if (categoryScore >= rule.warningThreshold) {
        alerts.push(this.buildAlert(
          record,
          "medium",
          rule.category,
          `${rule.label}: warning threshold breached (${categoryScore} >= ${rule.warningThreshold})`,
          true,
        ));
      }
    }

    return alerts;
  }

  private getCategoryScore(record: FinancialRiskRecord, category: string): number {
    switch (category) {
      case "liquidity":
        return record.liquidityStatus === "critical" ? 80 : record.liquidityStatus === "warning" ? 50 : 20;
      case "profitability":
        return record.profitabilityStatus === "critical" ? 80 : record.profitabilityStatus === "warning" ? 50 : 20;
      case "budget":
        return record.budgetStatus === "critical" ? 80 : record.budgetStatus === "warning" ? 50 : 20;
      case "composite":
        return record.riskScore;
      default:
        return record.riskScore;
    }
  }

  private buildAlert(
    record: FinancialRiskRecord,
    severity: FinancialRiskAlert["severity"],
    category: string,
    description: string,
    thresholdBreached: boolean,
  ): FinancialRiskAlert {
    return {
      alertId: `frm-alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      severity,
      category,
      description,
      financialRiskId: record.financialRiskId,
      thresholdBreached,
    };
  }
}
