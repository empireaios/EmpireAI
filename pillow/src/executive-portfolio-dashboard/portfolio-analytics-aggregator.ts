/** X2-06 — Portfolio analytics aggregator. */

import { appendEpdLog } from "./epd-logging.js";
import type {
  CapitalAllocationSummary,
  CompanySummary,
  EnterpriseHealthSummary,
  GrowthSummary,
  PortfolioSummary,
} from "./types.js";

export class PortfolioAnalyticsAggregator {
  aggregatePortfolio(input: {
    registeredModules: number;
    activeModules: number;
    frameworkHealthScore: number;
    frameworkStatus: string;
  }): PortfolioSummary {
    return {
      registeredModules: input.registeredModules,
      activeModules: input.activeModules,
      frameworkHealthScore: input.frameworkHealthScore,
      frameworkStatus: input.frameworkStatus,
    };
  }

  aggregateCompanies(input: {
    totalCompanies: number;
    activeCompanies: number;
    categoriesTracked: number;
  }): CompanySummary {
    return {
      totalCompanies: input.totalCompanies,
      activeCompanies: input.activeCompanies,
      categoriesTracked: input.categoriesTracked,
    };
  }

  aggregateCapital(input: {
    availablePoolUnits: number;
    allocationCount: number;
    totalApprovedUnits: number;
    highRiskSignals: number;
  }): CapitalAllocationSummary {
    return { ...input };
  }

  aggregateGrowth(input: {
    knowledgeAssets: number;
    sharedKnowledge: number;
    averageGrowthIndex: number;
  }): GrowthSummary {
    return { ...input };
  }

  aggregateHealth(input: {
    companyHealthScore: number;
    performanceHealthScore: number;
    capitalHealthScore: number;
    knowledgeHealthScore: number;
    frameworkHealthScore: number;
  }): EnterpriseHealthSummary {
    const overallHealthScore = Math.round(
      input.frameworkHealthScore * 0.2 +
        input.companyHealthScore * 0.2 +
        input.performanceHealthScore * 0.25 +
        input.capitalHealthScore * 0.2 +
        input.knowledgeHealthScore * 0.15,
    );

    const status =
      overallHealthScore >= 75
        ? ("healthy" as const)
        : overallHealthScore >= 50
          ? ("degraded" as const)
          : ("failed" as const);

    appendEpdLog({
      event: "portfolio_analytics",
      level: "info",
      details: `Enterprise health aggregated · score=${overallHealthScore}`,
    });

    return {
      overallHealthScore,
      companyHealthScore: input.companyHealthScore,
      performanceHealthScore: input.performanceHealthScore,
      capitalHealthScore: input.capitalHealthScore,
      knowledgeHealthScore: input.knowledgeHealthScore,
      status,
    };
  }
}
