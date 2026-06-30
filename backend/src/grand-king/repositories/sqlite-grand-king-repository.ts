import { randomUUID } from "node:crypto";

import { getDatabase } from "../../brain/database.js";
import type {
  GrandKingAiDecision,
  GrandKingOrder,
  GrandKingProduct,
  GrandKingSupplier,
  GrandKingTask,
} from "../models/grand-king-account.js";

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row["record_json"])) as T;
}

export class GrandKingRepository {
  saveProduct(product: GrandKingProduct): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO grand_king_products (product_id, workspace_id, record_json, updated_at)
       VALUES (@productId, @workspaceId, @json, @updatedAt)
       ON CONFLICT(product_id) DO UPDATE SET record_json = excluded.record_json, updated_at = excluded.updated_at`,
    ).run({ productId: product.productId, workspaceId: product.workspaceId, json: JSON.stringify(product), updatedAt: product.updatedAt });
  }

  listProducts(workspaceId: string): GrandKingProduct[] {
    const db = getDatabase();
    const rows = db.prepare(`SELECT record_json FROM grand_king_products WHERE workspace_id = @workspaceId ORDER BY updated_at DESC`).all({ workspaceId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<GrandKingProduct>(r));
  }

  saveTask(task: GrandKingTask): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO grand_king_tasks (task_id, workspace_id, status, priority, record_json, created_at, updated_at)
       VALUES (@taskId, @workspaceId, @status, @priority, @json, @createdAt, @updatedAt)
       ON CONFLICT(task_id) DO UPDATE SET status = excluded.status, priority = excluded.priority, record_json = excluded.record_json, updated_at = excluded.updated_at`,
    ).run({ taskId: task.taskId, workspaceId: task.workspaceId, status: task.status, priority: task.priority, json: JSON.stringify(task), createdAt: task.createdAt, updatedAt: task.updatedAt });
  }

  listTasks(workspaceId: string): GrandKingTask[] {
    const db = getDatabase();
    const rows = db.prepare(`SELECT record_json FROM grand_king_tasks WHERE workspace_id = @workspaceId ORDER BY updated_at DESC`).all({ workspaceId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<GrandKingTask>(r));
  }

  saveSupplier(supplier: GrandKingSupplier): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO grand_king_suppliers (supplier_id, workspace_id, record_json, updated_at)
       VALUES (@supplierId, @workspaceId, @json, @updatedAt)
       ON CONFLICT(supplier_id) DO UPDATE SET record_json = excluded.record_json, updated_at = excluded.updated_at`,
    ).run({ supplierId: supplier.supplierId, workspaceId: supplier.workspaceId, json: JSON.stringify(supplier), updatedAt: supplier.updatedAt });
  }

  listSuppliers(workspaceId: string): GrandKingSupplier[] {
    const db = getDatabase();
    const rows = db.prepare(`SELECT record_json FROM grand_king_suppliers WHERE workspace_id = @workspaceId ORDER BY updated_at DESC`).all({ workspaceId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<GrandKingSupplier>(r));
  }

  saveOrder(order: GrandKingOrder): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO grand_king_orders (order_id, workspace_id, status, record_json, created_at)
       VALUES (@orderId, @workspaceId, @status, @json, @createdAt)
       ON CONFLICT(order_id) DO UPDATE SET status = excluded.status, record_json = excluded.record_json`,
    ).run({ orderId: order.orderId, workspaceId: order.workspaceId, status: order.status, json: JSON.stringify(order), createdAt: order.createdAt });
  }

  listOrders(workspaceId: string): GrandKingOrder[] {
    const db = getDatabase();
    const rows = db.prepare(`SELECT record_json FROM grand_king_orders WHERE workspace_id = @workspaceId ORDER BY created_at DESC`).all({ workspaceId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<GrandKingOrder>(r));
  }

  saveAiDecision(decision: GrandKingAiDecision): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO grand_king_ai_decisions (decision_id, workspace_id, status, record_json, created_at, resolved_at)
       VALUES (@decisionId, @workspaceId, @status, @json, @createdAt, @resolvedAt)
       ON CONFLICT(decision_id) DO UPDATE SET status = excluded.status, record_json = excluded.record_json, resolved_at = excluded.resolved_at`,
    ).run({
      decisionId: decision.decisionId,
      workspaceId: decision.workspaceId,
      status: decision.status,
      json: JSON.stringify(decision),
      createdAt: decision.createdAt,
      resolvedAt: decision.resolvedAt ?? null,
    });
  }

  listAiDecisions(workspaceId: string): GrandKingAiDecision[] {
    const db = getDatabase();
    const rows = db.prepare(`SELECT record_json FROM grand_king_ai_decisions WHERE workspace_id = @workspaceId ORDER BY created_at DESC`).all({ workspaceId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<GrandKingAiDecision>(r));
  }

  isSeeded(workspaceId: string): boolean {
    const db = getDatabase();
    const row = db.prepare(`SELECT COUNT(*) as count FROM grand_king_products WHERE workspace_id = @workspaceId`).get({ workspaceId }) as { count: number };
    return row.count > 0;
  }

  createTask(input: Omit<GrandKingTask, "taskId" | "createdAt" | "updatedAt">): GrandKingTask {
    const now = new Date().toISOString();
    const task: GrandKingTask = { ...input, taskId: randomUUID(), createdAt: now, updatedAt: now };
    this.saveTask(task);
    return task;
  }
}

let repository: GrandKingRepository | null = null;

export function getGrandKingRepository(): GrandKingRepository {
  if (!repository) repository = new GrandKingRepository();
  return repository;
}

export function resetGrandKingRepository(): void {
  repository = null;
}
