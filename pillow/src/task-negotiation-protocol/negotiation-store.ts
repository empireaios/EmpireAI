import { TNP_METADATA_VERSION } from "./paths.js";
import type {
  DependencyEdge,
  EscalationStatus,
  NegotiationOutcome,
  NegotiationRecord,
  OwnershipDecision,
  TaskHandoff,
  TaskNegotiationProtocolInput,
  ValidationStatus,
  WorkerCapabilityDeclaration,
} from "./types.js";

/** Authoritative in-memory Task Negotiation Protocol store — negotiate only. */
export class NegotiationStore {
  private records = new Map<string, NegotiationRecord>();

  seed(records: NegotiationRecord[]) {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.negotiationId, clone(record));
    }
  }

  count() {
    return this.records.size;
  }

  list() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(negotiationId: string) {
    const record = this.records.get(negotiationId);
    return record ? clone(record) : null;
  }

  save(record: NegotiationRecord) {
    this.records.set(record.negotiationId, clone(record));
    return clone(record);
  }

  buildRecord(params: {
    input: TaskNegotiationProtocolInput;
    candidates: WorkerCapabilityDeclaration[];
    ownership: OwnershipDecision;
    supportingWorkers: string[];
    dependencyGraph: DependencyEdge[];
    handoffs: TaskHandoff[];
    conflicts: string[];
    result: NegotiationOutcome;
    escalationStatus: EscalationStatus;
    validationStatus: ValidationStatus;
  }): NegotiationRecord {
    negotiationSequence += 1;
    const negotiationId =
      params.input.negotiationId?.trim() || `tnp-neg-${Date.now()}-${negotiationSequence}`;
    const record: NegotiationRecord = {
      negotiationId,
      timestamp: new Date().toISOString(),
      missionId: params.input.missionId?.trim() || "mission-unspecified",
      taskId: params.input.taskId?.trim() || `task-${negotiationSequence}`,
      candidateWorkers: unique(params.candidates.map((c) => c.workerId)),
      capabilityAssessment: params.candidates.map((c) => ({
        ...c,
        declaredCapabilities: [...c.declaredCapabilities],
      })),
      ownershipDecision: { ...params.ownership },
      supportingWorkers: unique(params.supportingWorkers),
      dependencyGraph: params.dependencyGraph.map((d) => ({ ...d })),
      negotiationResult: params.result,
      escalationStatus: params.escalationStatus,
      metadataVersion: TNP_METADATA_VERSION,
      negotiationTraceId: `tnp-trace-${Date.now()}-${negotiationSequence}`,
      validationStatus: params.validationStatus,
      requiredCapabilities: unique(params.input.requiredCapabilities ?? []),
      handoffs: params.handoffs.map((h) => ({ ...h })),
      conflicts: unique(params.conflicts),
      neverExecuteWorkerTasks: true,
      neverReplaceWorkforceOrchestrator: true,
      neverReplacePillow: true,
      neverOverrideGrandKing: true,
      neverPerformStrategicPlanning: true,
      workerTasksExecuted: false,
      workforceOrchestratorReplaced: false,
      pillowReplaced: false,
      grandKingOverridden: false,
      strategicPlanningPerformed: false,
      preserveNegotiationTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(record);
  }
}

let negotiationSequence = 0;

export function resetNegotiationSequenceForTesting() {
  negotiationSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function clone(record: NegotiationRecord): NegotiationRecord {
  return {
    ...record,
    candidateWorkers: [...record.candidateWorkers],
    capabilityAssessment: record.capabilityAssessment.map((c) => ({
      ...c,
      declaredCapabilities: [...c.declaredCapabilities],
    })),
    ownershipDecision: { ...record.ownershipDecision },
    supportingWorkers: [...record.supportingWorkers],
    dependencyGraph: record.dependencyGraph.map((d) => ({ ...d })),
    handoffs: record.handoffs.map((h) => ({ ...h })),
    conflicts: [...record.conflicts],
    requiredCapabilities: [...record.requiredCapabilities],
  };
}
