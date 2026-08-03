/** X2-18 — Expansion Opportunity Engine. */

import type { PortfolioExpansionPlannerConfiguration } from "./configuration.js";
import type { ExpansionCategory, ExpansionPriority, ExpansionRecord } from "./types.js";
import { EXPANSION_CATEGORIES, PEP_METADATA_VERSION } from "./paths.js";

function priorityFromReturn(
  expectedReturn: number,
  config: PortfolioExpansionPlannerConfiguration,
): ExpansionPriority {
  if (expectedReturn >= config.highPriorityReturnThreshold + 25) return "critical";
  if (expectedReturn >= config.highPriorityReturnThreshold) return "high";
  if (expectedReturn >= config.minimumInvestmentThreshold + 10) return "medium";
  return "low";
}

const OPPORTUNITY_TEMPLATES: Record<ExpansionCategory, string> = {
  market: "Enter adjacent geographic market with structural portfolio leverage",
  industry: "Expand into complementary industry vertical aligned with enterprise capabilities",
  internal: "Scale internal capability footprint across portfolio companies",
  acquisition: "Evaluate acquisition-led expansion to accelerate portfolio coverage",
};

export class ExpansionOpportunityEngine {
  discover(input: {
    portfolioReference: string;
    categories: ExpansionCategory[];
    config: PortfolioExpansionPlannerConfiguration;
  }): ExpansionRecord[] {
    return input.categories.map((category) =>
      this.createOpportunity({
        portfolioReference: input.portfolioReference,
        category,
        config: input.config,
      }),
    );
  }

  createOpportunity(input: {
    portfolioReference: string;
    category: ExpansionCategory;
    opportunityHint?: string;
    investmentHint?: number;
    returnHint?: number;
    config: PortfolioExpansionPlannerConfiguration;
  }): ExpansionRecord {
    const baseInvestment =
      input.investmentHint ??
      (input.category === "acquisition"
        ? 55
        : input.category === "market"
          ? 40
          : input.category === "industry"
            ? 35
            : 28);
    const baseReturn =
      input.returnHint ??
      (input.category === "acquisition"
        ? 50
        : input.category === "market"
          ? 42
          : input.category === "industry"
            ? 38
            : 32);

    const estimatedInvestment = Math.max(
      0,
      Math.min(
        100,
        Math.round(baseInvestment + (input.config.expansionEvaluationRulesEnabled ? 5 : 0)),
      ),
    );
    const expectedReturn = Math.max(
      0,
      Math.min(
        100,
        Math.round(baseReturn + (input.config.expansionEvaluationRulesEnabled ? 6 : 0)),
      ),
    );
    const expansionPriority = priorityFromReturn(expectedReturn, input.config);
    const requiresApproval =
      input.config.requireApprovalForExpansionInitiation ||
      expansionPriority === "high" ||
      expansionPriority === "critical";

    return {
      expansionPlanId: `pep-exp-${Date.now()}-${input.category}`,
      timestamp: new Date().toISOString(),
      portfolioReference: input.portfolioReference,
      expansionOpportunity:
        input.opportunityHint ?? OPPORTUNITY_TEMPLATES[input.category],
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

  evaluateInternal(input: {
    portfolioReference: string;
    opportunityHint?: string;
    investmentHint?: number;
    returnHint?: number;
    config: PortfolioExpansionPlannerConfiguration;
  }): ExpansionRecord {
    return this.createOpportunity({
      ...input,
      category: "internal",
      opportunityHint:
        input.opportunityHint ??
        "Internal expansion through cross-portfolio capability replication",
    });
  }

  allCategories(): ExpansionCategory[] {
    return [...EXPANSION_CATEGORIES];
  }
}
