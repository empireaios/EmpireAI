import type {
  AwarenessFinding,
  EscalationRecord,
  PersistentAwarenessState,
  SituationalAwarenessReport,
} from "./types.js";

let reportSeq = 0;
let stateSeq = 0;
let findingSeq = 0;
let escalationSeq = 0;
let recommendationSeq = 0;
let investigationSeq = 0;
let cycleSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `eesae-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextStateId() {
  stateSeq += 1;
  return `eesae-state-${String(stateSeq).padStart(4, "0")}`;
}

export function nextFindingId() {
  findingSeq += 1;
  return `eesae-find-${String(findingSeq).padStart(4, "0")}`;
}

export function nextEscalationId() {
  escalationSeq += 1;
  return `eesae-esc-${String(escalationSeq).padStart(4, "0")}`;
}

export function nextRecommendationId() {
  recommendationSeq += 1;
  return `eesae-rec-${String(recommendationSeq).padStart(4, "0")}`;
}

export function nextInvestigationId() {
  investigationSeq += 1;
  return `eesae-inv-${String(investigationSeq).padStart(4, "0")}`;
}

export function nextCycleId() {
  cycleSeq += 1;
  return `eesae-cycle-${String(cycleSeq).padStart(4, "0")}`;
}

export function resetEesaeSequenceForTesting() {
  reportSeq = 0;
  stateSeq = 0;
  findingSeq = 0;
  escalationSeq = 0;
  recommendationSeq = 0;
  investigationSeq = 0;
  cycleSeq = 0;
}

function cloneFinding(f: AwarenessFinding): AwarenessFinding {
  return {
    ...f,
    evidence: [...f.evidence],
    probableRootCauses: [...f.probableRootCauses],
    recommendedActions: [...f.recommendedActions],
  };
}

function cloneState(state: PersistentAwarenessState): PersistentAwarenessState {
  return {
    ...state,
    openFindings: state.openFindings.map(cloneFinding),
    escalations: state.escalations.map((e) => ({ ...e })),
    recommendations: state.recommendations.map((r) => ({ ...r, evidenceRefs: [...r.evidenceRefs], findingIds: [...r.findingIds] })),
    longTermEmpireValueNotes: [...state.longTermEmpireValueNotes],
    evidenceRefs: [...state.evidenceRefs],
  };
}

function cloneReport(report: SituationalAwarenessReport): SituationalAwarenessReport {
  return {
    ...report,
    findings: report.findings.map(cloneFinding),
    recommendations: report.recommendations.map((r) => ({ ...r, evidenceRefs: [...r.evidenceRefs], findingIds: [...r.findingIds] })),
    domainSummaries: report.domainSummaries.map((d) => ({ ...d, evidenceRefs: [...d.evidenceRefs], notes: [...d.notes] })),
    historyRefs: [...report.historyRefs],
    boundaryValidation: { ...report.boundaryValidation, issues: [...report.boundaryValidation.issues] },
    governanceValidation: { ...report.governanceValidation, issues: [...report.governanceValidation.issues] },
    validation: { ...report.validation, errors: [...report.validation.errors], warnings: [...report.validation.warnings] },
  };
}

export class AuditStore {
  private reports: SituationalAwarenessReport[] = [];
  private awarenessStates: PersistentAwarenessState[] = [];
  private auditTrail: string[] = [];

  seed(reports: SituationalAwarenessReport[]) {
    for (const report of reports) {
      this.reports.push(cloneReport(report));
    }
  }

  saveReport(report: SituationalAwarenessReport) {
    this.reports.push(cloneReport(report));
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
  }

  saveAwarenessState(state: PersistentAwarenessState) {
    this.awarenessStates.push(cloneState(state));
    this.auditTrail.push(`awareness_state_saved:${state.stateId}@${state.timestamp}`);
  }

  listReports(): SituationalAwarenessReport[] {
    return this.reports.map(cloneReport);
  }

  listAwarenessStates(): PersistentAwarenessState[] {
    return this.awarenessStates.map(cloneState);
  }

  getLatestReport(): SituationalAwarenessReport | null {
    const latest = this.reports.at(-1);
    return latest ? cloneReport(latest) : null;
  }

  getLatestAwarenessState(): PersistentAwarenessState | null {
    const latest = this.awarenessStates.at(-1);
    return latest ? cloneState(latest) : null;
  }

  getPriorAwarenessState(): PersistentAwarenessState | null {
    if (this.awarenessStates.length < 2) return null;
    const prior = this.awarenessStates.at(-2);
    return prior ? cloneState(prior) : null;
  }

  getAwarenessState(stateId: string): PersistentAwarenessState | null {
    const state = this.awarenessStates.find((s) => s.stateId === stateId);
    return state ? cloneState(state) : null;
  }

  reportCount() {
    return this.reports.length;
  }

  awarenessStateCount() {
    return this.awarenessStates.length;
  }

  getAuditTrail(limit = 100): string[] {
    return this.auditTrail.slice(-limit);
  }
}
