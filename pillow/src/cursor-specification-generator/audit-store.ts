import type { CursorSpecification, CursorSpecificationReport, SpecificationHistoryEntry } from "./types.js";

let reportSeq = 0;
let specSeq = 0;
let historySeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `csgen-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextCursorSpecificationId() {
  specSeq += 1;
  return `csgen-spec-${String(specSeq).padStart(4, "0")}`;
}

export function nextHistoryEntryId() {
  historySeq += 1;
  return `csgen-hist-${String(historySeq).padStart(4, "0")}`;
}

export function resetCsgenSequenceForTesting() {
  reportSeq = 0;
  specSeq = 0;
  historySeq = 0;
}

export class AuditStore {
  private reports: CursorSpecificationReport[] = [];
  private specifications: CursorSpecification[] = [];
  private specificationHistory: SpecificationHistoryEntry[] = [];
  private auditTrail: string[] = [];

  seed(reports: CursorSpecificationReport[]) {
    for (const report of reports) {
      this.reports.push(cloneReport(report));
      if (report.generatedCursorSpecification) {
        this.specifications.push(cloneSpec(report.generatedCursorSpecification));
      }
    }
  }

  saveReport(report: CursorSpecificationReport) {
    this.reports.push(cloneReport(report));
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
  }

  saveSpecification(spec: CursorSpecification) {
    this.specifications.push(cloneSpec(spec));
    this.auditTrail.push(`spec_saved:${spec.cursorSpecificationId}@${spec.timestamp}`);
  }

  saveSpecificationHistory(entry: SpecificationHistoryEntry) {
    this.specificationHistory.push({ ...entry, evidence: [...entry.evidence] });
    this.auditTrail.push(`spec_history_saved:${entry.entryId}@${entry.timestamp}`);
  }

  listReports(): CursorSpecificationReport[] {
    return this.reports.map((report) => cloneReport(report));
  }

  listSpecifications(): CursorSpecification[] {
    return this.specifications.map((spec) => cloneSpec(spec));
  }

  getLatestReport(): CursorSpecificationReport | null {
    const latest = this.reports.at(-1);
    return latest ? cloneReport(latest) : null;
  }

  getLatestSpecification(): CursorSpecification | null {
    const latest = this.specifications.at(-1);
    return latest ? cloneSpec(latest) : null;
  }

  reportCount() {
    return this.reports.length;
  }

  specificationCount() {
    return this.specifications.length;
  }

  getSpecificationHistory(limit = 100): SpecificationHistoryEntry[] {
    return this.specificationHistory.slice(-limit).map((entry) => ({ ...entry, evidence: [...entry.evidence] }));
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit);
  }
}

function cloneReport(report: CursorSpecificationReport): CursorSpecificationReport {
  return JSON.parse(JSON.stringify(report)) as CursorSpecificationReport;
}

function cloneSpec(spec: CursorSpecification): CursorSpecification {
  return JSON.parse(JSON.stringify(spec)) as CursorSpecification;
}

export function resetCursorSpecificationGeneratorManagerSequencesForTesting() {
  resetCsgenSequenceForTesting();
}
