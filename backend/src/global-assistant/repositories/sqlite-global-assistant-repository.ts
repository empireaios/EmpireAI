import { randomUUID } from "node:crypto";

import { getDatabase } from "../../brain/database.js";
import type { AssistantCommand, AssistantMessage, AssistantSession } from "../models/global-assistant.js";

let repositoryInstance: SqliteGlobalAssistantRepository | null = null;

export function getGlobalAssistantRepository(): SqliteGlobalAssistantRepository {
  if (!repositoryInstance) repositoryInstance = new SqliteGlobalAssistantRepository();
  return repositoryInstance;
}

export function resetGlobalAssistantRepository(): void {
  repositoryInstance = null;
}

export class SqliteGlobalAssistantRepository {
  saveSession(session: AssistantSession): void {
    const db = getDatabase();
    db.prepare(
      `INSERT OR REPLACE INTO global_assistant_sessions
        (session_id, workspace_id, company_id, record_json, updated_at)
       VALUES (@sessionId, @workspaceId, @companyId, @recordJson, @updatedAt)`,
    ).run({
      sessionId: session.sessionId,
      workspaceId: session.workspaceId,
      companyId: session.companyId,
      recordJson: JSON.stringify(session),
      updatedAt: session.updatedAt,
    });
  }

  getSession(sessionId: string): AssistantSession | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT record_json FROM global_assistant_sessions WHERE session_id = @sessionId`)
      .get({ sessionId }) as { record_json: string } | undefined;
    return row ? (JSON.parse(row.record_json) as AssistantSession) : null;
  }

  saveMessage(message: AssistantMessage): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO global_assistant_messages
        (message_id, session_id, role, record_json, created_at)
       VALUES (@messageId, @sessionId, @role, @recordJson, @createdAt)`,
    ).run({
      messageId: message.messageId,
      sessionId: message.sessionId,
      role: message.role,
      recordJson: JSON.stringify(message),
      createdAt: message.createdAt,
    });
  }

  listMessages(sessionId: string, limit = 100): AssistantMessage[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM global_assistant_messages
         WHERE session_id = @sessionId ORDER BY created_at ASC LIMIT @limit`,
      )
      .all({ sessionId, limit }) as Array<{ record_json: string }>;
    return rows.map((row) => JSON.parse(row.record_json) as AssistantMessage);
  }

  saveCommand(command: AssistantCommand): void {
    const db = getDatabase();
    db.prepare(
      `INSERT OR REPLACE INTO global_assistant_commands
        (command_id, workspace_id, session_id, status, record_json, updated_at)
       VALUES (@commandId, @workspaceId, @sessionId, @status, @recordJson, @updatedAt)`,
    ).run({
      commandId: command.commandId,
      workspaceId: command.workspaceId,
      sessionId: command.sessionId,
      status: command.status,
      recordJson: JSON.stringify(command),
      updatedAt: command.decidedAt ?? command.createdAt,
    });
  }

  getCommand(commandId: string): AssistantCommand | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT record_json FROM global_assistant_commands WHERE command_id = @commandId`)
      .get({ commandId }) as { record_json: string } | undefined;
    return row ? (JSON.parse(row.record_json) as AssistantCommand) : null;
  }

  saveAuditArtifact(artifactId: string, workspaceId: string, missionId: string, content: string): void {
    const db = getDatabase();
    db.prepare(
      `INSERT OR REPLACE INTO global_assistant_audit_artifacts
        (artifact_id, workspace_id, mission_id, content, created_at)
       VALUES (@artifactId, @workspaceId, @missionId, @content, @createdAt)`,
    ).run({
      artifactId,
      workspaceId,
      missionId,
      content,
      createdAt: new Date().toISOString(),
    });
  }

  getAuditArtifact(artifactId: string): { content: string; missionId: string } | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT content, mission_id AS missionId FROM global_assistant_audit_artifacts WHERE artifact_id = @artifactId`,
      )
      .get({ artifactId }) as { content: string; missionId: string } | undefined;
    return row ?? null;
  }

  createId(): string {
    return randomUUID();
  }
}
