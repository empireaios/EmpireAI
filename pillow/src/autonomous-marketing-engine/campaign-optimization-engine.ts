/** R5-19 — Campaign Optimization Engine (record store + performance monitoring). */

import { AME_METADATA_VERSION } from "./paths.js";
import type {
  AutonomousMarketingRecord,
  ExecutionStatus,
  OptimizationCategory,
} from "./types.js";

export class CampaignOptimizationEngine {
  private readonly records = new Map<string, AutonomousMarketingRecord>();

  create(input: {
    campaignReference: string | null;
    optimizationCategory: OptimizationCategory;
    triggerEvent: string;
    recommendedAction: string;
    executedAction?: string | null;
    executionStatus?: ExecutionStatus;
    approvalGranted?: boolean;
    confidenceScore: number;
  }): AutonomousMarketingRecord {
    const record: AutonomousMarketingRecord = {
      autonomousMarketingId: `ame-opt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      campaignReference: input.campaignReference,
      optimizationCategory: input.optimizationCategory,
      triggerEvent: input.triggerEvent,
      recommendedAction: input.recommendedAction,
      executedAction: input.executedAction ?? null,
      executionStatus: input.executionStatus ?? "recommended",
      highImpactExecuted: false,
      approvalGranted: input.approvalGranted ?? false,
      confidenceScore: input.confidenceScore,
      validationStatus: "pending",
      metadataVersion: AME_METADATA_VERSION,
    };
    this.records.set(record.autonomousMarketingId, record);
    return { ...record };
  }

  persist(record: AutonomousMarketingRecord): AutonomousMarketingRecord {
    const next = { ...record, highImpactExecuted: false as const };
    this.records.set(next.autonomousMarketingId, next);
    return { ...next };
  }

  get(id: string): AutonomousMarketingRecord | null {
    const found = this.records.get(id);
    return found ? { ...found } : null;
  }

  list(): AutonomousMarketingRecord[] {
    return [...this.records.values()].map((r) => ({ ...r }));
  }

  pendingApprovals(): number {
    return [...this.records.values()].filter(
      (r) => r.executionStatus === "recommended" || r.executionStatus === "blocked",
    ).length;
  }

  resetForTesting(): void {
    this.records.clear();
  }
}
