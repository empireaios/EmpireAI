import { APPROVED_RESEARCH_SOURCES, DPR_METADATA_VERSION } from "./paths.js";
import type {
  DigitalProductResearchReport,
  DigitalProductResearchWorkerInput,
  DigitalProductResearchWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  createDigitalProducts?: boolean;
  createSalesPages?: boolean;
  processPayments?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  inventUnsupportedMarketEvidence?: boolean;
  implementQ503OrLater?: boolean;
  useUnapprovedSource?: boolean;
  validated?: boolean;
  discoverySource?: string | null;
};

export class ResearchValidator {
  decide(
    input: DigitalProductResearchWorkerInput,
  ): DigitalProductResearchWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (this.hasUnapprovedSource(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: DigitalProductResearchReport[] | null,
    input: DigitalProductResearchWorkerInput,
    started: number,
    options: { requireFactEvidence?: boolean } = {},
  ): DigitalProductResearchWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    this.pushSourceErrors(input, errors);
    if (input.validated === false) {
      errors.push("Digital Product Research Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No digital product research reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.researchReportId) errors.push("Missing research report ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.opportunityId) errors.push("Missing opportunity ID");
        if (!report.productCategory) errors.push("Missing product category");
        if (!report.targetAudience?.trim()) errors.push("Missing target audience");
        if (!report.customerPainPoints.length) errors.push("Missing customer pain points");
        if (!report.marketGap?.trim()) errors.push("Missing market gap");
        if (!report.demandAssessment?.trim()) errors.push("Missing demand assessment");
        if (!report.competitorSummary?.trim()) errors.push("Missing competitor summary");
        if (!report.revenuePotential?.trim()) errors.push("Missing revenue potential");
        if (report.opportunityScore == null) errors.push("Missing opportunity score");
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (options.requireFactEvidence) {
          const hasFact = report.supportingEvidence.some((e) => e.kind === "fact");
          if (!hasFact) {
            errors.push(
              `Report ${report.researchReportId} requires at least one fact in supportingEvidence`,
            );
          }
        }
        if (!report.neverCreateDigitalProducts) {
          errors.push("Digital Product Research Worker must never create digital products");
        }
        if (!report.neverCreateSalesPages) {
          errors.push("Digital Product Research Worker must never create sales pages");
        }
        if (!report.neverProcessPayments) {
          errors.push("Digital Product Research Worker must never process payments");
        }
        if (!report.neverOverridePillow) {
          errors.push("Digital Product Research Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Digital Product Research Worker must never override Grand King");
        }
        if (!report.neverInventUnsupportedMarketEvidence) {
          errors.push(
            "Digital Product Research Worker must never invent unsupported market evidence",
          );
        }
        if (!report.neverImplementQ503OrLater) {
          errors.push("Digital Product Research Worker must never implement Q5-03 or later");
        }
        if (!report.useApprovedResearchSourcesOnly) {
          errors.push("Digital Product Research Worker must use approved research sources only");
        }
        if (!report.distinguishFactsFromAssumptions) {
          errors.push("Digital Product Research Worker must distinguish facts from assumptions");
        }
        if (report.recommendedPriority === "critical" || report.recommendedPriority === "high") {
          warnings.push(
            `Report ${report.researchReportId} has ${report.recommendedPriority} priority opportunity`,
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

  isApprovedSource(source: string | null | undefined): boolean {
    if (!source?.trim()) return false;
    return (APPROVED_RESEARCH_SOURCES as readonly string[]).includes(source.trim());
  }

  private hasUnapprovedSource(input: BoundaryInput): boolean {
    if (input.useUnapprovedSource === true) return true;
    const source = input.discoverySource?.trim();
    if (!source) return false;
    return !this.isApprovedSource(source);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.createDigitalProducts === true ||
      input.createSalesPages === true ||
      input.processPayments === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.inventUnsupportedMarketEvidence === true ||
      input.implementQ503OrLater === true ||
      input.useUnapprovedSource === true
    );
  }

  private pushSourceErrors(input: BoundaryInput, errors: string[]) {
    if (input.useUnapprovedSource === true) {
      errors.push("Digital Product Research Worker must use approved research sources only");
    }
    const source = input.discoverySource?.trim();
    if (source && !this.isApprovedSource(source)) {
      errors.push(`Discovery source '${source}' is not in approved research sources`);
    }
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.createDigitalProducts === true) {
      errors.push("Digital Product Research Worker must never create digital products");
    }
    if (input.createSalesPages === true) {
      errors.push("Digital Product Research Worker must never create sales pages");
    }
    if (input.processPayments === true) {
      errors.push("Digital Product Research Worker must never process payments");
    }
    if (input.overridePillow === true) {
      errors.push("Digital Product Research Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Digital Product Research Worker must never override Grand King");
    }
    if (input.inventUnsupportedMarketEvidence === true) {
      errors.push(
        "Digital Product Research Worker must never invent unsupported market evidence",
      );
    }
    if (input.implementQ503OrLater === true) {
      errors.push("Digital Product Research Worker must never implement Q5-03 or later");
    }
  }

  finalize(
    decision: DigitalProductResearchWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): DigitalProductResearchWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `dpr-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: DPR_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: DigitalProductResearchWorkerValidationReport["decision"] | null,
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
