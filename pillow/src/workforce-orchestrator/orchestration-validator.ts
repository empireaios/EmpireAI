import { PWO_METADATA_VERSION } from "./paths.js";
import type {
  OrchestrationRecord,
  OrchestrationValidationReport,
  WorkforceOrchestratorInput,
} from "./types.js";

export class OrchestrationValidator {
  decide(input: WorkforceOrchestratorInput): OrchestrationValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (!input.executiveRequest?.trim()) return "fail";
    if (input.executiveRequest.trim().length < 8) return "partial";
    return "pass";
  }

  validateRecords(
    records: OrchestrationRecord[] | null,
    input: WorkforceOrchestratorInput,
    started: number,
  ): OrchestrationValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (!input.executiveRequest?.trim()) errors.push("Executive request is required");
    if (input.validated === false) errors.push("Workforce orchestration requires validated=true");

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No orchestration records were produced");
    } else {
      for (const record of records) {
        if (!record.orchestrationId) errors.push("Missing orchestration ID");
        if (!record.executiveRequest.trim()) errors.push("Executive request missing on record");
        if (!record.workersSelected.length) errors.push("Workers selected is required");
        if (!record.workerStatus.length) errors.push("Worker status is required");
        if (!record.executionSequence.length) warnings.push(`Empty execution sequence for ${record.orchestrationId}`);
        if (record.workerTasksPerformed) errors.push("workerTasksPerformed must remain false");
        if (record.workerLogicReplaced) errors.push("workerLogicReplaced must remain false");
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
        if (record.strategicPlanningPerformed) errors.push("strategicPlanningPerformed must remain false");
        if (record.discoveredWorkerCount < record.workersSelected.length) {
          errors.push("Discovered worker count cannot be less than selected workers");
        }
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: {
    performWorkerTasks?: boolean;
    replaceWorkerLogic?: boolean;
    overridePillow?: boolean;
    overrideGrandKing?: boolean;
    performStrategicPlanning?: boolean;
  }): boolean {
    return (
      input.performWorkerTasks === true ||
      input.replaceWorkerLogic === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.performStrategicPlanning === true
    );
  }

  private pushBoundaryErrors(
    input: {
      performWorkerTasks?: boolean;
      replaceWorkerLogic?: boolean;
      overridePillow?: boolean;
      overrideGrandKing?: boolean;
      performStrategicPlanning?: boolean;
    },
    errors: string[],
  ) {
    if (input.performWorkerTasks === true) {
      errors.push("Workforce Orchestrator must never perform worker tasks");
    }
    if (input.replaceWorkerLogic === true) {
      errors.push("Workforce Orchestrator must never replace worker logic");
    }
    if (input.overridePillow === true) {
      errors.push("Workforce Orchestrator must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Workforce Orchestrator must never override Grand King");
    }
    if (input.performStrategicPlanning === true) {
      errors.push("Workforce Orchestrator must never perform strategic planning");
    }
  }

  private finalize(
    decision: OrchestrationValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): OrchestrationValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `pwo-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PWO_METADATA_VERSION,
    };
  }
}

export class OrchestrationMetadataGenerator {
  generate(orchestrationCount: number, activeWorkers: number) {
    return {
      metadataVersion: PWO_METADATA_VERSION,
      engineVersion: "PILLOW-PWO-001" as const,
      missionId: "Q0-09" as const,
      orchestrationCount,
      activeWorkers,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: OrchestrationValidationReport["decision"] | null, enabled: boolean) {
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
      workerTasksPerformed: false as const,
      workerLogicReplaced: false as const,
      strategicPlanningPerformed: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
