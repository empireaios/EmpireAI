import type { RecoveryHistoryEntry, RecoveryPlan, RecoveryReport, RecoverySpecification } from "./types.js";

let reportSeq = 0;
let planSeq = 0;
let specSeq = 0;
let historySeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `irpln-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextRecoveryId() {
  planSeq += 1;
  return `irpln-rec-${String(planSeq).padStart(4, "0")}`;
}

export function nextRecoverySpecificationId() {
  specSeq += 1;
  return `irpln-rspec-${String(specSeq).padStart(4, "0")}`;
}

export function nextHistoryEntryId() {
  historySeq += 1;
  return `irpln-hist-${String(historySeq).padStart(4, "0")}`;
}

export function resetIrplnSequenceForTesting() {
  reportSeq = 0;
  planSeq = 0;
  specSeq = 0;
  historySeq = 0;
}

export class AuditStore {
  private reports: RecoveryReport[] = [];
  private plans: RecoveryPlan[] = [];
  private recoverySpecifications: RecoverySpecification[] = [];
  private recoveryHistory: RecoveryHistoryEntry[] = [];
  private auditTrail: string[] = [];

  seed(reports: RecoveryReport[]) {
    for (const report of reports) {
      this.reports.push(cloneReport(report));
      for (const plan of report.plans) {
        this.plans.push(clonePlan(plan));
      }
      for (const spec of report.recoverySpecifications) {
        this.recoverySpecifications.push(cloneSpec(spec));
      }
    }
  }

  saveReport(report: RecoveryReport) {
    this.reports.push(cloneReport(report));
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
  }

  savePlan(plan: RecoveryPlan) {
    this.plans.push(clonePlan(plan));
    this.auditTrail.push(`plan_saved:${plan.recoveryId}@${plan.timestamp}`);
  }

  saveRecoverySpecification(spec: RecoverySpecification) {
    this.recoverySpecifications.push(cloneSpec(spec));
    this.auditTrail.push(`rspec_saved:${spec.recoverySpecificationId}@${spec.timestamp}`);
  }

  saveRecoveryHistory(entry: RecoveryHistoryEntry) {
    this.recoveryHistory.push({ ...entry, evidence: [...entry.evidence] });
    this.auditTrail.push(`recovery_history_saved:${entry.entryId}@${entry.timestamp}`);
  }

  listReports(): RecoveryReport[] {
    return this.reports.map((report) => cloneReport(report));
  }

  listPlans(): RecoveryPlan[] {
    return this.plans.map((plan) => clonePlan(plan));
  }

  getLatestReport(): RecoveryReport | null {
    const latest = this.reports.at(-1);
    return latest ? cloneReport(latest) : null;
  }

  getLatestPlan(): RecoveryPlan | null {
    const latest = this.plans.at(-1);
    return latest ? clonePlan(latest) : null;
  }

  getLatestRecoverySpecification(): RecoverySpecification | null {
    const latest = this.recoverySpecifications.at(-1);
    return latest ? cloneSpec(latest) : null;
  }

  reportCount() {
    return this.reports.length;
  }

  planCount() {
    return this.plans.length;
  }

  getRecoveryHistory(limit = 100): RecoveryHistoryEntry[] {
    return this.recoveryHistory.slice(-limit).map((entry) => ({ ...entry, evidence: [...entry.evidence] }));
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit);
  }
}

function cloneReport(report: RecoveryReport): RecoveryReport {
  return JSON.parse(JSON.stringify(report)) as RecoveryReport;
}

function clonePlan(plan: RecoveryPlan): RecoveryPlan {
  return JSON.parse(JSON.stringify(plan)) as RecoveryPlan;
}

function cloneSpec(spec: RecoverySpecification): RecoverySpecification {
  return JSON.parse(JSON.stringify(spec)) as RecoverySpecification;
}

export function resetImplementationRecoveryPlannerManagerSequencesForTesting() {
  resetIrplnSequenceForTesting();
}
