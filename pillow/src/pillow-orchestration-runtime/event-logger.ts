import { appendPorLog } from "./por-logging.js";
import { nextPorId } from "./orchestration-store.js";
import type { OrchestrationStore } from "./orchestration-store.js";
import type { ExecutionTimelineEntry } from "./types.js";

export class OrchestrationEventLogger {
  log(
    store: OrchestrationStore,
    entry: Omit<ExecutionTimelineEntry, "entryId">,
  ): ExecutionTimelineEntry {
    const event: ExecutionTimelineEntry = {
      entryId: nextPorId("por-event"),
      ...entry,
      notes: [...entry.notes],
    };
    store.appendEvent(event);
    appendPorLog({ event: String(entry.kind), details: entry.label });
    return event;
  }
}
