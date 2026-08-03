import { LGW_METADATA_VERSION } from "./paths.js";
import type {
  LeadGenInput,
  LeadGenerationReport,
  LeadGenerationWorkerValidationReport,
} from "./types.js";

/** Reject Q7-09 and later mission IDs. Q7-08 itself is allowed. */
const FORBIDDEN_MISSION_ID = /^(Q7-0[9]|Q7-\d{2,}|Q[8-9]-\d+)/i;

type BoundaryInput = {
  executeAdvertisingCampaigns?: boolean;
  replaceCrm?: boolean;
  replaceBookingWorker?: boolean;
  deliverCustomerJobs?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  fabricateLeadOrConversionResults?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ709OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class LeadValidator {
  decide(input: LeadGenInput): LeadGenerationWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateInput(input: LeadGenInput, started: number) {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Lead Generation Worker requires validated=true when explicitly set");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  validateReports(
    reports: LeadGenerationReport[] | null,
    input: LeadGenInput,
    started: number,
    options: { allowIncompleteReport?: boolean } = {},
  ): LeadGenerationWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Lead Generation Worker requires validated=true when explicitly set");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail" && !options.allowIncompleteReport) {
        warnings.push("No lead generation reports were produced yet");
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
    decision: LeadGenerationWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): LeadGenerationWorkerValidationReport {
    return {
      validationReportId: `lgw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LGW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeAdvertisingCampaigns === true ||
      input.replaceCrm === true ||
      input.replaceBookingWorker === true ||
      input.deliverCustomerJobs === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.fabricateLeadOrConversionResults === true ||
      input.bypassGrandKingApproval === true ||
      input.implementQ709OrLater === true ||
      (typeof input.missionId === "string" &&
        FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeAdvertisingCampaigns === true) {
      errors.push("Lead Generation Worker must never execute advertising campaigns");
    }
    if (input.replaceCrm === true) {
      errors.push("Lead Generation Worker must never replace CRM");
    }
    if (input.replaceBookingWorker === true) {
      errors.push("Lead Generation Worker must never replace booking worker");
    }
    if (input.deliverCustomerJobs === true) {
      errors.push("Lead Generation Worker must never deliver customer jobs");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Lead Generation Worker must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Lead Generation Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Lead Generation Worker must never override Grand King");
    }
    if (input.fabricateLeadOrConversionResults === true) {
      errors.push(
        "Lead Generation Worker must never fabricate lead or conversion results",
      );
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Lead Generation Worker must never bypass Grand King approval");
    }
    if (input.implementQ709OrLater === true) {
      errors.push("Lead Generation Worker must never implement Q7-09 or later");
    }
    if (
      typeof input.missionId === "string" &&
      FORBIDDEN_MISSION_ID.test(input.missionId.trim())
    ) {
      errors.push(`Lead Generation Worker rejects forbidden missionId ${input.missionId}`);
    }
  }

  private validateReportShape(
    report: LeadGenerationReport,
    errors: string[],
    warnings: string[],
  ) {
    if (!report.reportId) errors.push("Missing report ID");
    if (!report.timestamp) errors.push("Missing timestamp");
    if (!report.businessProjectId) errors.push("Missing business project ID");
    if (!report.funnelId) errors.push("Missing funnel ID");
    if (!report.leadSource) errors.push("Missing lead source");
    if (!report.leadQualificationStatus) errors.push("Missing lead qualification status");
    if (report.leadScore === undefined) errors.push("Missing lead score field");
    if (!report.crmIntegrationStatus) errors.push("Missing CRM integration status");
    if (!report.bookingIntegrationStatus) errors.push("Missing booking integration status");
    if (!report.conversionStage) errors.push("Missing conversion stage");
    if (!report.funnelPerformanceSummary) errors.push("Missing funnel performance summary");
    if (!report.auditStatus) errors.push("Missing audit status");
    if (!report.outstandingIssues) errors.push("Missing outstanding issues");
    if (report.confidenceScore == null) errors.push("Missing confidence score");
    if (!report.metadataVersion) errors.push("Missing metadata version");
    if (!report.reportVersion) errors.push("Missing report version");
    if (!report.workerId) errors.push("Missing worker ID");
    if (!report.forms) errors.push("Missing forms");
    if (!report.capturedLeads) errors.push("Missing captured leads");
    if (!report.sourceAttribution) errors.push("Missing source attribution");
    if (!report.sourceSeoReportId) errors.push("Missing source SEO report ID");
    if (report.consumableByQ709 !== true) errors.push("Report must be consumableByQ709");
    if (!report.neverExecuteAdvertisingCampaigns) {
      errors.push("Report must lock neverExecuteAdvertisingCampaigns");
    }
    if (!report.neverReplaceCrm) errors.push("Report must lock neverReplaceCrm");
    if (!report.neverReplaceBookingWorker) {
      errors.push("Report must lock neverReplaceBookingWorker");
    }
    if (!report.neverFabricateLeadOrConversionResults) {
      errors.push("Report must lock neverFabricateLeadOrConversionResults");
    }
    if (!report.neverImplementQ709OrLater) {
      errors.push("Report must lock neverImplementQ709OrLater");
    }
    if (!report.preserveCompleteLeadTraceability) {
      errors.push("Report must lock preserveCompleteLeadTraceability");
    }
    if (!report.preserveFunnelAuditHistory) {
      errors.push("Report must lock preserveFunnelAuditHistory");
    }
    if (
      report.funnelPerformanceSummary &&
      report.funnelPerformanceSummary.derivedFromObservedCapturesOnly !== true
    ) {
      errors.push("Funnel metrics must derive from observed captures only");
    }
    if (!report.capturedLeads.length) {
      warnings.push(`Report ${report.reportId} has no captured leads`);
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
