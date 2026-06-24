import { getDatabase } from "../brain/database.js";
import type { ExitSurvey, RetentionRecommendation, RetentionState, RetentionStatus } from "./types.js";

/** Retention framework — never deletes founder businesses on cancellation. */
export class RetentionFramework {
  getState(workspaceId: string): RetentionState {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM retention_states WHERE workspace_id = @workspaceId`)
      .get({ workspaceId }) as Record<string, unknown> | undefined;

    if (!row) {
      return this.ensureActive(workspaceId);
    }
    return mapRow(row);
  }

  ensureActive(workspaceId: string): RetentionState {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT OR IGNORE INTO retention_states
        (workspace_id, status, paused_at, cancelled_at, preserved_at, exit_survey, metadata, updated_at)
       VALUES (@workspaceId, 'active', NULL, NULL, NULL, NULL, '{}', @updatedAt)`,
    ).run({ workspaceId, updatedAt: now });
    return this.getState(workspaceId);
  }

  pauseBusiness(workspaceId: string, reason: string): RetentionState {
    return this.transition(workspaceId, "paused", { pausedAt: new Date().toISOString(), reason });
  }

  resumeBusiness(workspaceId: string): RetentionState {
    return this.transition(workspaceId, "active", { resumedAt: new Date().toISOString() });
  }

  cancelWithPreservation(workspaceId: string, survey: ExitSurvey): RetentionState {
    const now = new Date().toISOString();
    const db = getDatabase();
    db.prepare(
      `INSERT INTO retention_states (workspace_id, status, paused_at, cancelled_at, preserved_at, exit_survey, metadata, updated_at)
       VALUES (@workspaceId, 'preserved', NULL, @cancelledAt, @preservedAt, @survey, @metadata, @updatedAt)
       ON CONFLICT(workspace_id) DO UPDATE SET
         status = 'preserved', cancelled_at = @cancelledAt, preserved_at = @preservedAt,
         exit_survey = @survey, metadata = @metadata, updated_at = @updatedAt`,
    ).run({
      workspaceId,
      cancelledAt: now,
      preservedAt: now,
      survey: JSON.stringify(survey),
      metadata: JSON.stringify({ preservation: "Business data retained per EmpireAI retention doctrine" }),
      updatedAt: now,
    });
    return this.getState(workspaceId);
  }

  recommend(state: RetentionState): RetentionRecommendation[] {
    if (state.status === "active") {
      return [{ action: "Continue monitoring engagement", rationale: "Workspace is active.", priority: "low" }];
    }
    if (state.status === "paused") {
      return [
        {
          action: "Offer resume incentive",
          rationale: "Paused businesses often return within 30 days with a nudge.",
          priority: "medium",
        },
      ];
    }
    return [
      {
        action: "AI retention outreach with preserved portfolio summary",
        rationale: "Cancelled/preserved founders respond to value reminders, not deletion threats.",
        priority: "high",
      },
    ];
  }

  private transition(
    workspaceId: string,
    status: RetentionStatus,
    metadata: Record<string, unknown>,
  ): RetentionState {
    const now = new Date().toISOString();
    const db = getDatabase();
    const pausedAt = status === "paused" ? now : null;
    db.prepare(
      `INSERT INTO retention_states (workspace_id, status, paused_at, cancelled_at, preserved_at, exit_survey, metadata, updated_at)
       VALUES (@workspaceId, @status, @pausedAt, NULL, NULL, NULL, @metadata, @updatedAt)
       ON CONFLICT(workspace_id) DO UPDATE SET status = @status, paused_at = @pausedAt, metadata = @metadata, updated_at = @updatedAt`,
    ).run({
      workspaceId,
      status,
      pausedAt,
      metadata: JSON.stringify(metadata),
      updatedAt: now,
    });
    return this.getState(workspaceId);
  }
}

function mapRow(row: Record<string, unknown>): RetentionState {
  return {
    workspaceId: String(row.workspace_id),
    status: row.status as RetentionStatus,
    pausedAt: row.paused_at ? String(row.paused_at) : null,
    cancelledAt: row.cancelled_at ? String(row.cancelled_at) : null,
    preservedAt: row.preserved_at ? String(row.preserved_at) : null,
    exitSurvey: row.exit_survey
      ? (JSON.parse(String(row.exit_survey)) as ExitSurvey)
      : null,
    metadata: JSON.parse(String(row.metadata ?? "{}")) as Record<string, unknown>,
    updatedAt: String(row.updated_at),
  };
}

export const retentionFramework = new RetentionFramework();
