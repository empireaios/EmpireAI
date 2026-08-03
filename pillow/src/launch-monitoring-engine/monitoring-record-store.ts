/** X1-13 — In-memory launch monitoring record store. */

import { createHash } from "node:crypto";
import { LME_METADATA_VERSION } from "./paths.js";
import type { LaunchMonitoringRecord, ValidationStatus } from "./types.js";

export class MonitoringRecordStore {
  private readonly records = new Map<string, LaunchMonitoringRecord>();
  private readonly fingerprints = new Set<string>();

  list(): LaunchMonitoringRecord[] {
    return [...this.records.values()];
  }

  get(launchMonitoringId: string): LaunchMonitoringRecord | undefined {
    return this.records.get(launchMonitoringId);
  }

  hasFingerprint(fingerprint: string): boolean {
    return this.fingerprints.has(fingerprint);
  }

  create(input: {
    companyReference: string;
    launchReference: string;
    growthPlanReference: string;
    operationalHealthScore: number;
    salesSummary: string;
    customerActivitySummary: string;
    orderActivitySummary: string;
    systemStabilitySummary: string;
    detectedIssues: string;
    anomalySummary: string;
    healthRecommendations: string;
    validationStatus?: ValidationStatus;
  }): LaunchMonitoringRecord {
    const monitoringFingerprint = createHash("sha256")
      .update(
        `${input.companyReference}|${input.launchReference}|${input.growthPlanReference}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);

    const record: LaunchMonitoringRecord = {
      launchMonitoringId: `lme-mon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      companyReference: input.companyReference,
      launchReference: input.launchReference,
      growthPlanReference: input.growthPlanReference,
      operationalHealthScore: input.operationalHealthScore,
      salesSummary: input.salesSummary,
      customerActivitySummary: input.customerActivitySummary,
      orderActivitySummary: input.orderActivitySummary,
      systemStabilitySummary: input.systemStabilitySummary,
      detectedIssues: input.detectedIssues,
      anomalySummary: input.anomalySummary,
      healthRecommendations: input.healthRecommendations,
      monitoringFingerprint,
      structuralSignalOnly: true,
      modifiedProductionOperationsWithoutValidation: false,
      fabricatedMonitoringFacts: false,
      validationStatus: input.validationStatus ?? "pending",
      metadataVersion: LME_METADATA_VERSION,
    };
    this.persist(record);
    return record;
  }

  persist(record: LaunchMonitoringRecord): void {
    this.records.set(record.launchMonitoringId, { ...record });
    this.fingerprints.add(record.monitoringFingerprint);
  }

  resetForTesting(): void {
    this.records.clear();
    this.fingerprints.clear();
  }
}
