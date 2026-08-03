import { EP_METADATA_VERSION } from "./paths.js";
import type { ExecutionPlan, ExecutivePlannerInput, PlanValidationReport } from "./types.js";

export class PlanValidator {
  decide(input: ExecutivePlannerInput): PlanValidationReport["decision"] {
    if (
      input.executeWork === true ||
      input.assignWorkers === true ||
      input.invokeTools === true ||
      input.approveActions === true
    ) {
      return "fail";
    }
    if (!input.objective?.trim()) return "fail";
    if (input.validated === false) return "fail";
    if (input.objective.trim().length < 12) return "partial";
    return "pass";
  }

  validatePlan(plan: ExecutionPlan | null, input: ExecutivePlannerInput, started: number): PlanValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.objective?.trim()) errors.push("Objective is required");
    if (input.executeWork === true) errors.push("Executive Planner must never execute work");
    if (input.assignWorkers === true) errors.push("Executive Planner must never assign workers");
    if (input.invokeTools === true) errors.push("Executive Planner must never invoke tools");
    if (input.approveActions === true) errors.push("Executive Planner must never approve actions");
    if (input.validated === false) errors.push("Planning requires validated=true");

    if (plan) {
      if (!plan.planId) errors.push("Missing plan ID");
      if (!plan.requiredWorkforceCategories.length) errors.push("Workforce categories must be identified");
      if (!plan.executionStages.length) errors.push("Execution stages are required");
      if (plan.workersAssigned) errors.push("workersAssigned must remain false");
      if (plan.workExecuted) errors.push("workExecuted must remain false");
      if (!plan.successCriteria.length) warnings.push("Success criteria list is empty");
      if (!plan.risks.length) warnings.push("Risks list is empty");
    } else if (decision !== "fail") {
      errors.push("Execution plan was not produced");
    }

    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";

    return {
      validationReportId: `ep-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EP_METADATA_VERSION,
    };
  }
}

export class PlanMetadataGenerator {
  generate(planCount: number) {
    return {
      metadataVersion: EP_METADATA_VERSION,
      engineVersion: "PILLOW-EP-001" as const,
      missionId: "Q0-01" as const,
      planCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: PlanValidationReport["decision"] | null, enabled: boolean) {
    if (!enabled) return "standby" as const;
    if (decision === "fail") return "degraded" as const;
    if (decision === "partial") return "degraded" as const;
    return "healthy" as const;
  }

  score(decision: PlanValidationReport["decision"] | null) {
    if (decision === "fail") return 40;
    if (decision === "partial") return 70;
    if (decision === "pass") return 100;
    return 50;
  }
}

/** Recovery never executes work or assigns workers. */
export class RecoveryManager {
  private failures = 0;
  recordFailure() {
    this.failures += 1;
    return {
      recoveryAttempted: true,
      failures: this.failures,
      workExecuted: false as const,
      workersAssigned: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
