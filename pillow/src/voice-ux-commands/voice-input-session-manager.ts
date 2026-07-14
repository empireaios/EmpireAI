/** T4-02 — Voice input session lifecycle management. */

import type { ProcessingStatus, VoiceCommandSession, VoiceUxCommandRecord } from "./types.js";
import { VoiceCommandMetadataGenerator } from "./voice-command-metadata-generator.js";
import { appendVoiceCommandLog } from "./voice-command-logging.js";

export class VoiceInputSessionManager {
  private readonly metadata = new VoiceCommandMetadataGenerator();
  private sessions = new Map<string, VoiceCommandSession>();
  private activeSessionId: string | null = null;

  startSession(existingSessionId?: string): VoiceCommandSession {
    if (existingSessionId && this.sessions.has(existingSessionId)) {
      const existing = this.sessions.get(existingSessionId)!;
      this.activeSessionId = existing.sessionId;
      appendVoiceCommandLog({
        event: "voice_ux_command_session_start",
        level: "info",
        details: `Resumed session ${existing.sessionId}`,
      });
      return existing;
    }

    const session: VoiceCommandSession = {
      sessionId: this.metadata.buildSessionId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commands: [],
      status: "received",
    };
    this.sessions.set(session.sessionId, session);
    this.activeSessionId = session.sessionId;
    appendVoiceCommandLog({
      event: "voice_ux_command_session_start",
      level: "info",
      details: `Started session ${session.sessionId}`,
    });
    return session;
  }

  getSession(sessionId: string): VoiceCommandSession | null {
    return this.sessions.get(sessionId) ?? null;
  }

  getActiveSession(): VoiceCommandSession | null {
    if (!this.activeSessionId) return null;
    return this.sessions.get(this.activeSessionId) ?? null;
  }

  appendCommand(sessionId: string, command: VoiceUxCommandRecord): VoiceCommandSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Voice session ${sessionId} not found`);
    session.commands.push(command);
    session.updatedAt = new Date().toISOString();
    session.status = command.processingStatus;
    this.sessions.set(sessionId, session);
    return session;
  }

  trimHistory(session: VoiceCommandSession, maxCommands: number): VoiceCommandSession {
    if (session.commands.length <= maxCommands) return session;
    return {
      ...session,
      commands: session.commands.slice(-maxCommands),
      updatedAt: new Date().toISOString(),
    };
  }

  updateStatus(sessionId: string, status: ProcessingStatus): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.status = status;
    session.updatedAt = new Date().toISOString();
  }

  getActiveSessionCount(): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (
        session.status === "received" ||
        session.status === "transcribed" ||
        session.status === "interpreted" ||
        session.status === "awaiting_clarification" ||
        session.status === "linked"
      ) {
        count += 1;
      }
    }
    return count;
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    if (session.status !== "completed" && session.status !== "failed") {
      session.status = "completed";
      session.updatedAt = new Date().toISOString();
    }
    if (this.activeSessionId === sessionId) this.activeSessionId = null;
    appendVoiceCommandLog({
      event: "voice_ux_command_session_end",
      level: "info",
      details: `Ended session ${sessionId}`,
    });
  }

  resetForTesting(): void {
    this.sessions.clear();
    this.activeSessionId = null;
  }
}
