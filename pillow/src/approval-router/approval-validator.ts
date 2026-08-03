import { AR_METADATA_VERSION } from "./paths.js";
import type {
  ApprovalRequest,
  ApprovalRouterInput,
  ApprovalValidationReport,
  ExecutionGateInput,
  RecordExternalOutcomeInput,
} from "./types.js";

export class ApprovalValidator {
  decide(input: ApprovalRouterInput): ApprovalValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (!input.requestedAction?.trim() || !input.requestSummary?.trim()) return "fail";
    if (input.validated === false) return "fail";
    if (input.requestedAction.trim().length < 4 || input.requestSummary.trim().length < 8) return "partial";
    return "pass";
  }

  decideOutcome(input: RecordExternalOutcomeInput): ApprovalValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (!input.approvalId?.trim()) return "fail";
    if (!input.authority) return "fail";
    if (input.validated === false) return "fail";
    if (input.approveRequest === true) return "fail";
    return "pass";
  }

  decideGate(input: ExecutionGateInput): ApprovalValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (!input.approvalId?.trim() && !input.requestId?.trim()) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRequest(
    request: ApprovalRequest | null,
    input: ApprovalRouterInput,
    started: number,
  ): ApprovalValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.requestedAction?.trim()) errors.push("Requested action is required");
    if (!input.requestSummary?.trim()) errors.push("Request summary is required");
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Approval routing requires validated=true");

    if (request) {
      if (!request.approvalId) errors.push("Missing approval ID");
      if (!request.approvalLevel) errors.push("Approval level is required");
      if (!request.approvalHistory.length) errors.push("Approval history is required");
      if (request.requestApprovedByRouter) errors.push("requestApprovedByRouter must remain false");
      if (request.requestExecutedByRouter) errors.push("requestExecutedByRouter must remain false");
      if (request.workersAssignedByRouter) errors.push("workersAssignedByRouter must remain false");
      if (request.pillowOverridden) errors.push("pillowOverridden must remain false");
      if (request.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      if (request.approvalRequired && request.currentStatus === "pending" && request.executionAllowed) {
        errors.push("Pending approval-required requests must block execution");
      }
      if (!request.riskAssessment.length) warnings.push("Risk assessment list is empty");
      if (!request.expectedImpact.length) warnings.push("Expected impact list is empty");
    } else if (decision !== "fail") {
      errors.push("Approval request was not produced");
    }

    return this.finalize(decision, errors, warnings, started);
  }

  validateOutcome(
    request: ApprovalRequest | null,
    input: RecordExternalOutcomeInput,
    started: number,
  ): ApprovalValidationReport {
    const decision = this.decideOutcome(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.approvalId?.trim()) errors.push("Approval ID is required");
    if (!input.authority) errors.push("External authority is required");
    this.pushBoundaryErrors(input, errors);
    if (input.approveRequest === true) {
      errors.push("Approval Router must never approve requests — record external outcomes only");
    }
    if (input.validated === false) errors.push("Outcome recording requires validated=true");
    if (!request && decision !== "fail") errors.push("Approval request not found");
    if (request?.currentStatus === "approved" && input.status === "approved") {
      warnings.push("Request already recorded as approved");
    }
    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: {
    approveRequest?: boolean;
    executeRequest?: boolean;
    assignWorkers?: boolean;
    overridePillow?: boolean;
    overrideGrandKing?: boolean;
  }): boolean {
    return (
      input.approveRequest === true ||
      input.executeRequest === true ||
      input.assignWorkers === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(
    input: {
      approveRequest?: boolean;
      executeRequest?: boolean;
      assignWorkers?: boolean;
      overridePillow?: boolean;
      overrideGrandKing?: boolean;
    },
    errors: string[],
  ) {
    if (input.approveRequest === true) errors.push("Approval Router must never approve requests");
    if (input.executeRequest === true) errors.push("Approval Router must never execute requests");
    if (input.assignWorkers === true) errors.push("Approval Router must never assign workers");
    if (input.overridePillow === true) errors.push("Approval Router must never override Pillow");
    if (input.overrideGrandKing === true) errors.push("Approval Router must never override Grand King");
  }

  private finalize(
    decision: ApprovalValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ApprovalValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `ar-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AR_METADATA_VERSION,
    };
  }
}

export class ApprovalMetadataGenerator {
  generate(requestCount: number, pendingCount: number) {
    return {
      metadataVersion: AR_METADATA_VERSION,
      engineVersion: "PILLOW-AR-001" as const,
      missionId: "Q0-06" as const,
      requestCount,
      pendingCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: ApprovalValidationReport["decision"] | null, enabled: boolean) {
    if (!enabled) return "standby" as const;
    if (decision === "fail") return "degraded" as const;
    if (decision === "partial") return "degraded" as const;
    return "healthy" as const;
  }
}

export class RecoveryManager {
  private failures = 0;
  recordFailure() {
    this.failures += 1;
    return {
      recoveryAttempted: true,
      failures: this.failures,
      requestApprovedByRouter: false as const,
      requestExecutedByRouter: false as const,
      workersAssignedByRouter: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
