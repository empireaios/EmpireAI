import { SCHRT_METADATA_VERSION } from "./paths.js";
import { nextSchrtId, type ScheduleStore } from "./schedule-store.js";
import type { EventTriggerRecord, ScheduleDefinition } from "./types.js";

/**
 * Event-driven schedules fire when eventKey matches.
 * Records structural EventTriggerRecord only — never fabricates times.
 */
export class EventTriggerEngine {
  matchSchedules(store: ScheduleStore, eventKey: string): ScheduleDefinition[] {
    return store
      .listSchedules()
      .filter(
        (s) =>
          s.scheduleType === "event_driven" &&
          s.eventKey === eventKey &&
          !s.paused &&
          (s.currentStatus === "active" || s.currentStatus === "draft"),
      );
  }

  recordMatch(
    store: ScheduleStore,
    schedule: ScheduleDefinition,
    eventKey: string,
    nowIso: string,
  ): EventTriggerRecord {
    const record: EventTriggerRecord = {
      eventTriggerId: nextSchrtId("schrt-evt"),
      eventKey,
      scheduleId: schedule.scheduleId,
      triggeredAt: nowIso,
      status: "matched",
      supportingEvidence: [
        `event_key_match:${eventKey}`,
        `schedule:${schedule.scheduleId}`,
        "never_fabricated",
      ],
      auditReference: schedule.auditReference,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: SCHRT_METADATA_VERSION,
    };
    return store.saveEventTrigger(record);
  }
}
