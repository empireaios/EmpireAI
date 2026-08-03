/** X2-07 — Portfolio risk scoring engine. */

import { appendPreLog } from "./pre-logging.js";
import type { PortfolioRiskRecord, PortfolioRiskScoreSummary, RiskSeverity } from "./types.js";

function severityFromScore(score: number): RiskSeverity {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  if (score >= 20) return "low";
  return "info";
}

export class RiskScoringEngine {
  scoreRecord(probability: number, impact: number): {
    riskScore: number;
    riskSeverity: RiskSeverity;
  } {
    const riskScore = Math.round((probability * impact) / 100);
    return { riskScore, riskSeverity: severityFromScore(riskScore) };
  }

  aggregate(records: PortfolioRiskRecord[]): PortfolioRiskScoreSummary {
    const byCategory = (cat: PortfolioRiskRecord["riskCategory"]) =>
      records.filter((r) => r.riskCategory === cat);

    const avg = (list: PortfolioRiskRecord[]) =>
      list.length === 0
        ? 0
        : Math.round(list.reduce((s, r) => s + r.riskScore, 0) / list.length);

    const enterprise = avg(byCategory("enterprise"));
    const financial = avg(byCategory("financial"));
    const operational = avg(byCategory("operational"));
    const concentration = avg([
      ...byCategory("supplier_concentration"),
      ...byCategory("customer_concentration"),
    ]);
    const company = avg(byCategory("company"));

    const overallPortfolioRiskScore = Math.round(
      enterprise * 0.2 +
        financial * 0.25 +
        operational * 0.2 +
        concentration * 0.2 +
        company * 0.15,
    );

    const companies = new Set(
      records.map((r) => r.companyReference).filter((c): c is string => Boolean(c)),
    );

    const summary: PortfolioRiskScoreSummary = {
      overallPortfolioRiskScore,
      enterpriseRiskScore: enterprise,
      financialRiskScore: financial,
      operationalRiskScore: operational,
      concentrationRiskScore: concentration,
      criticalRiskCount: records.filter((r) => r.riskSeverity === "critical").length,
      emergingRiskCount: records.filter((r) => r.emerging).length,
      companiesAssessed: companies.size,
    };

    appendPreLog({
      event: "risk_calculation",
      level: "info",
      details: `Portfolio risk scored · overall=${overallPortfolioRiskScore} · records=${records.length}`,
    });

    return summary;
  }
}
