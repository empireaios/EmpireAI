import type { OpportunityScannerConfiguration } from "./configuration.js";
import {
  OpportunityDiscoveryEngine,
  OpportunityNormalizer,
  OpportunityScoringEngine,
} from "./opportunity-discovery.js";
import { OSC_METADATA_VERSION } from "./paths.js";
import type {
  OpportunityCategory,
  OpportunityRecord,
  OpportunityScannerInput,
  OpportunityValidationReport,
  ValidationStatus,
} from "./types.js";

export class OpportunityRecordBuilder {
  private readonly discovery = new OpportunityDiscoveryEngine();
  private readonly scoring = new OpportunityScoringEngine();
  private readonly normalizer = new OpportunityNormalizer();

  build(
    input: OpportunityScannerInput,
    configuration: OpportunityScannerConfiguration,
    validationStatus: ValidationStatus,
  ): OpportunityRecord[] {
    const domains = input.domains?.length ? input.domains : configuration.opportunityDomains;
    const categoryFocus = input.categoryFocus ?? "all";
    const max = input.maxOpportunities ?? configuration.maxOpportunitiesPerScan;
    const found = this.discovery.discover(domains, categoryFocus, input.signalHints ?? []);

    return found.slice(0, Math.max(1, max)).map((bp, index) => {
      const scores = this.scoring.score(bp.base, {
        hintBoost: bp.hintBoost,
        minConfidence: configuration.minConfidenceScore,
      });
      const timestamp = new Date().toISOString();
      return {
        opportunityId: `osc-opp-${Date.now()}-${index + 1}`,
        timestamp,
        opportunityCategory: bp.category,
        sourceSignal: bp.signal,
        summary: this.normalizer.normalizeSummary(bp.summary, bp.domain, bp.category),
        businessValueHypothesis: bp.valueHypothesis,
        feasibilityScore: scores.feasibilityScore,
        profitPotentialScore: scores.profitPotentialScore,
        riskScore: scores.riskScore,
        confidenceScore: scores.confidenceScore,
        relevanceScore: scores.relevanceScore,
        recommendedNextStep: bp.nextStep,
        reviewStatus: "pending_pillow_review",
        validationStatus,
        metadataVersion: OSC_METADATA_VERSION,
        opportunityTraceId: `osc-trace-${Date.now()}-${index + 1}`,
        domain: bp.domain,
        neverExecuteOpportunities: true,
        neverApproveOpportunities: true,
        neverAssignWorkers: true,
        neverCreateBusinesses: true,
        opportunityExecuted: false,
        opportunityApproved: false,
        workersAssigned: false,
        businessCreated: false,
        preserveOpportunityTraceability: true,
        preserveAuditability: true,
        preserveScanningIntegrity: true,
        structuralSignalOnly: true as const,
        maskSensitiveValues: true as const,
      } satisfies OpportunityRecord;
    }).filter((record) => record.confidenceScore >= configuration.minConfidenceScore);
  }
}

export class OpportunityValidator {
  decide(input: OpportunityScannerInput): OpportunityValidationReport["decision"] {
    if (
      input.executeOpportunities === true ||
      input.approveOpportunities === true ||
      input.assignWorkers === true ||
      input.createBusinesses === true
    ) {
      return "fail";
    }
    if (input.validated === false) return "fail";
    if (input.domains && input.domains.length === 0) return "partial";
    return "pass";
  }

  validateRecords(
    records: OpportunityRecord[],
    input: OpportunityScannerInput,
    started: number,
  ): OpportunityValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (input.executeOpportunities === true) errors.push("Opportunity Scanner must never execute opportunities");
    if (input.approveOpportunities === true) errors.push("Opportunity Scanner must never approve opportunities");
    if (input.assignWorkers === true) errors.push("Opportunity Scanner must never assign workers");
    if (input.createBusinesses === true) errors.push("Opportunity Scanner must never create businesses");
    if (input.validated === false) errors.push("Scanning requires validated=true");
    if (input.domains && input.domains.length === 0) warnings.push("Empty domain list narrows scan coverage");

    for (const record of records) {
      if (!record.opportunityId) errors.push("Missing opportunity ID");
      if (record.reviewStatus !== "pending_pillow_review" && record.reviewStatus !== "reviewed" && record.reviewStatus !== "deferred" && record.reviewStatus !== "rejected") {
        errors.push(`Invalid review status for ${record.opportunityId}`);
      }
      if (record.opportunityExecuted) errors.push("opportunityExecuted must remain false");
      if (record.opportunityApproved) errors.push("opportunityApproved must remain false");
      if (record.workersAssigned) errors.push("workersAssigned must remain false");
      if (record.businessCreated) errors.push("businessCreated must remain false");
      if (record.confidenceScore < 0 || record.confidenceScore > 100) errors.push("Confidence score out of range");
    }

    if (!records.length && decision !== "fail") {
      warnings.push("No opportunities discovered for configured domains");
    }

    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";

    return {
      validationReportId: `osc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: OSC_METADATA_VERSION,
    };
  }
}

export class OpportunityMetadataGenerator {
  generate(opportunityCount: number, domains: string[]) {
    return {
      metadataVersion: OSC_METADATA_VERSION,
      engineVersion: "PILLOW-OSC-001" as const,
      missionId: "Q0-02" as const,
      opportunityCount,
      domains,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: OpportunityValidationReport["decision"] | null, enabled: boolean) {
    if (!enabled) return "standby" as const;
    if (decision === "fail") return "degraded" as const;
    if (decision === "partial") return "degraded" as const;
    return "healthy" as const;
  }
}

/** Recovery never executes, approves, assigns, or creates businesses. */
export class RecoveryManager {
  private failures = 0;
  recordFailure() {
    this.failures += 1;
    return {
      recoveryAttempted: true,
      failures: this.failures,
      opportunityExecuted: false as const,
      opportunityApproved: false as const,
      workersAssigned: false as const,
      businessCreated: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}

export function filterByCategory(records: OpportunityRecord[], category: OpportunityCategory) {
  return records.filter((r) => r.opportunityCategory === category);
}
