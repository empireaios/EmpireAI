import type { AuditRuntimeConfiguration } from "./configuration.js";
import type { AuditStore } from "./audit-store.js";
import { EventRecorder } from "./event-recorder.js";
import type { AuditRecord, AudrtInput } from "./types.js";

export class RecoveryRecorder {
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
        category: "recovery_event",
        actionPerformed: input.actionPerformed ?? "recovery_event",
        runtimeComponent: input.runtimeComponent ?? "recovery-runtime",
      },
      config,
    );
  }
}
