/** X1-05 — Persistent in-memory brand record store. */

import { createHash } from "node:crypto";
import { BCE_METADATA_VERSION } from "./paths.js";
import type { BrandRecord, ValidationStatus } from "./types.js";

export class BrandRecordStore {
  private readonly records = new Map<string, BrandRecord>();
  private readonly identityFingerprints = new Set<string>();

  list(): BrandRecord[] {
    return [...this.records.values()];
  }

  get(brandId: string): BrandRecord | undefined {
    return this.records.get(brandId);
  }

  hasIdentityFingerprint(fingerprint: string): boolean {
    return this.identityFingerprints.has(fingerprint);
  }

  create(input: {
    businessModelReference: string;
    companyName: string;
    brandIdentity: string;
    brandPositioning: string;
    brandMessaging: string;
    brandValues: string;
    brandVoice: string;
    colourRecommendations: string;
    typographyRecommendations: string;
    brandGuidelineReference: string;
    validationStatus?: ValidationStatus;
  }): BrandRecord {
    const identityFingerprint = createHash("sha256")
      .update(
        `${input.companyName}|${input.brandIdentity}|${input.brandPositioning}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);

    const record: BrandRecord = {
      brandId: `bce-brd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      businessModelReference: input.businessModelReference,
      companyName: input.companyName,
      brandIdentity: input.brandIdentity,
      brandPositioning: input.brandPositioning,
      brandMessaging: input.brandMessaging,
      brandValues: input.brandValues,
      brandVoice: input.brandVoice,
      colourRecommendations: input.colourRecommendations,
      typographyRecommendations: input.typographyRecommendations,
      brandGuidelineReference: input.brandGuidelineReference,
      identityFingerprint,
      structuralSignalOnly: true,
      fabricatedBrandFacts: false,
      validationStatus: input.validationStatus ?? "pending",
      metadataVersion: BCE_METADATA_VERSION,
    };
    this.persist(record);
    return record;
  }

  persist(record: BrandRecord): void {
    this.records.set(record.brandId, { ...record });
    this.identityFingerprints.add(record.identityFingerprint);
  }

  resetForTesting(): void {
    this.records.clear();
    this.identityFingerprints.clear();
  }
}
