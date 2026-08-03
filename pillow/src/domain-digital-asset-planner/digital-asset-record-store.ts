/** X1-06 — In-memory digital asset plan record store. */

import { createHash } from "node:crypto";
import { DAP_METADATA_VERSION } from "./paths.js";
import type { DigitalAssetPlanRecord, ValidationStatus } from "./types.js";

export class DigitalAssetRecordStore {
  private readonly records = new Map<string, DigitalAssetPlanRecord>();
  private readonly planFingerprints = new Set<string>();

  list(): DigitalAssetPlanRecord[] {
    return [...this.records.values()];
  }

  get(planId: string): DigitalAssetPlanRecord | undefined {
    return this.records.get(planId);
  }

  hasPlanFingerprint(fingerprint: string): boolean {
    return this.planFingerprints.has(fingerprint);
  }

  create(input: {
    brandReference: string;
    proposedCompanyDomain: string;
    alternativeDomains: string;
    socialMediaHandlePlan: string;
    emailDomainPlan: string;
    brandAssetStructure: string;
    websiteArchitectureSummary: string;
    digitalIdentityConsistency: string;
    namingConflictSummary: string;
    recommendations: string;
    validationStatus?: ValidationStatus;
  }): DigitalAssetPlanRecord {
    const planFingerprint = createHash("sha256")
      .update(
        `${input.brandReference}|${input.proposedCompanyDomain}|${input.socialMediaHandlePlan}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);

    const record: DigitalAssetPlanRecord = {
      digitalAssetPlanId: `dap-plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      brandReference: input.brandReference,
      proposedCompanyDomain: input.proposedCompanyDomain,
      alternativeDomains: input.alternativeDomains,
      socialMediaHandlePlan: input.socialMediaHandlePlan,
      emailDomainPlan: input.emailDomainPlan,
      brandAssetStructure: input.brandAssetStructure,
      websiteArchitectureSummary: input.websiteArchitectureSummary,
      digitalIdentityConsistency: input.digitalIdentityConsistency,
      namingConflictSummary: input.namingConflictSummary,
      recommendations: input.recommendations,
      planFingerprint,
      structuralSignalOnly: true,
      automaticRegistrationOrPurchase: false,
      fabricatedDigitalAssetFacts: false,
      validationStatus: input.validationStatus ?? "pending",
      metadataVersion: DAP_METADATA_VERSION,
    };
    this.persist(record);
    return record;
  }

  persist(record: DigitalAssetPlanRecord): void {
    this.records.set(record.digitalAssetPlanId, { ...record });
    this.planFingerprints.add(record.planFingerprint);
  }

  resetForTesting(): void {
    this.records.clear();
    this.planFingerprints.clear();
  }
}
