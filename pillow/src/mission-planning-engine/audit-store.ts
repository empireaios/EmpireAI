import type { MissionPlan, MissionPlanningReport, PlanningHistoryEntry } from "./types.js";

let reportSeq = 0;
let planSeq = 0;
let historySeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `mpeng-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextPlanId() {
  planSeq += 1;
  return `mpeng-plan-${String(planSeq).padStart(4, "0")}`;
}

export function nextHistoryEntryId() {
  historySeq += 1;
  return `mpeng-hist-${String(historySeq).padStart(4, "0")}`;
}

export function resetMpengSequenceForTesting() {
  reportSeq = 0;
  planSeq = 0;
  historySeq = 0;
}

export class AuditStore {
  private reports: MissionPlanningReport[] = [];
  private plans: MissionPlan[] = [];
  private planningHistory: PlanningHistoryEntry[] = [];
  private auditTrail: string[] = [];

  seed(reports: MissionPlanningReport[]) {
    for (const report of reports) {
      this.reports.push(cloneReport(report));
      for (const plan of report.plans) {
        this.plans.push(clonePlan(plan));
      }
    }
  }

  saveReport(report: MissionPlanningReport) {
    this.reports.push(cloneReport(report));
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
  }

  savePlan(plan: MissionPlan) {
    this.plans.push(clonePlan(plan));
    this.auditTrail.push(`plan_saved:${plan.planId}@${plan.timestamp}`);
  }

  savePlanningHistory(entry: PlanningHistoryEntry) {
    this.planningHistory.push({ ...entry, evidence: [...entry.evidence] });
    this.auditTrail.push(`planning_saved:${entry.entryId}@${entry.timestamp}`);
  }

  listReports(): MissionPlanningReport[] {
    return this.reports.map((report) => cloneReport(report));
  }

  listPlans(): MissionPlan[] {
    return this.plans.map((plan) => clonePlan(plan));
  }

  getLatestReport(): MissionPlanningReport | null {
    const latest = this.reports.at(-1);
    return latest ? cloneReport(latest) : null;
  }

  getLatestPlan(): MissionPlan | null {
    const latest = this.plans.at(-1);
    return latest ? clonePlan(latest) : null;
  }

  reportCount() {
    return this.reports.length;
  }

  planCount() {
    return this.plans.length;
  }

  getPlanningHistory(limit = 100): PlanningHistoryEntry[] {
    return this.planningHistory.slice(-limit).map((entry) => ({ ...entry, evidence: [...entry.evidence] }));
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit);
  }
}

function cloneReport(report: MissionPlanningReport): MissionPlanningReport {
  return JSON.parse(JSON.stringify(report)) as MissionPlanningReport;
}

function clonePlan(plan: MissionPlan): MissionPlan {
  return JSON.parse(JSON.stringify(plan)) as MissionPlan;
}

export function resetMissionPlanningEngineManagerSequencesForTesting() {
  resetMpengSequenceForTesting();
}
