import { CAPFC_METADATA_VERSION } from "./paths.js";
import type {
  CapfcInput,
  CapitalProject,
  CapitalFactoryCoreValidationReport,
  CapitalFactoryReport,
} from "./types.js";

type BoundaryInput = {
  performAccounting?: boolean;
  forecastFinances?: boolean;
  executeInvestmentsAutomatically?: boolean;
  fabricateWorkerStatus?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ902OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

const FORBIDDEN_MISSION_ID = /^(Q9-0[2-9]|Q9-\d{2,}|Q[1-9]\d-\d+)/i;

export class AfcValidator {
  decide(input: CapfcInput): CapitalFactoryCoreValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateProjects(
    projects: CapitalProject[] | null,
    input: CapfcInput,
    started: number,
  ): CapitalFactoryCoreValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Capital Factory Core requires validated=true");
    }

    if (!projects || projects.length === 0) {
      if (decision !== "fail") {
        warnings.push("No capital projects were produced yet");
      }
    } else {
      for (const project of projects) {
        if (!project.factoryProjectId) errors.push("Missing factory project ID");
        if (!project.capitalBusinessId) errors.push("Missing capital ID");
        if (!project.timestamp) errors.push("Missing timestamp");
        if (!project.capitalProjectName?.trim()) errors.push("Missing business name");
        if (!project.metadataVersion) errors.push("Missing metadata version");

        if (!project.neverPerformAccounting) {
          errors.push("Capital Factory Core must never perform accounting");
        }
        if (!project.neverForecastFinances) {
          errors.push("Capital Factory Core must never forecast finances");
        }
        if (!project.neverExecuteInvestmentsAutomatically) {
          errors.push("Capital Factory Core must never execute investments automatically");
        }
        if (!project.neverFabricateWorkerStatus) {
          errors.push("Capital Factory Core must never fabricate worker status");
        }
        if (!project.neverFabricateFinancialStatus) {
          errors.push("Capital Factory Core must never fabricate financial status");
        }
        if (!project.neverImplementQ902OrLater) {
          errors.push("Capital Factory Core must never implement Q9-02 or later");
        }
        if (!project.traceabilityRefs.some((r) => r.includes("q9-01"))) {
          warnings.push(`Project ${project.factoryProjectId} missing Q9-01 traceability`);
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
    report: CapitalFactoryReport | null,
    input: CapfcInput,
    started: number,
  ): CapitalFactoryCoreValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Capital Factory Core requires validated=true");
    }

    if (!report) {
      errors.push("No Capital Factory Report was produced");
    } else {
      const required: Array<keyof CapitalFactoryReport> = [
        "reportId",
        "timestamp",
        "capitalProjectId",
        "financialPeriod",
        "capitalStatus",
        "capitalBusinessId",
        "capitalProjectName",
        "lifecycleStatus",
        "workerStatusMatrix",
        "capitalAllocationSummary",
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
          errors.push(`Capital Factory Report missing required field: ${String(field)}`);
        }
      }
      if (
        typeof report.confidenceScore !== "number" ||
        report.confidenceScore < 0 ||
        report.confidenceScore > 100
      ) {
        errors.push("Capital Factory Report confidenceScore must be 0-100");
      }
      if (!report.neverPerformAccounting) {
        errors.push(
          "Capital Factory Report must enforce neverPerformAccounting boundary",
        );
      }
      if (!report.neverForecastFinances) {
        errors.push(
          "Capital Factory Report must enforce neverForecastFinances boundary",
        );
      }
      if (!report.neverExecuteInvestmentsAutomatically) {
        errors.push(
          "Capital Factory Report must enforce neverExecuteInvestmentsAutomatically boundary",
        );
      }
      if (!report.neverFabricateWorkerStatus) {
        errors.push("Capital Factory Report must enforce neverFabricateWorkerStatus boundary");
      }
      if (!report.neverFabricateFinancialStatus) {
        errors.push(
          "Capital Factory Report must enforce neverFabricateFinancialStatus boundary",
        );
      }
      if (!report.neverBypassGrandKingApproval) {
        errors.push(
          "Capital Factory Report must enforce neverBypassGrandKingApproval boundary",
        );
      }
      if (!report.neverImplementQ902OrLater) {
        errors.push("Capital Factory Report must enforce neverImplementQ902OrLater boundary");
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
      input.performAccounting === true ||
      input.forecastFinances === true ||
      input.executeInvestmentsAutomatically === true ||
      input.fabricateWorkerStatus === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ902OrLater === true ||
      (!!input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.performAccounting === true) {
      errors.push("Capital Factory Core must never perform accounting");
    }
    if (input.forecastFinances === true) {
      errors.push("Capital Factory Core must never forecast finances");
    }
    if (input.executeInvestmentsAutomatically === true) {
      errors.push("Capital Factory Core must never execute investments automatically");
    }
    if (input.fabricateWorkerStatus === true) {
      errors.push("Capital Factory Core must never fabricate worker status");
    }
    if (input.bypassGrandKingApproval === true || input.bypassApproval === true) {
      errors.push("Capital Factory Core must never bypass Grand King approval");
    }
    if (input.overridePillow === true) {
      errors.push("Capital Factory Core must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Capital Factory Core must never override Grand King");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Capital Factory Core must never override approved architecture");
    }
    if (input.implementQ902OrLater === true) {
      errors.push("Capital Factory Core must never implement Q9-02 or later");
    }
    if (input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`Capital Factory Core rejects out-of-scope missionId ${input.missionId}`);
    }
  }

  finalize(
    decision: CapitalFactoryCoreValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): CapitalFactoryCoreValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `capfc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CAPFC_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: CapitalFactoryCoreValidationReport["decision"] | null,
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
