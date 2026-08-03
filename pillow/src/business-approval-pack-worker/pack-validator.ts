import { BAP_METADATA_VERSION } from "./paths.js";
import type {
  BusinessApprovalPack,
  BusinessApprovalPackWorkerInput,
  BusinessApprovalPackWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  approveBusiness?: boolean;
  launchBusiness?: boolean;
  modifyPreviousReports?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ210OrLater?: boolean;
  validated?: boolean;
};

export class PackValidator {
  decide(
    input: BusinessApprovalPackWorkerInput,
  ): BusinessApprovalPackWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validatePacks(
    packs: BusinessApprovalPack[] | null,
    input: BusinessApprovalPackWorkerInput,
    started: number,
  ): BusinessApprovalPackWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Business Approval Pack Worker requires validated=true");
    }

    if (!packs || packs.length === 0) {
      if (decision !== "fail") {
        warnings.push("No business approval packs were produced yet");
      }
    } else {
      for (const pack of packs) {
        if (!pack.approvalPackId) errors.push("Missing approval pack ID");
        if (!pack.timestamp) errors.push("Missing approval pack timestamp");
        if (!pack.businessBuildMissionId) {
          errors.push("Missing business build mission ID");
        }
        if (!pack.executiveSummary?.trim()) errors.push("Missing executive summary");
        if (!pack.businessOverview?.trim()) errors.push("Missing business overview");
        if (!pack.opportunitySummary?.trim()) errors.push("Missing opportunity summary");
        if (!pack.marketSummary?.trim()) errors.push("Missing market summary");
        if (!pack.businessModelSummary?.trim()) {
          errors.push("Missing business model summary");
        }
        if (!pack.blueprintSummary?.trim()) errors.push("Missing blueprint summary");
        if (!pack.launchSummary?.trim()) errors.push("Missing launch summary");
        if (!pack.riskSummary?.trim()) errors.push("Missing risk summary");
        if (!pack.recommendation) errors.push("Missing recommendation");
        if (!pack.requiredGrandKingDecisions.length) {
          errors.push("Missing required Grand King decisions");
        }
        if (!pack.supportingEvidence.length) errors.push("Missing supporting evidence");
        if (!pack.metadataVersion) errors.push("Missing metadata version");

        if (!pack.sourceRefs.businessModelId) {
          warnings.push(`Pack ${pack.approvalPackId} missing business model source ref`);
        }
        if (!pack.sourceRefs.marketResearchReportId) {
          warnings.push(`Pack ${pack.approvalPackId} missing market research source ref`);
        }
        if (!pack.sourceRefs.opportunityEvaluationId) {
          warnings.push(
            `Pack ${pack.approvalPackId} missing opportunity evaluation source ref`,
          );
        }
        if (!pack.sourceRefs.businessBlueprintId) {
          warnings.push(`Pack ${pack.approvalPackId} missing blueprint source ref`);
        }
        if (!pack.sourceRefs.launchPlanId) {
          warnings.push(`Pack ${pack.approvalPackId} missing launch plan source ref`);
        }
        if (!pack.sourceRefs.businessRiskReportId) {
          warnings.push(`Pack ${pack.approvalPackId} missing risk report source ref`);
        }

        if (!pack.neverApproveBusiness) {
          errors.push("Business Approval Pack Worker must never approve businesses");
        }
        if (!pack.neverLaunchBusiness) {
          errors.push("Business Approval Pack Worker must never launch businesses");
        }
        if (!pack.neverModifyPreviousReports) {
          errors.push("Business Approval Pack Worker must never modify previous reports");
        }
        if (!pack.distinguishFactsFromRecommendations) {
          errors.push("Business Approval Pack Worker must distinguish facts from recommendations");
        }
        if (!pack.facts.length) {
          warnings.push(`Pack ${pack.approvalPackId} has no facts section`);
        }
        if (!pack.recommendationsOnly.length) {
          warnings.push(`Pack ${pack.approvalPackId} has no recommendations section`);
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
      input.launchBusiness === true ||
      input.modifyPreviousReports === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ210OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.approveBusiness === true) {
      errors.push("Business Approval Pack Worker must never approve businesses");
    }
    if (input.launchBusiness === true) {
      errors.push("Business Approval Pack Worker must never launch businesses");
    }
    if (input.modifyPreviousReports === true) {
      errors.push("Business Approval Pack Worker must never modify previous reports");
    }
    if (input.overridePillow === true) {
      errors.push("Business Approval Pack Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Business Approval Pack Worker must never override Grand King");
    }
    if (input.implementQ210OrLater === true) {
      errors.push("Business Approval Pack Worker must never implement Q2-10 or later");
    }
  }

  finalize(
    decision: BusinessApprovalPackWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): BusinessApprovalPackWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `bap-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BAP_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: BusinessApprovalPackWorkerValidationReport["decision"] | null,
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
