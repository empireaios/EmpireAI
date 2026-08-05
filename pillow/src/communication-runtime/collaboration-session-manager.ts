import { COMRT_METADATA_VERSION, COMRT_MISSION_ID } from "./paths.js";
import { nextComrtId, type CommunicationStore } from "./communication-store.js";
import type { CollaborationSession, ComrtInput } from "./types.js";

export class CollaborationSessionManager {
  openSession(store: CommunicationStore, input: ComrtInput): CollaborationSession {
    const sessionId = input.sessionId ?? nextComrtId("comrt-sess");
    const existing = store.getSession(sessionId);
    if (existing && existing.status !== "closed") {
      return store.updateSession(sessionId, {
        status: "open",
        participants: input.participants?.length
          ? [...input.participants]
          : existing.participants,
      })!;
    }

    const session: CollaborationSession = {
      sessionId,
      participants: [...(input.participants ?? [])].sort((a, b) => a.localeCompare(b)),
      missionId: input.missionId ?? COMRT_MISSION_ID,
      status: "open",
      startedAt: new Date().toISOString(),
      endedAt: null,
      messageCount: 0,
      contextReference:
        input.contextReference?.startsWith("ctx://")
          ? input.contextReference
          : `ctx://structural/session/${sessionId}`,
      auditReference: input.auditReference ?? `audit://comrt/session/${sessionId}`,
      structuralSignalOnly: true,
      fabricated: false,
    };
    return store.saveSession(session);
  }

  closeSession(store: CommunicationStore, sessionId: string): CollaborationSession | null {
    const existing = store.getSession(sessionId);
    if (!existing) return null;
    return store.updateSession(sessionId, {
      status: "closed",
      endedAt: new Date().toISOString(),
    });
  }

  incrementMessageCount(store: CommunicationStore, sessionId: string) {
    const existing = store.getSession(sessionId);
    if (!existing) return null;
    return store.updateSession(sessionId, {
      messageCount: existing.messageCount + 1,
    });
  }

  listSessions(store: CommunicationStore) {
    return store.listSessions();
  }
}
