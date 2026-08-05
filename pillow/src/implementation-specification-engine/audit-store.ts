import type { ImplementationSpecification, ImplementationSpecificationReport, SpecificationHistoryEntry } from "./types.js";

let reportSeq = 0;
let historySeq = 0;
let specificationSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `iseng-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextHistoryEntryId() {
  historySeq += 1;
  return `iseng-hist-${String(historySeq).padStart(4, "0")}`;
}

export function nextSpecificationId() {
  specificationSeq += 1;
  return `iseng-spec-${String(specificationSeq).padStart(4, "0")}`;
}

export function resetIsengSequenceForTesting() {
  reportSeq = 0;
  historySeq = 0;
  specificationSeq = 0;
}

export class AuditStore {
  private reports: ImplementationSpecificationReport[] = [];
  private specifications: ImplementationSpecification[] = [];
  private history: SpecificationHistoryEntry[] = [];
  private auditTrail: string[] = [];

  seed(reports: ImplementationSpecificationReport[]) {
    for (const report of reports) {
      this.reports.push({ ...report });
      for (const spec of report.specifications) {
        this.specifications.push({ ...spec });
      }
    }
  }

  saveReport(report: ImplementationSpecificationReport) {
    this.reports.push({ ...report });
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
  }

  saveSpecification(specification: ImplementationSpecification) {
    this.specifications.push({ ...specification });
    this.auditTrail.push(`specification_saved:${specification.specificationId}@${specification.timestamp}`);
  }

  saveHistory(entry: SpecificationHistoryEntry) {
    this.history.push({ ...entry });
    this.auditTrail.push(`history_saved:${entry.entryId}@${entry.timestamp}`);
  }

  listReports() {
    return this.reports.map((r) => ({ ...r }));
  }

  listSpecifications() {
    return this.specifications.map((s) => ({ ...s }));
  }

  getLatestReport() {
    return this.reports.at(-1) ?? null;
  }

  getLatestReportId() {
    return this.getLatestReport()?.reportId ?? null;
  }

  reportCount() {
    return this.reports.length;
  }

  specificationCount() {
    return this.specifications.length;
  }

  getSpecificationHistory(limit = 100) {
    return this.history.slice(-limit).map((h) => ({ ...h }));
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit);
  }
}

export function resetImplementationSpecificationEngineManagerSequencesForTesting() {
  resetIsengSequenceForTesting();
}
