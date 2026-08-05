import type {
  ExecutiveDashboard,
  FinancialReport,
  FinancialReportingWorkerCatalog,
  FinancialReportingWorkerEngineRecord,
} from "./types.js";

let seq = 0;

function next(prefix: string): string {
  seq += 1;
  return `${prefix}-${String(seq).padStart(6, "0")}`;
}

export function resetFrwSequenceForTesting() {
  seq = 0;
}

export function nextDashboardId() {
  return next("frw-dash");
}
export function nextReportId() {
  return next("frw-rpt");
}
export function nextEngineRecordId() {
  return next("frw-eng");
}
export function nextWidgetId() {
  return next("frw-wgt");
}

export class ReportingStore {
  private reports: FinancialReport[] = [];
  private dashboards: ExecutiveDashboard[] = [];
  private engineRecord: FinancialReportingWorkerEngineRecord | null = null;
  private catalog: FinancialReportingWorkerCatalog | null = null;
  private latestBusinessId: string | null = null;
  private auditTrail: Array<{ at: string; action: string; details: string }> = [];

  reset() {
    this.reports = [];
    this.dashboards = [];
    this.engineRecord = null;
    this.catalog = null;
    this.latestBusinessId = null;
    this.auditTrail = [];
  }

  addReport(report: FinancialReport) {
    this.reports.push(report);
    this.latestBusinessId = report.capitalBusinessId;
  }

  addDashboard(dashboard: ExecutiveDashboard) {
    this.dashboards.push(dashboard);
  }

  setEngineRecord(record: FinancialReportingWorkerEngineRecord) {
    this.engineRecord = record;
  }

  setCatalog(catalog: FinancialReportingWorkerCatalog) {
    this.catalog = catalog;
  }

  appendAudit(action: string, details: string) {
    this.auditTrail.push({ at: new Date().toISOString(), action, details });
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
