/** X1-11 — In-memory business launch record store. */

import { createHash } from "node:crypto";
import { BLO_METADATA_VERSION } from "./paths.js";
import type {
  BusinessLaunchRecord,
  LaunchStage,
  LaunchStatus,
  RecoveryStatus,
  ValidationStatus,
} from "./types.js";

export class LaunchRecordStore {
  private readonly records = new Map<string, BusinessLaunchRecord>();
  private readonly fingerprints = new Set<string>();

  list(): BusinessLaunchRecord[] {
    return [...this.records.values()];
  }

  get(launchId: string): BusinessLaunchRecord | undefined {
    return this.records.get(launchId);
  }

  hasFingerprint(fingerprint: string): boolean {
    return this.fingerprints.has(fingerprint);
  }

  create(input: {
    companyReference: string;
    launchWorkflowReference: string;
    readinessReference: string;
    brandReference: string;
    digitalAssetPlanReference: string;
    storefrontReference: string;
    pricingReference: string;
    currentLaunchStage: LaunchStage;
    launchProgress: number;
    launchStatus: LaunchStatus;
    recoveryStatus: RecoveryStatus;
    dependencySummary: string;
    launchReportSummary: string;
    validationStatus?: ValidationStatus;
  }): BusinessLaunchRecord {
    const launchFingerprint = createHash("sha256")
      .update(
        `${input.companyReference}|${input.readinessReference}|${input.storefrontReference}|${input.pricingReference}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);

    const record: BusinessLaunchRecord = {
      launchId: `blo-lnc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      companyReference: input.companyReference,
      launchWorkflowReference: input.launchWorkflowReference,
      readinessReference: input.readinessReference,
      brandReference: input.brandReference,
      digitalAssetPlanReference: input.digitalAssetPlanReference,
      storefrontReference: input.storefrontReference,
      pricingReference: input.pricingReference,
      currentLaunchStage: input.currentLaunchStage,
      launchProgress: input.launchProgress,
      launchStatus: input.launchStatus,
      recoveryStatus: input.recoveryStatus,
      dependencySummary: input.dependencySummary,
      launchReportSummary: input.launchReportSummary,
      launchFingerprint,
      structuralSignalOnly: true,
      launchedWithoutReadinessValidation: false,
      fabricatedLaunchFacts: false,
      validationStatus: input.validationStatus ?? "pending",
      metadataVersion: BLO_METADATA_VERSION,
    };
    this.persist(record);
    return record;
  }

  persist(record: BusinessLaunchRecord): void {
    this.records.set(record.launchId, { ...record });
    this.fingerprints.add(record.launchFingerprint);
  }

  resetForTesting(): void {
    this.records.clear();
    this.fingerprints.clear();
  }
}
