/** X1-10 — In-memory launch readiness record store. */

import { createHash } from "node:crypto";
import { LRV_METADATA_VERSION } from "./paths.js";
import type { LaunchReadinessRecord, ValidationStatus } from "./types.js";

export class LaunchReadinessRecordStore {
  private readonly records = new Map<string, LaunchReadinessRecord>();
  private readonly fingerprints = new Set<string>();

  list(): LaunchReadinessRecord[] {
    return [...this.records.values()];
  }

  get(launchReadinessId: string): LaunchReadinessRecord | undefined {
    return this.records.get(launchReadinessId);
  }

  hasFingerprint(fingerprint: string): boolean {
    return this.fingerprints.has(fingerprint);
  }

  create(input: {
    companyReference: string;
    businessModelReference: string;
    brandReference: string;
    digitalAssetPlanReference: string;
    storefrontReference: string;
    productPortfolioReference: string;
    pricingReference: string;
    readinessScore: number;
    readinessBreakdown: string;
    launchBlockers: string;
    launchRecommendation: string;
    launchCertified: boolean;
    validationStatus?: ValidationStatus;
  }): LaunchReadinessRecord {
    const readinessFingerprint = createHash("sha256")
      .update(
        `${input.companyReference}|${input.businessModelReference}|${input.storefrontReference}|${input.productPortfolioReference}|${input.pricingReference}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);

    const record: LaunchReadinessRecord = {
      launchReadinessId: `lrv-lrd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      companyReference: input.companyReference,
      businessModelReference: input.businessModelReference,
      brandReference: input.brandReference,
      digitalAssetPlanReference: input.digitalAssetPlanReference,
      storefrontReference: input.storefrontReference,
      productPortfolioReference: input.productPortfolioReference,
      pricingReference: input.pricingReference,
      readinessScore: input.readinessScore,
      readinessBreakdown: input.readinessBreakdown,
      launchBlockers: input.launchBlockers,
      launchRecommendation: input.launchRecommendation,
      launchCertified: input.launchCertified,
      readinessFingerprint,
      structuralSignalOnly: true,
      fabricatedLaunchFacts: false,
      validationStatus: input.validationStatus ?? "pending",
      metadataVersion: LRV_METADATA_VERSION,
    };
    this.persist(record);
    return record;
  }

  persist(record: LaunchReadinessRecord): void {
    this.records.set(record.launchReadinessId, { ...record });
    this.fingerprints.add(record.readinessFingerprint);
  }

  resetForTesting(): void {
    this.records.clear();
    this.fingerprints.clear();
  }
}
