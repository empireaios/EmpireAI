import { EMG_METADATA_VERSION } from "./paths.js";
import type {
  EmpireBuilderBusinessModel,
  EmpireBuilderModelGeneratorInput,
  EmpireBuilderModelGeneratorValidationReport,
} from "./types.js";

type BoundaryInput = {
  validateDemand?: boolean;
  performMarketResearch?: boolean;
  buildBranding?: boolean;
  assignWorkers?: boolean;
  launchBusiness?: boolean;
  implementQ204OrLater?: boolean;
  validated?: boolean;
};

export class ModelValidator {
  decide(
    input: EmpireBuilderModelGeneratorInput,
  ): EmpireBuilderModelGeneratorValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateModels(
    models: EmpireBuilderBusinessModel[] | null,
    input: EmpireBuilderModelGeneratorInput,
    started: number,
  ): EmpireBuilderModelGeneratorValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Empire Builder Model Generator requires validated=true");
    }

    if (!models || models.length === 0) {
      if (decision !== "fail") {
        warnings.push("No business models were produced yet");
      }
    } else {
      for (const model of models) {
        if (!model.businessModelId) errors.push("Missing business model ID");
        if (!model.businessType) errors.push("Missing business type");
        if (!model.valueProposition?.trim()) errors.push("Missing value proposition");
        if (!model.productsServices.length) errors.push("Missing products/services");
        if (!model.customerSegments.length) errors.push("Missing customer segments");
        if (!model.revenueModel?.trim()) errors.push("Missing revenue model");
        if (!model.costModel?.trim()) errors.push("Missing cost model");
        if (!model.operatingModel?.trim()) errors.push("Missing operating model");
        if (!model.neverValidateDemand) {
          errors.push("Empire Builder Model Generator must never validate demand");
        }
        if (!model.neverImplementQ204OrLater) {
          errors.push("Empire Builder Model Generator must never implement Q2-04 or later");
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
      input.validateDemand === true ||
      input.performMarketResearch === true ||
      input.buildBranding === true ||
      input.assignWorkers === true ||
      input.launchBusiness === true ||
      input.implementQ204OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.validateDemand === true) {
      errors.push("Empire Builder Model Generator must never validate demand");
    }
    if (input.performMarketResearch === true) {
      errors.push("Empire Builder Model Generator must never perform market research");
    }
    if (input.buildBranding === true) {
      errors.push("Empire Builder Model Generator must never build branding");
    }
    if (input.assignWorkers === true) {
      errors.push("Empire Builder Model Generator must never assign workers");
    }
    if (input.launchBusiness === true) {
      errors.push("Empire Builder Model Generator must never launch the business");
    }
    if (input.implementQ204OrLater === true) {
      errors.push("Empire Builder Model Generator must never implement Q2-04 or later");
    }
  }

  finalize(
    decision: EmpireBuilderModelGeneratorValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): EmpireBuilderModelGeneratorValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `emg-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EMG_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: EmpireBuilderModelGeneratorValidationReport["decision"] | null,
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
