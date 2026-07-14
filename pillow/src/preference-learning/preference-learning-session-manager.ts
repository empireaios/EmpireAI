/** T4-08 — Preference learning session lifecycle. */

import type {
  CollaborationPreferenceRecord,
  PreferenceLearningSession,
  PreferenceStatus,
} from "./types.js";
import { PreferenceMetadataGenerator } from "./preference-metadata-generator.js";

export class PreferenceLearningSessionManager {
  private sessions = new Map<string, PreferenceLearningSession>();

  startSession(sessionId?: string): PreferenceLearningSession {
    const metadata = new PreferenceMetadataGenerator();
    const id = sessionId ?? metadata.buildSessionId();
    const existing = this.sessions.get(id);
    if (existing) return existing;

    const session: PreferenceLearningSession = {
      sessionId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferences: [],
      status: "draft",
    };
    this.sessions.set(id, session);
    return session;
  }

  appendPreferences(
    sessionId: string,
    preferences: CollaborationPreferenceRecord[],
    status: PreferenceStatus,
  ): PreferenceLearningSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Preference learning session not found: ${sessionId}`);
    const updated: PreferenceLearningSession = {
      ...session,
      updatedAt: new Date().toISOString(),
      preferences: [...session.preferences, ...preferences],
      status,
    };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    this.sessions.set(sessionId, { ...session, status: "completed" });
  }

  getActiveSessionCount(): number {
    let count = 0;
    for (const s of this.sessions.values()) {
      if (s.status !== "completed" && s.status !== "failed") count += 1;
    }
    return count;
  }

  resetForTesting(): void {
    this.sessions.clear();
  }
}
