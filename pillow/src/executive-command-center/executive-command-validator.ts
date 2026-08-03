import { PECC_METADATA_VERSION } from "./paths.js";
import type {
  ExecutiveCommandCenterInput,
  ExecutiveCommandCenterValidationReport,
  ExecutiveCommandRecord,
} from "./types.js";

type BoundaryInput = {
  executeWorkerLogic?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  replaceWorkers?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class ExecutiveCommandValidator {
  decide(input: ExecutiveCommandCenterInput): ExecutiveCommandCenterValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (!input.executiveRequest?.trim() && !input.requestedCapability && !input.routedService) {
      return "partial";
    }
    return "pass";
  }

  validateRecords(
    records: ExecutiveCommandRecord[] | null,
    input: ExecutiveCommandCenterInput,
    started: number,
    requireRequest = false,
  ): ExecutiveCommandCenterValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Executive Command Center requires validated=true");
    }
    if (requireRequest && !input.executiveRequest?.trim() && !input.requestedCapability) {
      errors.push("Executive request or requested capability is required");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No executive command records were produced");
    } else {
      for (const record of records) {
        if (!record.commandId) errors.push("Missing command ID");
        if (!record.routedService) warnings.push(`Routed service empty for ${record.commandId}`);
        if (record.workerLogicExecuted) errors.push("workerLogicExecuted must remain false");
        if (record.workforceOrchestratorReplaced) {
          errors.push("workforceOrchestratorReplaced must remain false");
        }
        if (record.workersReplaced) errors.push("workersReplaced must remain false");
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerLogic === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.replaceWorkers === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerLogic === true) {
      errors.push("Executive Command Center must never execute worker logic");
    }
    if (input.replaceWorkforceOrchestrator === true) {
      errors.push("Executive Command Center must never replace the Workforce Orchestrator");
    }
    if (input.replaceWorkers === true) {
      errors.push("Executive Command Center must never replace workers");
    }
    if (input.overridePillow === true) {
      errors.push("Executive Command Center must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Executive Command Center must never override Grand King");
    }
  }

  finalize(
    decision: ExecutiveCommandCenterValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ExecutiveCommandCenterValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `pecc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PECC_METADATA_VERSION,
    };
  }
}

export class ExecutiveCommandCenterMetadataGenerator {
  generate(commandCount: number, workerCount: number) {
    return {
      metadataVersion: PECC_METADATA_VERSION,
      engineVersion: "PILLOW-PECC-001" as const,
      missionId: "Q0-18" as const,
      commandCount,
      workerCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: ExecutiveCommandCenterValidationReport["decision"] | null, enabled: boolean) {
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
