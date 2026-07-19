/** R3-11 — Tax rules engine (jurisdictions and rates). */

import type { TaxIntelligenceEngineConfiguration } from "./configuration.js";
import type { TaxCategory } from "./types.js";

export class TaxRulesEngine {
  resolveRate(
    jurisdiction: string,
    category: TaxCategory,
    config: TaxIntelligenceEngineConfiguration,
  ): { rate: number; warnings: string[] } {
    const warnings: string[] = [];

    if (!config.taxRateRulesEnabled) {
      warnings.push("Tax rate rules disabled — using default rate");
      return { rate: config.defaultTaxRate, warnings };
    }

    const match = config.jurisdictionRates.find(
      (r) => r.jurisdiction === jurisdiction && r.category === category,
    );
    if (match) return { rate: match.rate, warnings };

    const jurisdictionDefault = config.jurisdictionRates.find(
      (r) => r.jurisdiction === jurisdiction,
    );
    if (jurisdictionDefault) {
      warnings.push(`No rate for ${category} in ${jurisdiction} — using jurisdiction default`);
      return { rate: jurisdictionDefault.rate, warnings };
    }

    warnings.push(`Unknown jurisdiction ${jurisdiction} — using default rate`);
    return { rate: config.defaultTaxRate, warnings };
  }

  validateJurisdiction(
    jurisdiction: string,
    config: TaxIntelligenceEngineConfiguration,
  ): { valid: boolean; errors: string[] } {
    if (!config.jurisdictionRulesEnabled) return { valid: true, errors: [] };

    const known = config.jurisdictionRates.some((r) => r.jurisdiction === jurisdiction);
    if (!known && jurisdiction !== config.defaultJurisdiction) {
      return { valid: false, errors: [`Unknown tax jurisdiction: ${jurisdiction}`] };
    }
    return { valid: true, errors: [] };
  }

  listJurisdictions(config: TaxIntelligenceEngineConfiguration): string[] {
    return [...new Set(config.jurisdictionRates.map((r) => r.jurisdiction))];
  }
}
