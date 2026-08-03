/** X2-19 — Company Valuation Engine. */

import type { EnterpriseValueEngineConfiguration } from "./configuration.js";
import type { ValuationMethodology, ValuationRecord } from "./types.js";
import { EVE_METADATA_VERSION } from "./paths.js";

function confidenceFromMethodology(
  methodology: ValuationMethodology,
  config: EnterpriseValueEngineConfiguration,
): number {
  const base =
    methodology === "structural_composite"
      ? 72
      : methodology === "hybrid"
        ? 68
        : methodology === "intrinsic"
          ? 65
          : 58;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(base + (config.valuationRulesEnabled ? 8 : 0)),
    ),
  );
}

export class CompanyValuationEngine {
  calculate(input: {
    portfolioReference: string;
    companyReference: string;
    methodology: ValuationMethodology;
    config: EnterpriseValueEngineConfiguration;
    baseValueHint?: number;
  }): ValuationRecord {
    const baseValue =
      input.baseValueHint ??
      (input.methodology === "intrinsic"
        ? 62
        : input.methodology === "market"
          ? 55
          : input.methodology === "hybrid"
            ? 68
            : 70);

    const companyValuation = Math.max(
      0,
      Math.min(
        100,
        Math.round(baseValue + (input.config.valuationRulesEnabled ? 5 : 0)),
      ),
    );
    const portfolioValuation = Math.max(
      0,
      Math.min(100, Math.round(companyValuation * 0.85)),
    );
    const enterpriseValuation = Math.max(
      0,
      Math.min(100, Math.round(companyValuation * 0.92)),
    );
    const confidenceScore = confidenceFromMethodology(input.methodology, input.config);

    return {
      enterpriseValueId: `eve-val-${Date.now()}-company-${input.companyReference}`,
      timestamp: new Date().toISOString(),
      portfolioReference: input.portfolioReference,
      companyReference: input.companyReference,
      enterpriseValuation,
      portfolioValuation,
      companyValuation,
      valuationMethodology: input.methodology,
      confidenceScore,
      validationStatus: confidenceScore >= input.config.minimumConfidenceThreshold ? "passed" : "partial",
      metadataVersion: EVE_METADATA_VERSION,
      notGuaranteedMarketPrice: true,
      structuralSignalOnly: true,
      sensitiveFinancialData: false,
      anomalyDetected: false,
      valueGrowthRate: 0,
    };
  }

  estimateIntrinsic(input: {
    portfolioReference: string;
    companyReference: string;
    config: EnterpriseValueEngineConfiguration;
  }): ValuationRecord {
    return this.calculate({
      ...input,
      methodology: "intrinsic",
      baseValueHint: 64,
    });
  }

  estimateMarket(input: {
    portfolioReference: string;
    companyReference: string;
    config: EnterpriseValueEngineConfiguration;
  }): ValuationRecord {
    return this.calculate({
      ...input,
      methodology: "market",
      baseValueHint: 52,
    });
  }
}
