import { SOW_METADATA_VERSION } from "./paths.js";
import type {
  OfferSession,
  ServiceOfferInput,
  ServiceOfferReport,
  ServiceOfferWorkerValidationReport,
} from "./types.js";

/** Reject Q7-04 and later mission IDs. Q7-03 itself is allowed. */
const FORBIDDEN_MISSION_ID = /^(Q7-0[4-9]|Q7-\d{2,}|Q[8-9]-\d+)/i;

type BoundaryInput = {
  buildBookingSystems?: boolean;
  buildCrm?: boolean;
  executeCustomerJobs?: boolean;
  launchBusiness?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  fabricatePricingEvidence?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ704OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class OfferValidator {
  decide(input: ServiceOfferInput): ServiceOfferWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateInput(input: ServiceOfferInput, started: number) {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Service Offer Worker requires validated=true when explicitly set");
    }
    if (
      !input.marketResearchReport &&
      !input.fixtureMarketResearch &&
      !input.researchId?.trim()
    ) {
      errors.push(
        "Service Offer Worker requires market research via marketResearchReport, researchId, or fixtureMarketResearch",
      );
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  validateResearchPresence(session: OfferSession | null, started: number) {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!session || !session.marketResearch || session.researchSource === "none") {
      errors.push(
        "Service Offer Worker requires consumed market research before offer generation",
      );
    } else if (!session.pricingEvidenceAvailable) {
      warnings.push(
        "Q7-02 pricing findings incomplete or missing — pricing recommendations will mark assumptions/unknowns; never fabricate pricing evidence",
      );
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  validateReports(
    reports: ServiceOfferReport[] | null,
    input: ServiceOfferInput,
    started: number,
    options: { allowIncompleteReport?: boolean } = {},
  ): ServiceOfferWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Service Offer Worker requires validated=true when explicitly set");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail" && !options.allowIncompleteReport) {
        warnings.push("No service offer reports were produced yet");
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
    decision: ServiceOfferWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ServiceOfferWorkerValidationReport {
    return {
      validationReportId: `sow-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SOW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.buildBookingSystems === true ||
      input.buildCrm === true ||
      input.executeCustomerJobs === true ||
      input.launchBusiness === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.fabricatePricingEvidence === true ||
      input.bypassGrandKingApproval === true ||
      input.implementQ704OrLater === true ||
      (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.buildBookingSystems === true) {
      errors.push("Service Offer Worker must never build booking systems");
    }
    if (input.buildCrm === true) {
      errors.push("Service Offer Worker must never build CRM");
    }
    if (input.executeCustomerJobs === true) {
      errors.push("Service Offer Worker must never execute customer jobs");
    }
    if (input.launchBusiness === true) {
      errors.push("Service Offer Worker must never launch business");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Service Offer Worker must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Service Offer Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Service Offer Worker must never override Grand King");
    }
    if (input.fabricatePricingEvidence === true) {
      errors.push("Service Offer Worker must never fabricate pricing evidence");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Service Offer Worker must never bypass Grand King approval");
    }
    if (input.implementQ704OrLater === true) {
      errors.push("Service Offer Worker must never implement Q7-04 or later");
    }
    if (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`Service Offer Worker rejects forbidden missionId ${input.missionId}`);
    }
  }

  private validateReportShape(
    report: ServiceOfferReport,
    errors: string[],
    warnings: string[],
  ) {
    if (!report.reportId) errors.push("Missing report ID");
    if (!report.timestamp) errors.push("Missing timestamp");
    if (!report.businessProjectId) errors.push("Missing business project ID");
    if (!report.serviceCatalogue) errors.push("Missing service catalogue");
    if (!report.servicePackages) errors.push("Missing service packages");
    if (!report.pricingRecommendations) errors.push("Missing pricing recommendations");
    if (!report.packageInclusions) errors.push("Missing package inclusions");
    if (!report.packageExclusions) errors.push("Missing package exclusions");
    if (!report.guarantees) errors.push("Missing guarantees");
    if (!report.fulfilmentRequirements) errors.push("Missing fulfilment requirements");
    if (!report.operationalAssumptions) errors.push("Missing operational assumptions");
    if (!report.risks) errors.push("Missing risks");
    if (!report.outstandingQuestions) errors.push("Missing outstanding questions");
    if (report.confidenceScore == null) errors.push("Missing confidence score");
    if (!report.executiveSummary) errors.push("Missing executive summary");
    if (!report.metadataVersion) errors.push("Missing metadata version");
    if (!report.reportVersion) errors.push("Missing report version");
    if (!report.workerId) errors.push("Missing worker ID");
    if (!report.sourceResearchId) errors.push("Missing source research ID");
    if (report.consumableByQ704 !== true) errors.push("Report must be consumableByQ704");
    if (!report.neverBuildBookingSystems) {
      errors.push("Report must lock neverBuildBookingSystems");
    }
    if (!report.neverFabricatePricingEvidence) {
      errors.push("Report must lock neverFabricatePricingEvidence");
    }
    if (!report.neverImplementQ704OrLater) {
      errors.push("Report must lock neverImplementQ704OrLater");
    }
    for (const pricing of report.pricingRecommendations) {
      if (!pricing.referencesQ702PricingFindings) {
        errors.push("Pricing recommendations must reference Q7-02 pricing findings");
      }
      if (pricing.evidenceClass === "verified" && !pricing.researchTypicalRange) {
        warnings.push(
          `Pricing recommendation ${pricing.recommendationId} marked verified without research typical range`,
        );
      }
    }
    if (!report.servicePackages.length) {
      warnings.push(`Report ${report.reportId} has no service packages`);
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
