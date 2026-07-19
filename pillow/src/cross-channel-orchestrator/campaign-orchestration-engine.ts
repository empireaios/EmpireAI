/** R5-18 — Campaign Orchestration Engine. */

import { CCO_METADATA_VERSION } from "./paths.js";
import type { MarketingChannel, OrchestrationRecord, SyncStatus } from "./types.js";

export class CampaignOrchestrationEngine {
  private readonly records = new Map<string, OrchestrationRecord>();

  create(input: {
    campaignReference: string | null;
    marketingChannels: MarketingChannel[];
    campaignSchedule: string;
    synchronizationStatus: SyncStatus;
    journeyCoordinationStatus: SyncStatus;
    conflictStatus: OrchestrationRecord["conflictStatus"];
    conflictSummary: string;
    recommendationSummary: string;
  }): OrchestrationRecord {
    const record: OrchestrationRecord = {
      orchestrationId: `cco-orc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      campaignReference: input.campaignReference,
      marketingChannels: [...input.marketingChannels],
      campaignSchedule: input.campaignSchedule,
      synchronizationStatus: input.synchronizationStatus,
      journeyCoordinationStatus: input.journeyCoordinationStatus,
      conflictStatus: input.conflictStatus,
      conflictSummary: input.conflictSummary,
      recommendationSummary: input.recommendationSummary,
      launchedToProduction: false,
      validationStatus: "passed",
      metadataVersion: CCO_METADATA_VERSION,
    };
    this.records.set(record.orchestrationId, record);
    return {
      ...record,
      marketingChannels: [...record.marketingChannels],
    };
  }

  get(id: string): OrchestrationRecord | null {
    const record = this.records.get(id);
    return record
      ? { ...record, marketingChannels: [...record.marketingChannels] }
      : null;
  }

  persist(record: OrchestrationRecord): void {
    this.records.set(record.orchestrationId, {
      ...record,
      marketingChannels: [...record.marketingChannels],
      timestamp: new Date().toISOString(),
    });
  }

  list(): OrchestrationRecord[] {
    return [...this.records.values()].map((r) => ({
      ...r,
      marketingChannels: [...r.marketingChannels],
    }));
  }

  resetForTesting(): void {
    this.records.clear();
  }
}
