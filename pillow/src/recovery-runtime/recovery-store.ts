import type {
  CheckpointRecord,
  EscalationRecord,
  FailureRecord,
  RecoveryCase,
  RecoveryRuntimeReport,
  RestartRecord,
  RollbackRecord,
} from "./types.js";

let sequence = 0;

export function resetRecrtSequenceForTesting() {
  sequence = 0;
}

export function nextRecrtId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

/**
 * Recovery store. NEVER deletes recoverable state refs (checkpointRef / stateRef).
 * History is append-only for failures, recoveries, checkpoints, restarts, rollbacks, escalations.
 */
export class RecoveryStore {
  private failures = new Map<string, FailureRecord>();
  private cases = new Map<string, RecoveryCase>();
  private checkpoints: CheckpointRecord[] = [];
  private restarts: RestartRecord[] = [];
  private rollbacks: RollbackRecord[] = [];
  private escalations: EscalationRecord[] = [];
  private reports: RecoveryRuntimeReport[] = [];
  private failureHistory: FailureRecord[] = [];
  private caseHistory: RecoveryCase[] = [];
  private auditTrail: string[] = [];

  saveFailure(failure: FailureRecord) {
    const snapshot = this.cloneFailure(failure);
    this.failures.set(failure.failureId, snapshot);
    this.failureHistory.push(this.cloneFailure(failure));
    this.auditTrail.push(`failure_saved:${failure.failureId}@${failure.detectedAt}`);
    return snapshot;
  }

  getFailure(failureId: string) {
    const failure = this.failures.get(failureId);
    return failure ? this.cloneFailure(failure) : null;
  }

  listFailures() {
    return [...this.failures.values()]
      .map((f) => this.cloneFailure(f))
      .sort((a, b) => a.failureId.localeCompare(b.failureId));
  }

  updateFailure(failureId: string, patch: Partial<FailureRecord>) {
    const existing = this.failures.get(failureId);
    if (!existing) return null;
    const updated: FailureRecord = {
      ...existing,
      ...patch,
      checkpointRef: patch.checkpointRef !== undefined ? patch.checkpointRef : existing.checkpointRef,
      stateRef: patch.stateRef !== undefined ? patch.stateRef : existing.stateRef,
      classificationSignals: patch.classificationSignals
        ? [...patch.classificationSignals]
        : [...existing.classificationSignals],
      supportingEvidence: patch.supportingEvidence
        ? [...patch.supportingEvidence]
        : [...existing.supportingEvidence],
      fabricated: false,
      structuralSignalOnly: true,
    };
    this.failures.set(failureId, updated);
    this.failureHistory.push(this.cloneFailure(updated));
    this.auditTrail.push(`failure_updated:${failureId}@${new Date().toISOString()}`);
    return this.cloneFailure(updated);
  }

  saveCase(recovery: RecoveryCase) {
    const snapshot = this.cloneCase(recovery);
    this.cases.set(recovery.recoveryId, snapshot);
    this.caseHistory.push(this.cloneCase(recovery));
    this.auditTrail.push(`case_saved:${recovery.recoveryId}@${new Date().toISOString()}`);
    return snapshot;
  }

  getCase(recoveryId: string) {
    const recovery = this.cases.get(recoveryId);
    return recovery ? this.cloneCase(recovery) : null;
  }

  getCaseByFailureId(failureId: string) {
    const found = [...this.cases.values()].find((c) => c.failureId === failureId);
    return found ? this.cloneCase(found) : null;
  }

  listCases() {
    return [...this.cases.values()]
      .map((c) => this.cloneCase(c))
      .sort((a, b) => a.recoveryId.localeCompare(b.recoveryId));
  }

  updateCase(recoveryId: string, patch: Partial<RecoveryCase>) {
    const existing = this.cases.get(recoveryId);
    if (!existing) return null;
    // NEVER lose recoverable state refs intentionally.
    const checkpointRef =
      patch.checkpointRef === null && existing.checkpointRef
        ? existing.checkpointRef
        : patch.checkpointRef !== undefined
          ? patch.checkpointRef
          : existing.checkpointRef;
    const stateRef =
      patch.stateRef === null && existing.stateRef
        ? existing.stateRef
        : patch.stateRef !== undefined
          ? patch.stateRef
          : existing.stateRef;
    const updated: RecoveryCase = {
      ...existing,
      ...patch,
      checkpointRef,
      stateRef,
      supportingEvidence: patch.supportingEvidence
        ? [...patch.supportingEvidence]
        : [...existing.supportingEvidence],
      fabricated: false,
      structuralSignalOnly: true,
    };
    this.cases.set(recoveryId, updated);
    this.caseHistory.push(this.cloneCase(updated));
    this.auditTrail.push(`case_updated:${recoveryId}@${new Date().toISOString()}`);
    return this.cloneCase(updated);
  }

