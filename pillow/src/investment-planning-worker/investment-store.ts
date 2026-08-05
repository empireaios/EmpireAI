import type {
  CapitalAllocationRecommendation,
  EvaluatedOpportunity,
  InvestmentPlanningReport,
  InvestmentPlanningWorkerCatalog,
  InvestmentPlanningWorkerEngineRecord,
} from "./types.js";

let seq = 0;

function next(prefix: string): string {
  seq += 1;
  return `${prefix}-${String(seq).padStart(6, "0")}`;
}

export function resetIpwSequenceForTesting() {
  seq = 0;
}

export function nextOpportunityEvalId() {
  return next("ipw-opp");
}
export function nextRecommendationId() {
  return next("ipw-rec");
}
export function nextReportId() {
  return next("ipw-rpt");
}
export function nextEngineRecordId() {
  return next("ipw-eng");
}
export function nextRankingId() {
  return next("ipw-rank");
}

export class InvestmentStore {
  private opportunities: EvaluatedOpportunity[] = [];
  private rankings: EvaluatedOpportunity[] = [];
  private recommendations: CapitalAllocationRecommendation[] = [];
  private reports: InvestmentPlanningReport[] = [];
  private engineRecord: InvestmentPlanningWorkerEngineRecord | null = null;
  private catalog: InvestmentPlanningWorkerCatalog | null = null;
  private latestBusinessId: string | null = null;
  private auditTrail: Array<{ at: string; action: string; details: string }> = [];

  reset() {
    this.opportunities = [];
    this.rankings = [];
    this.recommendations = [];
    this.reports = [];
    this.engineRecord = null;
    this.catalog = null;
    this.latestBusinessId = null;
    this.auditTrail = [];
  }

  addEvaluated(opportunity: EvaluatedOpportunity) {
    this.opportunities.push(opportunity);
  }

  setRankings(ranked: EvaluatedOpportunity[]) {
    this.rankings = ranked.map((r) => ({ ...r }));
  }

  addRecommendations(items: CapitalAllocationRecommendation[]) {
    for (const item of items) this.recommendations.push(item);
  }

  addReport(report: InvestmentPlanningReport) {
    this.reports.push(report);
    this.latestBusinessId = report.capitalBusinessId;
  }

  setEngineRecord(record: InvestmentPlanningWorkerEngineRecord) {
    this.engineRecord = record;
  }

  setCatalog(catalog: InvestmentPlanningWorkerCatalog) {
    this.catalog = catalog;
  }

  appendAudit(action: string, details: string) {
    this.auditTrail.push({ at: new Date().toISOString(), action, details });
  }

  getOpportunities() {
    return this.opportunities.map((o) => ({ ...o }));
  }
  getRankings() {
    return this.rankings.map((r) => ({ ...r }));
  }
  getRecommendations() {
    return this.recommendations.map((r) => ({ ...r }));
  }
  getReports() {
    return this.reports.map((r) => ({ ...r }));
  }
  getLatestReport() {
    return this.reports.length ? { ...this.reports[this.reports.length - 1]! } : null;
  }
  getEngineRecord() {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }
  getCatalog() {
    return this.catalog ? { ...this.catalog } : null;
  }
  getLatestBusinessId() {
    return this.latestBusinessId;
  }
  getAuditTrail() {
    return this.auditTrail.map((a) => ({ ...a }));
  }
}
