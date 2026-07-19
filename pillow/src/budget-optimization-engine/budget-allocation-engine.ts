/** R5-13 — Budget Allocation Engine. */

import { BOE_METADATA_VERSION } from "./paths.js";
import type { BudgetRecord, MarketingChannel } from "./types.js";

export class BudgetAllocationEngine {
  private readonly budgets = new Map<string, BudgetRecord>();

  allocate(input: {
    campaignReference: string | null;
    marketingChannel: MarketingChannel;
    allocatedBudget: number;
    currentSpend: number;
    efficiencyScore: number;
    overspendDetected: boolean;
    inefficiencyDetected: boolean;
    optimizationRecommendation: string;
  }): BudgetRecord {
    const remaining = Math.max(0, input.allocatedBudget - input.currentSpend);
    const utilization =
      input.allocatedBudget <= 0
        ? 0
        : Math.round((input.currentSpend / input.allocatedBudget) * 10000) / 100;

    const record: BudgetRecord = {
      budgetRecordId: `boe-bud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      campaignReference: input.campaignReference,
      marketingChannel: input.marketingChannel,
      allocatedBudget: Math.round(input.allocatedBudget * 100) / 100,
      currentSpend: Math.round(input.currentSpend * 100) / 100,
      remainingBudget: Math.round(remaining * 100) / 100,
      budgetUtilization: utilization,
      efficiencyScore: input.efficiencyScore,
      overspendDetected: input.overspendDetected,
      inefficiencyDetected: input.inefficiencyDetected,
      optimizationRecommendation: input.optimizationRecommendation,
      appliedToActiveCampaign: false,
      validationStatus: "passed",
      metadataVersion: BOE_METADATA_VERSION,
    };
    this.budgets.set(record.budgetRecordId, record);
    return { ...record };
  }

  get(id: string): BudgetRecord | null {
    const record = this.budgets.get(id);
    return record ? { ...record } : null;
  }

  persist(record: BudgetRecord): void {
    this.budgets.set(record.budgetRecordId, {
      ...record,
      timestamp: new Date().toISOString(),
    });
  }

  list(): BudgetRecord[] {
    return [...this.budgets.values()].map((r) => ({ ...r }));
  }

  reallocateAcrossChannels(input: {
    campaignReference: string | null;
    totalBudget: number;
    channels: MarketingChannel[];
    spendByChannel: Record<string, number>;
    efficiencyByChannel: Record<string, number>;
  }): BudgetRecord[] {
    const channels = input.channels.filter((c) => c !== "cross_channel");
    if (channels.length === 0) return [];

    const weights = channels.map((channel) => {
      const efficiency = input.efficiencyByChannel[channel] ?? 50;
      return Math.max(10, efficiency);
    });
    const weightSum = weights.reduce((a, b) => a + b, 0);

    const created: BudgetRecord[] = [];
    channels.forEach((channel, index) => {
      const allocated = (input.totalBudget * (weights[index]! / weightSum));
      const spend = input.spendByChannel[channel] ?? allocated * 0.35;
      created.push(
        this.allocate({
          campaignReference: input.campaignReference,
          marketingChannel: channel,
          allocatedBudget: allocated,
          currentSpend: spend,
          efficiencyScore: input.efficiencyByChannel[channel] ?? 50,
          overspendDetected: spend > allocated,
          inefficiencyDetected: (input.efficiencyByChannel[channel] ?? 50) < 40,
          optimizationRecommendation: `Reallocated share based on efficiency for ${channel}`,
        }),
      );
    });
    return created;
  }

  resetForTesting(): void {
    this.budgets.clear();
  }
}
