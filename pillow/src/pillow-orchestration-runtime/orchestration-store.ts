import type {
  ApprovalAction,
  ExecutionTimelineEntry,
  InvocationRequest,
  InvocationResult,
  OrchestrationReport,
  OrchestrationSession,
} from "./types.js";

let sequence = 0;

export function resetPorSequenceForTesting() {
  sequence = 0;
}

export function nextPorId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

export class OrchestrationStore {
  private sessions = new Map<string, OrchestrationSession>();
  private invocations = new Map<string, InvocationRequest>();
  private results: InvocationResult[] = [];
  private approvalActions: ApprovalAction[] = [];
  private events: ExecutionTimelineEntry[] = [];
  private reports: OrchestrationReport[] = [];
  private auditTrail: string[] = [];

  saveSession(session: OrchestrationSession) {
    this.sessions.set(session.sessionId, {
      ...session,
      traceabilityRefs: [...session.traceabilityRefs],
    });
    this.auditTrail.push(`session_saved:${session.sessionId}@${session.createdAt}`);
    return session;
  }

  getSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    return session ? { ...session, traceabilityRefs: [...session.traceabilityRefs] } : null;
  }

  listSessions() {
    return [...this.sessions.values()].map((s) => ({
      ...s,
      traceabilityRefs: [...s.traceabilityRefs],
    }));
  }

  saveInvocation(request: InvocationRequest) {
    this.invocations.set(request.invocationId, { ...request, descriptor: { ...request.descriptor } });
    this.auditTrail.push(`invocation_saved:${request.invocationId}@${request.timestamp}`);
    return request;
  }

  saveResult(result: InvocationResult) {
    this.results.push({ ...result, evidence: [...result.evidence], notes: [...result.notes] });
    this.auditTrail.push(`result_saved:${result.invocationId}@${result.timestamp}`);
    return result;
  }

  listResults() {
    return this.results.map((r) => ({ ...r, evidence: [...r.evidence], notes: [...r.notes] }));
  }

  saveApprovalAction(action: ApprovalAction) {
    this.approvalActions.push({ ...action, notes: [...action.notes] });
    this.auditTrail.push(`approval_saved:${action.actionId}@${action.routedAt}`);
    return action;
  }

  listApprovalActions() {
    return this.approvalActions.map((a) => ({ ...a, notes: [...a.notes] }));
  }

  appendEvent(event: ExecutionTimelineEntry) {
    this.events.push({ ...event, notes: [...event.notes] });
    this.auditTrail.push(`event:${event.entryId}@${event.timestamp}`);
    return event;
  }

  listEvents() {
    return this.events.map((e) => ({ ...e, notes: [...e.notes] }));
  }

  saveReport(report: OrchestrationReport) {
    this.reports.push({
      ...report,
      invokedWorkers: report.invokedWorkers.map((r) => ({ ...r, evidence: [...r.evidence], notes: [...r.notes] })),
      invokedTools: report.invokedTools.map((r) => ({ ...r, evidence: [...r.evidence], notes: [...r.notes] })),
      invokedWorkflows: report.invokedWorkflows.map((r) => ({ ...r, evidence: [...r.evidence], notes: [...r.notes] })),
      approvalActions: report.approvalActions.map((a) => ({ ...a, notes: [...a.notes] })),
      reportsGenerated: report.reportsGenerated.map((r) => ({ ...r, evidence: [...r.evidence], notes: [...r.notes] })),
      executionTimeline: report.executionTimeline.map((e) => ({ ...e, notes: [...e.notes] })),
      supportingEvidence: [...report.supportingEvidence],
      outstandingIssues: [...report.outstandingIssues],
    });
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
    return report;
  }

  listReports() {
    return this.reports.map((r) => ({ ...r }));
  }

  getLatestReport() {
    return this.reports.length ? this.reports[this.reports.length - 1] : null;
  }

  getHistory() {
    return {
      sessions: this.listSessions(),
      results: this.listResults(),
      approvalActions: this.listApprovalActions(),
      events: this.listEvents(),
      reports: this.listReports(),
      auditTrail: this.getAuditTrail(),
    };
  }

  getAuditTrail() {
    return [...this.auditTrail];
  }
}
