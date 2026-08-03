import { LSEO_METADATA_VERSION } from "./paths.js";
import type {
  LocalSeoInput,
  LocalSeoReport,
  LocalSeoWorkerValidationReport,
  SeoSession,
} from "./types.js";

/** Reject Q7-08 and later mission IDs. Q7-07 itself is allowed. */
const FORBIDDEN_MISSION_ID = /^(Q7-0[8-9]|Q7-\d{2,}|Q[8-9]-\d+)/i;

type BoundaryInput = {
  publishWebsites?: boolean;
  purchaseBacklinks?: boolean;
  manipulateSearchRankings?: boolean;
  modifyLiveGoogleBusinessProfilesAutomatically?: boolean;
  modifyUnrelatedPlatformComponents?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  fabricateSeoPerformanceResults?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ708OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class SeoValidator {
  decide(input: LocalSeoInput): LocalSeoWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateInput(input: LocalSeoInput, started: number) {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Local SEO Worker requires validated=true when explicitly set");
    }
    if (
      !input.serviceOfferReport &&
      !input.fixtureServiceOffer &&
      !input.offerReportId?.trim()
    ) {
      errors.push(
        "Local SEO Worker requires a service offer via serviceOfferReport, offerReportId, or fixtureServiceOffer",
      );
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  validateOfferPresence(session: SeoSession | null, started: number) {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!session || !session.serviceOffer || session.offerSource === "none") {
      errors.push(
        "Local SEO Worker requires a consumed service offer before SEO asset preparation",
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
    reports: LocalSeoReport[] | null,
    input: LocalSeoInput,
    started: number,
    options: { allowIncompleteReport?: boolean } = {},
  ): LocalSeoWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Local SEO Worker requires validated=true when explicitly set");
    }

    if (!reports || reports.length === 0) {
      if (decision !== "fail" && !options.allowIncompleteReport) {
        warnings.push("No local SEO reports were produced yet");
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
    decision: LocalSeoWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): LocalSeoWorkerValidationReport {
    return {
      validationReportId: `lseo-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LSEO_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.publishWebsites === true ||
      input.purchaseBacklinks === true ||
      input.manipulateSearchRankings === true ||
      input.modifyLiveGoogleBusinessProfilesAutomatically === true ||
      input.modifyUnrelatedPlatformComponents === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.fabricateSeoPerformanceResults === true ||
      input.bypassGrandKingApproval === true ||
      input.implementQ708OrLater === true ||
      (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.publishWebsites === true) {
      errors.push("Local SEO Worker must never publish websites");
    }
    if (input.purchaseBacklinks === true) {
      errors.push("Local SEO Worker must never purchase backlinks");
    }
    if (input.manipulateSearchRankings === true) {
      errors.push("Local SEO Worker must never manipulate search rankings");
    }
    if (input.modifyLiveGoogleBusinessProfilesAutomatically === true) {
      errors.push(
        "Local SEO Worker must never modify live Google Business Profiles automatically",
      );
    }
    if (input.modifyUnrelatedPlatformComponents === true) {
      errors.push("Local SEO Worker must never modify unrelated platform components");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Local SEO Worker must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Local SEO Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Local SEO Worker must never override Grand King");
    }
    if (input.fabricateSeoPerformanceResults === true) {
      errors.push("Local SEO Worker must never fabricate SEO performance results");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Local SEO Worker must never bypass Grand King approval");
    }
    if (input.implementQ708OrLater === true) {
      errors.push("Local SEO Worker must never implement Q7-08 or later");
    }
    if (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`Local SEO Worker rejects forbidden missionId ${input.missionId}`);
    }
  }

  private validateReportShape(
    report: LocalSeoReport,
    errors: string[],
    warnings: string[],
  ) {
    if (!report.reportId) errors.push("Missing report ID");
    if (!report.timestamp) errors.push("Missing timestamp");
    if (!report.businessProjectId) errors.push("Missing business project ID");
    if (!report.targetLocation) errors.push("Missing target location");
    if (!report.serviceCategory) errors.push("Missing service category");
    if (!report.landingPagesGenerated) errors.push("Missing landing pages");
    if (!report.googleBusinessRecommendations) {
      errors.push("Missing Google Business recommendations");
    }
    if (!report.localKeywords) errors.push("Missing local keywords");
    if (!report.metadata) errors.push("Missing metadata");
    if (!report.structuredDataRecommendations) {
      errors.push("Missing structured data recommendations");
    }
    if (!report.citationRecommendations) errors.push("Missing citation recommendations");
    if (!report.seoCompletenessStatus) errors.push("Missing SEO completeness status");
    if (!report.auditStatus) errors.push("Missing audit status");
    if (!report.outstandingIssues) errors.push("Missing outstanding issues");
    if (report.confidenceScore == null) errors.push("Missing confidence score");
    if (!report.metadataVersion) errors.push("Missing metadata version");
    if (!report.reportVersion) errors.push("Missing report version");
    if (!report.workerId) errors.push("Missing worker ID");
    if (!report.sourceOfferReportId) errors.push("Missing source offer report ID");
    if (report.consumableByQ708 !== true) errors.push("Report must be consumableByQ708");
    if (!report.neverPublishWebsites) errors.push("Report must lock neverPublishWebsites");
    if (!report.neverFabricateSeoPerformanceResults) {
      errors.push("Report must lock neverFabricateSeoPerformanceResults");
    }
    if (!report.neverImplementQ708OrLater) {
      errors.push("Report must lock neverImplementQ708OrLater");
    }
    if (!report.neverModifyLiveGoogleBusinessProfilesAutomatically) {
      errors.push("Report must lock neverModifyLiveGoogleBusinessProfilesAutomatically");
    }
    if (report.seoCompletenessStatus?.neverClaimsLiveRankingOrTraffic !== true) {
      errors.push("Completeness evaluation must never claim live ranking or traffic");
    }
    if (!report.landingPagesGenerated.length) {
      warnings.push(`Report ${report.reportId} has no landing pages`);
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
