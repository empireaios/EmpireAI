import { CRMW_METADATA_VERSION } from "./paths.js";
import type {
  CrmInput,
  CrmReport,
  CrmWorkerValidationReport,
} from "./types.js";

/** Reject Q7-06 and later mission IDs. Q7-05 itself is allowed. */
const FORBIDDEN_MISSION_ID = /^(Q7-0[6-9]|Q7-\d{2,}|Q[8-9]-\d+)/i;

type BoundaryInput = {
  executeMarketingCampaigns?: boolean;
  deliverCustomerJobs?: boolean;
  replaceBookingFunctionality?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  fabricateCustomerInteractions?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ706OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class CrmValidator {
  decide(input: CrmInput): CrmWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateInput(input: CrmInput, started: number) {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("CRM Worker requires validated=true when explicitly set");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  validateReports(
    reports: CrmReport[] | null,
    input: CrmInput,
    started: number,
    options: { allowIncompleteReport?: boolean } = {},
  ): CrmWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("CRM Worker requires validated=true when explicitly set");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail" && !options.allowIncompleteReport) {
        warnings.push("No CRM reports were produced yet");
      }
    } else if (!options.allowIncompleteReport) {
      for (const report of reports) {
        this.validateReportShape(report, errors);
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
    decision: CrmWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): CrmWorkerValidationReport {
    return {
      validationReportId: `crmw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CRMW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeMarketingCampaigns === true ||
      input.deliverCustomerJobs === true ||
      input.replaceBookingFunctionality === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.fabricateCustomerInteractions === true ||
      input.bypassGrandKingApproval === true ||
      input.implementQ706OrLater === true ||
      (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeMarketingCampaigns === true) {
      errors.push("CRM Worker must never execute marketing campaigns");
    }
    if (input.deliverCustomerJobs === true) {
      errors.push("CRM Worker must never deliver customer jobs");
    }
    if (input.replaceBookingFunctionality === true) {
      errors.push("CRM Worker must never replace booking functionality");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("CRM Worker must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("CRM Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("CRM Worker must never override Grand King");
    }
    if (input.fabricateCustomerInteractions === true) {
      errors.push("CRM Worker must never fabricate customer interactions");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("CRM Worker must never bypass Grand King approval");
    }
    if (input.implementQ706OrLater === true) {
      errors.push("CRM Worker must never implement Q7-06 or later");
    }
    if (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`CRM Worker rejects forbidden missionId ${input.missionId}`);
    }
  }

  private validateReportShape(report: CrmReport, errors: string[]) {
    if (!report.reportId) errors.push("Missing report ID");
    if (!report.timestamp) errors.push("Missing timestamp");
    if (!report.businessProjectId) errors.push("Missing business project ID");
    if (!report.customerId) errors.push("Missing customer ID");
    if (!report.leadStatus) errors.push("Missing lead status");
    if (!report.contactHistory) errors.push("Missing contact history");
    if (!report.bookingHistory) errors.push("Missing booking history");
    if (!report.followUpSchedule) errors.push("Missing follow-up schedule");
    if (!report.customerLifecycleStage) errors.push("Missing customer lifecycle stage");
    if (!report.outstandingTasks) errors.push("Missing outstanding tasks");
    if (!report.auditStatus) errors.push("Missing audit status");
    if (report.confidenceScore == null) errors.push("Missing confidence score");
    if (!report.metadataVersion) errors.push("Missing metadata version");
    if (!report.reportVersion) errors.push("Missing report version");
    if (!report.workerId) errors.push("Missing worker ID");
    if (!report.tags) errors.push("Missing tags");
    if (!report.segments) errors.push("Missing segments");
    if (report.referralSource === undefined) errors.push("Missing referral source field");
    if (report.repeatCustomer == null) errors.push("Missing repeat customer");
    if (!report.opportunities) errors.push("Missing opportunities");
    if (!report.communicationHistory) errors.push("Missing communication history");
    if (report.consumableByQ706 !== true) errors.push("Report must be consumableByQ706");
    if (!report.neverExecuteMarketingCampaigns) {
      errors.push("Report must lock neverExecuteMarketingCampaigns");
    }
    if (!report.neverDeliverCustomerJobs) {
      errors.push("Report must lock neverDeliverCustomerJobs");
    }
    if (!report.neverReplaceBookingFunctionality) {
      errors.push("Report must lock neverReplaceBookingFunctionality");
    }
    if (!report.neverFabricateCustomerInteractions) {
      errors.push("Report must lock neverFabricateCustomerInteractions");
    }
    if (!report.neverImplementQ706OrLater) {
      errors.push("Report must lock neverImplementQ706OrLater");
    }
    if (!report.preserveCompleteCustomerHistory) {
      errors.push("Report must lock preserveCompleteCustomerHistory");
    }
    if (!report.preserveCrmAuditHistory) {
      errors.push("Report must lock preserveCrmAuditHistory");
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
