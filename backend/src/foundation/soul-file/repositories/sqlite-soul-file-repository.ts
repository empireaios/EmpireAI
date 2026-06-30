import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import {
  normalizeSoulFileDocument,
  type SoulFileChangeRecord,
  type SoulFileDocument,
} from "../models/soul-file-document.js";
import type { SoulFileRepository } from "../repositories/soul-file-repository.js";

function mapSnapshotRow(row: Record<string, unknown>): SoulFileDocument {
  const document = JSON.parse(String(row.document_json)) as SoulFileDocument;
  return normalizeSoulFileDocument(document);
}

function mapChangeRow(row: Record<string, unknown>): SoulFileChangeRecord {
  return {
    changeId: String(row.change_id),
    workspaceId: String(row.workspace_id),
    fromVersion: row.from_version === null ? null : Number(row.from_version),
    toVersion: Number(row.to_version),
    changeType: row.change_type as SoulFileChangeRecord["changeType"],
    summary: String(row.summary),
    actor: String(row.actor),
    createdAt: String(row.created_at),
  };
}

let repositoryInstance: SqliteSoulFileRepository | null = null;

export function getSoulFileRepository(): SqliteSoulFileRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteSoulFileRepository();
  }
  return repositoryInstance;
}

export function resetSoulFileRepository(): void {
  repositoryInstance = null;
}

/** SQLite persistence for Soul File snapshots and change history. */
export class SqliteSoulFileRepository implements SoulFileRepository {
  saveSnapshot(document: SoulFileDocument): SoulFileDocument {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO soul_file_snapshots
        (snapshot_id, workspace_id, version, version_label, checksum, document_json, created_at, updated_at)
       VALUES
        (@snapshotId, @workspaceId, @version, @versionLabel, @checksum, @documentJson, @createdAt, @updatedAt)
       ON CONFLICT(workspace_id, version) DO UPDATE SET
         version_label = excluded.version_label,
         checksum = excluded.checksum,
         document_json = excluded.document_json,
         updated_at = excluded.updated_at`,
    ).run({
      snapshotId: randomUUID(),
      workspaceId: document.workspaceId,
      version: document.version,
      versionLabel: document.versionLabel,
      checksum: document.checksum,
      documentJson: JSON.stringify(document),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
    return document;
  }

  getSnapshotByVersion(workspaceId: string, version: number): SoulFileDocument | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT document_json FROM soul_file_snapshots
         WHERE workspace_id = @workspaceId AND version = @version`,
      )
      .get({ workspaceId, version });
    return row ? mapSnapshotRow(row as Record<string, unknown>) : null;
  }

  getLatestSnapshot(workspaceId: string): SoulFileDocument | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT document_json FROM soul_file_snapshots
         WHERE workspace_id = @workspaceId
         ORDER BY version DESC LIMIT 1`,
      )
      .get({ workspaceId });
    return row ? mapSnapshotRow(row as Record<string, unknown>) : null;
  }

  listSnapshots(workspaceId: string): SoulFileDocument[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT document_json FROM soul_file_snapshots
         WHERE workspace_id = @workspaceId ORDER BY version ASC`,
      )
      .all({ workspaceId });
    return (rows as Record<string, unknown>[]).map(mapSnapshotRow);
  }

  appendChange(record: SoulFileChangeRecord): SoulFileChangeRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO soul_file_change_history
        (change_id, workspace_id, from_version, to_version, change_type, summary, actor, created_at)
       VALUES
        (@changeId, @workspaceId, @fromVersion, @toVersion, @changeType, @summary, @actor, @createdAt)`,
    ).run({
      changeId: record.changeId,
      workspaceId: record.workspaceId,
      fromVersion: record.fromVersion,
      toVersion: record.toVersion,
      changeType: record.changeType,
      summary: record.summary,
      actor: record.actor,
      createdAt: record.createdAt,
    });
    return record;
  }

  listChanges(workspaceId: string, limit = 50): SoulFileChangeRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM soul_file_change_history
         WHERE workspace_id = @workspaceId
         ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit });
    return (rows as Record<string, unknown>[]).map(mapChangeRow);
  }
}
