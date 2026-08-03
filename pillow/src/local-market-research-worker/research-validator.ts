import { LMRW_METADATA_VERSION } from "./paths.js";
import type {
  LocalMarketResearchInput,
  LocalMarketResearchReport,
  LocalMarketResearchWorkerValidationReport,
} from "./types.js";

/** Reject Q7-03 and later mission IDs. Q7-02 itself is allowed. */
const FORBIDDEN_MISSION_ID = /^(Q7-0[3-9]|Q7-\d{2,}|Q[8-9]-\d+)/i;

type BoundaryInput = {
  finalizeServicePackages?: boolean;
  setFinalPrices?: boolean;
  makeLaunchDecisions?: boolean;
  buildBookingSystems?: boolean;
  buildWebsites?: boolean;
  contactCustomersOrCompetitorsWithoutApproval?: boolean;
  purchaseDataOrAdvertisingWithoutApproval?: boolean;
  fabricateDemandPricingOrCompetitorData?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ703OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class ResearchValidator {
  decide(input: LocalMarketResearchInput): LocalMarketResearchWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (!this.hasRequiredLocationCategory(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateInput(input: LocalMarketResearchInput, started: number) {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (!this.hasRequiredLocationCategory(input)) {
      errors.push(
        "Local Market Research Worker requires targetCountry, targetCity, targetServiceArea, and serviceCategory",
      );
    }
    if (input.validated === false) {
      errors.push("Local Market Research Worker requires validated=true when explicitly set");
    }
    if (input.searchRadius == null || String(input.searchRadius).trim() === "") {
      warnings.push("searchRadius not provided");
    }
    if (!input.currency?.trim()) {
      warnings.push("currency not provided");
    }
    return this.finalize(errors.length ? "fail" : warnings.length ? "partial" : "pass", errors, warnings, started);
  }

  validateReports(
    reports: LocalMarketResearchReport[] | null,
    input: LocalMarketResearchInput,
    started: number,
    options: { allowIncompleteReport?: boolean } = {},
  ): LocalMarketResearchWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (!this.hasRequiredLocationCategory(input) && !options.allowIncompleteReport) {
      errors.push(
        "Local Market Research Worker requires targetCountry, targetCity, targetServiceArea, and serviceCategory",
      );
    }
    if (input.validated === false) {
      errors.push("Local Market Research Worker requires validated=true when explicitly set");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail" && !options.allowIncompleteReport) {
        warnings.push("No local market research reports were produced yet");
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
    decision: LocalMarketResearchWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): LocalMarketResearchWorkerValidationReport {
    return {
      validationReportId: `lmrw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LMRW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.finalizeServicePackages === true ||
      input.setFinalPrices === true ||
      input.makeLaunchDecisions === true ||
      input.buildBookingSystems === true ||
      input.buildWebsites === true ||
      input.contactCustomersOrCompetitorsWithoutApproval === true ||
      input.purchaseDataOrAdvertisingWithoutApproval === true ||
      input.fabricateDemandPricingOrCompetitorData === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.bypassGrandKingApproval === true ||
      input.implementQ703OrLater === true ||
      (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  hasRequiredLocationCategory(input: LocalMarketResearchInput): boolean {
    return Boolean(
      input.targetCountry?.trim() &&
        input.targetCity?.trim() &&
        input.targetServiceArea?.trim() &&
        input.serviceCategory?.trim(),
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.finalizeServicePackages === true) {
      errors.push("Local Market Research Worker must never finalize service packages");
    }
    if (input.setFinalPrices === true) {
      errors.push("Local Market Research Worker must never set final prices");
    }
    if (input.makeLaunchDecisions === true) {
      errors.push("Local Market Research Worker must never make launch decisions");
    }
    if (input.buildBookingSystems === true) {
      errors.push("Local Market Research Worker must never build booking systems");
    }
    if (input.buildWebsites === true) {
      errors.push("Local Market Research Worker must never build websites");
    }
    if (input.contactCustomersOrCompetitorsWithoutApproval === true) {
      errors.push(
        "Local Market Research Worker must never contact customers or competitors without approval",
      );
    }
    if (input.purchaseDataOrAdvertisingWithoutApproval === true) {
      errors.push(
        "Local Market Research Worker must never purchase data or advertising without approval",
      );
    }
    if (input.fabricateDemandPricingOrCompetitorData === true) {
      errors.push(
        "Local Market Research Worker must never fabricate demand, pricing, or competitor data",
      );
    }
    if (input.overridePillow === true) {
      errors.push("Local Market Research Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Local Market Research Worker must never override Grand King");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Local Market Research Worker must never bypass Grand King approval");
    }
    if (input.implementQ703OrLater === true) {
      errors.push("Local Market Research Worker must never implement Q7-03 or later");
    }
    if (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`Local Market Research Worker rejects forbidden missionId ${input.missionId}`);
    }
  }

  private validateReportShape(
    report: LocalMarketResearchReport,
    errors: string[],
    warnings: string[],
  ) {
    if (!report.researchId) errors.push("Missing research ID");
    if (!report.timestamp) errors.push("Missing timestamp");
    if (!report.businessProjectId) errors.push("Missing business project ID");
    if (!report.targetCountry) errors.push("Missing target country");
    if (!report.targetCity) errors.push("Missing target city");
    if (!report.targetServiceArea) errors.push("Missing target service area");
    if (!report.serviceCategory) errors.push("Missing service category");
    if (!report.demandFindings) errors.push("Missing demand findings");
    if (!report.pricingFindings) errors.push("Missing pricing findings");
    if (!report.marketAttractivenessAssessment) {
      errors.push("Missing market attractiveness assessment");
    }
    if (report.confidenceScore == null) errors.push("Missing confidence score");
    if (!report.metadataVersion) errors.push("Missing metadata version");
    if (!report.reportVersion) errors.push("Missing report version");
    if (!report.workerId) errors.push("Missing worker ID");
    if (report.consumableByQ703 !== true) errors.push("Report must be consumableByQ703");
    if (!report.neverFinalizeServicePackages) {
      errors.push("Report must lock neverFinalizeServicePackages");
    }
    if (!report.neverSetFinalPrices) errors.push("Report must lock neverSetFinalPrices");
    if (!report.neverMakeLaunchDecisions) {
      errors.push("Report must lock neverMakeLaunchDecisions");
    }
    if (!report.neverFabricateDemandPricingOrCompetitorData) {
      errors.push("Report must lock neverFabricateDemandPricingOrCompetitorData");
    }
    if ("finalPriceRecommendation" in (report.pricingFindings as object)) {
      errors.push("Pricing findings must not include finalPriceRecommendation");
    }
    if (!report.evidenceSources.length) {
      warnings.push(`Report ${report.researchId} has no evidence sources`);
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
