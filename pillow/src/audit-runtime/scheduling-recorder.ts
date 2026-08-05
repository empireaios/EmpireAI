import type { AuditRuntimeConfiguration } from "./configuration.js";
import type { AuditStore } from "./audit-store.js";
import { EventRecorder } from "./event-recorder.js";
import type { AuditRecord, AudrtInput } from "./types.js";

export class SchedulingRecorder {
  private readonly events = new EventRecorder();

  record(
    store: AuditStore,
    input: AudrtInput,
    config: AuditRuntimeConfiguration,
  ): AuditRecord {
    return this.events.record(
      store,
      {
        ...input,
        category: "scheduling_activity",
        actionPerformed: input.actionPerformed ?? "scheduling_activity",
        runtimeComponent: input.runtimeComponent ?? "scheduling-runtime",
      },
      config,
    );
  }
}
