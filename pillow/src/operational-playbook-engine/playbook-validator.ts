import { OPBK_METADATA_VERSION } from "./paths.js";
import type {
  OperationalPlaybookEngineInput,
  PlaybookExecutionRecord,
  PlaybookRecord,
  PlaybookValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  replaceWorkers?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class PlaybookValidator {
  decide(input: OperationalPlaybookEngineInput): PlaybookValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validatePlaybookDefinition(
    playbook: PlaybookRecord | null,
    integrityErrors: string[],
    input: OperationalPlaybookEngineInput,
    started: number,
  ): PlaybookValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Playbook operations require validated=true");
    if (!playbook) errors.push("Playbook not found");
    errors.push(...integrityErrors);
    if (playbook && !playbook.active) warnings.push("Playbook is inactive");
    return this.finalize(decision, errors, warnings, started);
  }

  validateExecutions(
    executions: PlaybookExecutionRecord[] | null,
    input: OperationalPlaybookEngineInput,
    started: number,
  ): PlaybookValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Playbook operations require validated=true");
    if (!executions || executions.length === 0) {
      if (decision !== "fail") errors.push("No playbook execution records were produced");
    } else {
      for (const record of executions) {
        if (!record.executionId) errors.push("Missing execution ID");
        if (!record.playbookId) errors.push("Playbook ID is required on execution record");
        if (!record.workflow?.steps?.length) errors.push("Executable workflow steps are required");
        if (record.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (record.workersReplaced) errors.push("workersReplaced must remain false");
        if (record.workforceOrchestratorReplaced) {
          errors.push("workforceOrchestratorReplaced must remain false");
        }
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
        if (!record.prerequisitesValid) warnings.push(`Prerequisites blocked for ${record.executionId}`);
      }
    }
    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkers === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Operational Playbook Engine must never execute worker tasks");
    }
    if (input.replaceWorkers === true) {
      errors.push("Operational Playbook Engine must never replace workers");
    }
    if (input.replaceWorkforceOrchestrator === true) {
      errors.push("Operational Playbook Engine must never replace the Workforce Orchestrator");
    }
    if (input.overridePillow === true) {
      errors.push("Operational Playbook Engine must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Operational Playbook Engine must never override Grand King");
    }
  }

  finalize(
    decision: PlaybookValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): PlaybookValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `opbk-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: OPBK_METADATA_VERSION,
    };
  }
}

export class PlaybookMetadataGenerator {
  generate(playbookCount: number, executionCount: number, lastConfidence: number | null) {
    return {
      metadataVersion: OPBK_METADATA_VERSION,
      engineVersion: "PILLOW-OPBK-001" as const,
      missionId: "Q0-15" as const,
      playbookCount,
      executionCount,
      lastConfidence,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: PlaybookValidationReport["decision"] | null, enabled: boolean) {
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
      workersReplaced: false as const,
      workforceOrchestratorReplaced: false as const,
      pillowOverridden: false as const,
      grandKingOverridden: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
