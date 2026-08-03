import { OPSW_METADATA_VERSION } from "./paths.js";
import type { OperationsReport, OperationsWorkerValidationReport, OpsInput } from "./types.js";

/** Reject Q7-10 and later mission IDs. Q7-09 itself is allowed. */
const FORBIDDEN_MISSION_ID = /^(Q7-1[0-9]|Q7-[2-9]\d|Q7-\d{3,}|Q[8-9]-\d+)/i;

type BoundaryInput = {
  performCustomerServices?: boolean;
  replaceBookingWorker?: boolean;
  replaceCrmWorker?: boolean;
  replaceLeadGenerationWorker?: boolean;
  fabricateOperationalEvidence?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ710OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class OpsValidator {
  decide(input: OpsInput): OperationsWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateInput(input: OpsInput, started: number) {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Operations Worker requires validated=true when explicitly set");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  validateReports(
    reports: OperationsReport[] | null,
    input: OpsInput,
    started: number,
    options: { allowIncompleteReport?: boolean } = {},
  ): OperationsWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Operations Worker requires validated=true when explicitly set");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail" && !options.allowIncompleteReport) {
        warnings.push("No operations reports were produced yet");
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
    decision: OperationsWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): OperationsWorkerValidationReport {
    return {
      validationReportId: `opsw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: OPSW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.performCustomerServices === true ||
      input.replaceBookingWorker === true ||
      input.replaceCrmWorker === true ||
      input.replaceLeadGenerationWorker === true ||
      input.fabricateOperationalEvidence === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.bypassGrandKingApproval === true ||
      input.implementQ710OrLater === true ||
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
    if (input.performCustomerServices === true) {
      errors.push("Operations Worker must never perform customer services");
    }
    if (input.replaceBookingWorker === true) {
      errors.push("Operations Worker must never replace the Booking Worker");
    }
    if (input.replaceCrmWorker === true) {
      errors.push("Operations Worker must never replace the CRM Worker");
    }
    if (input.replaceLeadGenerationWorker === true) {
      errors.push("Operations Worker must never replace the Lead Generation Worker");
    }
    if (input.fabricateOperationalEvidence === true) {
      errors.push("Operations Worker must never fabricate operational evidence");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Operations Worker must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Operations Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Operations Worker must never override Grand King");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Operations Worker must never bypass Grand King approval");
    }
    if (input.implementQ710OrLater === true) {
      errors.push("Operations Worker must never implement Q7-10 or later");
    }
    if (
      typeof input.missionId === "string" &&
      FORBIDDEN_MISSION_ID.test(input.missionId.trim())
    ) {
      errors.push(`Operations Worker rejects forbidden missionId ${input.missionId}`);
    }
  }

  private validateReportShape(
    report: OperationsReport,
    errors: string[],
    warnings: string[],
  ) {
    if (!report.reportId) errors.push("Missing report ID");
    if (!report.timestamp) errors.push("Missing timestamp");
    if (!report.businessProjectId) errors.push("Missing business project ID");
    if (!report.workflowId) errors.push("Missing workflow ID");
    if (!report.serviceType) errors.push("Missing service type");
    if (!report.operationalStages) errors.push("Missing operational stages");
    if (report.assignmentWorkflow === undefined) errors.push("Missing assignment workflow field");
    if (report.fulfilmentChecklist === undefined) errors.push("Missing fulfilment checklist field");
    if (report.qaCheckpoints === undefined) errors.push("Missing QA checkpoints field");
    if (report.escalationWorkflow === undefined) errors.push("Missing escalation workflow field");
    if (report.completionWorkflow === undefined) errors.push("Missing completion workflow field");
    if (report.followUpWorkflow === undefined) errors.push("Missing follow-up workflow field");
    if (!report.auditStatus) errors.push("Missing audit status");
    if (!report.outstandingIssues) errors.push("Missing outstanding issues");
    if (report.confidenceScore == null) errors.push("Missing confidence score");
    if (!report.metadataVersion) errors.push("Missing metadata version");
    if (!report.reportVersion) errors.push("Missing report version");
    if (!report.workerId) errors.push("Missing worker ID");
    if (!report.sourceBookingId) errors.push("Missing source booking ID");
    if (report.consumableByQ710 !== true) errors.push("Report must be consumableByQ710");
    if (!report.neverFabricateOperationalEvidence) {
      errors.push("Report must lock neverFabricateOperationalEvidence");
    }
    if (!report.neverPerformCustomerServices) {
      errors.push("Report must lock neverPerformCustomerServices");
    }
    if (!report.neverReplaceBookingWorker) {
      errors.push("Report must lock neverReplaceBookingWorker");
    }
    if (!report.neverReplaceCrmWorker) errors.push("Report must lock neverReplaceCrmWorker");
    if (!report.neverReplaceLeadGenerationWorker) {
      errors.push("Report must lock neverReplaceLeadGenerationWorker");
    }
    if (!report.neverImplementQ710OrLater) {
      errors.push("Report must lock neverImplementQ710OrLater");
    }
    if (!report.preserveCompleteOperationalTraceability) {
      errors.push("Report must lock preserveCompleteOperationalTraceability");
    }
    if (!report.preserveWorkflowAuditHistory) {
      errors.push("Report must lock preserveWorkflowAuditHistory");
    }
    if (!report.operationalStages.length) {
      warnings.push(`Report ${report.reportId} has no operational stages defined`);
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
