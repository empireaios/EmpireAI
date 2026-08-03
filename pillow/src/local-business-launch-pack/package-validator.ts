import { LBLP_METADATA_VERSION } from "./paths.js";
import type {
  DeliverableVerification,
  LblpInput,
  LocalBusinessLaunchPackValidationReport,
  LocalBusinessLaunchReport,
} from "./types.js";

/** Reject Q7-11 and later mission IDs. Q7-10 itself is allowed. */
const FORBIDDEN_MISSION_ID = /^(Q7-1[1-9]|Q7-[2-9]\d|Q7-\d{3,}|Q[8-9]-\d+)/i;

type BoundaryInput = {
  launchBusinessAutomatically?: boolean;
  overrideGovernance?: boolean;
  replaceCertification?: boolean;
  claimReadinessWithoutEvidence?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ711OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class LblpValidator {
  decide(input: LblpInput): LocalBusinessLaunchPackValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateInput(input: LblpInput, started: number) {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Local Business Launch Pack requires validated=true when explicitly set");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  /**
   * Enforce "never claim readiness without evidence": a report claiming
   * ready_for_approval / recommend_approval with zero verified deliverables
   * is always rejected, regardless of forbidden-flag input.
   */
  validateReadinessEvidence(verification: DeliverableVerification, errors: string[]) {
    if (verification.presentCount === 0 && verification.requiredCount > 0) {
      // Zero evidence is only a hard failure when someone still tries to
      // assert a positive readiness signal elsewhere; the report builder
      // itself is required to reflect not_ready / do_not_approve in this case.
      return;
    }
  }

  validateReports(
    reports: LocalBusinessLaunchReport[] | null,
    input: LblpInput,
    started: number,
    options: { allowIncompleteReport?: boolean } = {},
  ): LocalBusinessLaunchPackValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Local Business Launch Pack requires validated=true when explicitly set");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail" && !options.allowIncompleteReport) {
        warnings.push("No Local Business Launch Reports were produced yet");
      }
    } else if (!options.allowIncompleteReport) {
      for (const report of reports) {
        this.validateReportShape(report, errors, warnings);
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

  finalize(
    decision: LocalBusinessLaunchPackValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): LocalBusinessLaunchPackValidationReport {
    return {
      validationReportId: `lblp-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LBLP_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.launchBusinessAutomatically === true ||
      input.overrideGovernance === true ||
      input.replaceCertification === true ||
      input.claimReadinessWithoutEvidence === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.bypassGrandKingApproval === true ||
      input.implementQ711OrLater === true ||
      (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.launchBusinessAutomatically === true) {
      errors.push("Local Business Launch Pack must never launch the business automatically");
    }
    if (input.overrideGovernance === true) {
      errors.push("Local Business Launch Pack must never override governance");
    }
    if (input.replaceCertification === true) {
      errors.push("Local Business Launch Pack must never replace certification");
    }
    if (input.claimReadinessWithoutEvidence === true) {
      errors.push("Local Business Launch Pack must never claim readiness without evidence");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Local Business Launch Pack must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Local Business Launch Pack must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Local Business Launch Pack must never override Grand King");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Local Business Launch Pack must never bypass Grand King approval");
    }
    if (input.implementQ711OrLater === true) {
      errors.push("Local Business Launch Pack must never implement Q7-11 or later");
    }
    if (
      typeof input.missionId === "string" &&
      FORBIDDEN_MISSION_ID.test(input.missionId.trim())
    ) {
      errors.push(`Local Business Launch Pack rejects forbidden missionId ${input.missionId}`);
    }
  }

  private validateReportShape(
    report: LocalBusinessLaunchReport,
    errors: string[],
    warnings: string[],
  ) {
    if (!report.reportId) errors.push("Missing report ID");
    if (!report.timestamp) errors.push("Missing timestamp");
    if (!report.businessProjectId) errors.push("Missing business project ID");
    if (!report.businessName) errors.push("Missing business name");
    if (!report.executiveSummary) errors.push("Missing executive summary");
    if (!report.deliverableVerification) errors.push("Missing deliverable verification");
    if (!report.readinessStatus) errors.push("Missing readiness status");
    if (!report.approvalRecommendation) errors.push("Missing approval recommendation");
    if (!report.auditStatus) errors.push("Missing audit status");
    if (!Array.isArray(report.outstandingIssues)) errors.push("Missing outstanding issues");
    if (report.confidenceScore == null) errors.push("Missing confidence score");
    if (!report.metadataVersion) errors.push("Missing metadata version");
    if (!report.reportVersion) errors.push("Missing report version");
    if (!report.workerId) errors.push("Missing worker ID");
    if (!report.packageId) errors.push("Missing package ID");
    if (!report.launchPackage) errors.push("Missing launch package sections");
    if (report.consumableByQ711 !== true) errors.push("Report must be consumableByQ711");
    if (!report.neverLaunchBusinessAutomatically) {
      errors.push("Report must lock neverLaunchBusinessAutomatically");
    }
    if (!report.neverReplaceCertification) {
      errors.push("Report must lock neverReplaceCertification");
    }
    if (!report.neverClaimReadinessWithoutEvidence) {
      errors.push("Report must lock neverClaimReadinessWithoutEvidence");
    }
    if (!report.neverImplementQ711OrLater) {
      errors.push("Report must lock neverImplementQ711OrLater");
    }
    if (!report.preserveCompleteTraceability) {
      errors.push("Report must lock preserveCompleteTraceability");
    }
    if (!report.preserveAuditHistory) {
      errors.push("Report must lock preserveAuditHistory");
    }
    if (
      (report.readinessStatus === "ready_for_approval" ||
        report.approvalRecommendation === "recommend_approval") &&
      report.deliverableVerification.presentCount === 0
    ) {
      errors.push(
        "Report must never claim readiness or recommend approval with zero verified deliverables",
      );
    }
    if (!report.deliverableVerification.items.length) {
      warnings.push(`Report ${report.reportId} has no deliverable verification items`);
    }
  }
}

export class HealthMonitor {
  status(
    decision: "pass" | "partial" | "fail",
    enabled: boolean,
  ): "healthy" | "degraded" | "failed" | "standby" {
    if (!enabled) return "standby";
    if (decision === "fail") return "failed";
    if (decision === "partial") return "degraded";
    return "healthy";
  }
}

export class RecoveryManager {
  private failures = 0;

  recordFailure() {
    this.failures += 1;
  }

  reset() {
    this.failures = 0;
  }

  failureCount() {
    return this.failures;
  }
}
