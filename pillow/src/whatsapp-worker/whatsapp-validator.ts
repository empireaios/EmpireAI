import { WAW_METADATA_VERSION } from "./paths.js";
import type {
  WhatsAppInput,
  WhatsAppReport,
  WhatsAppWorkerValidationReport,
} from "./types.js";

/** Reject Q7-07 and later mission IDs. Q7-06 itself is allowed. */
const FORBIDDEN_MISSION_ID = /^(Q7-0[7-9]|Q7-\d{2,}|Q[8-9]-\d+)/i;

type BoundaryInput = {
  replaceCrm?: boolean;
  replaceBookingWorker?: boolean;
  replaceOperationsWorker?: boolean;
  modifyUnrelatedPlatformComponents?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  fabricateMessageDeliveryResults?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ707OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class WhatsAppValidator {
  decide(input: WhatsAppInput): WhatsAppWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateInput(input: WhatsAppInput, started: number) {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("WhatsApp Worker requires validated=true when explicitly set");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  validateReports(
    reports: WhatsAppReport[] | null,
    input: WhatsAppInput,
    started: number,
    options: { allowIncompleteReport?: boolean } = {},
  ): WhatsAppWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("WhatsApp Worker requires validated=true when explicitly set");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail" && !options.allowIncompleteReport) {
        warnings.push("No WhatsApp reports were produced yet");
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
    decision: WhatsAppWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): WhatsAppWorkerValidationReport {
    return {
      validationReportId: `waw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WAW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.replaceCrm === true ||
      input.replaceBookingWorker === true ||
      input.replaceOperationsWorker === true ||
      input.modifyUnrelatedPlatformComponents === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.fabricateMessageDeliveryResults === true ||
      input.bypassGrandKingApproval === true ||
      input.implementQ707OrLater === true ||
      (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.replaceCrm === true) {
      errors.push("WhatsApp Worker must never replace CRM");
    }
    if (input.replaceBookingWorker === true) {
      errors.push("WhatsApp Worker must never replace booking worker");
    }
    if (input.replaceOperationsWorker === true) {
      errors.push("WhatsApp Worker must never replace operations worker");
    }
    if (input.modifyUnrelatedPlatformComponents === true) {
      errors.push("WhatsApp Worker must never modify unrelated platform components");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("WhatsApp Worker must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("WhatsApp Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("WhatsApp Worker must never override Grand King");
    }
    if (input.fabricateMessageDeliveryResults === true) {
      errors.push("WhatsApp Worker must never fabricate message delivery results");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("WhatsApp Worker must never bypass Grand King approval");
    }
    if (input.implementQ707OrLater === true) {
      errors.push("WhatsApp Worker must never implement Q7-07 or later");
    }
    if (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`WhatsApp Worker rejects missionId=${input.missionId.trim()} (Q7-07+ forbidden)`);
    }
  }

  private validateReportShape(report: WhatsAppReport, errors: string[]) {
    const required: Array<keyof WhatsAppReport> = [
      "reportId",
      "timestamp",
      "businessProjectId",
      "conversationId",
      "customerReference",
      "messageDirection",
      "conversationStatus",
      "templatesUsed",
      "automationSteps",
      "crmIntegrationStatus",
      "bookingIntegrationStatus",
      "auditStatus",
      "outstandingIssues",
      "confidenceScore",
      "metadataVersion",
    ];
    for (const key of required) {
      if (report[key] === undefined || report[key] === null) {
        errors.push(`WhatsApp Report missing required field: ${key}`);
      }
    }
    if (report.consumableByQ707 !== true) {
      errors.push("WhatsApp Report must set consumableByQ707=true");
    }
    if (report.neverFabricateMessageDeliveryResults !== true) {
      errors.push("WhatsApp Report must lock neverFabricateMessageDeliveryResults");
    }
  }
}

export class HealthMonitor {
  score(params: {
    totalReports: number;
    totalConversations: number;
    lastDecision: "pass" | "partial" | "fail" | null;
  }): "healthy" | "degraded" | "failed" | "standby" {
    if (params.lastDecision === "fail") return "failed";
    if (params.totalConversations === 0 && params.totalReports === 0) return "standby";
    if (params.lastDecision === "partial") return "degraded";
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
