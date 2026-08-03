import { LPW_METADATA_VERSION } from "./paths.js";
import type {
  LaunchPlan,
  LaunchPlanWorkerInput,
  LaunchPlanWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeLaunchTasks?: boolean;
  assignWorkersDirectly?: boolean;
  createBusinessAssets?: boolean;
  connectExternalAccounts?: boolean;
  launchBusiness?: boolean;
  approveLaunch?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ208OrLater?: boolean;
  validated?: boolean;
};

export class PlanValidator {
  decide(input: LaunchPlanWorkerInput): LaunchPlanWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validatePlans(
    plans: LaunchPlan[] | null,
    input: LaunchPlanWorkerInput,
    started: number,
    options: { requireApprovedBlueprint?: boolean } = {},
  ): LaunchPlanWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Launch Plan Worker requires validated=true");
    }

    if (options.requireApprovedBlueprint !== false) {
      const hasBlueprint =
        !!input.businessBlueprint?.blueprintId || !!input.businessBlueprintId;
      if (!hasBlueprint && input.businessBlueprint == null) {
        /* checked by manager for missing payloads */
      } else if (hasBlueprint && input.blueprintApproved === false) {
        errors.push(
          "Launch Plan Worker requires an approved Business Blueprint (blueprintApproved must not be false)",
        );
      }
    }

    if (!plans || plans.length === 0) {
      if (decision !== "fail") {
        warnings.push("No launch plans were produced yet");
      }
    } else {
      for (const plan of plans) {
        if (!plan.launchPlanId) errors.push("Missing launch plan ID");
        if (!plan.businessBuildMissionId) {
          errors.push("Missing business build mission ID");
        }
        if (!plan.businessBlueprintId) errors.push("Missing business blueprint ID");
        if (!plan.businessType) errors.push("Missing business type");
        if (!plan.launchObjective?.trim()) errors.push("Missing launch objective");
        if (!plan.launchStages.length) errors.push("Missing launch stages");
        if (!plan.milestones.length) errors.push("Missing milestones");
        if (!plan.tasks.length) errors.push("Missing tasks");
        if (!plan.dependencies.length) errors.push("Missing dependencies");
        if (!plan.requiredWorkforce.length) errors.push("Missing required workforce");
        if (!plan.requiredTools.length) errors.push("Missing required tools");
        if (!plan.approvalCheckpoints.length) {
          errors.push("Missing approval checkpoints");
        }
        if (!plan.validationCheckpoints.length) {
          errors.push("Missing validation checkpoints");
        }
        if (!plan.launchPrerequisites.length) {
          errors.push("Missing launch prerequisites");
        }
        if (!plan.rollbackConditions.length) {
          errors.push("Missing rollback conditions");
        }
        if (!plan.completionCriteria.length) {
          errors.push("Missing completion criteria");
        }
        if (!plan.metadataVersion) errors.push("Missing metadata version");
        if (!plan.traceabilityRefs.some((r) => r.includes("q2-06"))) {
          warnings.push(
            `Launch plan ${plan.launchPlanId} missing explicit Q2-06 blueprint traceability`,
          );
        }
        if (!plan.neverExecuteLaunchTasks) {
          errors.push("Launch Plan Worker must never execute launch tasks");
        }
        if (!plan.neverLaunchBusiness) {
          errors.push("Launch Plan Worker must never launch the business");
        }
        if (!plan.neverApproveLaunch) {
          errors.push("Launch Plan Worker must never approve the launch");
        }
        if (!plan.neverAssignWorkersDirectly) {
          errors.push("Launch Plan Worker must never assign workers directly");
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
      input.executeLaunchTasks === true ||
      input.assignWorkersDirectly === true ||
      input.createBusinessAssets === true ||
      input.connectExternalAccounts === true ||
      input.launchBusiness === true ||
      input.approveLaunch === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ208OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeLaunchTasks === true) {
      errors.push("Launch Plan Worker must never execute launch tasks");
    }
    if (input.assignWorkersDirectly === true) {
      errors.push("Launch Plan Worker must never assign workers directly");
    }
    if (input.createBusinessAssets === true) {
      errors.push("Launch Plan Worker must never create business assets");
    }
    if (input.connectExternalAccounts === true) {
      errors.push("Launch Plan Worker must never connect external accounts");
    }
    if (input.launchBusiness === true) {
      errors.push("Launch Plan Worker must never launch the business");
    }
    if (input.approveLaunch === true) {
      errors.push("Launch Plan Worker must never approve the launch");
    }
    if (input.overridePillow === true) {
      errors.push("Launch Plan Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Launch Plan Worker must never override Grand King");
    }
    if (input.implementQ208OrLater === true) {
      errors.push("Launch Plan Worker must never implement Q2-08 or later");
    }
  }

  finalize(
    decision: LaunchPlanWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): LaunchPlanWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `lpw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LPW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: LaunchPlanWorkerValidationReport["decision"] | null,
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
