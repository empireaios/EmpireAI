/**
 * Accepted Pillow chat request ownership + bounded recovery.
 * Conversational reasoning retries are side-effect-safe.
 * Do not use this path for purchase/publish/spend mutations.
 */
import { randomUUID } from "node:crypto";

export const PILLOW_CHAT_TIMEOUTS = {
  /** Vercel route maxDuration is 130s — BFF must finish under that. */
  bffChatMs: 125_000,
  /** Tier-0 wall budget must finish before BFF aborts. */
  tier0TotalBudgetMs: 118_000,
  tier0Attempt1Ms: 85_000,
  tier0Attempt2Ms: 28_000,
  workerReadyWaitMs: 14_000,
  workerProbeIntervalMs: 1_200,
  /** Browser client abort — outer of BFF. */
  frontendChatMs: 128_000,
} as const;

export type PillowRequestKind = "reasoning" | "side_effect";

export type AcceptedPillowChatRequest = {
  requestId: string;
  sessionId: string | null;
  message: string;
  acceptedAt: number;
  kind: PillowRequestKind;
};

export type PillowProxyAttemptResult =
  | {
      ok: true;
      status: number;
      body: Buffer;
      headers: Headers;
      messagePreview: string;
    }
  | {
      ok: false;
      reason: "timeout" | "network" | "upstream_error" | "empty_message" | "worker_unavailable";
      status?: number;
      error?: unknown;
    };

export type RecoveryTelemetryEvent =
  | "accepted"
  | "attempt_started"
  | "worker_unavailable"
  | "worker_ready"
  | "retry_started"
  | "retry_succeeded"
  | "completed"
  | "degraded_completion"
  | "terminal_infrastructure_failure";

const SYNTHETIC_ISOLATION =
  /\b(?:synthetic(?:canary)?|scenario\s+only|not\s+(?:empireai|live)\s+facts|do\s+not\s+mention\s+(?:empireai|birth|products?|sales|revenue))\b/i;

const BIRTH_ASK =
  /\b(?:birth|authoris(?:e|ation)|authorize\s+birth|birth\s+timestamp)\b/i;

export function isSyntheticIsolatedAsk(message: string): boolean {
  return SYNTHETIC_ISOLATION.test(String(message || ""));
}

export function shouldSurfaceBirthBoundary(message: string): boolean {
  return BIRTH_ASK.test(String(message || ""));
}

export function classifyPillowRequestKind(_message: string): PillowRequestKind {
  // Chat path is conversational reasoning only. Action tools use other routes.
  return "reasoning";
}

