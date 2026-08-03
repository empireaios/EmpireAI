/** X1-09 — In-memory pricing record store. */

import { createHash } from "node:crypto";
import { PSE_METADATA_VERSION } from "./paths.js";
import type { PricingModel, PricingRecord, ValidationStatus } from "./types.js";

export class PricingRecordStore {
  private readonly records = new Map<string, PricingRecord>();
  private readonly fingerprints = new Set<string>();

  list(): PricingRecord[] {
    return [...this.records.values()];
  }

  get(pricingRecordId: string): PricingRecord | undefined {
    return this.records.get(pricingRecordId);
  }

  hasFingerprint(fingerprint: string): boolean {
    return this.fingerprints.has(fingerprint);
  }

  create(input: {
    companyReference: string;
    productReference: string;
    pricingModel: PricingModel;
    recommendedSellingPrice: number;
    estimatedProfitMargin: number;
    competitiveScore: number;
    willingnessToPayScore: number;
    pricingConflictsSummary: string;
    unprofitableFlags: string;
    recommendations: string;
    analyticsSummary: string;
    validationStatus?: ValidationStatus;
  }): PricingRecord {
    const pricingFingerprint = createHash("sha256")
      .update(
        `${input.companyReference}|${input.productReference}|${input.pricingModel}|${input.recommendedSellingPrice}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);

    const record: PricingRecord = {
      pricingRecordId: `pse-prc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      companyReference: input.companyReference,
      productReference: input.productReference,
      pricingModel: input.pricingModel,
      recommendedSellingPrice: input.recommendedSellingPrice,
      estimatedProfitMargin: input.estimatedProfitMargin,
      competitiveScore: input.competitiveScore,
      willingnessToPayScore: input.willingnessToPayScore,
      pricingConflictsSummary: input.pricingConflictsSummary,
      unprofitableFlags: input.unprofitableFlags,
      recommendations: input.recommendations,
      analyticsSummary: input.analyticsSummary,
      pricingFingerprint,
      structuralSignalOnly: true,
      automaticPublication: false,
      fabricatedPricingFacts: false,
      validationStatus: input.validationStatus ?? "pending",
      metadataVersion: PSE_METADATA_VERSION,
    };
    this.persist(record);
    return record;
  }

  persist(record: PricingRecord): void {
    this.records.set(record.pricingRecordId, { ...record });
    this.fingerprints.add(record.pricingFingerprint);
  }

  resetForTesting(): void {
    this.records.clear();
    this.fingerprints.clear();
  }
}
