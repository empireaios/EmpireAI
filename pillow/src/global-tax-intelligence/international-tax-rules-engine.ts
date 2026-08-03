/** X4-07 — International Tax Rules Engine. */

import type { GlobalTaxIntelligenceConfiguration } from "./configuration.js";
import {
  buildTaxIntelligenceRecord,
  computeStructuralTaxSignals,
} from "./structural-signals.js";
import type { TaxAnalysisInput, TaxIntelligenceRecord } from "./types.js";

export class InternationalTaxRulesEngine {
  manageCountryTaxRules(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): TaxIntelligenceRecord {
    const signals = computeStructuralTaxSignals(
      { ...input, taxCategory: "country_specific" },
      config,
    );
    return buildTaxIntelligenceRecord({
      ...signals,
      recommendationSummary: `Manage country-specific tax rules for ${signals.country} — not legal advice`,
    });
  }

  monitorTaxRegulationUpdates(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): TaxIntelligenceRecord {
    const signals = computeStructuralTaxSignals(
      { ...input, taxCategory: "regulatory_update" },
      config,
    );
    return buildTaxIntelligenceRecord({
      ...signals,
      recommendationSummary: `Monitor tax regulation updates for ${signals.country} — not legal advice`,
    });
  }

  manageIndirectTaxes(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): TaxIntelligenceRecord {
    const signals = computeStructuralTaxSignals(
      { ...input, taxCategory: "indirect" },
      config,
    );
    return buildTaxIntelligenceRecord({
      ...signals,
      recommendationSummary: `Manage indirect tax signals for ${signals.country} — not legal advice`,
    });
  }

  manageDirectTaxes(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): TaxIntelligenceRecord {
    const signals = computeStructuralTaxSignals(
      { ...input, taxCategory: "direct" },
      config,
    );
    return buildTaxIntelligenceRecord({
      ...signals,
      recommendationSummary: `Manage direct tax signals for ${signals.country} — not legal advice`,
    });
  }

  manageCrossBorder(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): TaxIntelligenceRecord {
    const signals = computeStructuralTaxSignals(
      { ...input, taxCategory: "cross_border" },
      config,
    );
    return buildTaxIntelligenceRecord({
      ...signals,
      recommendationSummary: `Manage cross-border tax requirements for ${signals.country} — not legal advice`,
    });
  }
}
