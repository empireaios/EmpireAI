import { EPFC_METADATA_VERSION } from "./paths.js";
import type {
  EnterprisePlatformFactoryCoreInput,
  EnterprisePlatformFactoryCoreValidationReport,
  EnterprisePlatformFactoryReport,
  EnterprisePlatformMission,
} from "./types.js";

type BoundaryInput = {
  buildFrontend?: boolean;
  buildBackend?: boolean;
  designDatabases?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ602OrLater?: boolean;
  validated?: boolean;
};

export class MissionValidator {
  decide(
    input: EnterprisePlatformFactoryCoreInput,
  ): EnterprisePlatformFactoryCoreValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateMissions(
    missions: EnterprisePlatformMission[] | null,
    input: EnterprisePlatformFactoryCoreInput,
    started: number,
    options: { requireActiveMission?: boolean } = {},
  ): EnterprisePlatformFactoryCoreValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Enterprise Platform Factory Core requires validated=true");
    }

    if (!missions || missions.length === 0) {
      if (decision !== "fail") {
        warnings.push("No enterprise platform missions were produced yet");
      }
    } else {
      for (const mission of missions) {
        if (!mission.factoryMissionId) errors.push("Missing factory mission ID");
        if (!mission.timestamp) errors.push("Missing timestamp");
        if (!mission.platformId) errors.push("Missing platform ID");
        if (!mission.businessObjective?.trim()) errors.push("Missing business objective");
        if (!mission.metadataVersion) errors.push("Missing metadata version");

        if (mission.currentStatus === "rejected" && options.requireActiveMission) {
          errors.push(`Enterprise platform mission ${mission.factoryMissionId} is rejected`);
        }
        if (!mission.neverBuildFrontend) {
          errors.push("Enterprise Platform Factory Core must never build frontend");
        }
        if (!mission.neverBuildBackend) {
          errors.push("Enterprise Platform Factory Core must never build backend");
        }
        if (!mission.neverDesignDatabases) {
          errors.push("Enterprise Platform Factory Core must never design databases");
        }
        if (!mission.neverImplementQ602OrLater) {
          errors.push("Enterprise Platform Factory Core must never implement Q6-02 or later");
        }
        if (!mission.traceabilityRefs.some((r) => r.includes("q6-01"))) {
          warnings.push(
            `Mission ${mission.factoryMissionId} missing Q6-01 traceability`,
          );
        }
      }
    }

    return this.finalize(
      errors.length || decision === "fail"
        ? "fail"
        : decision === "pass" && warnings.length
          ? "partial"
          : decision,
      errors,
      warnings,
      started,
    );
  }

  validateReport(
    report: EnterprisePlatformFactoryReport | null,
    input: EnterprisePlatformFactoryCoreInput,
    started: number,
  ): EnterprisePlatformFactoryCoreValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Enterprise Platform Factory Core requires validated=true");
    }

    if (!report) {
      errors.push("No Enterprise Platform Factory Report was produced");
    } else {
      const required: Array<keyof EnterprisePlatformFactoryReport> = [
        "factoryMissionId",
        "timestamp",
        "platformId",
        "platformName",
        "businessObjective",
        "currentLifecycleStage",
        "assignedWorkers",
        "activeDependencies",
        "testingStatus",
        "deploymentStatus",
        "executiveSummary",
        "metadataVersion",
        "approvalStatus",
        "productionStatus",
        "assignedWorkerRoles",
        "pipelineType",
        "platformType",
        "businessId",
        "traceabilityRefs",
        "preservedDecisions",
        "workerId",
      ];
      for (const field of required) {
        const value = report[field];
        if (value === undefined || value === null || value === "") {
          errors.push(
            `Enterprise Platform Factory Report missing required field: ${String(field)}`,
          );
        }
      }
      if (!report.neverBuildFrontend) {
        errors.push(
          "Enterprise Platform Factory Report must enforce neverBuildFrontend boundary",
        );
      }
      if (!report.neverBuildBackend) {
        errors.push(
          "Enterprise Platform Factory Report must enforce neverBuildBackend boundary",
        );
      }
      if (!report.neverDesignDatabases) {
        errors.push(
          "Enterprise Platform Factory Report must enforce neverDesignDatabases boundary",
        );
      }
      if (!report.neverBypassGrandKingApproval) {
        errors.push(
          "Enterprise Platform Factory Report must enforce neverBypassGrandKingApproval boundary",
        );
      }
    }

    return this.finalize(
      errors.length || decision === "fail"
        ? "fail"
        : decision === "pass" && warnings.length
          ? "partial"
          : decision,
      errors,
      warnings,
      started,
    );
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.buildFrontend === true ||
      input.buildBackend === true ||
      input.designDatabases === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ602OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.buildFrontend === true) {
      errors.push("Enterprise Platform Factory Core must never build frontend");
    }
    if (input.buildBackend === true) {
      errors.push("Enterprise Platform Factory Core must never build backend");
    }
    if (input.designDatabases === true) {
      errors.push("Enterprise Platform Factory Core must never design databases");
    }
    if (input.bypassGrandKingApproval === true || input.bypassApproval === true) {
      errors.push("Enterprise Platform Factory Core must never bypass Grand King approval");
    }
    if (input.overridePillow === true) {
      errors.push("Enterprise Platform Factory Core must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Enterprise Platform Factory Core must never override Grand King");
    }
    if (input.implementQ602OrLater === true) {
      errors.push("Enterprise Platform Factory Core must never implement Q6-02 or later");
    }
  }

  finalize(
    decision: EnterprisePlatformFactoryCoreValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): EnterprisePlatformFactoryCoreValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `epfc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EPFC_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: EnterprisePlatformFactoryCoreValidationReport["decision"] | null,
    enabled: boolean,
  ) {
    if (!enabled) return "standby" as const;
    if (decision === "fail" || decision === "partial") return "degraded" as const;
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
