import { BRW_METADATA_VERSION, RISK_CATEGORIES } from "./paths.js";
import type {
  BusinessRiskReport,
  BusinessRiskWorkerInput,
  BusinessRiskWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  removeRisksAutomatically?: boolean;
  approveBusiness?: boolean;
  rejectBusiness?: boolean;
  launchBusiness?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ209OrLater?: boolean;
  validated?: boolean;
};

export class RiskValidator {
  decide(input: BusinessRiskWorkerInput): BusinessRiskWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: BusinessRiskReport[] | null,
    input: BusinessRiskWorkerInput,
    started: number,
  ): BusinessRiskWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Business Risk Worker requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No business risk reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.riskReportId) errors.push("Missing risk report ID");
        if (!report.timestamp) errors.push("Missing risk report timestamp");
        if (!report.businessBuildMissionId) {
          errors.push("Missing business build mission ID");
        }
        if (!report.businessBlueprintId) errors.push("Missing business blueprint ID");
        if (!report.launchPlanId) errors.push("Missing launch plan ID");
        if (!report.risks.length) errors.push("Missing risk entries");
        if (!report.metadataVersion) errors.push("Missing metadata version");

        const categories = new Set(report.risks.map((r) => String(r.riskCategory)));
        for (const required of RISK_CATEGORIES) {
          if (!categories.has(required)) {
            warnings.push(`Risk category ${required} not present in report ${report.riskReportId}`);
          }
        }

        for (const risk of report.risks) {
          if (!risk.riskDescription?.trim()) {
            errors.push(`Risk ${risk.riskId} missing description`);
          }
          if (!risk.recommendedMitigation?.trim()) {
            errors.push(`Risk ${risk.riskId} missing recommended mitigation`);
          }
          if (!risk.supportingEvidence.length) {
            errors.push(`Risk ${risk.riskId} missing supporting evidence`);
          }
          if (risk.likelihoodScore < 0 || risk.impactScore < 0) {
            errors.push(`Risk ${risk.riskId} has invalid scores`);
          }
        }

        if (!report.neverRemoveRisksAutomatically) {
          errors.push("Business Risk Worker must never remove risks automatically");
        }
        if (!report.neverApproveBusiness) {
          errors.push("Business Risk Worker must never approve businesses");
        }
        if (!report.neverRejectBusiness) {
          errors.push("Business Risk Worker must never reject businesses");
        }
        if (!report.neverLaunchBusiness) {
          errors.push("Business Risk Worker must never launch businesses");
        }
        if (!report.traceabilityRefs.some((r) => r.includes("q2-06"))) {
          warnings.push(
            `Risk report ${report.riskReportId} missing explicit Q2-06 blueprint traceability`,
          );
        }
        if (!report.traceabilityRefs.some((r) => r.includes("q2-07"))) {
          warnings.push(
            `Risk report ${report.riskReportId} missing explicit Q2-07 launch plan traceability`,
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

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.removeRisksAutomatically === true ||
      input.approveBusiness === true ||
      input.rejectBusiness === true ||
      input.launchBusiness === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ209OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.removeRisksAutomatically === true) {
      errors.push("Business Risk Worker must never remove risks automatically");
    }
    if (input.approveBusiness === true) {
      errors.push("Business Risk Worker must never approve businesses");
    }
    if (input.rejectBusiness === true) {
      errors.push("Business Risk Worker must never reject businesses");
    }
    if (input.launchBusiness === true) {
      errors.push("Business Risk Worker must never launch businesses");
    }
    if (input.overridePillow === true) {
      errors.push("Business Risk Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Business Risk Worker must never override Grand King");
    }
    if (input.implementQ209OrLater === true) {
      errors.push("Business Risk Worker must never implement Q2-09 or later");
    }
  }

  finalize(
    decision: BusinessRiskWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): BusinessRiskWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `brw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BRW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: BusinessRiskWorkerValidationReport["decision"] | null,
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
