import { EBF_METADATA_VERSION } from "./paths.js";
import type {
  BusinessBuildMissionRecord,
  EmpireBuilderFactoryInput,
  EmpireBuilderFactoryValidationReport,
} from "./types.js";

type BoundaryInput = {
  interpretDetailedBusinessStrategy?: boolean;
  generateBusinessModels?: boolean;
  researchMarkets?: boolean;
  assignWorkers?: boolean;
  executeBusinesses?: boolean;
  launchBusinesses?: boolean;
  implementQ202OrLater?: boolean;
  validated?: boolean;
};

export class MissionValidator {
  decide(input: EmpireBuilderFactoryInput): EmpireBuilderFactoryValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateMissions(
    missions: BusinessBuildMissionRecord[] | null,
    input: EmpireBuilderFactoryInput,
    started: number,
  ): EmpireBuilderFactoryValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Empire Builder Factory Core requires validated=true");
    }

    if (!missions || missions.length === 0) {
      if (decision !== "fail") {
        warnings.push("No business-building mission records were produced yet");
      }
    } else {
      for (const mission of missions) {
        if (!mission.businessBuildMissionId) errors.push("Missing business build mission ID");
        if (!mission.originalCommand?.trim()) errors.push("Missing original command");
        if (!mission.businessType) errors.push("Missing business type");
        if (!mission.missionObjective?.trim()) errors.push("Missing mission objective");
        if (!mission.traceabilityReference?.trim()) {
          errors.push("Missing traceability reference to Grand King command");
        }
        if (!mission.preparedForQ2Workers) {
          errors.push("Mission must be prepared for later Q2 workers");
        }
        if (!mission.neverExecuteBusinesses) {
          errors.push("Empire Builder Factory Core must never execute businesses");
        }
        if (!mission.neverImplementQ202OrLater) {
          errors.push("Empire Builder Factory Core must never implement Q2-02 or later");
        }
      }
    }

    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision === "pass" && warnings.length ? "partial" : decision,
      errors,
      warnings,
      started,
    );
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.interpretDetailedBusinessStrategy === true ||
      input.generateBusinessModels === true ||
      input.researchMarkets === true ||
      input.assignWorkers === true ||
      input.executeBusinesses === true ||
      input.launchBusinesses === true ||
      input.implementQ202OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.interpretDetailedBusinessStrategy === true) {
      errors.push("Empire Builder Factory Core must never interpret detailed business strategy");
    }
    if (input.generateBusinessModels === true) {
      errors.push("Empire Builder Factory Core must never generate business models");
    }
    if (input.researchMarkets === true) {
      errors.push("Empire Builder Factory Core must never research markets");
    }
    if (input.assignWorkers === true) {
      errors.push("Empire Builder Factory Core must never assign workers");
    }
    if (input.executeBusinesses === true) {
      errors.push("Empire Builder Factory Core must never execute businesses");
    }
    if (input.launchBusinesses === true) {
      errors.push("Empire Builder Factory Core must never launch businesses");
    }
    if (input.implementQ202OrLater === true) {
      errors.push("Empire Builder Factory Core must never implement Q2-02 or later");
    }
  }

  finalize(
    decision: EmpireBuilderFactoryValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): EmpireBuilderFactoryValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `ebf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EBF_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: EmpireBuilderFactoryValidationReport["decision"] | null,
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
