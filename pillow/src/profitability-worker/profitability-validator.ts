import { PRFW_METADATA_VERSION } from "./paths.js";
import type { ProfitabilityAnalysis, ProfitabilityReport, PrfwInput, PrfwValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateRevenueCostFeeRefundOrProfitabilityFigures?: boolean;
  forecastFutureProfitability?: boolean;
  approveSpending?: boolean;
  executeFinancialTransactions?: boolean;
  replaceForecastingWorker?: boolean;
  modifyAccountingRecords?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  implementQ906OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

/** Rejects Q9-06 and every later mission — Profitability Worker is Q9-05 only. */
const FORBIDDEN_MISSION_ID = /^(Q9-0[6-9]|Q9-\d{2,}|Q[1-9]\d-\d+)/i;

export class PrfwValidator {
  decide(input: BoundaryInput): PrfwValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateAnalysis(analysis: ProfitabilityAnalysis | null, input: PrfwInput, started: number): PrfwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Profitability Worker requires validated=true");
    }

    if (!analysis) {
      errors.push("No profitability analysis was produced");
    } else {
      if (analysis.fabricated !== false) errors.push("Profitability analysis fabricated flag must be false");
      if (!analysis.analysisId) errors.push("Missing profitability analysis ID");
      if (!analysis.scopeId) errors.push("Profitability analysis is missing a scopeId");
      if (analysis.outstandingIssues.length) {
        warnings.push(...analysis.outstandingIssues);
      }
      if (!analysis.realisedOnly) {
        warnings.push(`Analysis for ${analysis.scope}:${analysis.scopeId} includes non-realised (estimated) line items.`);
      }
    }

    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision === "pass" && warnings.length ? "partial" : decision,
      errors,
      warnings,
      started,
    );
  }

  validateAnalyses(analyses: ProfitabilityAnalysis[], input: PrfwInput, started: number, requireEvidence: boolean): PrfwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Profitability Worker requires validated=true");
    }

    if (!analyses.length) {
      if (requireEvidence) {
        errors.push(
          "No verified financial line items were available — Profitability Worker never fabricates revenue, cost, fee, refund, or profitability figures.",
        );
      } else if (decision !== "fail") {
        warnings.push("No profitability analyses were produced");
      }
    } else {
      for (const analysis of analyses) {
        if (!analysis.analysisId) errors.push("Missing profitability analysis ID");
        if (analysis.fabricated !== false) errors.push("Profitability analysis fabricated flag must be false");
        if (!analysis.realisedOnly) {
          warnings.push(`Analysis for ${analysis.scope}:${analysis.scopeId} includes non-realised (estimated) line items.`);
        }
        warnings.push(...analysis.outstandingIssues);
      }
    }

    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision === "pass" && warnings.length ? "partial" : decision,
      errors,
      warnings,
      started,
    );
  }

  validateReport(report: ProfitabilityReport | null, input: PrfwInput, started: number): PrfwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Profitability Worker requires validated=true");
    }

    if (!report) {
      errors.push("No Profitability Report was produced");
    } else {
      const required: Array<keyof ProfitabilityReport> = [
        "reportId",
        "timestamp",
        "reportingPeriod",
        "revenueSummary",
        "costSummary",
        "feeSummary",
        "refundSummary",
        "taxSummary",
        "grossProfit",
        "operatingProfit",
        "netProfit",
        "profitMargins",
        "profitabilityRankings",
        "profitDrivers",
        "lossDrivers",
        "supportingEvidence",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
        "metadataVersion",
      ];
      for (const field of required) {
        if (report[field] === undefined || report[field] === null) {
          errors.push(`Profitability Report missing required field: ${String(field)}`);
        }
      }
      if (typeof report.confidenceScore !== "number" || report.confidenceScore < 0 || report.confidenceScore > 100) {
        errors.push("Profitability Report confidenceScore must be 0-100");
      }
      if (!report.consumableByQ906) errors.push("consumableByQ906 must be true");
      if (!report.neverFabricateRevenueCostFeeRefundOrProfitabilityFigures) {
        errors.push("Profitability Report must enforce neverFabricateRevenueCostFeeRefundOrProfitabilityFigures boundary");
      }
      if (!report.neverForecastFutureProfitability) {
        errors.push("Profitability Report must enforce neverForecastFutureProfitability boundary");
      }
      if (!report.neverApproveSpending) errors.push("Profitability Report must enforce neverApproveSpending boundary");
      if (!report.neverExecuteFinancialTransactions) {
        errors.push("Profitability Report must enforce neverExecuteFinancialTransactions boundary");
      }
      if (!report.neverReplaceForecastingWorker) {
        errors.push("Profitability Report must enforce neverReplaceForecastingWorker boundary");
      }
      if (!report.neverModifyAccountingRecords) {
        errors.push("Profitability Report must enforce neverModifyAccountingRecords boundary");
      }
      if (!report.neverBypassGrandKingApproval) {
        errors.push("Profitability Report must enforce neverBypassGrandKingApproval boundary");
      }
      if (!report.neverImplementQ906OrLater) {
        errors.push("Profitability Report must enforce neverImplementQ906OrLater boundary");
      }
      if (!report.preserveCompleteTraceability) {
        errors.push("Profitability Report must preserve complete traceability");
      }
      if (report.outstandingIssues.length) {
        warnings.push(`Profitability Report has ${report.outstandingIssues.length} outstanding issue(s)`);
      }
    }

    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision === "pass" && warnings.length ? "partial" : decision,
      errors,
      warnings,
      started,
    );
  }

  validateGeneric(input: PrfwInput, started: number): PrfwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Profitability Worker requires validated=true");
    }
    return this.finalize(errors.length || decision === "fail" ? "fail" : decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateRevenueCostFeeRefundOrProfitabilityFigures === true ||
      input.forecastFutureProfitability === true ||
      input.approveSpending === true ||
      input.executeFinancialTransactions === true ||
      input.replaceForecastingWorker === true ||
      input.modifyAccountingRecords === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.implementQ906OrLater === true ||
      (!!input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateRevenueCostFeeRefundOrProfitabilityFigures === true) {
      errors.push("Profitability Worker must never fabricate revenue, cost, fee, refund, or profitability figures");
    }
    if (input.forecastFutureProfitability === true) {
      errors.push("Profitability Worker must never forecast future profitability");
    }
    if (input.approveSpending === true) {
      errors.push("Profitability Worker must never approve spending");
    }
    if (input.executeFinancialTransactions === true) {
      errors.push("Profitability Worker must never execute financial transactions");
    }
    if (input.replaceForecastingWorker === true) {
      errors.push("Profitability Worker must never replace the Forecasting Worker");
    }
    if (input.modifyAccountingRecords === true) {
      errors.push("Profitability Worker must never modify accounting records");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Profitability Worker must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Profitability Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Profitability Worker must never override Grand King");
    }
    if (input.bypassGrandKingApproval === true || input.bypassApproval === true) {
      errors.push("Profitability Worker must never bypass Grand King approval");
    }
    if (input.implementQ906OrLater === true) {
      errors.push("Profitability Worker must never implement Q9-06 or later");
    }
    if (input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`Profitability Worker rejects out-of-scope missionId ${input.missionId}`);
    }
  }

  finalize(
    decision: PrfwValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): PrfwValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `prfw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PRFW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(decision: PrfwValidationReport["decision"] | null, enabled: boolean) {
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
