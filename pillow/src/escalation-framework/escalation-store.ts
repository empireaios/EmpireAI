import { ESF_METADATA_VERSION } from "./paths.js";
import type {
  EscalationCategory,
  EscalationFrameworkInput,
  EscalationPriority,
  EscalationRecord,
  EscalationStatus,
  RiskAssessment,
  ValidationStatus,
} from "./types.js";

/** Authoritative in-memory Escalation Framework store — escalate/route only. */
export class EscalationStore {
  private records = new Map<string, EscalationRecord>();

  seed(records: EscalationRecord[]) {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.escalationId, clone(record));
    }
  }

  count() {
    return this.records.size;
  }

  openCount() {
    return this.list().filter((r) => r.currentStatus === "open" || r.currentStatus === "routed_to_pillow")
      .length;
  }

  list() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(escalationId: string) {
    const record = this.records.get(escalationId);
    return record ? clone(record) : null;
  }

  save(record: EscalationRecord) {
    this.records.set(record.escalationId, clone(record));
    return clone(record);
  }

  buildRecord(params: {
    input: EscalationFrameworkInput;
    category: EscalationCategory | string;
    triggerReason: string;
    priority: EscalationPriority;
    status: EscalationStatus;
    risk: RiskAssessment;
    evidence: string[];
    actions: string[];
    detectedConditions: string[];
    routedToPillow: boolean;
    pillowNotified: boolean;
    validationStatus: ValidationStatus;
  }): EscalationRecord {
    escalationSequence += 1;
    const escalationId =
      params.input.escalationId?.trim() || `esf-esc-${Date.now()}-${escalationSequence}`;
    const record: EscalationRecord = {
      escalationId,
      timestamp: new Date().toISOString(),
      missionId: params.input.missionId?.trim() || "mission-unspecified",
      taskId: params.input.taskId?.trim() || `task-${escalationSequence}`,
      businessId: params.input.businessId?.trim() || "biz-unspecified",
      escalationCategory: params.category,
      triggerReason: params.triggerReason,
      relatedWorkers: unique(params.input.relatedWorkers ?? []),
      currentEvidence: unique(params.evidence),
      riskAssessment: {
        ...params.risk,
        factors: [...params.risk.factors],
      },
      recommendedActions: unique(params.actions),
      escalationPriority: params.priority,
      currentStatus: params.status,
      metadataVersion: ESF_METADATA_VERSION,
      escalationTraceId: `esf-trace-${Date.now()}-${escalationSequence}`,
      validationStatus: params.validationStatus,
      routedToPillow: params.routedToPillow,
      pillowNotified: params.pillowNotified,
      detectedConditions: unique(params.detectedConditions),
      neverExecuteWorkerTasks: true,
      neverResolveBusinessDisputes: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverReplaceExecutiveJudgement: true,
      workerTasksExecuted: false,
      businessDisputesResolved: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      executiveJudgementReplaced: false,
      preserveEscalationTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(record);
  }
}

let escalationSequence = 0;

export function resetEscalationSequenceForTesting() {
  escalationSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function clone(record: EscalationRecord): EscalationRecord {
  return {
    ...record,
    relatedWorkers: [...record.relatedWorkers],
    currentEvidence: [...record.currentEvidence],
    recommendedActions: [...record.recommendedActions],
    detectedConditions: [...record.detectedConditions],
    riskAssessment: {
      ...record.riskAssessment,
      factors: [...record.riskAssessment.factors],
    },
  };
}
