import type {
  CapitalRisk,
  CapitalRiskReport,
  CapitalRiskWorkerCatalog,
  CapitalRiskWorkerEngineRecord,
  EnterpriseRiskDashboard,
} from "./types.js";

let seq = 0;

function next(prefix: string): string {
  seq += 1;
  return `${prefix}-${String(seq).padStart(6, "0")}`;
}

export function resetCaprwSequenceForTesting() {
  seq = 0;
}

export function nextRiskId() {
  return next("caprw-rsk");
}
export function nextReportId() {
  return next("caprw-rpt");
}
export function nextDashboardId() {
  return next("caprw-dash");
}
export function nextEngineRecordId() {
  return next("caprw-eng");
}
export function nextMitigationId() {
  return next("caprw-mit");
}
export function nextSummaryId() {
  return next("caprw-sum");
}
export function nextWidgetId() {
  return next("caprw-wgt");
}

export class RiskStore {
  private risks: CapitalRisk[] = [];
  private reports: CapitalRiskReport[] = [];
  private dashboards: EnterpriseRiskDashboard[] = [];
  private engineRecord: CapitalRiskWorkerEngineRecord | null = null;
  private catalog: CapitalRiskWorkerCatalog | null = null;
  private latestBusinessId: string | null = null;
  private auditTrail: Array<{ at: string; action: string; details: string }> = [];

  reset() {
    this.risks = [];
    this.reports = [];
    this.dashboards = [];
    this.engineRecord = null;
    this.catalog = null;
    this.latestBusinessId = null;
    this.auditTrail = [];
  }

  addRisk(risk: CapitalRisk) {
    this.risks.push(risk);
  }

  addRisks(risks: CapitalRisk[]) {
    for (const risk of risks) this.risks.push(risk);
  }

  addReport(report: CapitalRiskReport) {
    this.reports.push(report);
    this.latestBusinessId = report.capitalBusinessId;
  }

  addDashboard(dashboard: EnterpriseRiskDashboard) {
    this.dashboards.push(dashboard);
  }

  setEngineRecord(record: CapitalRiskWorkerEngineRecord) {
    this.engineRecord = record;
  }

  setCatalog(catalog: CapitalRiskWorkerCatalog) {
    this.catalog = catalog;
  }

  appendAudit(action: string, details: string) {
    this.auditTrail.push({ at: new Date().toISOString(), action, details });
  }

  getRisks() {
    return this.risks.map((r) => ({ ...r }));
  }

  getReports() {
    return this.reports.map((r) => ({ ...r }));
  }

  getLatestReport() {
    return this.reports.length ? { ...this.reports[this.reports.length - 1]! } : null;
  }

  getDashboards() {
    return this.dashboards.map((d) => ({ ...d }));
  }

  getLatestDashboard() {
    return this.dashboards.length ? { ...this.dashboards[this.dashboards.length - 1]! } : null;
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
