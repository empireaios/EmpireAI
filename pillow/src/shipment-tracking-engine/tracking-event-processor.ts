/** R2-12 — Tracking Event Processor. */

import type { ReceiveTrackingWebhookInput, TrackingEvent } from "./types.js";

export class TrackingEventProcessor {
  private processedEventIds = new Set<string>();

  processWebhook(input: ReceiveTrackingWebhookInput): TrackingEvent | null {
    const eventId = `ste-event-${input.shipmentId}-${input.eventType}-${Date.now()}`;
    if (this.processedEventIds.has(`${input.shipmentId}:${input.eventType}:${input.trackingNumber}`)) {
      return null;
    }
    this.processedEventIds.add(`${input.shipmentId}:${input.eventType}:${input.trackingNumber}`);

    return {
      eventId,
      shipmentId: input.shipmentId,
      trackingNumber: input.trackingNumber,
      eventType: input.eventType,
      location: input.location ?? null,
      occurredAt: new Date().toISOString(),
      source: "webhook",
    };
  }

  processApiEvent(input: {
    shipmentId: string;
    trackingNumber: string;
    eventType: import("./types.js").TrackingStatus;
    location: string | null;
  }): TrackingEvent {
    return {
      eventId: `ste-event-${input.shipmentId}-api-${Date.now()}`,
      shipmentId: input.shipmentId,
      trackingNumber: input.trackingNumber,
      eventType: input.eventType,
      location: input.location,
      occurredAt: new Date().toISOString(),
      source: "api",
    };
  }

  resetForTesting(): void {
    this.processedEventIds.clear();
  }
}
