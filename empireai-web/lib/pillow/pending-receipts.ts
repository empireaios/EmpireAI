import type { DurableReceipt } from "./durable-delivery";

export type PendingPillowReceipt = DurableReceipt & { query: string };
const keyFor = (ownerId: string) => `empireai:pillow:pending:v1:${encodeURIComponent(ownerId)}`;

/** Only confirmed receipts, scoped to the signed-in owner; never credentials. */
export function loadPendingPillowReceipts(ownerId: string): PendingPillowReceipt[] {
  if (typeof window === "undefined") return [];
  try {
    const rows: unknown = JSON.parse(window.localStorage.getItem(keyFor(ownerId)) ?? "[]");
    if (!Array.isArray(rows)) return [];
    return rows.filter((row): row is PendingPillowReceipt =>
      Boolean(row) && typeof row.requestId === "string" && row.requestId.length > 0 &&
      typeof row.sessionId === "string" && typeof row.query === "string");
  } catch {
    return [];
  }
}

export function savePendingPillowReceipt(ownerId: string, receipt: PendingPillowReceipt): void {
  if (typeof window === "undefined") return;
  const rows = loadPendingPillowReceipts(ownerId).filter((row) => row.requestId !== receipt.requestId);
  try {
    window.localStorage.setItem(keyFor(ownerId), JSON.stringify([...rows, receipt]));
  } catch {
    // Storage unavailable does not authorize a second POST; current poll still owns this ID.
  }
}

export function clearPendingPillowReceipt(ownerId: string, requestId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(ownerId), JSON.stringify(
      loadPendingPillowReceipts(ownerId).filter((row) => row.requestId !== requestId),
    ));
  } catch {
    // A retained receipt can be read again safely; retrieval never executes work.
  }
}
