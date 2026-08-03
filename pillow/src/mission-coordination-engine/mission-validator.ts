import { MCE_METADATA_VERSION } from "./paths.js";
import type {
  MissionCoordinationEngineInput,
  MissionCoordinationEngineValidationReport,
  MissionRecord,
} from "./types.js";

type BoundaryInput = {
  executeWorkerLogic?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  replaceExecutivePlanner?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class MissionValidator {
  decide(
    input: MissionCoordinationEngineInput,
    requireName = false,
  ): MissionCoordinationEngineValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (requireName && !input.missionName?.trim() && !input.missionId?.trim()) return "partial";
    return "pass";
  }

  validateRecords(
    records: MissionRecord[] | null,
    input: MissionCoordinationEngineInput,
    started: number,
    requireName = false,
  ): MissionCoordinationEngineValidationReport {
    const decision = this.decide(input, requireName);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Mission Coordination Engine requires validated=true");
    }
    if (requireName && !input.missionName?.trim() && !input.missionId?.trim()) {
      warnings.push("missionName or missionId is recommended");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No mission records were produced");
    } else {
      for (const record of records) {
        if (!record.missionId) errors.push("Missing mission ID");
        if (!record.missionName) warnings.push(`Mission name empty for ${record.missionId}`);
        if (record.workerLogicExecuted) errors.push("workerLogicExecuted must remain false");
        if (record.workforceOrchestratorReplaced) {
          errors.push("workforceOrchestratorReplaced must remain false");
        }
        if (record.executivePlannerReplaced) {
          errors.push("executivePlannerReplaced must remain false");
        }
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
      input.replaceExecutivePlanner === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerLogic === true) {
      errors.push("Mission Coordination Engine must never execute worker logic");
    }
    if (input.replaceWorkforceOrchestrator === true) {
      errors.push("Mission Coordination Engine must never replace Workforce Orchestrator");
    }
    if (input.replaceExecutivePlanner === true) {
      errors.push("Mission Coordination Engine must never replace Executive Planner");
    }
    if (input.overridePillow === true) {
      errors.push("Mission Coordination Engine must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Mission Coordination Engine must never override Grand King");
    }
  }

  finalize(
    decision: MissionCoordinationEngineValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): MissionCoordinationEngineValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `mce-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MCE_METADATA_VERSION,
    };
  }
}

export class MissionCoordinationEngineMetadataGenerator {
  generate(missionCount: number, activeMissions: number) {
    return {
      metadataVersion: MCE_METADATA_VERSION,
      engineVersion: "PILLOW-MCE-001" as const,
      missionId: "Q0-25" as const,
      missionCount,
      activeMissions,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(
    decision: MissionCoordinationEngineValidationReport["decision"] | null,
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
    return this.failures;
  }
  reset() {
    this.failures = 0;
  }
  failureCount() {
    return this.failures;
  }
}
