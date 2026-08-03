import { DPF_METADATA_VERSION } from "./paths.js";
import type {
  DigitalProductBusinessMission,
  DigitalProductsFactoryCoreInput,
  DigitalProductsFactoryCoreValidationReport,
  DigitalProductsFactoryReport,
} from "./types.js";

type BoundaryInput = {
  createEbooks?: boolean;
  createCourses?: boolean;
  buildSalesPages?: boolean;
  processPayments?: boolean;
  bypassApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ502OrLater?: boolean;
  validated?: boolean;
};

export class MissionValidator {
  decide(
    input: DigitalProductsFactoryCoreInput,
  ): DigitalProductsFactoryCoreValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateMissions(
    missions: DigitalProductBusinessMission[] | null,
    input: DigitalProductsFactoryCoreInput,
    started: number,
    options: { requireActiveMission?: boolean } = {},
  ): DigitalProductsFactoryCoreValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Digital Products Factory Core requires validated=true");
    }

    if (!missions || missions.length === 0) {
      if (decision !== "fail") {
        warnings.push("No digital product business missions were produced yet");
      }
    } else {
      for (const mission of missions) {
        if (!mission.factoryMissionId) errors.push("Missing factory mission ID");
        if (!mission.timestamp) errors.push("Missing timestamp");
        if (!mission.businessId) errors.push("Missing business ID");
        if (!mission.missionObjective?.trim()) errors.push("Missing mission objective");
        if (!mission.metadataVersion) errors.push("Missing metadata version");

        if (mission.currentStatus === "rejected" && options.requireActiveMission) {
          errors.push(`Digital product mission ${mission.factoryMissionId} is rejected`);
        }
        if (!mission.neverCreateEbooks) {
          errors.push("Digital Products Factory Core must never create ebooks");
        }
        if (!mission.neverCreateCourses) {
          errors.push("Digital Products Factory Core must never create courses");
        }
        if (!mission.neverBuildSalesPages) {
          errors.push("Digital Products Factory Core must never build sales pages");
        }
        if (!mission.neverProcessPayments) {
          errors.push("Digital Products Factory Core must never process payments");
        }
        if (!mission.neverImplementQ502OrLater) {
          errors.push("Digital Products Factory Core must never implement Q5-02 or later");
        }
        if (!mission.traceabilityRefs.some((r) => r.includes("q5-01"))) {
          warnings.push(
            `Mission ${mission.factoryMissionId} missing Q5-01 traceability`,
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
    report: DigitalProductsFactoryReport | null,
    input: DigitalProductsFactoryCoreInput,
    started: number,
  ): DigitalProductsFactoryCoreValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Digital Products Factory Core requires validated=true");
    }

    if (!report) {
      errors.push("No Digital Products Factory Report was produced");
    } else {
      const required: Array<keyof DigitalProductsFactoryReport> = [
        "factoryMissionId",
        "timestamp",
        "businessId",
        "productPortfolio",
        "activeProducts",
        "currentPipelineStage",
        "assignedWorkers",
        "fulfilmentStatus",
        "analyticsStatus",
        "learningStatus",
        "executiveSummary",
        "metadataVersion",
        "approvalStatus",
        "productionStatus",
        "assignedWorkerRoles",
        "pipelineType",
        "productType",
        "businessName",
        "traceabilityRefs",
        "preservedDecisions",
        "workerId",
      ];
      for (const field of required) {
        const value = report[field];
        if (value === undefined || value === null || value === "") {
          errors.push(
            `Digital Products Factory Report missing required field: ${String(field)}`,
          );
        }
      }
      if (!report.neverCreateEbooks) {
        errors.push(
          "Digital Products Factory Report must enforce neverCreateEbooks boundary",
        );
      }
      if (!report.neverBuildSalesPages) {
        errors.push(
          "Digital Products Factory Report must enforce neverBuildSalesPages boundary",
        );
      }
      if (!report.neverProcessPayments) {
        errors.push(
          "Digital Products Factory Report must enforce neverProcessPayments boundary",
        );
      }
      if (!report.neverBypassApproval) {
        errors.push(
          "Digital Products Factory Report must enforce neverBypassApproval boundary",
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
      input.createEbooks === true ||
      input.createCourses === true ||
      input.buildSalesPages === true ||
      input.processPayments === true ||
      input.bypassApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ502OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.createEbooks === true) {
      errors.push("Digital Products Factory Core must never create ebooks");
    }
    if (input.createCourses === true) {
      errors.push("Digital Products Factory Core must never create courses");
    }
    if (input.buildSalesPages === true) {
      errors.push("Digital Products Factory Core must never build sales pages");
    }
    if (input.processPayments === true) {
      errors.push("Digital Products Factory Core must never process payments");
    }
    if (input.bypassApproval === true) {
      errors.push("Digital Products Factory Core must never bypass approval");
    }
    if (input.overridePillow === true) {
      errors.push("Digital Products Factory Core must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Digital Products Factory Core must never override Grand King");
    }
    if (input.implementQ502OrLater === true) {
      errors.push("Digital Products Factory Core must never implement Q5-02 or later");
    }
  }

  finalize(
    decision: DigitalProductsFactoryCoreValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): DigitalProductsFactoryCoreValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `dpf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: DPF_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: DigitalProductsFactoryCoreValidationReport["decision"] | null,
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
