import { APPROVED_RESEARCH_SOURCES, TRW_METADATA_VERSION } from "./paths.js";
import type {
  TrendResearchReport,
  TrendResearchWorkerInput,
  TrendResearchWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  selectPublishingTopics?: boolean;
  writeScripts?: boolean;
  generateThumbnails?: boolean;
  publishContent?: boolean;
  generateContent?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ404OrLater?: boolean;
  useUnapprovedSource?: boolean;
  validated?: boolean;
  discoverySource?: string | null;
};

export class TrendValidator {
  decide(input: TrendResearchWorkerInput): TrendResearchWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (this.hasUnapprovedSource(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateReports(
    reports: TrendResearchReport[] | null,
    input: TrendResearchWorkerInput,
    started: number,
  ): TrendResearchWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    this.pushSourceErrors(input, errors);
    if (input.validated === false) {
      errors.push("Trend Research Worker requires validated=true");
    }
    if (!reports || reports.length === 0) {
      if (decision !== "fail") {
        warnings.push("No trend research reports were produced yet");
      }
    } else {
      for (const report of reports) {
        if (!report.trendReportId) errors.push("Missing trend report ID");
        if (!report.timestamp) errors.push("Missing timestamp");
        if (!report.channelId) errors.push("Missing channel ID");
        if (!report.trendTopic) errors.push("Missing trend topic");
        if (!report.discoverySource) errors.push("Missing discovery source");
        if (!report.searchDemand) errors.push("Missing search demand");
        if (!report.socialSignals) errors.push("Missing social signals");
        if (!report.competitorActivity) errors.push("Missing competitor activity");
        if (!report.currentEventRelevance) errors.push("Missing current event relevance");
        if (report.confidenceScore == null) errors.push("Missing confidence score");
        if (!report.metadataVersion) errors.push("Missing metadata version");
        if (!report.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (!report.neverSelectPublishingTopics) {
          errors.push("Trend Research Worker must never select publishing topics");
        }
        if (!report.neverWriteScripts) {
          errors.push("Trend Research Worker must never write scripts");
        }
        if (!report.neverGenerateThumbnails) {
          errors.push("Trend Research Worker must never generate thumbnails");
        }
        if (!report.neverPublishContent) {
          errors.push("Trend Research Worker must never publish content");
        }
        if (!report.neverGenerateContentDirectly) {
          errors.push("Trend Research Worker must never generate content directly");
        }
        if (!report.neverOverridePillow) {
          errors.push("Trend Research Worker must never override Pillow");
        }
        if (!report.neverOverrideGrandKing) {
          errors.push("Trend Research Worker must never override Grand King");
        }
        if (!report.neverImplementQ404OrLater) {
          errors.push("Trend Research Worker must never implement Q4-04 or later");
        }
        if (!report.useApprovedResearchSourcesOnly) {
          errors.push("Trend Research Worker must use approved research sources only");
        }
        if (report.trendDirection === "declining") {
          warnings.push(
            `Report ${report.trendReportId} classified as declining — advisory review recommended`,
          );
        }
        if (report.recommendedPriority === "critical" || report.recommendedPriority === "high") {
          warnings.push(
            `Report ${report.trendReportId} has ${report.recommendedPriority} priority opportunity`,
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
      input.selectPublishingTopics === true ||
      input.writeScripts === true ||
      input.generateThumbnails === true ||
      input.publishContent === true ||
      input.generateContent === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ404OrLater === true ||
      input.useUnapprovedSource === true
    );
  }

  private pushSourceErrors(input: BoundaryInput, errors: string[]) {
    if (input.useUnapprovedSource === true) {
      errors.push("Trend Research Worker must use approved research sources only");
    }
    const source = input.discoverySource?.trim();
    if (source && !this.isApprovedSource(source)) {
      errors.push(`Discovery source '${source}' is not in approved research sources`);
    }
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.selectPublishingTopics === true) {
      errors.push("Trend Research Worker must never select publishing topics");
    }
    if (input.writeScripts === true) {
      errors.push("Trend Research Worker must never write scripts");
    }
    if (input.generateThumbnails === true) {
      errors.push("Trend Research Worker must never generate thumbnails");
    }
    if (input.publishContent === true) {
      errors.push("Trend Research Worker must never publish content");
    }
    if (input.generateContent === true) {
      errors.push("Trend Research Worker must never generate content directly");
    }
    if (input.overridePillow === true) {
      errors.push("Trend Research Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Trend Research Worker must never override Grand King");
    }
    if (input.implementQ404OrLater === true) {
      errors.push("Trend Research Worker must never implement Q4-04 or later");
    }
  }

  finalize(
    decision: TrendResearchWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): TrendResearchWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `trw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TRW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: TrendResearchWorkerValidationReport["decision"] | null,
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
