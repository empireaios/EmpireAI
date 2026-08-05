import type { AuditRuntimeConfiguration } from "./configuration.js";
import type { AuditStore } from "./audit-store.js";
import { EventRecorder } from "./event-recorder.js";
import type { AuditRecord, AudrtInput } from "./types.js";

export class WorkerActionRecorder {
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
        category: "worker_action",
        actionPerformed: input.actionPerformed ?? "worker_action",
        runtimeComponent: input.runtimeComponent ?? "worker",
      },
      config,
    );
  }
}
