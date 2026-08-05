import type { AuditRuntimeConfiguration } from "./configuration.js";
import type { AuditStore } from "./audit-store.js";
import { EventRecorder } from "./event-recorder.js";
import type { AuditRecord, AudrtInput } from "./types.js";

export class ApprovalRecorder {
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
        category: "approval_decision",
        actionPerformed: input.actionPerformed ?? "approval_decision",
        runtimeComponent: input.runtimeComponent ?? "approval-runtime",
        decision: input.decision ?? "pending",
      },
      config,
    );
  }
}
