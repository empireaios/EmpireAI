import type {
  CertificationHistoryEntry,
  FinalRepositoryConstitutionalCertification,
  ProgrammeCertification,
  ProgrammeCertificationReport,
} from "./types.js";

let reportSeq = 0;
let certSeq = 0;
let finalSeq = 0;
let historySeq = 0;
let recommendationSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `pcfct-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextCertificationId() {
  certSeq += 1;
  return `pcfct-cert-${String(certSeq).padStart(4, "0")}`;
}

export function nextFinalCertificationId() {
  finalSeq += 1;
  return `pcfct-final-${String(finalSeq).padStart(4, "0")}`;
}

export function nextHistoryEntryId() {
  historySeq += 1;
  return `pcfct-hist-${String(historySeq).padStart(4, "0")}`;
}

export function nextRecommendationId() {
  recommendationSeq += 1;
  return `pcfct-rec-${String(recommendationSeq).padStart(4, "0")}`;
}

export function resetPcfctSequenceForTesting() {
  reportSeq = 0;
  certSeq = 0;
  finalSeq = 0;
  historySeq = 0;
  recommendationSeq = 0;
}

export class AuditStore {
  private reports: ProgrammeCertificationReport[] = [];
  private certifications: ProgrammeCertification[] = [];
  private finalCertifications: FinalRepositoryConstitutionalCertification[] = [];
  private certificationHistory: CertificationHistoryEntry[] = [];
  private auditTrail: string[] = [];

  seed(reports: ProgrammeCertificationReport[]) {
    for (const report of reports) {
      this.reports.push(cloneReport(report));
      this.certifications.push(cloneCertification(report.programmeCertification));
    }
  }

  saveReport(report: ProgrammeCertificationReport) {
    this.reports.push(cloneReport(report));
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
  }

  saveCertification(certification: ProgrammeCertification) {
    const existing = this.certifications.findIndex((c) => c.programmeCode === certification.programmeCode);
    if (existing >= 0) {
      this.certifications[existing] = cloneCertification(certification);
    } else {
      this.certifications.push(cloneCertification(certification));
    }
    this.auditTrail.push(`certification_saved:${certification.certificationId}@${certification.timestamp}`);
  }

  saveFinalCertification(final: FinalRepositoryConstitutionalCertification) {
    this.finalCertifications.push(cloneFinal(final));
    this.auditTrail.push(`final_certification_saved:${final.reportId}@${final.repositoryCertificationTimestamp}`);
  }

  saveCertificationHistory(entry: CertificationHistoryEntry) {
    this.certificationHistory.push({ ...entry, evidence: [...entry.evidence] });
    this.auditTrail.push(`certification_history_saved:${entry.entryId}@${entry.timestamp}`);
  }

  listReports(): ProgrammeCertificationReport[] {
    return this.reports.map((report) => cloneReport(report));
  }

  listCertifications(): ProgrammeCertification[] {
    return this.certifications.map((cert) => cloneCertification(cert));
  }

  getCertification(programmeCode: string): ProgrammeCertification | null {
    const cert = this.certifications.find((c) => c.programmeCode === programmeCode);
    return cert ? cloneCertification(cert) : null;
  }

  getLatestReport(): ProgrammeCertificationReport | null {
    const latest = this.reports.at(-1);
    return latest ? cloneReport(latest) : null;
  }

  getLatestFinalCertification(): FinalRepositoryConstitutionalCertification | null {
    const latest = this.finalCertifications.at(-1);
    return latest ? cloneFinal(latest) : null;
  }

  reportCount() {
    return this.reports.length;
  }

  certificationCount() {
    return this.certifications.length;
  }

  getCertificationHistory(limit = 100): CertificationHistoryEntry[] {
    return this.certificationHistory.slice(-limit).map((entry) => ({ ...entry, evidence: [...entry.evidence] }));
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit);
  }

  hasAllProgrammeCertifications(requiredCodes: string[]): boolean {
    return requiredCodes.every((code) => this.certifications.some((c) => c.programmeCode === code));
  }
}

function cloneReport(report: ProgrammeCertificationReport): ProgrammeCertificationReport {
  return JSON.parse(JSON.stringify(report)) as ProgrammeCertificationReport;
}

function cloneCertification(cert: ProgrammeCertification): ProgrammeCertification {
  return JSON.parse(JSON.stringify(cert)) as ProgrammeCertification;
}

function cloneFinal(final: FinalRepositoryConstitutionalCertification): FinalRepositoryConstitutionalCertification {
  return JSON.parse(JSON.stringify(final)) as FinalRepositoryConstitutionalCertification;
}

export function resetProgrammeCertificationFactoryManagerSequencesForTesting() {
  resetPcfctSequenceForTesting();
}
