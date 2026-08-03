/** X2-18 — Acquisition Expansion Engine. */

import type { PortfolioExpansionPlannerConfiguration } from "./configuration.js";
import type { ExpansionPriority, ExpansionRecord } from "./types.js";
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

export class AcquisitionExpansionEngine {
  evaluate(input: {
    portfolioReference: string;
    opportunityHint?: string;
    investmentHint?: number;
    returnHint?: number;
    config: PortfolioExpansionPlannerConfiguration;
  }): ExpansionRecord {
    const baseInvestment = input.investmentHint ?? 58;
    const baseReturn = input.returnHint ?? 52;

    const estimatedInvestment = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          baseInvestment +
            (input.config.expansionEvaluationRulesEnabled ? 10 : 0),
        ),
      ),
    );
    const expectedReturn = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          baseReturn + (input.config.expansionEvaluationRulesEnabled ? 9 : 0),
        ),
      ),
    );
    const expansionPriority = priorityFromReturn(expectedReturn, input.config);
    const requiresApproval = true;

    return {
      expansionPlanId: `pep-exp-${Date.now()}-acquisition`,
      timestamp: new Date().toISOString(),
      portfolioReference: input.portfolioReference,
      expansionOpportunity:
        input.opportunityHint ??
        "Acquisition-linked expansion evaluated through structural fit and portfolio synergy",
      expansionCategory: "acquisition",
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
}
