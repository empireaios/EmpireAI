import { AWO_METADATA_VERSION } from "./paths.js";
import type {
  AdaptiveWorkforceOptimizerInput,
  AdaptiveWorkforceOptimizerValidationReport,
  OptimizationRecord,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  modifyWorkersAutomatically?: boolean;
  replacePillow?: boolean;
  overrideGrandKing?: boolean;
  performStrategicPlanning?: boolean;
  validated?: boolean;
};

export class WorkforceOptimizerValidator {
  decide(
    input: AdaptiveWorkforceOptimizerInput,
    requireWorkers = false,
  ): AdaptiveWorkforceOptimizerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (requireWorkers && (!input.workers || input.workers.length === 0)) return "fail";
    if (requireWorkers && input.workers?.some((w) => !w.workerId?.trim())) return "partial";
    return "pass";
  }

  validateRecords(
    records: OptimizationRecord[] | null,
    input: AdaptiveWorkforceOptimizerInput,
    started: number,
    requireWorkers = false,
  ): AdaptiveWorkforceOptimizerValidationReport {
    const decision = this.decide(input, requireWorkers);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Adaptive Workforce Optimizer requires validated=true");
    }
    if (requireWorkers && (!input.workers || input.workers.length === 0)) {
      errors.push("Worker performance snapshots are required for analysis");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No optimization records were produced");
    } else {
      for (const record of records) {
        if (!record.optimizationId) errors.push("Missing optimization ID");
        if (!record.scope) warnings.push(`Optimization scope empty for ${record.optimizationId}`);
        if (record.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (record.workersModifiedAutomatically) {
          errors.push("workersModifiedAutomatically must remain false");
        }
        if (record.pillowReplaced) errors.push("pillowReplaced must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
        if (record.strategicPlanningPerformed) {
          errors.push("strategicPlanningPerformed must remain false");
        }
        if (record.confidenceScore < 40) {
          warnings.push(`Low confidence optimization recorded (${record.confidenceScore})`);
        }
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.modifyWorkersAutomatically === true ||
      input.replacePillow === true ||
      input.overrideGrandKing === true ||
      input.performStrategicPlanning === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Adaptive Workforce Optimizer must never execute worker tasks");
    }
    if (input.modifyWorkersAutomatically === true) {
      errors.push("Adaptive Workforce Optimizer must never modify workers automatically");
    }
    if (input.replacePillow === true) {
      errors.push("Adaptive Workforce Optimizer must never replace Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Adaptive Workforce Optimizer must never override Grand King");
    }
    if (input.performStrategicPlanning === true) {
      errors.push("Adaptive Workforce Optimizer must never perform strategic planning");
    }
  }

  finalize(
    decision: AdaptiveWorkforceOptimizerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): AdaptiveWorkforceOptimizerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `awo-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AWO_METADATA_VERSION,
    };
  }
}

export class AdaptiveWorkforceOptimizerMetadataGenerator {
  generate(optimizationCount: number, lastConfidence: number | null) {
    return {
      metadataVersion: AWO_METADATA_VERSION,
      engineVersion: "PILLOW-AWO-001" as const,
      missionId: "Q0-17" as const,
      optimizationCount,
      lastConfidence,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(
    decision: AdaptiveWorkforceOptimizerValidationReport["decision"] | null,
    enabled: boolean,
  ) {
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
      workerTasksExecuted: false as const,
      workersModifiedAutomatically: false as const,
      pillowReplaced: false as const,
      grandKingOverridden: false as const,
      strategicPlanningPerformed: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
