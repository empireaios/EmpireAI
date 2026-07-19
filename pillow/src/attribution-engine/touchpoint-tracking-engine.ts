/** R5-09 — Touchpoint Tracking Engine. */

import type { MarketingChannel, TouchpointRecord } from "./types.js";

function redactCustomerRef(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "cust-ref-unknown";
  if (trimmed.startsWith("cust-ref-")) return trimmed;
  const hash = Buffer.from(trimmed).toString("base64url").slice(0, 12);
  return `cust-ref-${hash}`;
}

export class TouchpointTrackingEngine {
  private readonly byCustomer = new Map<string, TouchpointRecord[]>();

  track(input: {
    customerRef: string;
    marketingChannel: MarketingChannel;
    campaignReference?: string;
    advertisementReference?: string;
    sourceLabel?: string;
    timestamp?: string;
  }): TouchpointRecord {
    const customerRef = redactCustomerRef(input.customerRef);
    const existing = this.byCustomer.get(customerRef) ?? [];
    const record: TouchpointRecord = {
      touchpointId: `att-tp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: input.timestamp ?? new Date().toISOString(),
      customerRef,
      marketingChannel: input.marketingChannel,
      campaignReference: input.campaignReference ?? null,
      advertisementReference: input.advertisementReference ?? null,
      sequenceIndex: existing.length,
      sourceLabel: input.sourceLabel?.trim() || input.marketingChannel,
      piiRedacted: true,
    };
    existing.push(record);
    this.byCustomer.set(customerRef, existing);
    return record;
  }

  listForCustomer(customerRef: string): TouchpointRecord[] {
    return [...(this.byCustomer.get(redactCustomerRef(customerRef)) ?? [])];
  }

  listAll(): TouchpointRecord[] {
    return [...this.byCustomer.values()].flat();
  }

  count(): number {
    return this.listAll().length;
  }

  resetForTesting(): void {
    this.byCustomer.clear();
  }
}
