import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../../brain/database.js";
import type {
  LiveCommerceAuditEntry,
  LiveCommerceOAuthState,
  LiveCommerceSyncJob,
  LiveCommerceWebhookEvent,
} from "../models.js";

let repositoryInstance: SqliteLiveCommerceRepository | null = null;

export function getLiveCommerceRepository(): SqliteLiveCommerceRepository {
  if (!repositoryInstance) repositoryInstance = new SqliteLiveCommerceRepository();
  return repositoryInstance;
}

export function resetLiveCommerceRepository(): void {
  repositoryInstance = null;
}

export class SqliteLiveCommerceRepository {
  saveOAuthState(state: LiveCommerceOAuthState): void {
    const db = getDatabase();
    db.prepare(
      `INSERT OR REPLACE INTO live_commerce_oauth_states
        (state_id, workspace_id, provider_id, record_json, updated_at)
       VALUES (@stateId, @workspaceId, @providerId, @recordJson, @updatedAt)`,
    ).run({
      stateId: state.stateId,
      workspaceId: state.workspaceId,
      providerId: state.providerId,
      recordJson: JSON.stringify(state),
      updatedAt: new Date().toISOString(),
    });
  }

  getOAuthState(stateId: string): LiveCommerceOAuthState | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT record_json FROM live_commerce_oauth_states WHERE state_id = @stateId`)
      .get({ stateId }) as { record_json: string } | undefined;
    return row ? (JSON.parse(row.record_json) as LiveCommerceOAuthState) : null;
  }

  saveSyncJob(job: LiveCommerceSyncJob): void {
    const db = getDatabase();
    db.prepare(
      `INSERT OR REPLACE INTO live_commerce_sync_jobs
        (job_id, workspace_id, provider_id, sync_type, record_json, updated_at)
       VALUES (@jobId, @workspaceId, @providerId, @syncType, @recordJson, @updatedAt)`,
    ).run({
      jobId: job.jobId,
      workspaceId: job.workspaceId,
      providerId: job.providerId,
      syncType: job.syncType,
      recordJson: JSON.stringify(job),
      updatedAt: job.completedAt ?? job.startedAt,
    });
  }

  listSyncJobs(workspaceId: string, providerId?: string): LiveCommerceSyncJob[] {
    const db = getDatabase();
    const rows = (providerId
      ? db
          .prepare(
            `SELECT record_json FROM live_commerce_sync_jobs
             WHERE workspace_id = @workspaceId AND provider_id = @providerId
             ORDER BY updated_at DESC`,
          )
          .all({ workspaceId, providerId })
      : db
          .prepare(
            `SELECT record_json FROM live_commerce_sync_jobs
             WHERE workspace_id = @workspaceId ORDER BY updated_at DESC`,
          )
          .all({ workspaceId })) as Array<{ record_json: string }>;
    return rows.map((row) => JSON.parse(row.record_json) as LiveCommerceSyncJob);
  }

  saveWebhookEvent(event: LiveCommerceWebhookEvent): void {
    const db = getDatabase();
    db.prepare(
      `INSERT OR REPLACE INTO live_commerce_webhook_events
        (event_id, workspace_id, provider_id, record_json, received_at)
       VALUES (@eventId, @workspaceId, @providerId, @recordJson, @receivedAt)`,
    ).run({
      eventId: event.eventId,
      workspaceId: event.workspaceId,
      providerId: event.providerId,
      recordJson: JSON.stringify(event),
      receivedAt: event.receivedAt,
    });
  }

  listWebhookEvents(workspaceId: string): LiveCommerceWebhookEvent[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM live_commerce_webhook_events
         WHERE workspace_id = @workspaceId ORDER BY received_at DESC`,
      )
      .all({ workspaceId }) as Array<{ record_json: string }>;
    return rows.map((row) => JSON.parse(row.record_json) as LiveCommerceWebhookEvent);
  }

  saveAuditEntry(entry: LiveCommerceAuditEntry): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO live_commerce_audit_log
        (audit_id, workspace_id, provider_id, action, record_json, recorded_at)
       VALUES (@auditId, @workspaceId, @providerId, @action, @recordJson, @recordedAt)`,
    ).run({
      auditId: entry.auditId,
      workspaceId: entry.workspaceId,
      providerId: entry.providerId,
      action: entry.action,
      recordJson: JSON.stringify(entry),
      recordedAt: entry.recordedAt,
    });
  }

  listAuditEntries(workspaceId: string, limit = 100): LiveCommerceAuditEntry[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM live_commerce_audit_log
         WHERE workspace_id = @workspaceId ORDER BY recorded_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit }) as Array<{ record_json: string }>;
    return rows.map((row) => JSON.parse(row.record_json) as LiveCommerceAuditEntry);
  }

  createRecoveryRecord(input: {
    workspaceId: string;
    providerId: string;
    operation: string;
    errorMessage: string;
  }): string {
    const recoveryId = randomUUID();
    const db = getDatabase();
    db.prepare(
      `INSERT INTO live_commerce_recovery_queue
        (recovery_id, workspace_id, provider_id, operation, error_message, status, created_at)
       VALUES (@recoveryId, @workspaceId, @providerId, @operation, @errorMessage, 'pending', @createdAt)`,
    ).run({
      recoveryId,
      workspaceId: input.workspaceId,
      providerId: input.providerId,
      operation: input.operation,
      errorMessage: input.errorMessage,
      createdAt: new Date().toISOString(),
    });
    return recoveryId;
  }

  listPendingRecoveries(workspaceId: string): Array<{
    recoveryId: string;
    providerId: string;
    operation: string;
    errorMessage: string;
    status: string;
  }> {
    const db = getDatabase();
    return db
      .prepare(
        `SELECT recovery_id as recoveryId, provider_id as providerId, operation, error_message as errorMessage, status
         FROM live_commerce_recovery_queue
         WHERE workspace_id = @workspaceId AND status = 'pending'
         ORDER BY created_at ASC`,
      )
      .all({ workspaceId }) as Array<{
      recoveryId: string;
      providerId: string;
      operation: string;
      errorMessage: string;
      status: string;
    }>;
  }

  markRecoveryComplete(recoveryId: string): void {
    const db = getDatabase();
    db.prepare(
      `UPDATE live_commerce_recovery_queue SET status = 'recovered', recovered_at = @recoveredAt WHERE recovery_id = @recoveryId`,
    ).run({ recoveryId, recoveredAt: new Date().toISOString() });
  }
}
