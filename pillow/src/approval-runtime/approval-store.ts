import type {
  ApprovalPolicy,
  ApprovalRequest,
  ApprovalRuntimeReport,
  DecisionRecord,
} from "./types.js";

let sequence = 0;

export function resetApvrtSequenceForTesting() {
  sequence = 0;
}

export function nextApvrtId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

export class ApprovalStore {
  private policies = new Map<string, ApprovalPolicy>();
  private requests = new Map<string, ApprovalRequest>();
  private decisions: DecisionRecord[] = [];
  private reports: ApprovalRuntimeReport[] = [];
  private requestHistory: ApprovalRequest[] = [];
  private decisionHistory: DecisionRecord[] = [];
  private auditTrail: string[] = [];

  savePolicy(policy: ApprovalPolicy) {
    const snapshot = this.clonePolicy(policy);
    this.policies.set(policy.policyId, snapshot);
    this.auditTrail.push(`policy_saved:${policy.policyId}@${new Date().toISOString()}`);
    return snapshot;
  }

  getPolicy(policyId: string) {
    const policy = this.policies.get(policyId);
    return policy ? this.clonePolicy(policy) : null;
  }

  listPolicies() {
    return [...this.policies.values()]
      .map((p) => this.clonePolicy(p))
      .sort((a, b) => a.policyId.localeCompare(b.policyId));
  }

  saveRequest(request: ApprovalRequest) {
    const snapshot = this.cloneRequest(request);
    this.requests.set(request.approvalId, snapshot);
    this.requestHistory.push(this.cloneRequest(request));
    this.auditTrail.push(`request_saved:${request.approvalId}@${new Date().toISOString()}`);
    return snapshot;
  }

  getRequest(approvalId: string) {
    const request = this.requests.get(approvalId);
    return request ? this.cloneRequest(request) : null;
  }

  listRequests() {
    return [...this.requests.values()]
      .map((r) => this.cloneRequest(r))
      .sort((a, b) => a.approvalId.localeCompare(b.approvalId));
  }

  /**
   * Update a request. NEVER deletes history — prior snapshots remain in requestHistory.
   */
  updateRequest(approvalId: string, patch: Partial<ApprovalRequest>) {
    const existing = this.requests.get(approvalId);
    if (!existing) return null;
    const updated: ApprovalRequest = {
      ...existing,
      ...patch,
      decisionHistory: patch.decisionHistory
        ? patch.decisionHistory.map((d) => this.cloneDecision(d))
        : existing.decisionHistory.map((d) => this.cloneDecision(d)),
      timestampHistory: patch.timestampHistory
        ? [...patch.timestampHistory]
        : [...existing.timestampHistory],
      escalationHistory: patch.escalationHistory
        ? [...patch.escalationHistory]
        : [...existing.escalationHistory],
      fabricated: false,
      structuralSignalOnly: true,
    };
    this.requests.set(approvalId, updated);
    this.requestHistory.push(this.cloneRequest(updated));
    this.auditTrail.push(`request_updated:${approvalId}@${new Date().toISOString()}`);
    return this.cloneRequest(updated);
  }

  /** Append-only decision persistence. NEVER deletes decisions. */
  saveDecision(decision: DecisionRecord) {
    const snapshot = this.cloneDecision(decision);
    this.decisions.push(snapshot);
    this.decisionHistory.push(this.cloneDecision(decision));
    this.auditTrail.push(`decision_saved:${decision.decisionId}@${decision.timestamp}`);
    return snapshot;
  }

  listDecisions() {
    return this.decisions.map((d) => this.cloneDecision(d));
  }

  listDecisionsForApproval(approvalId: string) {
    return this.listDecisions().filter((d) => d.approvalId === approvalId);
  }

  saveReport(report: ApprovalRuntimeReport) {
    this.reports.push({
      ...report,
      activeApprovalRequests: report.activeApprovalRequests.map((r) => this.cloneRequest(r)),
      pendingApprovals: report.pendingApprovals.map((r) => this.cloneRequest(r)),
      approvedRequests: report.approvedRequests.map((r) => this.cloneRequest(r)),
      rejectedRequests: report.rejectedRequests.map((r) => this.cloneRequest(r)),
      escalatedRequests: report.escalatedRequests.map((r) => this.cloneRequest(r)),
      approvalTimelines: report.approvalTimelines.map((t) => ({
        ...t,
        timestamps: [...t.timestamps],
        structuralSignalOnly: true as const,
      })),
      governanceSummary: {
        ...report.governanceSummary,
        notes: [...report.governanceSummary.notes],
      },
      supportingEvidence: [...report.supportingEvidence],
      outstandingIssues: [...report.outstandingIssues],
    });
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
    return report;
  }

  listReports() {
    return this.reports.map((r) => ({ ...r }));
  }

  getAuditTrail() {
    return [...this.auditTrail];
  }

  getHistory() {
    return {
      policies: this.listPolicies(),
      requests: this.listRequests(),
      requestHistory: this.requestHistory.map((r) => this.cloneRequest(r)),
      decisions: this.listDecisions(),
      decisionHistory: this.decisionHistory.map((d) => this.cloneDecision(d)),
      reports: this.listReports(),
    };
  }

  private clonePolicy(policy: ApprovalPolicy): ApprovalPolicy {
    return {
      ...policy,
      stages: [...policy.stages],
      structuralSignalOnly: true,
      fabricated: false,
    };
  }

  private cloneRequest(request: ApprovalRequest): ApprovalRequest {
    return {
      ...request,
      decisionHistory: request.decisionHistory.map((d) => this.cloneDecision(d)),
      timestampHistory: [...request.timestampHistory],
      escalationHistory: [...request.escalationHistory],
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  private cloneDecision(decision: DecisionRecord): DecisionRecord {
    return {
      ...decision,
      fabricated: false,
    };
  }
}
