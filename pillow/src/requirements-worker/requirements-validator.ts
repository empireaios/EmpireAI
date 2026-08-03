import { RQW_METADATA_VERSION } from "./paths.js";
import type {
  RequirementsReport,
  RequirementsWorkerInput,
  RequirementsWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  designArchitecture?: boolean;
  writeApplicationCode?: boolean;
  deploySoftware?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  inventUnsupportedBusinessRequirements?: boolean;
  implementQ603OrLater?: boolean;
  validated?: boolean;
};

export class RequirementsValidator {
  decide(input: RequirementsWorkerInput): RequirementsWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRequirementsReports(
    reports: RequirementsReport[] | null,
    input: RequirementsWorkerInput,
    started: number,
    options: { allowIncompleteReport?: boolean } = {},
  ): RequirementsWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    const incompleteOk = options.allowIncompleteReport === true;
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Requirements Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No requirements reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.requirementsId) errors.push("Missing requirements ID");
        if (report.requirementsId && !report.requirementsId.startsWith("rqw-req-")) {
          errors.push("Requirements ID must start with rqw-req-");
        }
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.platformId) errors.push("Missing platform ID");
        if (!report.platformName?.trim()) errors.push("Missing platform name");
        if (!report.businessObjective?.trim()) errors.push("Missing business objective");
        if (!Array.isArray(report.stakeholders)) errors.push("Missing stakeholders");
        if (!Array.isArray(report.functionalRequirements)) {
          errors.push("Missing functional requirements");
        }
        if (!Array.isArray(report.nonFunctionalRequirements)) {
          errors.push("Missing non-functional requirements");
        }
        if (!Array.isArray(report.userStories)) errors.push("Missing user stories");
        if (!Array.isArray(report.useCases)) errors.push("Missing use cases");
        if (!Array.isArray(report.acceptanceCriteria)) {
          errors.push("Missing acceptance criteria");
        }
        if (!Array.isArray(report.assumptions)) errors.push("Missing assumptions");
        if (!Array.isArray(report.constraints)) errors.push("Missing constraints");
        if (!Array.isArray(report.risks)) errors.push("Missing risks");
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!incompleteOk && report.functionalRequirements.length === 0) {
          errors.push("Missing functional requirements content");
        }
        if (!report.neverDesignArchitecture) {
          errors.push("Requirements Worker must never design architecture");
        }
        if (!report.neverWriteApplicationCode) {
          errors.push("Requirements Worker must never write application code");
        }
        if (!report.neverDeploySoftware) {
          errors.push("Requirements Worker must never deploy software");
        }
        if (!report.neverOverridePillow) {
          errors.push("Requirements Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Requirements Worker must never override Grand King");
        }
        if (!report.neverInventUnsupportedBusinessRequirements) {
          errors.push("Requirements Worker must never invent unsupported business requirements");
        }
        if (!report.neverImplementQ603OrLater) {
          errors.push("Requirements Worker must never implement Q6-03 or later");
        }
        if (!report.distinguishRequirementsFromAssumptions) {
          errors.push("Requirements Worker must distinguish requirements from assumptions");
        }
        if (!report.preserveCompleteTraceability) {
          errors.push("Requirements Worker must preserve complete traceability");
        }
        if (!report.selfReviewPassed) {
          warnings.push(`Report ${report.requirementsId} self-review did not fully pass`);
        }
        if (report.researchCompliance === "non_compliant") {
          warnings.push(`Report ${report.requirementsId} research compliance is non_compliant`);
        }
        for (const assumption of report.assumptions) {
          for (const fr of report.functionalRequirements) {
            if (fr.statement.includes(assumption)) {
              errors.push("Assumptions must be distinct from functional requirements");
              break;
            }
          }
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

  finalize(
    decision: RequirementsWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): RequirementsWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `rqw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RQW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.designArchitecture === true ||
      input.writeApplicationCode === true ||
      input.deploySoftware === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.inventUnsupportedBusinessRequirements === true ||
      input.implementQ603OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.designArchitecture) {
      errors.push("Requirements Worker must never design architecture");
    }
    if (input.writeApplicationCode) {
      errors.push("Requirements Worker must never write application code");
    }
    if (input.deploySoftware) {
      errors.push("Requirements Worker must never deploy software");
    }
    if (input.overridePillow) {
      errors.push("Requirements Worker must never override Pillow");
    }
    if (input.overrideGrandKing) {
      errors.push("Requirements Worker must never override Grand King");
    }
    if (input.inventUnsupportedBusinessRequirements) {
      errors.push("Requirements Worker must never invent unsupported business requirements");
    }
    if (input.implementQ603OrLater) {
      errors.push("Requirements Worker must never implement Q6-03 or later");
    }
  }
}

export class HealthMonitor {
  status(
    validationDecision: "pass" | "partial" | "fail",
    enabled: boolean,
  ): "healthy" | "degraded" | "failed" | "standby" {
    if (!enabled) return "standby";
    if (validationDecision === "fail") return "failed";
    if (validationDecision === "partial") return "degraded";
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

  getFailureCount() {
    return this.failures;
  }
}
