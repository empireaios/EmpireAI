/** X2-19 — Portfolio Valuation Engine. */

import type { EnterpriseValueEngineConfiguration } from "./configuration.js";
import type { ValuationMethodology, ValuationRecord } from "./types.js";
import { EVE_METADATA_VERSION } from "./paths.js";

export class PortfolioValuationEngine {
  calculate(input: {
    portfolioReference: string;
    methodology: ValuationMethodology;
    config: EnterpriseValueEngineConfiguration;
    companyRecords?: ValuationRecord[];
  }): ValuationRecord {
    const companyRecords = input.companyRecords ?? [];
    const avgCompany =
      companyRecords.length > 0
        ? companyRecords.reduce((sum, r) => sum + r.companyValuation, 0) / companyRecords.length
        : input.methodology === "structural_composite"
          ? 68
          : 60;

    const portfolioValuation = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          avgCompany * 1.15 + (input.config.valuationRulesEnabled ? 6 : 0),
        ),
      ),
    );
    const enterpriseValuation = Math.max(
      0,
      Math.min(100, Math.round(portfolioValuation * 1.08)),
    );
    const confidenceScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (companyRecords.length
            ? companyRecords.reduce((sum, r) => sum + r.confidenceScore, 0) /
              companyRecords.length
            : 62) + (input.config.valuationRulesEnabled ? 5 : 0),
        ),
      ),
    );

    return {
      enterpriseValueId: `eve-val-${Date.now()}-portfolio-${input.portfolioReference}`,
      timestamp: new Date().toISOString(),
      portfolioReference: input.portfolioReference,
      companyReference: null,
      enterpriseValuation,
      portfolioValuation,
      companyValuation: 0,
      valuationMethodology: input.methodology,
      confidenceScore,
      validationStatus:
        confidenceScore >= input.config.minimumConfidenceThreshold ? "passed" : "partial",
      metadataVersion: EVE_METADATA_VERSION,
      notGuaranteedMarketPrice: true,
      structuralSignalOnly: true,
      sensitiveFinancialData: false,
      anomalyDetected: false,
      valueGrowthRate: 0,
    };
  }

  calculateEnterprise(input: {
    portfolioReference: string;
    companyReference?: string | null;
    methodology: ValuationMethodology;
    config: EnterpriseValueEngineConfiguration;
    portfolioRecord?: ValuationRecord;
    companyRecord?: ValuationRecord | null;
  }): ValuationRecord {
    const portfolioValuation =
      input.portfolioRecord?.portfolioValuation ??
      this.calculate({
        portfolioReference: input.portfolioReference,
        methodology: input.methodology,
        config: input.config,
      }).portfolioValuation;

    const companyValuation = input.companyRecord?.companyValuation ?? 0;
    const enterpriseValuation = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          portfolioValuation * 0.75 +
            companyValuation * 0.25 +
            (input.config.valuationRulesEnabled ? 4 : 0),
        ),
      ),
    );

    const confidenceScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (input.portfolioRecord?.confidenceScore ?? 60) * 0.6 +
            (input.companyRecord?.confidenceScore ?? 55) * 0.4,
        ),
      ),
    );

    return {
      enterpriseValueId: `eve-val-${Date.now()}-enterprise-${input.portfolioReference}`,
      timestamp: new Date().toISOString(),
      portfolioReference: input.portfolioReference,
      companyReference: input.companyReference ?? null,
      enterpriseValuation,
      portfolioValuation,
      companyValuation,
      valuationMethodology: input.methodology,
      confidenceScore,
      validationStatus:
        confidenceScore >= input.config.minimumConfidenceThreshold ? "passed" : "partial",
      metadataVersion: EVE_METADATA_VERSION,
      notGuaranteedMarketPrice: true,
      structuralSignalOnly: true,
      sensitiveFinancialData: false,
      anomalyDetected: false,
      valueGrowthRate: 0,
    };
  }
}
