import { OPPORTUNITY_TYPES } from "./paths.js";
import type {
  InvestmentOpportunityInput,
  InvestmentPlanningReport,
  IpwInput,
  ValidationResult,
} from "./types.js";

const FORBIDDEN_MISSION = /^(Q9-0[9]|Q9-1\d|Q9-[2-9]\d|Q9-\d{3,}|Q[1-9]\d-\d+)/i;

export class IpwValidator {
  validateInput(input: IpwInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.forceFail) errors.push("forceFail requested");
    if (input.validated === false) errors.push("Caller marked input as unvalidated");
    const businessId = input.capitalBusinessId?.trim();
    if (!businessId) errors.push("capitalBusinessId is required");
    const period = input.planningPeriod?.trim();
    if (!period) errors.push("planningPeriod is required");
    for (const opp of input.opportunities ?? []) {
      this.validateOpportunity(opp, errors);
    }
    return {
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
    };
  }

  validateOpportunity(opp: InvestmentOpportunityInput, errors: string[] = []): ValidationResult {
    if (!OPPORTUNITY_TYPES.includes(opp.opportunityType)) {
      errors.push(`Unknown opportunity type: ${opp.opportunityType}`);
    }
    if (!opp.opportunityId?.trim()) errors.push("opportunityId is required");
    if (!opp.businessOrProject?.trim()) errors.push(`Opportunity ${opp.opportunityId} missing businessOrProject`);
    if (!Number.isInteger(opp.capitalRequiredMinor) || opp.capitalRequiredMinor < 0) {
      errors.push(`Opportunity ${opp.opportunityId} capitalRequiredMinor must be a non-negative safe integer`);
    }
    if (opp.fabricated !== false) errors.push(`Opportunity ${opp.opportunityId} must have fabricated:false`);
    if (!opp.evidenceRefs?.length) {
      errors.push(`Opportunity ${opp.opportunityId} requires evidenceRefs — never invent opportunities`);
    }
    const hasRoi = opp.expectedRoiBps != null && opp.expectedRoiBps > 0;
    const hasPayback = opp.expectedPaybackPeriods != null && opp.expectedPaybackPeriods > 0;
    if ((hasRoi || hasPayback) && (!opp.assumptions || opp.assumptions.length === 0)) {
      errors.push(
        `Opportunity ${opp.opportunityId} requires documented assumptions when ROI or payback projections are supplied`,
      );
    }
    if (opp.expectedRoiBps != null && (opp.expectedRoiBps < 0 || opp.expectedRoiBps > 10000)) {
      errors.push(`Opportunity ${opp.opportunityId} expectedRoiBps must be 0–10000 basis points`);
    }
    if (opp.strategicAlignmentBps != null && (opp.strategicAlignmentBps < 0 || opp.strategicAlignmentBps > 10000)) {
      errors.push(`Opportunity ${opp.opportunityId} strategicAlignmentBps must be 0–10000 basis points`);
    }
    if (opp.riskScoreBps != null && (opp.riskScoreBps < 0 || opp.riskScoreBps > 10000)) {
      errors.push(`Opportunity ${opp.opportunityId} riskScoreBps must be 0–10000 basis points`);
    }
    return {
      decision: errors.length ? "fail" : "pass",
      errors,
      warnings: [],
    };
  }

  validateReport(report: InvestmentPlanningReport): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!report.consumableByQ909) errors.push("consumableByQ909 must be true");
    if (!report.neverExecuteInvestments) errors.push("neverExecuteInvestments must be true");
    if (!report.neverApproveInvestments) errors.push("neverApproveInvestments must be true");
    if (!report.neverMoveOrAllocateCapital) errors.push("neverMoveOrAllocateCapital must be true");
    if (!report.neverModifyAccountingRecords) errors.push("neverModifyAccountingRecords must be true");
    if (!report.neverFabricateRoiOrPaybackOrRecommendations) {
      errors.push("neverFabricateRoiOrPaybackOrRecommendations must be true");
    }
    if (!report.neverImplementQ909OrLater) errors.push("neverImplementQ909OrLater must be true");
    if (!report.measuredDataDistinctFromProjections) {
      errors.push("measuredDataDistinctFromProjections must be true");
    }
    for (const rec of report.capitalAllocationRecommendations) {
      if (rec.isExecution !== false) errors.push(`Recommendation ${rec.recommendationId} must not execute`);
      if (rec.isApproval !== false) errors.push(`Recommendation ${rec.recommendationId} must not approve`);
      if (rec.signalKind !== "capital_allocation_recommendation") {
        errors.push(`Recommendation ${rec.recommendationId} must be capital_allocation_recommendation`);
      }
    }
    for (const opp of report.evaluatedOpportunities) {
      if (opp.fabricated !== false) errors.push(`Evaluated opportunity ${opp.opportunityId} must not be fabricated`);
    }
    return {
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
    };
  }

  rejectFutureMissions(missionId?: string | null): ValidationResult {
    if (missionId && FORBIDDEN_MISSION.test(missionId)) {
      return {
        decision: "fail",
        errors: [`Investment Planning Worker never implements ${missionId} (Q9-09 or later)`],
        warnings: [],
      };
    }
    return { decision: "pass", errors: [], warnings: [] };
  }
}
