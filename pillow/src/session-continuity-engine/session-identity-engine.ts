/** T1-09 — Session identity resolution and preservation. */

import type { PersistedSessionSnapshot } from "./types.js";

export class SessionIdentityEngine {
  resolve(input: {
    persisted: PersistedSessionSnapshot | null;
    runtimeSessionId: string;
    actorIdentifier?: string | null;
  }): { sessionId: string; actorIdentifier: string | null; isResumed: boolean } {
    if (input.persisted?.sessionId) {
      return {
        sessionId: input.persisted.sessionId,
        actorIdentifier: input.actorIdentifier ?? input.persisted.actorIdentifier,
        isResumed: true,
      };
    }
    return {
      sessionId: input.runtimeSessionId,
      actorIdentifier: input.actorIdentifier ?? null,
      isResumed: false,
    };
  }
}
