import { randomUUID } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import type { ActivityRecord } from "../types.js";

type ActivityRow = {
  id: string;
  workspace_id: string;
  agent_name: string;
  action: string;
  module: string;
  outcome: string | null;
  created_at: string;
};

export class ActivityRepository {
  listRecent(workspaceId: string, limit = 10): ActivityRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM activity_events WHERE workspace_id = @workspaceId
         ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit }) as ActivityRow[];

    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      agentName: row.agent_name,
      action: row.action,
      module: row.module,
      outcome: row.outcome,
      createdAt: row.created_at,
    }));
  }

  record(input: {
    workspaceId: string;
    agentName: string;
    action: string;
    module: string;
    outcome?: string;
  }): ActivityRecord {
    const db = getDatabase();
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO activity_events
        (id, workspace_id, agent_name, action, module, outcome, created_at)
       VALUES (@id, @workspaceId, @agentName, @action, @module, @outcome, @createdAt)`,
    ).run({
      id,
      workspaceId: input.workspaceId,
      agentName: input.agentName,
      action: input.action,
      module: input.module,
      outcome: input.outcome ?? null,
      createdAt,
    });

    return {
      id,
      workspaceId: input.workspaceId,
      agentName: input.agentName,
      action: input.action,
      module: input.module,
      outcome: input.outcome ?? null,
      createdAt,
    };
  }
}
