import { getDatabase } from "../../../brain/database.js";
import type { ConnectorMonitoringEvent } from "../models/reality-integration.js";

let repositoryInstance: SqliteConnectorMonitoringRepository | null = null;

export function getConnectorMonitoringRepository(): SqliteConnectorMonitoringRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteConnectorMonitoringRepository();
  }
  return repositoryInstance;
}

export function resetConnectorMonitoringRepository(): void {
  repositoryInstance = null;
}

export class SqliteConnectorMonitoringRepository {
  saveEvent(event: ConnectorMonitoringEvent): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO connector_monitoring_events
        (event_id, provider_id, workspace_id, event_type, message, metadata_json, recorded_at)
       VALUES
        (@eventId, @providerId, @workspaceId, @eventType, @message, @metadataJson, @recordedAt)`,
    ).run({
      eventId: event.eventId,
      providerId: event.providerId,
      workspaceId: event.workspaceId,
      eventType: event.eventType,
      message: event.message,
      metadataJson: JSON.stringify(event.metadata),
      recordedAt: event.recordedAt,
    });
  }

  listEvents(workspaceId: string, providerId?: string, limit = 50): ConnectorMonitoringEvent[] {
    const db = getDatabase();
    let query = `SELECT * FROM connector_monitoring_events WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };
    if (providerId) {
      query += ` AND provider_id = @providerId`;
      params.providerId = providerId;
    }
    query += ` ORDER BY recorded_at DESC LIMIT @limit`;
    params.limit = limit;
    const rows = db.prepare(query).all(params) as Record<string, unknown>[];
    return rows.map((row) => ({
      eventId: String(row.event_id),
      providerId: String(row.provider_id),
      workspaceId: String(row.workspace_id),
      eventType: String(row.event_type) as ConnectorMonitoringEvent["eventType"],
      message: String(row.message),
      metadata: JSON.parse(String(row.metadata_json)) as Record<string, unknown>,
      recordedAt: String(row.recorded_at),
    }));
  }
}
