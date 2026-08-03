import { TNP_METADATA_VERSION } from "./paths.js";
import type {
  NegotiationRecord,
  TaskNegotiationProtocolInput,
  TaskNegotiationProtocolValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  replacePillow?: boolean;
  overrideGrandKing?: boolean;
  performStrategicPlanning?: boolean;
  validated?: boolean;
};

export class NegotiationValidator {
  decide(
    input: TaskNegotiationProtocolInput,
    requireTask = false,
  ): TaskNegotiationProtocolValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (requireTask && !input.taskId?.trim()) return "fail";
    if (requireTask && (!input.candidateWorkers || input.candidateWorkers.length === 0)) {
      return "partial";
    }
    return "pass";
  }

  validateRecords(
    records: NegotiationRecord[] | null,
    input: TaskNegotiationProtocolInput,
    started: number,
    requireTask = false,
  ): TaskNegotiationProtocolValidationReport {
    const decision = this.decide(input, requireTask);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Task Negotiation Protocol requires validated=true");
    }
    if (requireTask && !input.taskId?.trim()) {
      errors.push("taskId is required for negotiation");
    }
    if (requireTask && (!input.candidateWorkers || input.candidateWorkers.length === 0)) {
      warnings.push("No candidate workers provided for negotiation");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No negotiation records were produced");
    } else {
      for (const record of records) {
        if (!record.negotiationId) errors.push("Missing negotiation ID");
        if (!record.taskId) warnings.push(`Task ID empty for ${record.negotiationId}`);
        if (record.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (record.workforceOrchestratorReplaced) {
          errors.push("workforceOrchestratorReplaced must remain false");
        }
        if (record.pillowReplaced) errors.push("pillowReplaced must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
        if (record.strategicPlanningPerformed) {
          errors.push("strategicPlanningPerformed must remain false");
        }
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.replacePillow === true ||
      input.overrideGrandKing === true ||
      input.performStrategicPlanning === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Task Negotiation Protocol must never execute worker tasks");
    }
    if (input.replaceWorkforceOrchestrator === true) {
      errors.push("Task Negotiation Protocol must never replace Workforce Orchestrator");
    }
    if (input.replacePillow === true) {
      errors.push("Task Negotiation Protocol must never replace Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Task Negotiation Protocol must never override Grand King");
    }
    if (input.performStrategicPlanning === true) {
      errors.push("Task Negotiation Protocol must never perform strategic planning");
    }
  }

  finalize(
    decision: TaskNegotiationProtocolValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): TaskNegotiationProtocolValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `tnp-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TNP_METADATA_VERSION,
    };
  }
}

export class TaskNegotiationProtocolMetadataGenerator {
  generate(negotiationCount: number, lastOutcome: string | null) {
    return {
      metadataVersion: TNP_METADATA_VERSION,
      engineVersion: "PILLOW-TNP-001" as const,
      missionId: "Q0-20" as const,
      negotiationCount,
      lastOutcome,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: TaskNegotiationProtocolValidationReport["decision"] | null, enabled: boolean) {
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
    return this.failures;
  }
  reset() {
    this.failures = 0;
  }
  failureCount() {
    return this.failures;
  }
}
