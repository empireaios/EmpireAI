import { POR_METADATA_VERSION } from "./paths.js";
import { nextPorId } from "./orchestration-store.js";
import type { OrchestrationStore } from "./orchestration-store.js";
import type { OrchestrationSession, PorInput } from "./types.js";

export class RuntimeSessionManager {
  createSession(
    store: OrchestrationStore,
    input: PorInput,
    executionContextId: string | null = null,
  ): OrchestrationSession {
    const now = new Date().toISOString();
    const session: OrchestrationSession = {
      sessionId: input.sessionId ?? nextPorId("por-session"),
      requestId: input.requestId ?? nextPorId("por-req"),
      capitalBusinessId: input.capitalBusinessId ?? null,
      createdAt: now,
      updatedAt: now,
      status: "active",
      executionContextId,
      traceabilityRefs: ["q10-02", "pillow-orchestration-runtime"],
      metadataVersion: POR_METADATA_VERSION,
      structuralSignalOnly: true,
    };
    store.saveSession(session);
    store.appendEvent({
      entryId: nextPorId("por-event"),
      timestamp: now,
      kind: "session",
      label: "session_created",
      status: "succeeded",
      notes: [`Session ${session.sessionId} created`],
    });
    return session;
  }

  getSession(store: OrchestrationStore, sessionId: string) {
    return store.getSession(sessionId);
  }
}
