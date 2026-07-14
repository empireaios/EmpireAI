/** R1-04 — Amazon order lifecycle engine. */

import { randomUUID } from "node:crypto";
import { appendOrderLog } from "./amzord-logging.js";
import type { AmazonOrderFetcher } from "./amazon-order-fetcher.js";
import type { AmazonOrderStatusMapper } from "./amazon-order-status-mapper.js";
import type { AmazonOrderManagementConfiguration } from "./configuration.js";
import type {
  AmazonOrderChangeSet,
  AmazonOrderLifecycleEvent,
  AmazonOrderRecord,
  SyncAmazonOrdersInput,
} from "./types.js";

export class AmazonOrderLifecycleEngine {
  constructor(
    private readonly fetcher: AmazonOrderFetcher,
    private readonly mapper: AmazonOrderStatusMapper,
  ) {}

  async sync(
    previousOrders: AmazonOrderRecord[],
    config: AmazonOrderManagementConfiguration,
    input: SyncAmazonOrdersInput = {},
    fixtureOptions?: Parameters<AmazonOrderFetcher["fetchAll"]>[2],
  ): Promise<{
    orders: AmazonOrderRecord[];
    changes: AmazonOrderChangeSet;
    events: AmazonOrderLifecycleEvent[];
  }> {
    appendOrderLog({
      event: "order_sync_start",
      level: "info",
      details: "Amazon order lifecycle sync started",
    });

    const raw = await this.fetcher.fetchAll(input, config, fixtureOptions);
    const mapped = this.mapper.mapBatch(raw, config);
    const changes = this.detectChanges(
      input.forceFullSync ? [] : previousOrders,
      mapped,
    );
    const orders = this.mergeOrders(previousOrders, mapped, changes, config);
    const events = this.buildLifecycleEvents(changes);

    appendOrderLog({
      event: "order_sync_complete",
      level: "info",
      details: `Sync: ${changes.newOrders.length} new, ${changes.updatedOrders.length} updated, ${changes.cancelledOrders.length} cancelled`,
    });

    return { orders, changes, events };
  }

  detectChanges(previous: AmazonOrderRecord[], current: AmazonOrderRecord[]): AmazonOrderChangeSet {
    const prevById = new Map(previous.map((o) => [o.amazonOrderId, o]));
    const currById = new Map(current.map((o) => [o.amazonOrderId, o]));

    const newOrders: AmazonOrderRecord[] = [];
    const updatedOrders: AmazonOrderRecord[] = [];
    const cancelledOrders: AmazonOrderRecord[] = [];
    const fulfilledOrders: AmazonOrderRecord[] = [];
    const refundedOrders: AmazonOrderRecord[] = [];
    let unchangedCount = 0;

    for (const order of current) {
      const prev = prevById.get(order.amazonOrderId);
      if (!prev) {
        newOrders.push(order);
      } else if (order.orderStatus === "cancelled" && prev.orderStatus !== "cancelled") {
        cancelledOrders.push(order);
      } else if (
        (order.orderStatus === "fulfilled" || order.fulfilmentStatus === "delivered") &&
        prev.fulfilmentStatus !== "delivered"
      ) {
        fulfilledOrders.push(order);
      } else if (
        (order.refundStatus === "full" || order.refundStatus === "partial") &&
        prev.refundStatus === "none"
      ) {
        refundedOrders.push(order);
      } else if (this.hasChanged(prev, order)) {
        updatedOrders.push(order);
      } else {
        unchangedCount += 1;
      }
    }

    return {
      newOrders,
      updatedOrders,
      cancelledOrders,
      fulfilledOrders,
      refundedOrders,
      unchangedCount,
    };
  }

  private hasChanged(prev: AmazonOrderRecord, curr: AmazonOrderRecord): boolean {
    return (
      prev.orderStatus !== curr.orderStatus ||
      prev.fulfilmentStatus !== curr.fulfilmentStatus ||
      prev.shippingStatus !== curr.shippingStatus ||
      prev.price !== curr.price ||
      prev.quantity !== curr.quantity
    );
  }

  private mergeOrders(
    previous: AmazonOrderRecord[],
    current: AmazonOrderRecord[],
    changes: AmazonOrderChangeSet,
    config: AmazonOrderManagementConfiguration,
  ): AmazonOrderRecord[] {
    void previous;
    const byId = new Map<string, AmazonOrderRecord>();
    for (const o of current) {
      byId.set(o.amazonOrderId, o);
    }
    for (const o of changes.cancelledOrders) {
      if (config.allowOrderModification) byId.set(o.amazonOrderId, o);
      else byId.set(o.amazonOrderId, o);
    }
    return [...byId.values()];
  }

  private buildLifecycleEvents(changes: AmazonOrderChangeSet): AmazonOrderLifecycleEvent[] {
    const events: AmazonOrderLifecycleEvent[] = [];
    const add = (orders: AmazonOrderRecord[], type: AmazonOrderLifecycleEvent["eventType"]) => {
      for (const o of orders) {
        events.push({
          eventId: `amzord-evt-${randomUUID()}`,
          eventType: type,
          amazonOrderId: o.amazonOrderId,
          timestamp: new Date().toISOString(),
          details: `Lifecycle event: ${type} for ${o.amazonOrderId}`,
        });
      }
    };
    add(changes.newOrders, "order_created");
    add(changes.updatedOrders, "order_updated");
    add(changes.cancelledOrders, "order_cancelled");
    add(changes.fulfilledOrders, "order_fulfilled");
    add(changes.refundedOrders, "order_refunded");
    return events;
  }
}
