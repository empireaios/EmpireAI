/**
 * Production shell delivery observability — correlation + brain→user proof.
 * Infrastructure only; does not change Pillow reasoning.
 */
import { createHash, randomUUID } from "node:crypto";

export type DeliveryClass =
  | "BRAIN_ANSWER_UNCHANGED"
  | "ALLOWED_FORMAT_TRANSFORM"
  | "REPAIRED_ANSWER"
  | "DEGRADED_TERMINAL"
  | "TRANSPORT_ERROR";

export type FailureClass =
  | "NONE"
  | "BRAIN_NOT_STARTED"
  | "BRAIN_TIMEOUT"
  | "BRAIN_ERROR"
  | "BRAIN_EMPTY"
  | "BRAIN_VALID_SHELL_REPLACED"
  | "SHELL_ERROR"
  | "TRANSPORT_ERROR";

export type ShellDeliveryTrace = {
  traceId: string;
  requestId: string | null;
  sessionId: string | null;
  ts: string;
  sessionClass: "unknown" | "fresh" | "long" | "qualification";
  contextSize: number | null;
  brainStarted: boolean;
  brainCompleted: boolean;
  brainDurationMs: number | null;
  shellDurationMs: number | null;
  brainCompletionState: "SUCCESS" | "EMPTY" | "ERROR" | "UNKNOWN";
  brainOutputValidNonempty: boolean;
  brainOutputLength: number;
  brainOutputHash: string;
  brainOutputPreview: string;
  shellComponent: string;
  transformReason: string | null;
  materialChange: boolean;
  shellOutputHash: string;
  shellOutputLength: number;
  deliveryClass: DeliveryClass;
  failureClass: FailureClass;
  brainToUserEquivalent: boolean;
  degradeReason: string | null;
  httpStatus: number;
  upstreamStatus: number | null;
};

const RING_MAX = 64;
const ring: ShellDeliveryTrace[] = [];

export function newShellTraceId(): string {
  return `sdt_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function hashText(text: string): string {
  return createHash("sha256").update(String(text || ""), "utf8").digest("hex").slice(0, 16);
}

export function previewText(text: string, n = 180): string {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

export function recordShellDeliveryTrace(trace: ShellDeliveryTrace): void {
  ring.unshift(trace);
  if (ring.length > RING_MAX) ring.length = RING_MAX;
}

export function listShellDeliveryTraces(limit = 40): ShellDeliveryTrace[] {
  return ring.slice(0, Math.max(1, Math.min(limit, RING_MAX)));
}

export function shellDeliveryDashboard() {
  const rows = ring;
  const brainSuccess = rows.filter((r) => r.brainCompletionState === "SUCCESS").length;
  const brainFailure = rows.filter((r) => r.brainCompletionState !== "SUCCESS").length;
  const shellReplacements = rows.filter((r) => r.materialChange).length;
  const degraded = rows.filter((r) => r.deliveryClass === "DEGRADED_TERMINAL").length;
  const transport = rows.filter((r) => r.deliveryClass === "TRANSPORT_ERROR").length;
  const equivalent = rows.filter((r) => r.brainToUserEquivalent).length;
  return {
    TOTAL_REQUESTS: rows.length,
    BRAIN_SUCCESS: brainSuccess,
    BRAIN_FAILURE: brainFailure,
    SHELL_REPLACEMENTS: shellReplacements,
    DEGRADED_TERMINALS: degraded,
    TRANSPORT_FAILURES: transport,
    BRAIN_TO_USER_EQUIVALENT: equivalent,
    /** V2 permanent dashboard columns */
    columns: [
      "TRACE_ID",
      "SESSION_CLASS",
      "CONTEXT_SIZE",
      "BRAIN_STARTED",
      "BRAIN_COMPLETED",
      "BRAIN_DURATION",
      "SHELL_DURATION",
      "DELIVERY_CLASS",
      "FAILURE_CLASS",
    ],
    recent: rows.slice(0, 20).map((r) => ({
      TRACE_ID: r.traceId,
      SESSION_CLASS: r.sessionClass,
      CONTEXT_SIZE: r.contextSize,
      BRAIN_STARTED: r.brainStarted,
      BRAIN_COMPLETED: r.brainCompleted,
      BRAIN_DURATION: r.brainDurationMs,
      SHELL_DURATION: r.shellDurationMs,
      DELIVERY_CLASS: r.deliveryClass,
      FAILURE_CLASS: r.failureClass,
      requestId: r.requestId,
      sessionId: r.sessionId,
      ts: r.ts,
    })),
  };
}
