/** X2-18 — Market Expansion Engine. */

import type { PortfolioExpansionPlannerConfiguration } from "./configuration.js";
import type { ExpansionCategory, ExpansionPriority, ExpansionRecord } from "./types.js";
import { PEP_METADATA_VERSION } from "./paths.js";

function priorityFromReturn(
  expectedReturn: number,
  config: PortfolioExpansionPlannerConfiguration,
): ExpansionPriority {
  if (expectedReturn >= config.highPriorityReturnThreshold + 25) return "critical";
  if (expectedReturn >= config.highPriorityReturnThreshold) return "high";
  if (expectedReturn >= config.minimumInvestmentThreshold + 10) return "medium";
  return "low";
}

export class MarketExpansionEngine {
  evaluate(input: {
    portfolioReference: string;
    category: Extract<ExpansionCategory, "market" | "industry">;
    opportunityHint?: string;
    investmentHint?: number;
    returnHint?: number;
    config: PortfolioExpansionPlannerConfiguration;
  }): ExpansionRecord {
    const categoryMultiplier = input.category === "market" ? 1.05 : 1.0;
    const baseInvestment =
      input.investmentHint ??
      (input.category === "market" ? 42 : 36) * categoryMultiplier;
    const baseReturn =
      input.returnHint ?? (input.category === "market" ? 44 : 39) * categoryMultiplier;

    const estimatedInvestment = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          baseInvestment +
            (input.config.expansionEvaluationRulesEnabled ? 7 : 0),
        ),
      ),
    );
    const expectedReturn = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          baseReturn + (input.config.expansionEvaluationRulesEnabled ? 8 : 0),
        ),
      ),
    );
    const expansionPriority = priorityFromReturn(expectedReturn, input.config);
    const requiresApproval =
      input.config.requireApprovalForExpansionInitiation ||
      expansionPriority === "high" ||
      expansionPriority === "critical";

    const defaultOpportunity =
      input.category === "market"
        ? "Geographic market expansion with portfolio distribution leverage"
        : "Industry vertical expansion aligned with enterprise structural advantages";

    return {
      expansionPlanId: `pep-exp-${Date.now()}-${input.category}`,
      timestamp: new Date().toISOString(),
      portfolioReference: input.portfolioReference,
      expansionOpportunity: input.opportunityHint ?? defaultOpportunity,
      expansionCategory: input.category,
      estimatedInvestment,
      expectedReturn,
      expansionPriority,
      validationStatus: "passed",
      metadataVersion: PEP_METADATA_VERSION,
      rankedPosition: null,
      requiresApproval,
      autoInitiationBlocked: true,
      structuralSignalOnly: true,
      sensitiveEnterpriseData: false,
    };
  }

  evaluateMarket(
    input: Omit<Parameters<MarketExpansionEngine["evaluate"]>[0], "category">,
  ): ExpansionRecord {
    return this.evaluate({ ...input, category: "market" });
  }

  evaluateIndustry(
    input: Omit<Parameters<MarketExpansionEngine["evaluate"]>[0], "category">,
  ): ExpansionRecord {
    return this.evaluate({ ...input, category: "industry" });
  }

  estimateCosts(records: ExpansionRecord[]): ExpansionRecord[] {
    return records.map((record) => ({
      ...record,
      timestamp: new Date().toISOString(),
      estimatedInvestment: Math.max(
        record.estimatedInvestment,
        Math.round(record.estimatedInvestment * 1.05),
      ),
    }));
  }

  estimateReturns(records: ExpansionRecord[]): ExpansionRecord[] {
    return records.map((record) => ({
      ...record,
      timestamp: new Date().toISOString(),
      expectedReturn: Math.max(
        record.expectedReturn,
        Math.round(record.expectedReturn * 0.98),
      ),
    }));
  }
}
