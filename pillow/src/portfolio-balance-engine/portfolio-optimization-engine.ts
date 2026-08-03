/** X2-08 — Portfolio optimization engine (recommendations only — no auto-rebalance). */

import { appendPbeLog } from "./pbe-logging.js";
import { PBE_METADATA_VERSION } from "./paths.js";
import type { BalancingAction, PortfolioBalanceRecord } from "./types.js";

export class PortfolioOptimizationEngine {
  buildRecord(input: {
    portfolioReference: string;
    diversificationScore: number;
    industryConcentrationScore: number;
    revenueConcentrationScore: number;
    capitalConcentrationScore: number;
    geographicExposureScore: number;
    imbalanceDetected: boolean;
    overexposureDetected: boolean;
    actions: BalancingAction[];
  }): PortfolioBalanceRecord {
    const record: PortfolioBalanceRecord = {
      portfolioBalanceId: `pbe-${Date.now()}`,
      timestamp: new Date().toISOString(),
      portfolioReference: input.portfolioReference,
      diversificationScore: input.diversificationScore,
      industryConcentrationScore: input.industryConcentrationScore,
      revenueConcentrationScore: input.revenueConcentrationScore,
      capitalConcentrationScore: input.capitalConcentrationScore,
      geographicExposureScore: input.geographicExposureScore,
      imbalanceDetected: input.imbalanceDetected,
      overexposureDetected: input.overexposureDetected,
      recommendedBalancingActions: input.actions,
      autoRebalanceApplied: false,
      structuralSignalOnly: true,
      validationStatus: "passed",
      metadataVersion: PBE_METADATA_VERSION,
    };

    appendPbeLog({
      event: "portfolio_optimization",
      level: "info",
      details: `Balance record ${record.portfolioBalanceId} · diversification=${record.diversificationScore} · autoRebalance=false`,
    });

    return record;
  }

  detectImbalance(input: {
    diversificationScore: number;
    industryConcentrationScore: number;
    revenueConcentrationScore: number;
    capitalConcentrationScore: number;
    geographicExposureScore: number;
    minDiversificationScore: number;
    maxIndustry: number;
    maxRevenue: number;
    maxCapital: number;
    imbalanceAlertThreshold: number;
  }): { imbalanceDetected: boolean; overexposureDetected: boolean; actions: BalancingAction[] } {
    const actions: BalancingAction[] = [];
    let imbalanceDetected = false;
    let overexposureDetected = false;

    if (input.diversificationScore < input.minDiversificationScore) {
      imbalanceDetected = true;
      actions.push(this.action("increase_diversification", "Raise portfolio diversification across companies and categories", "high"));
    }
    if (input.industryConcentrationScore > input.maxIndustry) {
      overexposureDetected = true;
      imbalanceDetected = true;
      actions.push(this.action("reduce_industry_concentration", "Reduce industry concentration below configured threshold", "high"));
    }
    if (input.revenueConcentrationScore > input.maxRevenue) {
      overexposureDetected = true;
      imbalanceDetected = true;
      actions.push(this.action("reduce_revenue_concentration", "Rebalance revenue exposure across companies", "medium"));
    }
    if (input.capitalConcentrationScore > input.maxCapital) {
      overexposureDetected = true;
      imbalanceDetected = true;
      actions.push(this.action("reduce_capital_concentration", "Redistribute capital allocations with Grand King approval", "high"));
    }
    if (input.geographicExposureScore >= input.imbalanceAlertThreshold) {
      imbalanceDetected = true;
      actions.push(this.action("diversify_geographic_exposure", "Expand structural geographic footprint diversity", "medium"));
    }

    if (actions.length === 0) {
      actions.push(this.action("maintain_balance", "Portfolio diversification within healthy structural band", "low"));
    }

    return { imbalanceDetected, overexposureDetected, actions };
  }

  private action(
    actionType: string,
    rationale: string,
    priority: BalancingAction["priority"],
  ): BalancingAction {
    return {
      actionId: `pbe-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actionType,
      rationale,
      priority,
      requiresManualApproval: true,
      autoApplied: false,
      structuralSignalOnly: true,
    };
  }
}
