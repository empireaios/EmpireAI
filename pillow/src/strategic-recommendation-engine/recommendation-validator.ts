import { REC_METADATA_VERSION } from "./paths.js";
import type {
  RecommendationPackage,
  RecommendationValidationReport,
  StrategicRecommendationInput,
} from "./types.js";

export class RecommendationValidator {
  decide(input: StrategicRecommendationInput): RecommendationValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    const signalCount =
      (input.empireStateHints?.length ?? 0) +
      (input.activeBusinessHints?.length ?? 0) +
      (input.businessPerformanceHints?.length ?? 0) +
      (input.workforcePerformanceHints?.length ?? 0) +
      (input.infrastructureHints?.length ?? 0) +
      (input.bottleneckHints?.length ?? 0) +
      (input.opportunityHints?.length ?? 0) +
      (input.riskHints?.length ?? 0);
    if (signalCount === 0) return "partial";
    return "pass";
  }

  validatePackages(
    packages: RecommendationPackage[] | null,
    input: StrategicRecommendationInput,
    started: number,
  ): RecommendationValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Strategic recommendation generation requires validated=true");
    }

    if (!packages || packages.length === 0) {
      if (decision !== "fail") errors.push("No recommendation packages were produced");
    } else {
      for (const pkg of packages) {
        if (!pkg.recommendationId) errors.push("Missing recommendation ID");
        if (!pkg.recommendationTitle?.trim()) errors.push("Recommendation title is required");
        if (!pkg.executiveSummary?.trim()) errors.push("Executive summary is required");
        if (!pkg.rationale?.trim()) errors.push("Recommendation rationale is required");
        if (!pkg.priority) errors.push("Priority is required");
        if (pkg.confidenceScore < 0 || pkg.confidenceScore > 100) {
          errors.push("Confidence score must be between 0 and 100");
        }
        if (pkg.recommendationExecuted) errors.push("recommendationExecuted must remain false");
        if (pkg.workersAssigned) errors.push("workersAssigned must remain false");
        if (pkg.actionsApproved) errors.push("actionsApproved must remain false");
        if (pkg.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (pkg.grandKingOverridden) errors.push("grandKingOverridden must remain false");
        if (!pkg.supportingEvidence.length) warnings.push(`Empty evidence for ${pkg.recommendationId}`);
        if (!pkg.riskAssessment.length) warnings.push(`Empty risk assessment for ${pkg.recommendationId}`);
      }
      const priorities = packages.map((p) => p.rankScore);
      const sorted = [...priorities].sort((a, b) => b - a);
      if (priorities.some((score, idx) => score !== sorted[idx])) {
        warnings.push("Recommendations are not fully ordered by rankScore");
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: {
    executeRecommendations?: boolean;
    assignWorkers?: boolean;
    approveActions?: boolean;
    overridePillow?: boolean;
    overrideGrandKing?: boolean;
  }): boolean {
    return (
      input.executeRecommendations === true ||
      input.assignWorkers === true ||
      input.approveActions === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(
    input: {
      executeRecommendations?: boolean;
      assignWorkers?: boolean;
      approveActions?: boolean;
      overridePillow?: boolean;
      overrideGrandKing?: boolean;
    },
    errors: string[],
  ) {
    if (input.executeRecommendations === true) {
      errors.push("Strategic Recommendation Engine must never execute recommendations");
    }
    if (input.assignWorkers === true) {
      errors.push("Strategic Recommendation Engine must never assign workers");
    }
    if (input.approveActions === true) {
      errors.push("Strategic Recommendation Engine must never approve actions");
    }
    if (input.overridePillow === true) {
      errors.push("Strategic Recommendation Engine must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Strategic Recommendation Engine must never override Grand King");
    }
  }

  private finalize(
    decision: RecommendationValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): RecommendationValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `rec-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: REC_METADATA_VERSION,
    };
  }
}

export class RecommendationMetadataGenerator {
  generate(recommendationCount: number, analysisId: string | null) {
    return {
      metadataVersion: REC_METADATA_VERSION,
      engineVersion: "PILLOW-REC-001" as const,
      missionId: "Q0-07" as const,
      recommendationCount,
      analysisId,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: RecommendationValidationReport["decision"] | null, enabled: boolean) {
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
      recommendationExecuted: false as const,
      workersAssigned: false as const,
      actionsApproved: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
