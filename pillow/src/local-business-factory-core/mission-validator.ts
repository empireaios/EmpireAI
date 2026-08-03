import { LBFC_METADATA_VERSION } from "./paths.js";
import type {
  LocalBusinessFactoryCoreInput,
  LocalBusinessFactoryCoreValidationReport,
  LocalBusinessFactoryReport,
  LocalBusinessProject,
} from "./types.js";

type BoundaryInput = {
  performSpecialistWork?: boolean;
  replaceQ7Workers?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  fabricateOperationalStatus?: boolean;
  implementQ702OrLater?: boolean;
  modifyUnrelatedFactories?: boolean;
  overrideApprovedArchitecture?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

const FORBIDDEN_MISSION_ID = /^(Q7-0[2-9]|Q7-\d{2,}|Q[8-9]-\d+)/i;

export class MissionValidator {
  decide(
    input: LocalBusinessFactoryCoreInput,
  ): LocalBusinessFactoryCoreValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateProjects(
    projects: LocalBusinessProject[] | null,
    input: LocalBusinessFactoryCoreInput,
    started: number,
    options: { requireActiveProject?: boolean } = {},
  ): LocalBusinessFactoryCoreValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Local Business Factory Core requires validated=true");
    }

    if (!projects || projects.length === 0) {
      if (decision !== "fail") {
        warnings.push("No local business projects were produced yet");
      }
    } else {
      for (const project of projects) {
        if (!project.factoryMissionId) errors.push("Missing factory mission ID");
        if (!project.businessProjectId) errors.push("Missing business project ID");
        if (!project.timestamp) errors.push("Missing timestamp");
        if (!project.businessName?.trim()) errors.push("Missing business name");
        if (!project.metadataVersion) errors.push("Missing metadata version");

        if (project.currentStatus === "rejected" && options.requireActiveProject) {
          errors.push(`Local business project ${project.factoryMissionId} is rejected`);
        }
        if (!project.neverPerformSpecialistWorkerFunctions) {
          errors.push(
            "Local Business Factory Core must never perform specialist worker functions",
          );
        }
        if (!project.neverReplaceQ7Workers) {
          errors.push("Local Business Factory Core must never replace Q7 workers");
        }
        if (!project.neverFabricateOperationalStatus) {
          errors.push(
            "Local Business Factory Core must never fabricate operational status",
          );
        }
        if (!project.neverImplementQ702OrLater) {
          errors.push("Local Business Factory Core must never implement Q7-02 or later");
        }
        if (!project.traceabilityRefs.some((r) => r.includes("q7-01"))) {
          warnings.push(
            `Project ${project.factoryMissionId} missing Q7-01 traceability`,
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
    report: LocalBusinessFactoryReport | null,
    input: LocalBusinessFactoryCoreInput,
    started: number,
  ): LocalBusinessFactoryCoreValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Local Business Factory Core requires validated=true");
    }

    if (!report) {
      errors.push("No Local Business Factory Report was produced");
    } else {
      const required: Array<keyof LocalBusinessFactoryReport> = [
        "factoryId",
        "timestamp",
        "businessProjectId",
        "businessCategory",
        "businessName",
        "currentLifecycleStage",
        "assignedWorkers",
        "launchReadiness",
        "customerAcquisitionStatus",
        "operationalStatus",
        "outstandingIssues",
        "executiveSummary",
        "confidenceScore",
        "metadataVersion",
      ];
      for (const field of required) {
        const value = report[field];
        if (value === undefined || value === null || value === "") {
          errors.push(
            `Local Business Factory Report missing required field: ${String(field)}`,
          );
        }
      }
      if (
        typeof report.confidenceScore !== "number" ||
        report.confidenceScore < 0 ||
        report.confidenceScore > 100
      ) {
        errors.push("Local Business Factory Report confidenceScore must be 0-100");
      }
      if (!report.neverPerformSpecialistWorkerFunctions) {
        errors.push(
          "Local Business Factory Report must enforce neverPerformSpecialistWorkerFunctions boundary",
        );
      }
      if (!report.neverReplaceQ7Workers) {
        errors.push(
          "Local Business Factory Report must enforce neverReplaceQ7Workers boundary",
        );
      }
      if (!report.neverFabricateOperationalStatus) {
        errors.push(
          "Local Business Factory Report must enforce neverFabricateOperationalStatus boundary",
        );
      }
      if (!report.neverBypassGrandKingApproval) {
        errors.push(
          "Local Business Factory Report must enforce neverBypassGrandKingApproval boundary",
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
      input.performSpecialistWork === true ||
      input.replaceQ7Workers === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.fabricateOperationalStatus === true ||
      input.implementQ702OrLater === true ||
      input.modifyUnrelatedFactories === true ||
      input.overrideApprovedArchitecture === true ||
      (!!input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.performSpecialistWork === true) {
      errors.push(
        "Local Business Factory Core must never perform specialist worker functions",
      );
    }
    if (input.replaceQ7Workers === true) {
      errors.push("Local Business Factory Core must never replace Q7 workers");
    }
    if (input.bypassGrandKingApproval === true || input.bypassApproval === true) {
      errors.push("Local Business Factory Core must never bypass Grand King approval");
    }
    if (input.overridePillow === true) {
      errors.push("Local Business Factory Core must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Local Business Factory Core must never override Grand King");
    }
    if (input.fabricateOperationalStatus === true) {
      errors.push(
        "Local Business Factory Core must never fabricate operational status",
      );
    }
    if (input.implementQ702OrLater === true) {
      errors.push("Local Business Factory Core must never implement Q7-02 or later");
    }
    if (input.modifyUnrelatedFactories === true) {
      errors.push("Local Business Factory Core must never modify unrelated factories");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push(
        "Local Business Factory Core must never override approved architecture",
      );
    }
    if (input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(
        `Local Business Factory Core rejects out-of-scope missionId ${input.missionId}`,
      );
    }
  }

  finalize(
    decision: LocalBusinessFactoryCoreValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): LocalBusinessFactoryCoreValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `lbfc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LBFC_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: LocalBusinessFactoryCoreValidationReport["decision"] | null,
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
