import { MRW_METADATA_VERSION } from "./paths.js";
import type {
  MarketResearchReport,
  MarketResearchWorkerInput,
  MarketResearchWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  decideWhetherToBuild?: boolean;
  generateBranding?: boolean;
  buildMarketingPlan?: boolean;
  launchBusiness?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ205OrLater?: boolean;
  validated?: boolean;
};

export class ResearchValidator {
  decide(input: MarketResearchWorkerInput): MarketResearchWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: MarketResearchReport[] | null,
    input: MarketResearchWorkerInput,
    started: number,
  ): MarketResearchWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Market Research Worker requires validated=true");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No market research reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.reportId) errors.push("Missing report ID");
        if (!report.businessBuildMissionId) errors.push("Missing business build mission ID");
        if (!report.businessType) errors.push("Missing business type");
        if (!report.targetMarket?.trim()) errors.push("Missing target market");
        if (!report.customerProblems.length) errors.push("Missing customer problems");
        if (!report.customerSegments.length) errors.push("Missing customer segments");
        if (!report.marketDemand?.summary) errors.push("Missing market demand findings");
        if (!report.marketSize?.tamSummary) errors.push("Missing market size findings");
        if (!report.competitorAnalysis.length) errors.push("Missing competitor analysis");
        if (!report.industryTrends.length) errors.push("Missing industry trends");
        if (!report.opportunitySize?.summary) errors.push("Missing opportunity size");
        if (!report.barriersToEntry.length) errors.push("Missing barriers to entry");
        if (!report.risks.length) errors.push("Missing market risks");
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (!report.recommendations.length) errors.push("Missing recommendations");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.neverDecideWhetherToBuild) {
          errors.push("Market Research Worker must never decide whether to build");
        }
        if (!report.neverLaunchBusiness) {
          errors.push("Market Research Worker must never launch businesses");
        }
        if (!report.evidenceBasedFindings) {
          errors.push("Market Research Worker must base findings on evidence");
        }
        if (!report.facts.length && !report.assumptions.length) {
          warnings.push(`Report ${report.reportId} has no fact/assumption classification`);
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
      input.decideWhetherToBuild === true ||
      input.generateBranding === true ||
      input.buildMarketingPlan === true ||
      input.launchBusiness === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ205OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.decideWhetherToBuild === true) {
      errors.push("Market Research Worker must never decide whether to build the business");
    }
    if (input.generateBranding === true) {
      errors.push("Market Research Worker must never generate branding");
    }
    if (input.buildMarketingPlan === true) {
      errors.push("Market Research Worker must never build marketing plans");
    }
    if (input.launchBusiness === true) {
      errors.push("Market Research Worker must never launch businesses");
    }
    if (input.overridePillow === true) {
      errors.push("Market Research Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Market Research Worker must never override Grand King");
    }
    if (input.implementQ205OrLater === true) {
      errors.push("Market Research Worker must never implement Q2-05 or later");
    }
  }

  finalize(
    decision: MarketResearchWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): MarketResearchWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `mrw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MRW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: MarketResearchWorkerValidationReport["decision"] | null,
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
