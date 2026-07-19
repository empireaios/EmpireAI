/** R4-03 — Timeline aggregation engine. */

import type { TimelineRecord } from "./types.js";
import type { TimelineRegistry } from "./timeline-registry.js";

export class TimelineAggregationEngine {
  aggregateByCustomer(registry: TimelineRegistry, customerId: string): TimelineRecord[] {
    return registry.listByCustomer(customerId);
  }

  aggregateChronological(registry: TimelineRegistry): TimelineRecord[] {
    return registry.list().sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  countByEventType(registry: TimelineRegistry): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const record of registry.list()) {
      counts[record.eventType] = (counts[record.eventType] ?? 0) + 1;
    }
    return counts;
  }

  toMachineReadable(record: TimelineRecord): Record<string, unknown> {
    return {
      timelineRecordId: record.timelineRecordId,
      timestamp: record.timestamp,
      customerId: record.customerId,
      eventType: record.eventType,
      eventSource: record.eventSource,
      eventReference: record.eventReference,
      eventDescription: record.eventDescription,
      eventStatus: record.eventStatus,
      validationStatus: record.validationStatus,
      metadataVersion: record.metadataVersion,
    };
  }
}
