import { AFC_METADATA_VERSION } from "./paths.js";
import type {
  AfcInput,
  AffiliateBusinessProject,
  AffiliateFactoryCoreValidationReport,
  AffiliateFactoryReport,
} from "./types.js";

type BoundaryInput = {
  discoverAffiliateProgrammes?: boolean;
  generateAffiliateContent?: boolean;
  launchBusinessesAutomatically?: boolean;
  fabricateWorkerStatus?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ802OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

const FORBIDDEN_MISSION_ID = /^(Q8-0[2-9]|Q8-\d{2,}|Q9-\d+)/i;

export class AfcValidator {
  decide(input: AfcInput): AffiliateFactoryCoreValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateProjects(
    projects: AffiliateBusinessProject[] | null,
    input: AfcInput,
    started: number,
  ): AffiliateFactoryCoreValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Affiliate Factory Core requires validated=true");
    }

    if (!projects || projects.length === 0) {
      if (decision !== "fail") {
        warnings.push("No affiliate business projects were produced yet");
      }
    } else {
      for (const project of projects) {
        if (!project.factoryProjectId) errors.push("Missing factory project ID");
        if (!project.affiliateBusinessId) errors.push("Missing affiliate business ID");
        if (!project.timestamp) errors.push("Missing timestamp");
        if (!project.businessName?.trim()) errors.push("Missing business name");
        if (!project.metadataVersion) errors.push("Missing metadata version");

        if (!project.neverDiscoverAffiliateProgrammes) {
          errors.push("Affiliate Factory Core must never discover affiliate programmes");
        }
        if (!project.neverGenerateAffiliateContent) {
          errors.push("Affiliate Factory Core must never generate affiliate content");
        }
        if (!project.neverLaunchBusinessesAutomatically) {
          errors.push("Affiliate Factory Core must never launch businesses automatically");
        }
        if (!project.neverFabricateWorkerStatus) {
          errors.push("Affiliate Factory Core must never fabricate worker status");
        }
        if (!project.neverImplementQ802OrLater) {
          errors.push("Affiliate Factory Core must never implement Q8-02 or later");
        }
        if (!project.traceabilityRefs.some((r) => r.includes("q8-01"))) {
          warnings.push(`Project ${project.factoryProjectId} missing Q8-01 traceability`);
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
    report: AffiliateFactoryReport | null,
    input: AfcInput,
    started: number,
  ): AffiliateFactoryCoreValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Affiliate Factory Core requires validated=true");
    }

    if (!report) {
      errors.push("No Affiliate Factory Report was produced");
    } else {
      const required: Array<keyof AffiliateFactoryReport> = [
        "reportId",
        "timestamp",
        "affiliateBusinessId",
        "businessName",
        "lifecycleStatus",
        "workerStatusMatrix",
        "readinessStatus",
        "outstandingTasks",
        "risks",
        "executiveSummary",
        "auditStatus",
        "confidenceScore",
        "metadataVersion",
      ];
      for (const field of required) {
        const value = report[field];
        if (value === undefined || value === null || value === "") {
          errors.push(`Affiliate Factory Report missing required field: ${String(field)}`);
        }
      }
      if (
        typeof report.confidenceScore !== "number" ||
        report.confidenceScore < 0 ||
        report.confidenceScore > 100
      ) {
        errors.push("Affiliate Factory Report confidenceScore must be 0-100");
      }
      if (!report.neverDiscoverAffiliateProgrammes) {
        errors.push(
          "Affiliate Factory Report must enforce neverDiscoverAffiliateProgrammes boundary",
        );
      }
      if (!report.neverGenerateAffiliateContent) {
        errors.push(
          "Affiliate Factory Report must enforce neverGenerateAffiliateContent boundary",
        );
      }
      if (!report.neverLaunchBusinessesAutomatically) {
        errors.push(
          "Affiliate Factory Report must enforce neverLaunchBusinessesAutomatically boundary",
        );
      }
      if (!report.neverFabricateWorkerStatus) {
        errors.push("Affiliate Factory Report must enforce neverFabricateWorkerStatus boundary");
      }
      if (!report.neverBypassGrandKingApproval) {
        errors.push(
          "Affiliate Factory Report must enforce neverBypassGrandKingApproval boundary",
        );
      }
      if (!report.neverImplementQ802OrLater) {
        errors.push("Affiliate Factory Report must enforce neverImplementQ802OrLater boundary");
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
      input.discoverAffiliateProgrammes === true ||
      input.generateAffiliateContent === true ||
      input.launchBusinessesAutomatically === true ||
      input.fabricateWorkerStatus === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ802OrLater === true ||
      (!!input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.discoverAffiliateProgrammes === true) {
      errors.push("Affiliate Factory Core must never discover affiliate programmes");
    }
    if (input.generateAffiliateContent === true) {
      errors.push("Affiliate Factory Core must never generate affiliate content");
    }
    if (input.launchBusinessesAutomatically === true) {
      errors.push("Affiliate Factory Core must never launch businesses automatically");
    }
    if (input.fabricateWorkerStatus === true) {
      errors.push("Affiliate Factory Core must never fabricate worker status");
    }
    if (input.bypassGrandKingApproval === true || input.bypassApproval === true) {
      errors.push("Affiliate Factory Core must never bypass Grand King approval");
    }
    if (input.overridePillow === true) {
      errors.push("Affiliate Factory Core must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Affiliate Factory Core must never override Grand King");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Affiliate Factory Core must never override approved architecture");
    }
    if (input.implementQ802OrLater === true) {
      errors.push("Affiliate Factory Core must never implement Q8-02 or later");
    }
    if (input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`Affiliate Factory Core rejects out-of-scope missionId ${input.missionId}`);
    }
  }

  finalize(
    decision: AffiliateFactoryCoreValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): AffiliateFactoryCoreValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `afc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AFC_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: AffiliateFactoryCoreValidationReport["decision"] | null,
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