export function acceptPillowChatRequest(input: {
  message: string;
  sessionId?: string | null;
  requestId?: string;
}): AcceptedPillowChatRequest {
  return {
    requestId: input.requestId || `pcr_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
    sessionId: input.sessionId ?? null,
    message: String(input.message || ""),
    acceptedAt: Date.now(),
    kind: classifyPillowRequestKind(input.message),
  };
}

export function extractChatMessagePreview(buf: Buffer): string {
  try {
    const parsed = JSON.parse(buf.toString("utf8")) as {
      result?: { message?: string };
      message?: string;
    };
    return String(parsed?.result?.message ?? parsed?.message ?? "").trim();
  } catch {
    return "";
  }
}

export function isTransientProxyFailure(result: PillowProxyAttemptResult): boolean {
  if (result.ok) return false;
  return (
    result.reason === "timeout" ||
    result.reason === "network" ||
    result.reason === "worker_unavailable" ||
    result.reason === "empty_message" ||
    (result.reason === "upstream_error" &&
      typeof result.status === "number" &&
      (result.status === 502 || result.status === 503 || result.status === 504 || result.status === 404))
  );
}

/** Request-scoped terminal message when recovery is exhausted. Never claims silent continuation. */
export function buildTerminalInfrastructureMessage(accepted: AcceptedPillowChatRequest): string {
  const isolated = isSyntheticIsolatedAsk(accepted.message);
  const lines = [
    "I accepted your request, but the deep reasoning path could not finish after bounded recovery.",
    "This is a temporary infrastructure limit — not a question about your task.",
  ];
  if (!isolated && shouldSurfaceBirthBoundary(accepted.message)) {
    lines.push("Birth remains unauthorised until Grand King decides.");
  }
  lines.push("Please send the same ask once more in a moment; the server will retry from a clean worker.");
  return lines.join(" ");
}

/**
 * Soft degraded completion when we have partial posture but must not dump protected state.
 * Must NOT say "you do not need to resubmit" unless completion is actually retained.
 */
export function buildRequestRelevantDegradedMessage(accepted: AcceptedPillowChatRequest): string {
  // Preferred policy: honest terminal when we did not complete — do not fake ownership.
  return buildTerminalInfrastructureMessage(accepted);
}

export function assertsNoIrrelevantProtectedState(message: string, userAsk: string): boolean {
  if (isSyntheticIsolatedAsk(userAsk) || !shouldSurfaceBirthBoundary(userAsk)) {
    if (/\bBirth remains unauthoris/i.test(message)) return false;
    if (/\brealised commerce|product focus|commissioning state\b/i.test(message)) return false;
  }
  if (/\btell me which (?:theme|part) to deepen\b/i.test(message)) return false;
  if (/\bworker proxy\b/i.test(message)) return false;
  return true;
}

export function remainingBudgetMs(acceptedAt: number, totalBudgetMs: number): number {
  return Math.max(0, totalBudgetMs - (Date.now() - acceptedAt));
}

export function attemptTimeoutForBudget(remainingMs: number, preferredMs: number): number {
  return Math.max(5_000, Math.min(preferredMs, remainingMs - 1_000));
}

export async function waitForWorkerReady(opts: {
  probe: (timeoutMs: number) => Promise<boolean>;
  maxWaitMs: number;
  intervalMs?: number;
}): Promise<boolean> {
  const interval = opts.intervalMs ?? PILLOW_CHAT_TIMEOUTS.workerProbeIntervalMs;
  const deadline = Date.now() + opts.maxWaitMs;
  while (Date.now() < deadline) {
    if (await opts.probe(Math.min(2_000, deadline - Date.now()))) return true;
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

/**
 * Bounded recovery loop for reasoning chat. Side-effect requests must not use this.
 */
export async function runAcceptedPillowChatRecovery(opts: {
  accepted: AcceptedPillowChatRequest;
  probeWorker: (timeoutMs: number) => Promise<boolean>;
  attempt: (timeoutMs: number, attemptIndex: number) => Promise<PillowProxyAttemptResult>;
  onEvent?: (event: RecoveryTelemetryEvent, detail?: Record<string, unknown>) => void;
  totalBudgetMs?: number;
  attempt1Ms?: number;
  attempt2Ms?: number;
  workerWaitMs?: number;
}): Promise<PillowProxyAttemptResult> {
  if (opts.accepted.kind !== "reasoning") {
    throw new Error("side_effect_retry_forbidden");
  }
  const totalBudgetMs = opts.totalBudgetMs ?? PILLOW_CHAT_TIMEOUTS.tier0TotalBudgetMs;
  const attempt1Ms = opts.attempt1Ms ?? PILLOW_CHAT_TIMEOUTS.tier0Attempt1Ms;
  const attempt2Ms = opts.attempt2Ms ?? PILLOW_CHAT_TIMEOUTS.tier0Attempt2Ms;
  const workerWaitMs = opts.workerWaitMs ?? PILLOW_CHAT_TIMEOUTS.workerReadyWaitMs;
  const emit = opts.onEvent ?? (() => undefined);

  emit("accepted", {
    requestId: opts.accepted.requestId,
    sessionId: opts.accepted.sessionId,
  });

  const ready0 = await opts.probeWorker(2_000);
  if (!ready0) {
    emit("worker_unavailable", { phase: "pre_attempt" });
    const becameReady = await waitForWorkerReady({
      probe: opts.probeWorker,
      maxWaitMs: Math.min(workerWaitMs, remainingBudgetMs(opts.accepted.acceptedAt, totalBudgetMs)),
    });
    if (becameReady) emit("worker_ready", { phase: "pre_attempt" });
  }

  const t1 = attemptTimeoutForBudget(
    remainingBudgetMs(opts.accepted.acceptedAt, totalBudgetMs),
    attempt1Ms,
  );
  emit("attempt_started", { attempt: 1, timeoutMs: t1 });
  const first = await opts.attempt(t1, 1);
  if (first.ok && first.messagePreview.length > 0) {
    emit("completed", { attempt: 1, requestId: opts.accepted.requestId });
    return first;
  }

  if (!isTransientProxyFailure(first) && first.ok === false && first.reason === "upstream_error") {
    // Non-retryable upstream (e.g. 401/400) — return as-is if we have body via ok path only.
    emit("terminal_infrastructure_failure", { attempt: 1, reason: first.reason });
    return first;
  }

  emit("retry_started", {
    requestId: opts.accepted.requestId,
    priorReason: first.ok ? "empty_message" : first.reason,
  });

  const waitCap = Math.min(
    workerWaitMs,
    remainingBudgetMs(opts.accepted.acceptedAt, totalBudgetMs) - attempt2Ms - 2_000,
  );
  if (waitCap > 0) {
    const ready = await waitForWorkerReady({
      probe: opts.probeWorker,
      maxWaitMs: waitCap,
    });
    if (ready) emit("worker_ready", { phase: "pre_retry" });
    else emit("worker_unavailable", { phase: "pre_retry" });
  }

  const rem = remainingBudgetMs(opts.accepted.acceptedAt, totalBudgetMs);
  if (rem < 6_000) {
    emit("terminal_infrastructure_failure", { reason: "budget_exhausted" });
    return { ok: false, reason: "timeout" };
  }

  const t2 = attemptTimeoutForBudget(rem, attempt2Ms);
  emit("attempt_started", { attempt: 2, timeoutMs: t2 });
  const second = await opts.attempt(t2, 2);
  if (second.ok && second.messagePreview.length > 0) {
    emit("retry_succeeded", { requestId: opts.accepted.requestId });
    emit("completed", { attempt: 2, requestId: opts.accepted.requestId });
    return second;
  }

  emit("terminal_infrastructure_failure", {
    requestId: opts.accepted.requestId,
    reason: second.ok ? "empty_message" : second.reason,
  });
  return second.ok ? { ok: false, reason: "empty_message", status: second.status } : second;
}
