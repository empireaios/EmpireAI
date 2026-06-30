import type { ExecutionPlan } from "../models/execution-plan.js";
import type { UniversalEventEnvelope, UniversalEventLifecycle } from "../models/universal-event.js";
import { getDatabase } from "../../../brain/database.js";

export type QueueEntry = {
  queueId: string;
  workspaceId: string;
  companyId: string;
  operation: string;
  kernel: string;
  status: string;
  recordJson: string;
  requestedAt: string;
};

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row["record_json"])) as T;
}

export class CommerceRuntimeRepository {
  savePlan(plan: ExecutionPlan): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO commerce_runtime_plans
        (plan_id, workspace_id, company_id, operation, status, record_json, created_at)
       VALUES
        (@planId, @workspaceId, @companyId, @operation, @status, @recordJson, @createdAt)
       ON CONFLICT(plan_id) DO UPDATE SET
         record_json = excluded.record_json,
         status = excluded.status`,
    ).run({
      planId: plan.planId,
      workspaceId: plan.workspaceId,
      companyId: plan.companyId,
      operation: plan.operation,
      status: plan.status,
      recordJson: JSON.stringify(plan),
      createdAt: plan.createdAt,
    });
  }

  getPlan(planId: string, workspaceId: string, companyId: string): ExecutionPlan | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM commerce_runtime_plans
         WHERE plan_id = @planId AND workspace_id = @workspaceId AND company_id = @companyId`,
      )
      .get({ planId, workspaceId, companyId }) as Record<string, unknown> | undefined;
    return row ? mapJson<ExecutionPlan>(row) : null;
  }

  listPlans(workspaceId: string, companyId: string): ExecutionPlan[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM commerce_runtime_plans
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY created_at DESC`,
      )
      .all({ workspaceId, companyId }) as Array<Record<string, unknown>>;
    return rows.map((row) => mapJson<ExecutionPlan>(row));
  }

  saveEvent(event: UniversalEventEnvelope): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO commerce_runtime_events
        (event_id, workspace_id, company_id, event_type, lifecycle, record_json, recorded_at)
       VALUES
        (@eventId, @workspaceId, @companyId, @eventType, @lifecycle, @recordJson, @recordedAt)
       ON CONFLICT(event_id) DO UPDATE SET
         lifecycle = excluded.lifecycle,
         record_json = excluded.record_json`,
    ).run({
      eventId: event.eventId,
      workspaceId: event.workspaceId,
      companyId: event.companyId,
      eventType: event.eventType,
      lifecycle: event.lifecycle,
      recordJson: JSON.stringify(event),
      recordedAt: event.occurredAt,
    });
  }

  updateEventLifecycle(eventId: string, lifecycle: UniversalEventLifecycle): void {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT record_json FROM commerce_runtime_events WHERE event_id = @eventId`)
      .get({ eventId }) as Record<string, unknown> | undefined;
    if (!row) return;
    const event = mapJson<UniversalEventEnvelope>(row);
    event.lifecycle = lifecycle;
    db.prepare(
      `UPDATE commerce_runtime_events SET lifecycle = @lifecycle, record_json = @recordJson WHERE event_id = @eventId`,
    ).run({ lifecycle, recordJson: JSON.stringify(event), eventId });
  }

  listEvents(workspaceId: string, companyId: string, limit: number): UniversalEventEnvelope[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM commerce_runtime_events
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY recorded_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, companyId, limit }) as Array<Record<string, unknown>>;
    return rows.map((row) => mapJson<UniversalEventEnvelope>(row));
  }

  eventStats(workspaceId: string, companyId: string): {
    received: number;
    processed: number;
    deadLetter: number;
  } {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT lifecycle, COUNT(*) as count FROM commerce_runtime_events
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         GROUP BY lifecycle`,
      )
      .all({ workspaceId, companyId }) as Array<{ lifecycle: string; count: number }>;

    const stats = { received: 0, processed: 0, deadLetter: 0 };
    for (const row of rows) {
      if (row.lifecycle === "RECEIVED" || row.lifecycle === "VERIFIED") stats.received += row.count;
      if (row.lifecycle === "PROCESSED" || row.lifecycle === "ARCHIVED") stats.processed += row.count;
      if (row.lifecycle === "DEAD_LETTER") stats.deadLetter += row.count;
    }
    return stats;
  }

  saveQueueEntry(entry: QueueEntry): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO commerce_runtime_queue
        (queue_id, workspace_id, company_id, operation, kernel, status, record_json, requested_at)
       VALUES
        (@queueId, @workspaceId, @companyId, @operation, @kernel, @status, @recordJson, @requestedAt)
       ON CONFLICT(queue_id) DO UPDATE SET
         status = excluded.status,
         record_json = excluded.record_json`,
    ).run({
      queueId: entry.queueId,
      workspaceId: entry.workspaceId,
      companyId: entry.companyId,
      operation: entry.operation,
      kernel: entry.kernel,
      status: entry.status,
      recordJson: entry.recordJson,
      requestedAt: entry.requestedAt,
    });
  }

  listQueue(workspaceId: string, companyId: string): QueueEntry[] {
    const db = getDatabase();
    return db
      .prepare(
        `SELECT queue_id as queueId, workspace_id as workspaceId, company_id as companyId,
                operation, kernel, status, record_json as recordJson, requested_at as requestedAt
         FROM commerce_runtime_queue
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY requested_at DESC`,
      )
      .all({ workspaceId, companyId }) as QueueEntry[];
  }

  queueStats(workspaceId: string, companyId: string): { total: number; blocked: number } {
    const db = getDatabase();
    const totalRow = db
      .prepare(`SELECT COUNT(*) as count FROM commerce_runtime_queue WHERE workspace_id = @workspaceId AND company_id = @companyId`)
      .get({ workspaceId, companyId }) as { count: number };
    const blockedRow = db
      .prepare(
        `SELECT COUNT(*) as count FROM commerce_runtime_queue
         WHERE workspace_id = @workspaceId AND company_id = @companyId AND status = 'BLOCKED'`,
      )
      .get({ workspaceId, companyId }) as { count: number };
    return { total: totalRow.count, blocked: blockedRow.count };
  }
}

let repository: CommerceRuntimeRepository | null = null;

export function getCommerceRuntimeRepository(): CommerceRuntimeRepository {
  repository ??= new CommerceRuntimeRepository();
  return repository;
}

export function resetCommerceRuntimeRepository(): void {
  repository = null;
}
