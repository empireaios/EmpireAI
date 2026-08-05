import type { AiInnovationReport, InnovationHistoryEntry } from "./types.js";



let reportSeq = 0;

let historySeq = 0;

let innovationSeq = 0;



export function nextReportId() {

  reportSeq += 1;

  return `aifrt-rpt-${String(reportSeq).padStart(4, "0")}`;

}



export function nextHistoryEntryId() {

  historySeq += 1;

  return `aifrt-hist-${String(historySeq).padStart(4, "0")}`;

}



export function nextInnovationId() {

  innovationSeq += 1;

  return `innov-${String(innovationSeq).padStart(4, "0")}`;

}



export function resetAifrtSequenceForTesting() {

  reportSeq = 0;

  historySeq = 0;

  innovationSeq = 0;

}



export class AuditStore {

  private reports: AiInnovationReport[] = [];

  private history: InnovationHistoryEntry[] = [];

  private auditTrail: string[] = [];



  seed(reports: AiInnovationReport[]) {

    for (const report of reports) {

      this.reports.push({ ...report });

    }

  }



  saveReport(report: AiInnovationReport) {

    this.reports.push({ ...report });

    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);

  }



  saveHistory(entry: InnovationHistoryEntry) {

    this.history.push({ ...entry });

    this.auditTrail.push(`history_saved:${entry.entryId}@${entry.timestamp}`);

  }



  listReports() {

    return this.reports.map((r) => ({ ...r }));

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



  getInnovationHistory(limit = 100) {

    return this.history.slice(-limit).map((h) => ({ ...h }));

  }



  getAuditTrail(limit = 100) {

    return this.auditTrail.slice(-limit);

  }

}



export function resetAiInnovationFactoryManagerSequencesForTesting() {

  resetAifrtSequenceForTesting();

}


