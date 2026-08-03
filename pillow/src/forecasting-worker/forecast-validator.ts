import { FRCW_METADATA_VERSION } from "./paths.js";
import type { ForecastingReport, ForecastSeries, FrcwInput, FrcwValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateHistoricalFinancialData?: boolean;
  presentForecastsAsGuaranteedOutcomes?: boolean;
  executeInvestments?: boolean;
  approveBudgets?: boolean;
  replaceInvestmentPlanningWorker?: boolean;
  modifyAccountingRecords?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  implementQ907OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

/** Rejects Q9-07 and every later mission — Forecasting Worker is Q9-06 only. */
const FORBIDDEN_MISSION_ID = /^(Q9-0[7-9]|Q9-\d{3,}|Q[1-9]\d-\d+)/i;

export class FrcwValidator {
  decide(input: BoundaryInput): FrcwValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateHistoricalRequirement(hasHistory: boolean, input: FrcwInput, started: number): FrcwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Forecasting Worker requires validated=true");
    }
    if (!hasHistory) {
      errors.push(
        "No verified historical points were available for the requested metric/business/currency — Forecasting Worker never fabricates historical financial data to produce a forecast.",
      );
    }
    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision === "pass" && warnings.length ? "partial" : decision,
      errors,
      warnings,
      started,
    );
  }

  validateSeries(series: ForecastSeries | null, issues: string[], input: FrcwInput, started: number): FrcwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [...issues];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Forecasting Worker requires validated=true");
    }
    if (!series) {
      errors.push("No forecast series was produced");
    } else {
      if (series.fabricated !== false) errors.push("Forecast series fabricated flag must be false");
      if (!series.points.length) errors.push("Forecast series has no forecast points");
      if (series.points.some((p) => p.isForecast !== true || p.isHistorical !== false)) {
        errors.push("Every forecast point must be labelled isForecast:true and isHistorical:false");
      }
    }
    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision === "pass" && warnings.length ? "partial" : decision,
      errors,
      warnings,
      started,
    );
  }

  validateReport(report: ForecastingReport | null, input: FrcwInput, started: number): FrcwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Forecasting Worker requires validated=true");
    }

    if (!report) {
      errors.push("No Forecasting Report was produced");
    } else {
      const required: Array<keyof ForecastingReport> = [
        "reportId",
        "timestamp",
        "forecastPeriod",
        "revenueForecast",
        "costForecast",
        "cashflowForecast",
        "cashRunway",
        "profitForecast",
        "reinvestmentOptions",
        "forecastAssumptions",
        "confidenceAssessment",
        "scenarioComparison",
        "supportingEvidence",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
        "metadataVersion",
        "historicalBaseline",
      ];
      for (const field of required) {
        if (report[field] === undefined || report[field] === null) {
          errors.push(`Forecasting Report missing required field: ${String(field)}`);
        }
      }
      if (typeof report.confidenceScore !== "number" || report.confidenceScore < 0 || report.confidenceScore > 100) {
        errors.push("Forecasting Report confidenceScore must be 0-100");
      }
      if (!report.consumableByQ907) errors.push("consumableByQ907 must be true");
      if (report.historicalBaseline.isHistorical !== true) {
        errors.push("historicalBaseline must be labelled isHistorical:true");
      }
      if (
        report.revenueForecast.points.some((p) => p.isForecast !== true) ||
        report.costForecast.points.some((p) => p.isForecast !== true) ||
        report.cashflowForecast.points.some((p) => p.isForecast !== true) ||
        report.profitForecast.points.some((p) => p.isForecast !== true)
      ) {
        errors.push("Every forecast point must be labelled isForecast:true, clearly separated from history");
      }
      if (!report.neverFabricateHistoricalFinancialData) {
        errors.push("Forecasting Report must enforce neverFabricateHistoricalFinancialData boundary");
      }
      if (!report.neverPresentForecastsAsGuaranteedOutcomes) {
        errors.push("Forecasting Report must enforce neverPresentForecastsAsGuaranteedOutcomes boundary");
      }
      if (!report.neverExecuteInvestments) errors.push("Forecasting Report must enforce neverExecuteInvestments boundary");
      if (!report.neverApproveBudgets) errors.push("Forecasting Report must enforce neverApproveBudgets boundary");
      if (!report.neverReplaceInvestmentPlanningWorker) {
        errors.push("Forecasting Report must enforce neverReplaceInvestmentPlanningWorker boundary");
      }
      if (!report.neverModifyAccountingRecords) {
        errors.push("Forecasting Report must enforce neverModifyAccountingRecords boundary");
      }
      if (!report.neverBypassGrandKingApproval) {
        errors.push("Forecasting Report must enforce neverBypassGrandKingApproval boundary");
      }
      if (!report.neverImplementQ907OrLater) {
        errors.push("Forecasting Report must enforce neverImplementQ907OrLater boundary");
      }
      if (!report.preserveCompleteTraceability) {
        errors.push("Forecasting Report must preserve complete traceability");
      }
      if (report.outstandingIssues.length) {
        warnings.push(`Forecasting Report has ${report.outstandingIssues.length} outstanding issue(s)`);
      }
    }

    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision === "pass" && warnings.length ? "partial" : decision,
      errors,
      warnings,
      started,
    );
  }

  validateGeneric(input: FrcwInput, started: number): FrcwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Forecasting Worker requires validated=true");
    }
    return this.finalize(errors.length || decision === "fail" ? "fail" : decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateHistoricalFinancialData === true ||
      input.presentForecastsAsGuaranteedOutcomes === true ||
      input.executeInvestments === true ||
      input.approveBudgets === true ||
      input.replaceInvestmentPlanningWorker === true ||
      input.modifyAccountingRecords === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.implementQ907OrLater === true ||
      (!!input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateHistoricalFinancialData === true) {
      errors.push("Forecasting Worker must never fabricate historical financial data");
    }
    if (input.presentForecastsAsGuaranteedOutcomes === true) {
      errors.push("Forecasting Worker must never present forecasts as guaranteed outcomes");
    }
    if (input.executeInvestments === true) {
      errors.push("Forecasting Worker must never execute investments");
    }
    if (input.approveBudgets === true) {
      errors.push("Forecasting Worker must never approve budgets");
    }
    if (input.replaceInvestmentPlanningWorker === true) {
      errors.push("Forecasting Worker must never replace the Investment Planning Worker");
    }
    if (input.modifyAccountingRecords === true) {
      errors.push("Forecasting Worker must never modify accounting records");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Forecasting Worker must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Forecasting Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Forecasting Worker must never override Grand King");
    }
    if (input.bypassGrandKingApproval === true || input.bypassApproval === true) {
      errors.push("Forecasting Worker must never bypass Grand King approval");
    }
    if (input.implementQ907OrLater === true) {
      errors.push("Forecasting Worker must never implement Q9-07 or later");
    }
    if (input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`Forecasting Worker rejects out-of-scope missionId ${input.missionId}`);
    }
  }

  finalize(
    decision: FrcwValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): FrcwValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `frcw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FRCW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(decision: FrcwValidationReport["decision"] | null, enabled: boolean) {
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
