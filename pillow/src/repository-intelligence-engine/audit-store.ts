import type { RepositoryIntelligenceReport, RepositoryKnowledgeHistoryEntry } from "./types.js";

let reportSeq = 0;
let historySeq = 0;
let snapshotSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `rieng-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextHistoryEntryId() {
  historySeq += 1;
  return `rieng-hist-${String(historySeq).padStart(4, "0")}`;
}

export function nextSnapshotId() {
  snapshotSeq += 1;
  return `rieng-snap-${String(snapshotSeq).padStart(4, "0")}`;
}

export function resetRiengSequenceForTesting() {
  reportSeq = 0;
  historySeq = 0;
  snapshotSeq = 0;
}

export class AuditStore {
  private reports: RepositoryIntelligenceReport[] = [];
  private knowledgeHistory: RepositoryKnowledgeHistoryEntry[] = [];
  private auditTrail: string[] = [];

  seed(reports: RepositoryIntelligenceReport[]) {
    for (const report of reports) {
      this.reports.push(cloneReport(report));
    }
  }

  saveReport(report: RepositoryIntelligenceReport) {
    this.reports.push(cloneReport(report));
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
  }

  saveKnowledgeHistory(entry: RepositoryKnowledgeHistoryEntry) {
    this.knowledgeHistory.push({ ...entry, evidence: [...entry.evidence] });
    this.auditTrail.push(`knowledge_saved:${entry.entryId}@${entry.timestamp}`);
  }

  listReports(): RepositoryIntelligenceReport[] {
    return this.reports.map((report) => cloneReport(report));
  }

  getLatestReport(): RepositoryIntelligenceReport | null {
    const latest = this.reports.at(-1);
    return latest ? cloneReport(latest) : null;
  }

  getLatestReportId(): string | null {
    return this.getLatestReport()?.reportId ?? null;
  }

  reportCount() {
    return this.reports.length;
  }

  getRepositoryKnowledgeHistory(limit = 100): RepositoryKnowledgeHistoryEntry[] {
    return this.knowledgeHistory.slice(-limit).map((entry) => ({ ...entry, evidence: [...entry.evidence] }));
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit);
  }
}

function cloneReport(report: RepositoryIntelligenceReport): RepositoryIntelligenceReport {
  return JSON.parse(JSON.stringify(report)) as RepositoryIntelligenceReport;
}

export function resetRepositoryIntelligenceEngineManagerSequencesForTesting() {
  resetRiengSequenceForTesting();
}
