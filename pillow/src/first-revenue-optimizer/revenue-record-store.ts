/** X1-14 — In-memory revenue optimization record store. */

import { createHash } from "node:crypto";
import { FRO_METADATA_VERSION } from "./paths.js";
import type { RevenueOptimizationRecord, ValidationStatus } from "./types.js";

export class RevenueRecordStore {
  private readonly records = new Map<string, RevenueOptimizationRecord>();
  private readonly fingerprints = new Set<string>();

  list(): RevenueOptimizationRecord[] {
    return [...this.records.values()];
  }

  get(revenueOptimizationId: string): RevenueOptimizationRecord | undefined {
    return this.records.get(revenueOptimizationId);
  }

  hasFingerprint(fingerprint: string): boolean {
    return this.fingerprints.has(fingerprint);
  }

  create(input: {
    companyReference: string;
    productReference: string;
    pricingReference: string;
    growthPlanReference: string;
    monitoringReference: string;
    revenueSummary: string;
    productPerformanceScore: number;
    customerPurchaseSummary: string;
    bottleneckSummary: string;
    underperformingProductsSummary: string;
    productPriorityOptimization: string;
    pricingOptimizationRecommendation: string;
    optimizationRecommendation: string;
    expectedRevenueImprovement: string;
    validationStatus?: ValidationStatus;
  }): RevenueOptimizationRecord {
    const optimizationFingerprint = createHash("sha256")
      .update(
        `${input.companyReference}|${input.productReference}|${input.pricingReference}|${input.monitoringReference}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);

    const record: RevenueOptimizationRecord = {
      revenueOptimizationId: `fro-rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      companyReference: input.companyReference,
      productReference: input.productReference,
      pricingReference: input.pricingReference,
      growthPlanReference: input.growthPlanReference,
      monitoringReference: input.monitoringReference,
      revenueSummary: input.revenueSummary,
      productPerformanceScore: input.productPerformanceScore,
      customerPurchaseSummary: input.customerPurchaseSummary,
      bottleneckSummary: input.bottleneckSummary,
      underperformingProductsSummary: input.underperformingProductsSummary,
      productPriorityOptimization: input.productPriorityOptimization,
      pricingOptimizationRecommendation: input.pricingOptimizationRecommendation,
      optimizationRecommendation: input.optimizationRecommendation,
      expectedRevenueImprovement: input.expectedRevenueImprovement,
      optimizationFingerprint,
      structuralSignalOnly: true,
      modifiedProductionPricingWithoutValidation: false,
      fabricatedRevenueFacts: false,
      validationStatus: input.validationStatus ?? "pending",
      metadataVersion: FRO_METADATA_VERSION,
    };
    this.persist(record);
    return record;
  }

  persist(record: RevenueOptimizationRecord): void {
    this.records.set(record.revenueOptimizationId, { ...record });
    this.fingerprints.add(record.optimizationFingerprint);
  }

  resetForTesting(): void {
    this.records.clear();
    this.fingerprints.clear();
  }
}
