import { ORW_METADATA_VERSION } from "./paths.js";
import type {
  OrderReport,
  OrderWorkerInput,
  OrderWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  processPayments?: boolean;
  issueRefunds?: boolean;
  modifyInventory?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ312OrLater?: boolean;
  alterFinancialRecords?: boolean;
  validated?: boolean;
};

export class OrderValidator {
  decide(input: OrderWorkerInput): OrderWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: OrderReport[] | null,
    input: OrderWorkerInput,
    started: number,
  ): OrderWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Order Worker requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No order reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.orderReportId) errors.push("Missing order report ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.orderId) errors.push("Missing order ID");
        if (!report.customerId) errors.push("Missing customer ID");
        if (!report.productId) errors.push("Missing product ID");
        if (report.quantity == null) errors.push("Missing quantity");
        if (!report.orderStatus) errors.push("Missing order status");
        if (!report.fulfilmentStatus) errors.push("Missing fulfilment status");
        if (!report.shippingStatus) errors.push("Missing shipping status");
        if (!report.routingRationale?.trim()) errors.push("Missing routing rationale");
        if (!report.recommendedAction?.trim()) errors.push("Missing recommended action");
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (!report.neverProcessPayments) {
          errors.push("Order Worker must never process payments");
        }
        if (!report.neverIssueRefunds) {
          errors.push("Order Worker must never issue refunds");
        }
        if (!report.neverModifyInventoryDirectly) {
          errors.push("Order Worker must never modify inventory directly");
        }
        if (!report.neverAlterFinancialRecords) {
          errors.push("Order Worker must never alter financial records");
        }
        if (!report.neverImplementQ312OrLater) {
          errors.push("Order Worker must never implement Q3-12 or later");
        }
        if (!report.supplierId && !report.routedSupplierId) {
          warnings.push(
            `Order ${report.orderReportId} missing supplier routing — escalate to Pillow`,
          );
        }
        if (report.failedFulfilment) {
          warnings.push(
            `Order ${report.orderReportId} has failed fulfilment — escalate to Pillow`,
          );
        }
        if (report.delayed) {
          warnings.push(`Order ${report.orderReportId} is delayed — continue monitoring`);
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
      input.processPayments === true ||
      input.issueRefunds === true ||
      input.modifyInventory === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ312OrLater === true ||
      input.alterFinancialRecords === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.processPayments === true) {
      errors.push("Order Worker must never process payments");
    }
    if (input.issueRefunds === true) {
      errors.push("Order Worker must never issue refunds");
    }
    if (input.modifyInventory === true) {
      errors.push("Order Worker must never modify inventory directly");
    }
    if (input.overridePillow === true) {
      errors.push("Order Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Order Worker must never override Grand King");
    }
    if (input.implementQ312OrLater === true) {
      errors.push("Order Worker must never implement Q3-12 or later");
    }
    if (input.alterFinancialRecords === true) {
      errors.push("Order Worker must never alter financial records");
    }
  }

  finalize(
    decision: OrderWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): OrderWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `orw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ORW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(decision: OrderWorkerValidationReport["decision"] | null, enabled: boolean) {
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
