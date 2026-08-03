import { EXM_METADATA_VERSION } from "./paths.js";
import type {
  ApprovalStatus,
  ExecutionEventType,
  ExecutionMemoryRecord,
  MemoryValidationReport,
  SearchMemoryInput,
  StoreMemoryInput,
  UpdateMemoryInput,
  ValidationStatus,
} from "./types.js";

function isEventType(value: string): value is ExecutionEventType {
  return (
    value === "mission_started" ||
    value === "mission_completed" ||
    value === "mission_failed" ||
    value === "executive_decision" ||
    value === "approval_granted" ||
    value === "approval_rejected" ||
    value === "business_created" ||
    value === "business_updated" ||
    value === "business_closed" ||
    value === "worker_escalation" ||
    value === "operational_incident" ||
    value === "lesson_learned"
  );
}

function isApproval(value: string): value is ApprovalStatus {
  return (
    value === "not_applicable" ||
    value === "pending" ||
    value === "granted" ||
    value === "rejected" ||
    value === "recorded"
  );
}

function defaultApproval(eventType: ExecutionEventType, explicit?: ApprovalStatus): ApprovalStatus {
  if (explicit && isApproval(explicit)) return explicit;
  if (eventType === "approval_granted") return "granted";
  if (eventType === "approval_rejected") return "rejected";
  if (eventType === "executive_decision") return "recorded";
  return "not_applicable";
}

