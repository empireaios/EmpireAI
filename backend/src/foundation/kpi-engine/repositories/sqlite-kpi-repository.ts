import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { KpiLifecycleRecord, KpiMetric, KpiObservation } from "../models/kpi-metric.js";
import type { KpiRepository } from "../repositories/kpi-repository.js";

function mapMetricRow(row: Record<string, unknown>): KpiMetric {
  return JSON.parse(String(row.metric_json)) as KpiMetric;
}

function mapObservationRow(row: Record<string, unknown>): KpiObservation {
  return {
    observationId: String(row.observation_id),
    kpiId: String(row.kpi_id),
    workspaceId: String(row.workspace_id),
    value: Number(row.value),
    source: String(row.source),
    actor: String(row.actor),
    correlationId: row.correlation_id ? String(row.correlation_id) : undefined,
    metadata: JSON.parse(String(row.metadata_json)),
    recordedAt: String(row.recorded_at),
  };
}

function mapLifecycleRow(row: Record<string, unknown>): KpiLifecycleRecord {
  return {
    lifecycleId: String(row.lifecycle_id),
    kpiId: String(row.kpi_id),
    workspaceId: String(row.workspace_id),
    event: row.event as KpiLifecycleRecord["event"],
    summary: String(row.summary),
    actor: String(row.actor),
    correlationId: row.correlation_id ? String(row.correlation_id) : undefined,
    metadata: JSON.parse(String(row.metadata_json)),
    createdAt: String(row.created_at),
  };
}

let repositoryInstance: SqliteKpiRepository | null = null;

export function getKpiRepository(): SqliteKpiRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteKpiRepository();
  }
  return repositoryInstance;
}

export function resetKpiRepository(): void {
  repositoryInstance = null;
}

/** SQLite persistence for KPI metrics, observations, and lifecycle. */
export class SqliteKpiRepository implements KpiRepository {
  saveMetric(metric: KpiMetric): KpiMetric {
    const db = getDatabase();
    const record = { ...metric, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO empire_kpi_metrics
        (kpi_id, workspace_id, metric_key, metric_json, created_at, updated_at)
       VALUES
        (@kpiId, @workspaceId, @metricKey, @metricJson, @createdAt, @updatedAt)
       ON CONFLICT(kpi_id) DO UPDATE SET
         metric_key = excluded.metric_key,
         metric_json = excluded.metric_json,
         updated_at = excluded.updated_at`,
    ).run({
      kpiId: record.kpiId,
      workspaceId: record.workspaceId,
      metricKey: record.metricKey,
      metricJson: JSON.stringify(record),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    return record;
  }

  getMetricById(kpiId: string): KpiMetric | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT metric_json FROM empire_kpi_metrics WHERE kpi_id = @kpiId`)
      .get({ kpiId });
    return row ? mapMetricRow(row as Record<string, unknown>) : null;
  }

  getMetricByKey(workspaceId: string, metricKey: string): KpiMetric | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT metric_json FROM empire_kpi_metrics
         WHERE workspace_id = @workspaceId AND metric_key = @metricKey LIMIT 1`,
      )
      .get({ workspaceId, metricKey });
    return row ? mapMetricRow(row as Record<string, unknown>) : null;
  }

  listMetrics(workspaceId: string): KpiMetric[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT metric_json FROM empire_kpi_metrics
         WHERE workspace_id = @workspaceId ORDER BY metric_key ASC`,
      )
      .all({ workspaceId });
    return (rows as Record<string, unknown>[]).map(mapMetricRow);
  }

  appendObservation(observation: KpiObservation): KpiObservation {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO empire_kpi_observations
        (observation_id, kpi_id, workspace_id, value, source, actor, correlation_id, metadata_json, recorded_at)
       VALUES
        (@observationId, @kpiId, @workspaceId, @value, @source, @actor, @correlationId, @metadataJson, @recordedAt)`,
    ).run({
      observationId: observation.observationId,
      kpiId: observation.kpiId,
      workspaceId: observation.workspaceId,
      value: observation.value,
      source: observation.source,
      actor: observation.actor,
      correlationId: observation.correlationId ?? null,
      metadataJson: JSON.stringify(observation.metadata),
      recordedAt: observation.recordedAt,
    });
    return observation;
  }

  listObservations(kpiId: string, limit = 100): KpiObservation[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM empire_kpi_observations
         WHERE kpi_id = @kpiId ORDER BY recorded_at DESC LIMIT @limit`,
      )
      .all({ kpiId, limit });
    return (rows as Record<string, unknown>[]).map(mapObservationRow);
  }

  listWorkspaceObservations(workspaceId: string, limit = 100): KpiObservation[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM empire_kpi_observations
         WHERE workspace_id = @workspaceId ORDER BY recorded_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit });
    return (rows as Record<string, unknown>[]).map(mapObservationRow);
  }

  appendLifecycle(record: KpiLifecycleRecord): KpiLifecycleRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO kpi_lifecycle
        (lifecycle_id, kpi_id, workspace_id, event, summary, actor, correlation_id, metadata_json, created_at)
       VALUES
        (@lifecycleId, @kpiId, @workspaceId, @event, @summary, @actor, @correlationId, @metadataJson, @createdAt)`,
    ).run({
      lifecycleId: record.lifecycleId,
      kpiId: record.kpiId,
      workspaceId: record.workspaceId,
      event: record.event,
      summary: record.summary,
      actor: record.actor,
      correlationId: record.correlationId ?? null,
      metadataJson: JSON.stringify(record.metadata),
      createdAt: record.createdAt,
    });
    return record;
  }

  listLifecycle(kpiId: string, limit = 100): KpiLifecycleRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM kpi_lifecycle
         WHERE kpi_id = @kpiId ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ kpiId, limit });
    return (rows as Record<string, unknown>[]).map(mapLifecycleRow);
  }

  listWorkspaceLifecycle(workspaceId: string, limit = 100): KpiLifecycleRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM kpi_lifecycle
         WHERE workspace_id = @workspaceId ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit });
    return (rows as Record<string, unknown>[]).map(mapLifecycleRow);
  }
}

export function createKpiLifecycleRecord(
  input: Omit<KpiLifecycleRecord, "lifecycleId" | "createdAt">,
): KpiLifecycleRecord {
  return {
    lifecycleId: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
}

export function createKpiObservation(
  input: Omit<KpiObservation, "observationId" | "recordedAt">,
): KpiObservation {
  return {
    observationId: randomUUID(),
    ...input,
    recordedAt: new Date().toISOString(),
  };
}
