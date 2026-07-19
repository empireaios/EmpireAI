/** R3-11 — Tax calculation engine. */

import { appendTxLog } from "./tx-logging.js";
import type { TaxIntelligenceEngineConfiguration } from "./configuration.js";
import type { TaxRulesEngine } from "./tax-rules-engine.js";
import type { TaxClassificationEngine } from "./tax-classification-engine.js";
import type { TaxDataSource } from "./tax-data-source.js";
import type { TaxRegistry } from "./tax-registry.js";
import type { TaxMetadataGenerator } from "./tax-metadata-generator.js";
import type { TaxCategory, TaxRecord } from "./types.js";

export class TaxCalculationEngine {
  constructor(
    private readonly rulesEngine: TaxRulesEngine,
    private readonly classificationEngine: TaxClassificationEngine,
    private readonly dataSource: TaxDataSource,
    private readonly registry: TaxRegistry,
    private readonly metadataGenerator: TaxMetadataGenerator,
  ) {}

  calculateLiability(
    input: {
      revenueReference?: string;
      expenseReference?: string;
      invoiceReference?: string;
      taxableAmount: number;
      taxJurisdiction?: string;
      taxCategory?: TaxCategory;
    },
    config: TaxIntelligenceEngineConfiguration,
    dedupeKey: string,
  ): { record: TaxRecord | null; error: string | null; warnings: string[] } {
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate tax calculation", warnings: [] };
    }

    const jurisdiction = input.taxJurisdiction ?? config.defaultJurisdiction;
    const jurisdictionCheck = this.rulesEngine.validateJurisdiction(jurisdiction, config);
    if (!jurisdictionCheck.valid) {
      return { record: null, error: jurisdictionCheck.errors.join("; "), warnings: [] };
    }

    let category = input.taxCategory;
    let warnings: string[] = [];

    if (!category) {
      const classified = this.classificationEngine.classify(
        {
          revenueReference: input.revenueReference,
          expenseReference: input.expenseReference,
          invoiceReference: input.invoiceReference,
          taxJurisdiction: jurisdiction,
        },
        config,
        this.dataSource,
      );
      if (classified.errors.length > 0) {
        return { record: null, error: classified.errors.join("; "), warnings: classified.warnings };
      }
      category = classified.category;
      warnings = classified.warnings;
    }

    if (!config.taxCalculationRulesEnabled) {
      warnings.push("Tax calculation rules disabled");
    }

    const { rate, warnings: rateWarnings } = this.rulesEngine.resolveRate(
      jurisdiction,
      category!,
      config,
    );
    warnings.push(...rateWarnings);

    const taxAmount = Math.round(input.taxableAmount * rate * 100) / 100;
    const record = this.metadataGenerator.buildTaxRecord({
      revenueReference: input.revenueReference ?? null,
      expenseReference: input.expenseReference ?? null,
      invoiceReference: input.invoiceReference ?? null,
      refundReference: null,
      taxJurisdiction: jurisdiction,
      taxCategory: category!,
      taxRate: rate,
      taxAmount,
      taxStatus: "calculated",
      validationStatus: "passed",
    });

    this.registry.store(record, dedupeKey);
    appendTxLog({
      event: "tax_calculation",
      level: "info",
      details: `Liability ${record.taxRecordId} amount=${taxAmount} jurisdiction=${jurisdiction}`,
    });

    return { record, error: null, warnings };
  }

  calculateAdjustment(
    input: { refundReference: string; taxJurisdiction?: string },
    config: TaxIntelligenceEngineConfiguration,
    dedupeKey: string,
  ): { record: TaxRecord | null; error: string | null; warnings: string[] } {
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate tax adjustment", warnings: [] };
    }

    const classified = this.classificationEngine.classify(
      {
        refundReference: input.refundReference,
        taxJurisdiction: input.taxJurisdiction,
      },
      config,
      this.dataSource,
    );

    if (classified.errors.length > 0) {
      return { record: null, error: classified.errors.join("; "), warnings: classified.warnings };
    }

    const { rate, warnings: rateWarnings } = this.rulesEngine.resolveRate(
      classified.jurisdiction,
      "refund_adjustment",
      config,
    );

    const baseAmount = Math.abs(classified.taxableAmount);
    const taxAmount = Math.round(baseAmount * rate * 100) / 100;
    const record = this.metadataGenerator.buildTaxRecord({
      revenueReference: classified.revenueReference,
      expenseReference: classified.expenseReference,
      invoiceReference: classified.invoiceReference,
      refundReference: input.refundReference,
      taxJurisdiction: classified.jurisdiction,
      taxCategory: "refund_adjustment",
      taxRate: rate,
      taxAmount,
      taxStatus: "adjusted",
      validationStatus: "passed",
    });

    this.registry.store(record, dedupeKey);
    appendTxLog({
      event: "tax_adjustment",
      level: "info",
      details: `Adjustment ${record.taxRecordId} amount=${taxAmount} refund=${input.refundReference}`,
    });

    return { record, error: null, warnings: [...classified.warnings, ...rateWarnings] };
  }

  recordPayment(
    input: { taxRecordId: string; paymentAmount: number },
    registry: TaxRegistry,
  ): { record: TaxRecord | null; error: string | null; warnings: string[] } {
    const existing = registry.get(input.taxRecordId);
    if (!existing) {
      return { record: null, error: `Tax record not found: ${input.taxRecordId}`, warnings: [] };
    }

    if (input.paymentAmount <= 0) {
      return { record: null, error: "Payment amount must be positive", warnings: [] };
    }

    const updated: TaxRecord = {
      ...existing,
      taxStatus: "paid",
      timestamp: new Date().toISOString(),
    };
    registry.update(updated);

    appendTxLog({
      event: "tax_payment",
      level: "info",
      details: `Tax payment recorded for ${input.taxRecordId} amount=${input.paymentAmount}`,
    });

    return { record: updated, error: null, warnings: [] };
  }
}
