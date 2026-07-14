/** R1-04 — Amazon order event processor. */

import { randomUUID } from "node:crypto";
import { appendOrderLog } from "./amzord-logging.js";
import type { AmazonOrderManagementConfiguration } from "./configuration.js";
import type {
  AmazonOrderLifecycleEvent,
  AmazonOrderRecord,
  ProcessAmazonOrderEventInput,
} from "./types.js";

export class AmazonOrderEventProcessor {
  private processedEventIds = new Set<string>();

  process(
    input: ProcessAmazonOrderEventInput,
    orders: AmazonOrderRecord[],
    config: AmazonOrderManagementConfiguration,
  ): {
    events: AmazonOrderLifecycleEvent[];
    orders: AmazonOrderRecord[];
    duplicate: boolean;
  } {
    const eventKey = `${input.eventType}:${input.amazonOrderId}:${input.payloadRef}`;
    if (this.processedEventIds.has(eventKey)) {
      appendOrderLog({
        event: "duplicate_event",
        level: "warn",
        details: `Duplicate order event ignored: ${input.amazonOrderId}`,
      });
      return { events: [], orders, duplicate: true };
    }
    this.processedEventIds.add(eventKey);

    if (!config.allowOrderModification) {
      appendOrderLog({
        event: "order_event_received",
        level: "info",
        details: `Event ${input.eventType} recorded (no modification — workflow required)`,
      });
      const event: AmazonOrderLifecycleEvent = {
        eventId: `amzord-evt-${randomUUID()}`,
        eventType: input.eventType,
        amazonOrderId: input.amazonOrderId,
        timestamp: new Date().toISOString(),
        details: `Event accepted without order modification (payload: ${input.payloadRef})`,
      };
      return { events: [event], orders, duplicate: false };
    }

    const updated = orders.map((o) => {
      if (o.amazonOrderId !== input.amazonOrderId) return o;
      return this.applyEvent(o, input.eventType);
    });

    const event: AmazonOrderLifecycleEvent = {
      eventId: `amzord-evt-${randomUUID()}`,
      eventType: input.eventType,
      amazonOrderId: input.amazonOrderId,
      timestamp: new Date().toISOString(),
      details: `Event processed (payload: ${input.payloadRef})`,
    };

    return { events: [event], orders: updated, duplicate: false };
  }

  private applyEvent(
    order: AmazonOrderRecord,
    eventType: ProcessAmazonOrderEventInput["eventType"],
  ): AmazonOrderRecord {
    switch (eventType) {
      case "order_cancelled":
        return {
          ...order,
          orderStatus: "cancelled",
          cancellationStatus: "confirmed",
          lastSyncedAt: new Date().toISOString(),
        };
      case "order_fulfilled":
        return {
          ...order,
          orderStatus: "fulfilled",
          fulfilmentStatus: "delivered",
          lastSyncedAt: new Date().toISOString(),
        };
      case "order_refunded":
        return {
          ...order,
          orderStatus: "refunded",
          refundStatus: "full",
          lastSyncedAt: new Date().toISOString(),
        };
      case "order_shipped":
        return {
          ...order,
          orderStatus: "shipped",
          fulfilmentStatus: "shipped",
          shippingStatus: "in_transit",
          lastSyncedAt: new Date().toISOString(),
        };
      default:
        return { ...order, lastSyncedAt: new Date().toISOString() };
    }
  }

  resetForTesting(): void {
    this.processedEventIds.clear();
  }
}
