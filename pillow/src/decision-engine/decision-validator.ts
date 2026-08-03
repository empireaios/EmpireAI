import { DE_METADATA_VERSION } from "./paths.js";
import type { DecisionEngineInput, DecisionPackage, DecisionValidationReport } from "./types.js";

export class DecisionValidator {
  decide(input: DecisionEngineInput): DecisionValidationReport["decision"] {
    if (
      input.executeWork === true ||
      input.assignWorkers === true ||
      input.approveActions === true ||
      input.overridePillow === true ||
      input.replaceGrandKingApproval === true
    ) {
      return "fail";
    }
    if (!input.executiveObjective?.trim()) return "fail";
    if (input.validated === false) return "fail";
    if (input.executiveObjective.trim().length < 12) return "partial";
    return "pass";
  }

  validatePackage(
    pkg: DecisionPackage | null,
    input: DecisionEngineInput,
    started: number,
  ): DecisionValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.executiveObjective?.trim()) errors.push("Executive objective is required");
    if (input.executeWork === true) errors.push("Decision Engine must never execute work");
    if (input.assignWorkers === true) errors.push("Decision Engine must never assign workers");
    if (input.approveActions === true) errors.push("Decision Engine must never approve actions");
    if (input.overridePillow === true) errors.push("Decision Engine must never override Pillow");
    if (input.replaceGrandKingApproval === true) {
      errors.push("Decision Engine must never replace Grand King approval");
    }
    if (input.validated === false) errors.push("Decision evaluation requires validated=true");

    if (pkg) {
      if (!pkg.decisionId) errors.push("Missing decision ID");
      if (pkg.candidateOptions.length < 2) errors.push("At least two candidate options are required");
      if (!pkg.evaluationMatrix.length) errors.push("Evaluation matrix is required");
      if (!pkg.recommendedOption?.optionId) errors.push("Recommended option is required");
      if (!pkg.tradeOffAnalysis?.comparisons) errors.push("Trade-off analysis is required");
      if (typeof pkg.confidenceScore !== "number") errors.push("Confidence score is required");
      if (!pkg.riskAssessment.length) warnings.push("Risk assessment list is empty");
      if (!pkg.assumptions.length) warnings.push("Assumptions list is empty");
      if (!pkg.missingInformation.length) warnings.push("Missing information list is empty");
      if (pkg.workExecuted) errors.push("workExecuted must remain false");
      if (pkg.workersAssigned) errors.push("workersAssigned must remain false");
      if (pkg.actionsApproved) errors.push("actionsApproved must remain false");
      if (pkg.pillowOverridden) errors.push("pillowOverridden must remain false");
      if (pkg.grandKingApprovalReplaced) errors.push("grandKingApprovalReplaced must remain false");
      if (!pkg.candidateOptions.some((o) => o.optionId === pkg.recommendedOption.optionId)) {
        errors.push("Recommended option must be one of the candidate options");
      }
    } else if (decision !== "fail") {
      errors.push("Decision package was not produced");
    }

    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";

    return {
      validationReportId: `de-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: DE_METADATA_VERSION,
    };
  }
}

export class DecisionMetadataGenerator {
  generate(decisionCount: number) {
    return {
      metadataVersion: DE_METADATA_VERSION,
      engineVersion: "PILLOW-DE-001" as const,
      missionId: "Q0-05" as const,
      decisionCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: DecisionValidationReport["decision"] | null, enabled: boolean) {
    if (!enabled) return "standby" as const;
    if (decision === "fail") return "degraded" as const;
    if (decision === "partial") return "degraded" as const;
    return "healthy" as const;
  }

  score(decision: DecisionValidationReport["decision"] | null) {
    if (decision === "fail") return 40;
    if (decision === "partial") return 70;
    if (decision === "pass") return 100;
    return 50;
  }
}

/** Recovery never executes work, assigns workers, or grants approvals. */
export class RecoveryManager {
  private failures = 0;
  recordFailure() {
    this.failures += 1;
    return {
      recoveryAttempted: true,
      failures: this.failures,
      workExecuted: false as const,
      workersAssigned: false as const,
      actionsApproved: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
