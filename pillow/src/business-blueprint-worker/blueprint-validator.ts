import { BBW_METADATA_VERSION } from "./paths.js";
import type {
  BusinessBlueprint,
  BusinessBlueprintWorkerInput,
  BusinessBlueprintWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeBusiness?: boolean;
  launchProducts?: boolean;
  createBranding?: boolean;
  buildWebsites?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ207OrLater?: boolean;
  validated?: boolean;
};

export class BlueprintValidator {
  decide(
    input: BusinessBlueprintWorkerInput,
  ): BusinessBlueprintWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateBlueprints(
    blueprints: BusinessBlueprint[] | null,
    input: BusinessBlueprintWorkerInput,
    started: number,
    options: { requireProceedRecommendation?: boolean } = {},
  ): BusinessBlueprintWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Business Blueprint Worker requires validated=true");
    }

    if (!blueprints || blueprints.length === 0) {
      if (decision !== "fail") {
        warnings.push("No business blueprints were produced yet");
      }
    } else {
      for (const blueprint of blueprints) {
        if (!blueprint.blueprintId) errors.push("Missing blueprint ID");
        if (!blueprint.businessBuildMissionId) {
          errors.push("Missing business build mission ID");
        }
        if (!blueprint.businessType) errors.push("Missing business type");
        if (!blueprint.businessObjective?.trim()) {
          errors.push("Missing business objective");
        }
        if (!blueprint.productsServices.length) {
          errors.push("Missing products/services");
        }
        if (!blueprint.customerSegments.length) {
          errors.push("Missing customer segments");
        }
        if (!blueprint.valueProposition?.trim()) {
          errors.push("Missing value proposition");
        }
        if (!blueprint.operationalWorkflow.length) {
          errors.push("Missing operational workflow");
        }
        if (!blueprint.requiredWorkers.length) {
          errors.push("Missing required workers");
        }
        if (!blueprint.requiredIntegrations.length) {
          errors.push("Missing required integrations");
        }
        if (!blueprint.requiredAssets.length) errors.push("Missing required assets");
        if (!blueprint.milestones.length) errors.push("Missing milestones");
        if (!blueprint.dependencies.length) errors.push("Missing dependencies");
        if (!blueprint.metadataVersion) errors.push("Missing metadata version");
        if (!blueprint.traceabilityRefs.length) {
          warnings.push(`Blueprint ${blueprint.blueprintId} has weak traceability refs`);
        }
        if (!blueprint.neverExecuteBusiness) {
          errors.push("Business Blueprint Worker must never execute the business");
        }
        if (!blueprint.neverLaunchProducts) {
          errors.push("Business Blueprint Worker must never launch products");
        }
        if (!blueprint.canonicalBlueprint) {
          errors.push("Business Blueprint must be marked canonical");
        }
      }
    }

    if (options.requireProceedRecommendation !== false) {
      const recommendation = input.opportunityEvaluation?.recommendation;
      const approved =
        input.opportunityApproved === true ||
        String(recommendation ?? "").toLowerCase() === "proceed";
      if (input.opportunityEvaluation && !approved) {
        errors.push(
          "Business Blueprint Worker requires an approved opportunity (Proceed recommendation or opportunityApproved=true)",
        );
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
      input.executeBusiness === true ||
      input.launchProducts === true ||
      input.createBranding === true ||
      input.buildWebsites === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ207OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeBusiness === true) {
      errors.push("Business Blueprint Worker must never execute the business");
    }
    if (input.launchProducts === true) {
      errors.push("Business Blueprint Worker must never launch products");
    }
    if (input.createBranding === true) {
      errors.push("Business Blueprint Worker must never create branding");
    }
    if (input.buildWebsites === true) {
      errors.push("Business Blueprint Worker must never build websites");
    }
    if (input.overridePillow === true) {
      errors.push("Business Blueprint Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Business Blueprint Worker must never override Grand King");
    }
    if (input.implementQ207OrLater === true) {
      errors.push("Business Blueprint Worker must never implement Q2-07 or later");
    }
  }

  finalize(
    decision: BusinessBlueprintWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): BusinessBlueprintWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `bbw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BBW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: BusinessBlueprintWorkerValidationReport["decision"] | null,
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
