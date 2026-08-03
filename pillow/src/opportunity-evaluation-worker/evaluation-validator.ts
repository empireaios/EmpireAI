import { OEW_METADATA_VERSION } from "./paths.js";
import type {
  OpportunityEvaluationReport,
  OpportunityEvaluationWorkerInput,
  OpportunityEvaluationWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  approveBusiness?: boolean;
  modifyBusinessModel?: boolean;
  launchBusiness?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ206OrLater?: boolean;
  validated?: boolean;
};

export class EvaluationValidator {
  decide(
    input: OpportunityEvaluationWorkerInput,
  ): OpportunityEvaluationWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateEvaluations(
    evaluations: OpportunityEvaluationReport[] | null,
    input: OpportunityEvaluationWorkerInput,
    started: number,
  ): OpportunityEvaluationWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Opportunity Evaluation Worker requires validated=true");
    }

    if (!evaluations || evaluations.length === 0) {
      if (decision !== "fail") {
        warnings.push("No opportunity evaluations were produced yet");
      }
    } else {
      for (const evaluation of evaluations) {
        if (!evaluation.evaluationId) errors.push("Missing evaluation ID");
        if (!evaluation.businessBuildMissionId) {
          errors.push("Missing business build mission ID");
        }
        if (!evaluation.businessType) errors.push("Missing business type");
        if (evaluation.demandScore == null) errors.push("Missing demand score");
        if (evaluation.feasibilityScore == null) errors.push("Missing feasibility score");
        if (evaluation.profitPotentialScore == null) {
          errors.push("Missing profit potential score");
        }
        if (evaluation.riskScore == null) errors.push("Missing risk score");
        if (evaluation.strategicFitScore == null) {
          errors.push("Missing strategic fit score");
        }
        if (evaluation.overallOpportunityScore == null) {
          errors.push("Missing overall opportunity score");
        }
        if (!evaluation.recommendation) errors.push("Missing recommendation");
        if (!evaluation.supportingEvidence.length) {
          errors.push("Missing supporting evidence");
        }
        if (evaluation.confidenceScore == null) errors.push("Missing confidence score");
        if (!evaluation.metadataVersion) errors.push("Missing metadata version");
        if (!evaluation.scoreExplanations?.demand?.explanation) {
          errors.push("Missing demand score explanation");
        }
        if (!evaluation.scoreExplanations?.overall?.explanation) {
          errors.push("Missing overall score explanation");
        }
        if (!evaluation.neverApproveBusiness) {
          errors.push("Opportunity Evaluation Worker must never approve businesses");
        }
        if (!evaluation.neverLaunchBusiness) {
          errors.push("Opportunity Evaluation Worker must never launch businesses");
        }
        if (!evaluation.evidenceBasedScoring) {
          errors.push("Opportunity Evaluation Worker must base scores on evidence");
        }
        if (!evaluation.facts.length && !evaluation.assumptions.length) {
          warnings.push(
            `Evaluation ${evaluation.evaluationId} has no fact/assumption classification`,
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

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.approveBusiness === true ||
      input.modifyBusinessModel === true ||
      input.launchBusiness === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ206OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.approveBusiness === true) {
      errors.push("Opportunity Evaluation Worker must never approve businesses");
    }
    if (input.modifyBusinessModel === true) {
      errors.push("Opportunity Evaluation Worker must never modify business models");
    }
    if (input.launchBusiness === true) {
      errors.push("Opportunity Evaluation Worker must never launch businesses");
    }
    if (input.overridePillow === true) {
      errors.push("Opportunity Evaluation Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Opportunity Evaluation Worker must never override Grand King");
    }
    if (input.implementQ206OrLater === true) {
      errors.push("Opportunity Evaluation Worker must never implement Q2-06 or later");
    }
  }

  finalize(
    decision: OpportunityEvaluationWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): OpportunityEvaluationWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `oew-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: OEW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: OpportunityEvaluationWorkerValidationReport["decision"] | null,
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
