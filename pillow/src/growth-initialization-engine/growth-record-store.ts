/** X1-12 — In-memory growth plan record store. */

import { createHash } from "node:crypto";
import { GIE_METADATA_VERSION } from "./paths.js";
import type { GrowthPlanRecord, ValidationStatus } from "./types.js";

export class GrowthRecordStore {
  private readonly records = new Map<string, GrowthPlanRecord>();
  private readonly fingerprints = new Set<string>();

  list(): GrowthPlanRecord[] {
    return [...this.records.values()];
  }

  get(growthPlanId: string): GrowthPlanRecord | undefined {
    return this.records.get(growthPlanId);
  }

  hasFingerprint(fingerprint: string): boolean {
    return this.fingerprints.has(fingerprint);
  }

  create(input: {
    companyReference: string;
    launchReference: string;
    portfolioReference: string;
    pricingReference: string;
    growthObjectives: string;
    revenueMilestones: string;
    customerAcquisitionPlan: string;
    launchMarketingRecommendations: string;
    salesTargets: string;
    operationalPriorities: string;
    performanceBaselines: string;
    earlyPerformanceSummary: string;
    immediateOptimizations: string;
    growthScore: number;
    validationStatus?: ValidationStatus;
  }): GrowthPlanRecord {
    const growthFingerprint = createHash("sha256")
      .update(
        `${input.companyReference}|${input.launchReference}|${input.portfolioReference}|${input.pricingReference}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);

    const record: GrowthPlanRecord = {
      growthPlanId: `gie-pln-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      companyReference: input.companyReference,
      launchReference: input.launchReference,
      portfolioReference: input.portfolioReference,
      pricingReference: input.pricingReference,
      growthObjectives: input.growthObjectives,
      revenueMilestones: input.revenueMilestones,
      customerAcquisitionPlan: input.customerAcquisitionPlan,
      launchMarketingRecommendations: input.launchMarketingRecommendations,
      salesTargets: input.salesTargets,
      operationalPriorities: input.operationalPriorities,
      performanceBaselines: input.performanceBaselines,
      earlyPerformanceSummary: input.earlyPerformanceSummary,
      immediateOptimizations: input.immediateOptimizations,
      growthScore: input.growthScore,
      growthFingerprint,
      structuralSignalOnly: true,
      modifiedOperationalConfigWithoutValidation: false,
      fabricatedGrowthFacts: false,
      validationStatus: input.validationStatus ?? "pending",
      metadataVersion: GIE_METADATA_VERSION,
    };
    this.persist(record);
    return record;
  }

  persist(record: GrowthPlanRecord): void {
    this.records.set(record.growthPlanId, { ...record });
    this.fingerprints.add(record.growthFingerprint);
  }

  resetForTesting(): void {
    this.records.clear();
    this.fingerprints.clear();
  }
}
