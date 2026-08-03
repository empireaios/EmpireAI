import { RDW_METADATA_VERSION } from "./paths.js";
import type {
  RefundDisputeReport,
  RefundDisputeWorkerInput,
  RefundDisputeWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  modifyFinancialLedgers?: boolean;
  overrideMarketplacePolicies?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ313OrLater?: boolean;
  authorizeOutsideAuthorityMatrix?: boolean;
  validated?: boolean;
};

export class CaseValidator {
  decide(input: RefundDisputeWorkerInput): RefundDisputeWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: RefundDisputeReport[] | null,
    input: RefundDisputeWorkerInput,
    started: number,
  ): RefundDisputeWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Refund & Dispute Worker requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No refund/dispute cases were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.caseId) errors.push("Missing case ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.orderId) errors.push("Missing order ID");
        if (!report.customerId) errors.push("Missing customer ID");
        if (!report.caseType) errors.push("Missing case type");
        if (!report.reason?.trim()) errors.push("Missing reason");
        if (!report.policyEvaluation?.policyId) errors.push("Missing policy evaluation");
        if (!report.policyEvaluation?.decision) errors.push("Missing policy decision");
        if (!report.currentStatus) errors.push("Missing current status");
        if (!report.actionsTaken?.length) errors.push("Missing actions taken");
        if (!report.recommendedAction?.trim()) errors.push("Missing recommended action");
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (!report.neverModifyFinancialLedgersDirectly) {
          errors.push("Refund & Dispute Worker must never modify financial ledgers directly");
        }
        if (!report.neverOverrideMarketplacePolicies) {
          errors.push("Refund & Dispute Worker must never override marketplace policies");
        }
        if (!report.neverOverridePillow) {
          errors.push("Refund & Dispute Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Refund & Dispute Worker must never override Grand King");
        }
        if (!report.neverImplementQ313OrLater) {
          errors.push("Refund & Dispute Worker must never implement Q3-13 or later");
        }
        if (!report.neverAuthorizeOutsideAuthorityMatrix) {
          errors.push(
            "Refund & Dispute Worker must never authorize outside Authority Matrix",
          );
        }
        if (!report.policyEvaluation.withinDelegatedAuthority) {
          warnings.push(
            `Case ${report.caseId} beyond delegated authority — escalate to Pillow`,
          );
        }
        if (report.escalationStatus === "escalated_to_pillow") {
          warnings.push(`Case ${report.caseId} escalated to Pillow`);
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
      input.modifyFinancialLedgers === true ||
      input.overrideMarketplacePolicies === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ313OrLater === true ||
      input.authorizeOutsideAuthorityMatrix === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.modifyFinancialLedgers === true) {
      errors.push("Refund & Dispute Worker must never modify financial ledgers directly");
    }
    if (input.overrideMarketplacePolicies === true) {
      errors.push("Refund & Dispute Worker must never override marketplace policies");
    }
    if (input.overridePillow === true) {
      errors.push("Refund & Dispute Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Refund & Dispute Worker must never override Grand King");
    }
    if (input.implementQ313OrLater === true) {
      errors.push("Refund & Dispute Worker must never implement Q3-13 or later");
    }
    if (input.authorizeOutsideAuthorityMatrix === true) {
      errors.push(
        "Refund & Dispute Worker must never authorize outside Authority Matrix",
      );
    }
  }

  finalize(
    decision: RefundDisputeWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): RefundDisputeWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `rdw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RDW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(decision: RefundDisputeWorkerValidationReport["decision"] | null, enabled: boolean) {
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
