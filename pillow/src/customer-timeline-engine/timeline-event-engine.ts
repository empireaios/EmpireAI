/** R4-03 — Timeline event engine. */

import type { CustomerTimelineEngineConfiguration } from "./configuration.js";
import type { RecordTimelineEventInput, TimelineRecord } from "./types.js";
import { TimelineMetadataGenerator } from "./timeline-metadata-generator.js";

export class TimelineEventEngine {
  private readonly metadata = new TimelineMetadataGenerator();

  buildEvent(
    input: RecordTimelineEventInput,
    config: CustomerTimelineEngineConfiguration,
  ): { record: TimelineRecord; error: string | null } {
    if (config.eventClassificationRulesEnabled) {
      const rule = config.eventClassificationRules.find((r) => r.eventType === input.eventType);
      if (rule && !rule.enabled) {
        return { record: null as unknown as TimelineRecord, error: `Event type ${input.eventType} is disabled` };
      }
    }

    if (!input.eventReference?.trim()) {
      return { record: null as unknown as TimelineRecord, error: "Event reference is required" };
    }
    if (!input.eventDescription?.trim()) {
      return { record: null as unknown as TimelineRecord, error: "Event description is required" };
    }

    const record = this.metadata.buildTimelineRecord({
      customerId: input.customerId,
      eventType: input.eventType,
      eventSource: input.eventSource,
      eventReference: input.eventReference,
      eventDescription: input.eventDescription,
      eventStatus: input.eventStatus,
    });

    return { record, error: null };
  }
}