  saveCheckpoint(checkpoint: CheckpointRecord) {
    const snapshot = this.cloneCheckpoint(checkpoint);
    this.checkpoints.push(snapshot);
    this.auditTrail.push(`checkpoint_saved:${checkpoint.checkpointId}@${new Date().toISOString()}`);
    return snapshot;
  }

  listCheckpoints() {
    return this.checkpoints.map((c) => this.cloneCheckpoint(c));
  }

  saveRestart(restart: RestartRecord) {
    const snapshot = this.cloneRestart(restart);
    this.restarts.push(snapshot);
    this.auditTrail.push(`restart_saved:${restart.restartId}@${restart.timestamp}`);
    return snapshot;
  }

  listRestarts() {
    return this.restarts.map((r) => this.cloneRestart(r));
  }

  saveRollback(rollback: RollbackRecord) {
    const snapshot = this.cloneRollback(rollback);
    this.rollbacks.push(snapshot);
    this.auditTrail.push(`rollback_saved:${rollback.rollbackId}@${rollback.timestamp}`);
    return snapshot;
  }

  listRollbacks() {
    return this.rollbacks.map((r) => this.cloneRollback(r));
  }

  saveEscalation(escalation: EscalationRecord) {
    const snapshot = this.cloneEscalation(escalation);
    this.escalations.push(snapshot);
    this.auditTrail.push(`escalation_saved:${escalation.escalationId}@${escalation.timestamp}`);
    return snapshot;
  }

  listEscalations() {
    return this.escalations.map((e) => this.cloneEscalation(e));
  }

  saveReport(report: RecoveryRuntimeReport) {
    this.reports.push({
      ...report,
      recoverySummary: {
        ...report.recoverySummary,
        supportingEvidence: [...report.recoverySummary.supportingEvidence],
        fabricated: false,
        structuralSignalOnly: true,
      },
      activeRecoveries: report.activeRecoveries.map((c) => this.cloneCase(c)),
      completedRecoveries: report.completedRecoveries.map((c) => this.cloneCase(c)),
      failedRecoveries: report.failedRecoveries.map((c) => this.cloneCase(c)),
      restartSummary: {
        ...report.restartSummary,
        supportingEvidence: [...report.restartSummary.supportingEvidence],
        fabricated: false,
        structuralSignalOnly: true,
      },
      rollbackSummary: {
        ...report.rollbackSummary,
        supportingEvidence: [...report.rollbackSummary.supportingEvidence],
        fabricated: false,
        structuralSignalOnly: true,
      },
      escalationSummary: {
        ...report.escalationSummary,
        supportingEvidence: [...report.escalationSummary.supportingEvidence],
        fabricated: false,
        structuralSignalOnly: true,
      },
      recoveryMetrics: { ...report.recoveryMetrics },
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
      failures: this.listFailures(),
      failureHistory: this.failureHistory.map((f) => this.cloneFailure(f)),
      cases: this.listCases(),
      caseHistory: this.caseHistory.map((c) => this.cloneCase(c)),
      checkpoints: this.listCheckpoints(),
      restarts: this.listRestarts(),
      rollbacks: this.listRollbacks(),
      escalations: this.listEscalations(),
      reports: this.listReports(),
    };
  }

  private cloneFailure(failure: FailureRecord): FailureRecord {
    return {
      ...failure,
      classificationSignals: [...failure.classificationSignals],
      supportingEvidence: [...failure.supportingEvidence],
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  private cloneCase(recovery: RecoveryCase): RecoveryCase {
    return {
      ...recovery,
      supportingEvidence: [...recovery.supportingEvidence],
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  private cloneCheckpoint(checkpoint: CheckpointRecord): CheckpointRecord {
    return {
      ...checkpoint,
      supportingEvidence: [...checkpoint.supportingEvidence],
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  private cloneRestart(restart: RestartRecord): RestartRecord {
    return {
      ...restart,
      supportingEvidence: [...restart.supportingEvidence],
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  private cloneRollback(rollback: RollbackRecord): RollbackRecord {
    return {
      ...rollback,
      supportingEvidence: [...rollback.supportingEvidence],
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  private cloneEscalation(escalation: EscalationRecord): EscalationRecord {
    return {
      ...escalation,
      supportingEvidence: [...escalation.supportingEvidence],
      fabricated: false,
      structuralSignalOnly: true,
    };
  }
}