function clampConfidence(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 70;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function boundaryViolated(input: {
  makeDecisions?: boolean;
  planMissions?: boolean;
  assignWorkers?: boolean;
  executeWork?: boolean;
  replaceKnowledgeSystems?: boolean;
}): boolean {
  return (
    input.makeDecisions === true ||
    input.planMissions === true ||
    input.assignWorkers === true ||
    input.executeWork === true ||
    input.replaceKnowledgeSystems === true
  );
}

/** Authoritative in-memory execution history store. */
export class ExecutionMemoryStore {
  private readonly records = new Map<string, ExecutionMemoryRecord>();
  private sequence = 0;

  count(): number {
    return this.records.size;
  }

  list(): ExecutionMemoryRecord[] {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((r) => this.clone(r));
  }

  get(memoryId: string): ExecutionMemoryRecord | null {
    const found = this.records.get(memoryId);
    return found ? this.clone(found) : null;
  }

  store(input: StoreMemoryInput, validationStatus: ValidationStatus): ExecutionMemoryRecord {
    if (!isEventType(input.eventType)) {
      throw new Error(`Unsupported event type: ${String(input.eventType)}`);
    }
    this.sequence += 1;
    const memoryId = (input.memoryId?.trim() || `exm-mem-${Date.now()}-${this.sequence}`).toLowerCase();
    if (this.records.has(memoryId)) {
      throw new Error(`Memory record already exists: ${memoryId}`);
    }
    const record: ExecutionMemoryRecord = {
      memoryId,
      timestamp: new Date().toISOString(),
      eventType: input.eventType,
      missionId: input.missionId?.trim() || null,
      businessId: input.businessId?.trim() || null,
      relatedWorkers: [...(input.relatedWorkers ?? [])],
      executiveDecision: input.executiveDecision?.trim() || null,
      outcome: input.outcome?.trim() || null,
      lessonLearned: input.lessonLearned?.trim() || null,
      approvalStatus: defaultApproval(input.eventType, input.approvalStatus),
      confidence: clampConfidence(input.confidence),
      evidence: [...(input.evidence ?? [])],
      metadataVersion: EXM_METADATA_VERSION,
      memoryTraceId: `exm-trace-${Date.now()}-${this.sequence}`,
      version: 1,
      validationStatus,
      neverMakeDecisions: true,
      neverPlanMissions: true,
      neverAssignWorkers: true,
      neverExecuteWork: true,
      neverReplaceKnowledgeSystems: true,
      decisionMadeByMemory: false,
      missionPlannedByMemory: false,
      workersAssignedByMemory: false,
      workExecutedByMemory: false,
      preserveMemoryTraceability: true,
      preserveAuditability: true,
      preserveMemoryIntegrity: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    this.records.set(memoryId, record);
    return this.clone(record);
  }

  update(input: UpdateMemoryInput, validationStatus: ValidationStatus): ExecutionMemoryRecord {
    const existing = this.records.get(input.memoryId);
    if (!existing) throw new Error(`Memory record not found: ${input.memoryId}`);
    if (input.approvalStatus && !isApproval(input.approvalStatus)) {
      throw new Error(`Invalid approval status: ${input.approvalStatus}`);
    }
    const updated: ExecutionMemoryRecord = {
      ...existing,
      outcome: input.outcome !== undefined ? input.outcome?.trim() || null : existing.outcome,
      lessonLearned:
        input.lessonLearned !== undefined ? input.lessonLearned?.trim() || null : existing.lessonLearned,
      approvalStatus: input.approvalStatus ?? existing.approvalStatus,
      confidence: input.confidence !== undefined ? clampConfidence(input.confidence) : existing.confidence,
      evidence: input.evidence ? [...input.evidence] : [...existing.evidence],
      executiveDecision:
        input.executiveDecision !== undefined
          ? input.executiveDecision?.trim() || null
          : existing.executiveDecision,
      relatedWorkers: input.relatedWorkers ? [...input.relatedWorkers] : [...existing.relatedWorkers],
      timestamp: new Date().toISOString(),
      version: existing.version + 1,
      validationStatus,
      decisionMadeByMemory: false,
      missionPlannedByMemory: false,
      workersAssignedByMemory: false,
      workExecutedByMemory: false,
    };
    this.records.set(updated.memoryId, updated);
    return this.clone(updated);
  }

  search(filters: SearchMemoryInput): ExecutionMemoryRecord[] {
    const limit = Math.max(1, filters.limit ?? 100);
    return this.list()
      .filter((r) => {
        if (filters.missionId && r.missionId !== filters.missionId) return false;
        if (filters.businessId && r.businessId !== filters.businessId) return false;
        if (filters.eventType && r.eventType !== filters.eventType) return false;
        if (filters.approvalStatus && r.approvalStatus !== filters.approvalStatus) return false;
        return true;
      })
      .slice(0, limit);
  }

  private clone(record: ExecutionMemoryRecord): ExecutionMemoryRecord {
    return {
      ...record,
      relatedWorkers: [...record.relatedWorkers],
      evidence: [...record.evidence],
    };
  }
}

export class ExecutionMemoryValidator {
  decide(input: {
    validated?: boolean;
    makeDecisions?: boolean;
    planMissions?: boolean;
    assignWorkers?: boolean;
    executeWork?: boolean;
    replaceKnowledgeSystems?: boolean;
  }): MemoryValidationReport["decision"] {
    if (boundaryViolated(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRecords(
    records: ExecutionMemoryRecord[],
    input: {
      validated?: boolean;
      makeDecisions?: boolean;
      planMissions?: boolean;
      assignWorkers?: boolean;
      executeWork?: boolean;
      replaceKnowledgeSystems?: boolean;
      eventType?: string;
      memoryId?: string;
    },
    started: number,
  ): MemoryValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (input.makeDecisions === true) errors.push("Execution Memory must never make decisions");
    if (input.planMissions === true) errors.push("Execution Memory must never plan missions");
    if (input.assignWorkers === true) errors.push("Execution Memory must never assign workers");
    if (input.executeWork === true) errors.push("Execution Memory must never execute work");
    if (input.replaceKnowledgeSystems === true) {
      errors.push("Execution Memory must never replace future knowledge systems");
    }
    if (input.validated === false) errors.push("Memory operations require validated=true");
    if (input.eventType && !isEventType(input.eventType)) errors.push(`Unsupported event type: ${input.eventType}`);

    for (const record of records) {
      if (!record.memoryId) errors.push("Missing memory ID");
      if (!isEventType(record.eventType)) errors.push(`Invalid event type on ${record.memoryId}`);
      if (record.confidence < 0 || record.confidence > 100) errors.push(`Confidence out of range on ${record.memoryId}`);
      if (record.decisionMadeByMemory) errors.push("decisionMadeByMemory must remain false");
      if (record.missionPlannedByMemory) errors.push("missionPlannedByMemory must remain false");
      if (record.workersAssignedByMemory) errors.push("workersAssignedByMemory must remain false");
      if (record.workExecutedByMemory) errors.push("workExecutedByMemory must remain false");
    }

    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";

    return {
      validationReportId: `exm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EXM_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(decision: MemoryValidationReport["decision"] | null, enabled: boolean) {
    if (!enabled) return "standby" as const;
    if (decision === "fail") return "degraded" as const;
    if (decision === "partial") return "degraded" as const;
    return "healthy" as const;
  }
}

export class RecoveryManager {
  private failures = 0;
  recordFailure() {
    this.failures += 1;
    return {
      recoveryAttempted: true,
      failures: this.failures,
      decisionMadeByMemory: false as const,
      missionPlannedByMemory: false as const,
      workersAssignedByMemory: false as const,
      workExecutedByMemory: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
