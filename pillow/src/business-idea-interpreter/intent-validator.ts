import { BII_METADATA_VERSION } from "./paths.js";
import type {
  BusinessIdeaInterpreterInput,
  BusinessIdeaInterpreterValidationReport,
  StructuredBusinessIntent,
} from "./types.js";

type BoundaryInput = {
  generateBusinessModels?: boolean;
  researchMarkets?: boolean;
  buildBusinesses?: boolean;
  assignWorkers?: boolean;
  executeAnything?: boolean;
  implementQ203OrLater?: boolean;
  validated?: boolean;
};

export class IntentValidator {
  decide(
    input: BusinessIdeaInterpreterInput,
  ): BusinessIdeaInterpreterValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateIntents(
    intents: StructuredBusinessIntent[] | null,
    input: BusinessIdeaInterpreterInput,
    started: number,
  ): BusinessIdeaInterpreterValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Business Idea Interpreter requires validated=true");
    }

    if (!intents || intents.length === 0) {
      if (decision !== "fail") {
        warnings.push("No structured business intents were produced yet");
      }
    } else {
      for (const intent of intents) {
        if (!intent.intentId) errors.push("Missing intent ID");
        if (!intent.originalCommand?.trim()) errors.push("Missing original command");
        if (!intent.businessIdea?.trim()) errors.push("Missing business idea");
        if (typeof intent.confidenceScore !== "number") {
          errors.push("Missing confidence score");
        } else if (intent.confidenceScore < 0 || intent.confidenceScore > 1) {
          errors.push("Confidence score must be between 0 and 1");
        }
        if (!Array.isArray(intent.missingInformation)) {
          errors.push("Missing information must be an array");
        }
        if (!intent.neverGenerateBusinessModels) {
          errors.push("Business Idea Interpreter must never generate business models");
        }
        if (!intent.neverImplementQ203OrLater) {
          errors.push("Business Idea Interpreter must never implement Q2-03 or later");
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
      input.generateBusinessModels === true ||
      input.researchMarkets === true ||
      input.buildBusinesses === true ||
      input.assignWorkers === true ||
      input.executeAnything === true ||
      input.implementQ203OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.generateBusinessModels === true) {
      errors.push("Business Idea Interpreter must never generate business models");
    }
    if (input.researchMarkets === true) {
      errors.push("Business Idea Interpreter must never research markets");
    }
    if (input.buildBusinesses === true) {
      errors.push("Business Idea Interpreter must never build businesses");
    }
    if (input.assignWorkers === true) {
      errors.push("Business Idea Interpreter must never assign workers");
    }
    if (input.executeAnything === true) {
      errors.push("Business Idea Interpreter must never execute anything");
    }
    if (input.implementQ203OrLater === true) {
      errors.push("Business Idea Interpreter must never implement Q2-03 or later");
    }
  }

  finalize(
    decision: BusinessIdeaInterpreterValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): BusinessIdeaInterpreterValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `bii-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BII_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: BusinessIdeaInterpreterValidationReport["decision"] | null,
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
