/** R5-09 — Conversion Attribution Engine. */

import { ATT_METADATA_VERSION } from "./paths.js";
import type {
  AttributionModel,
  AttributionRecord,
  MarketingChannel,
  TouchpointRecord,
} from "./types.js";

export class ConversionAttributionEngine {
  private readonly records: AttributionRecord[] = [];

  attribute(input: {
    customerRef: string;
    conversionValue: number;
    model: AttributionModel;
    touchpoints: TouchpointRecord[];
    weights: number[];
    campaignReference?: string | null;
  }): AttributionRecord[] {
    const created: AttributionRecord[] = [];
    const totalWeight = input.weights.reduce((a, b) => a + b, 0) || 1;

    for (let i = 0; i < input.touchpoints.length; i++) {
      const tp = input.touchpoints[i]!;
      const weight = (input.weights[i] ?? 0) / totalWeight;
      const attributionValue = Math.round(input.conversionValue * weight * 100) / 100;
      const record: AttributionRecord = {
        attributionRecordId: `att-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        customerId: tp.customerRef,
        campaignReference: input.campaignReference ?? tp.campaignReference,
        marketingChannel: tp.marketingChannel,
        touchpointSequence: input.touchpoints.map((t) => t.touchpointId),
        attributionModel: input.model,
        attributionValue,
        roiContribution: attributionValue,
        validationStatus: "passed",
        metadataVersion: ATT_METADATA_VERSION,
        conversionValue: input.conversionValue,
        piiRedacted: true,
      };
      this.records.push(record);
      created.push(record);
    }
    return created;
  }

  list(): AttributionRecord[] {
    return [...this.records];
  }

  listForCustomer(customerRef: string): AttributionRecord[] {
    return this.records.filter((r) => r.customerId === customerRef);
  }

  primaryChannel(records: AttributionRecord[]): MarketingChannel {
    if (records.length === 0) return "unknown";
    const top = [...records].sort((a, b) => b.attributionValue - a.attributionValue)[0];
    return top?.marketingChannel ?? "unknown";
  }

  resetForTesting(): void {
    this.records.length = 0;
  }
}
