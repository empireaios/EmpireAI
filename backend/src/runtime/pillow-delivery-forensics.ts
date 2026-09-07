/**
 * Durable delivery forensics on Tier-0 primary (survives Brain worker restarts).
 * Vercel BFF in-memory rings are NOT durable — this store is the source of truth
 * for Grand King checkpoint failure investigation.
 */
import { createHash, randomUUID } from "node:crypto";

export type DeliveryForensicEvent = {
  traceId: string;
  requestId: string;
  sessionId: string | null;
  ts: string;
  acceptedAt: number;
  requestPreview: string;
  requestHash: string;
  sessionClass: "unknown" | "fresh" | "long" | "qualification";
  brainStarted: boolean;
  brainCompleted: boolean;
  brainOutputNonempty: boolean;
  brainOutputLength: number;
  brainOutputHash: string | null;
  brainDurationMs: number | null;
  shellDurationMs: number | null;
  deliveryClass:
    | "BRAIN_ANSWER"
    | "DEGRADED_TERMINAL"
    | "TRANSPORT_ERROR"
    | "UPSTREAM_ERROR";
  failureClass:
    | "NONE"
    | "BRAIN_NEVER_STARTED"
    | "BRAIN_STARTED_NOT_COMPLETED"
    | "BRAIN_COMPLETED_EMPTY"
    | "WORKER_UNAVAILABLE"
    | "UPSTREAM_ERROR"
    | "TIMEOUT"
    | "BUDGET_EXHAUSTED";
  upstreamStatus: number | null;
  recoveryAttempts: number;
  terminalReason: string | null;
  deploymentId: string | null;
};

const RING_MAX = 200;
const ring: DeliveryForensicEvent[] = [];

export function hashText(text: string): string {
  return createHash("sha256").update(String(text || ""), "utf8").digest("hex").slice(0, 16);
}

export function previewText(text: string, n = 160): string {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

export function newDeliveryTraceId(): string {
  return `dft_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function recordDeliveryForensic(event: DeliveryForensicEvent): void {
  ring.unshift(event);
  if (ring.length > RING_MAX) ring.length = RING_MAX;
}

export function listDeliveryForensics(limit = 50): DeliveryForensicEvent[] {
  return ring.slice(0, Math.max(1, Math.min(limit, RING_MAX)));
}

export function deliveryForensicsDashboard() {
  const rows = ring;
  return {
    TOTAL_REQUESTS: rows.length,
    BRAIN_COMPLETED: rows.filter((r) => r.brainCompleted).length,
    DEGRADED_TERMINALS: rows.filter((r) => r.deliveryClass === "DEGRADED_TERMINAL").length,
    WORKER_UNAVAILABLE: rows.filter((r) => r.failureClass === "WORKER_UNAVAILABLE").length,
    UPSTREAM_ERROR: rows.filter((r) => r.failureClass === "UPSTREAM_ERROR").length,
    recent: rows.slice(0, 40),
  };
}

export function searchDeliveryForensics(q: string): DeliveryForensicEvent[] {
  const needle = String(q || "").toLowerCase();
  if (!needle) return listDeliveryForensics(20);
  return ring.filter((r) => {
    const hay = `${r.requestPreview} ${r.requestId} ${r.sessionId ?? ""} ${r.terminalReason ?? ""}`.toLowerCase();
    return hay.includes(needle);
  });
}
