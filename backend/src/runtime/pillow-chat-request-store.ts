/**
 * Durable Pillow chat request state machine (canonical Tier-0 owned).
 * Survives BFF/worker recycle via Redis when REDIS_URL is set; memory is warm cache only.
 *
 * Lifecycle: RECEIVED → ACCEPTED → RUNNING → COMPLETED
 *                         ↘ RETRYABLE → RUNNING …
 *                         ↘ FAILED_FATAL
 *
 * Sync HTTP window ≠ request lifetime. Result persist precedes user delivery.
 */
import { createHash, randomUUID } from "node:crypto";

type RedisLike = {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
};

export type ChatRequestStatus =
  | "RECEIVED"
  | "ACCEPTED"
  | "RUNNING"
  | "RETRYABLE"
  | "COMPLETED"
  | "FAILED_FATAL"
  /** @deprecated alias — maps to FAILED_FATAL for older readers */
  | "FAILED";

export type ChatDeliveryState =
  | "NOT_STARTED"
  | "NOT_DELIVERED"
  | "ATTEMPTED"
  | "DELIVERED"
  | "RETRIEVED"
  | "PENDING_CLIENT"
  | "FAILED_DELIVERY";

/** Canonical failure taxonomy — deterministic policy per class (see docs). */
export type ChatFailureClass =
  | "NONE"
  | "BRAIN_SUCCESS"
  | "REQUEST_REJECTED"
  | "CONTEXT_ADMISSION_FAILURE"
  | "WORKER_UNAVAILABLE"
  | "WORKER_RECYCLED"
  | "UPSTREAM_4XX_FATAL"
  | "UPSTREAM_4XX_RETRYABLE"
  | "UPSTREAM_5XX_RETRYABLE"
  | "BRAIN_TIMEOUT_RETRYABLE"
  | "BRAIN_FATAL"
  | "POSTPROCESS_FAILURE"
  | "RESULT_PERSIST_FAILURE"
  | "DELIVERY_FAILURE"
  | "CLIENT_DISCONNECT"
  | "REQUEST_NOT_ACCEPTED"
  | "UPSTREAM_4XX"
  | "UPSTREAM_5XX"
  | "PROXY_ERROR"
  | "NETWORK"
  | "TIMEOUT"
  | "BUDGET_EXHAUSTED"
  | "BRAIN_RETRYABLE_FAILURE"
  | "UNKNOWN";

export type FailurePolicy = "RETRY" | "FAIL" | "CONTINUE" | "DELIVER_PERSISTED_RESULT";

export const FAILURE_POLICY: Record<ChatFailureClass, FailurePolicy> = {
  NONE: "CONTINUE",
  BRAIN_SUCCESS: "DELIVER_PERSISTED_RESULT",
  REQUEST_REJECTED: "FAIL",
  CONTEXT_ADMISSION_FAILURE: "FAIL",
  WORKER_UNAVAILABLE: "RETRY",
  WORKER_RECYCLED: "RETRY",
  UPSTREAM_4XX_FATAL: "FAIL",
  UPSTREAM_4XX_RETRYABLE: "RETRY",
  UPSTREAM_5XX_RETRYABLE: "RETRY",
  BRAIN_TIMEOUT_RETRYABLE: "RETRY",
  BRAIN_FATAL: "FAIL",
  POSTPROCESS_FAILURE: "FAIL",
  RESULT_PERSIST_FAILURE: "RETRY",
  DELIVERY_FAILURE: "DELIVER_PERSISTED_RESULT",
  CLIENT_DISCONNECT: "CONTINUE",
  REQUEST_NOT_ACCEPTED: "FAIL",
  UPSTREAM_4XX: "FAIL",
  UPSTREAM_5XX: "RETRY",
  PROXY_ERROR: "RETRY",
  NETWORK: "RETRY",
  TIMEOUT: "RETRY",
  BUDGET_EXHAUSTED: "RETRY",
  BRAIN_RETRYABLE_FAILURE: "RETRY",
  UNKNOWN: "RETRY",
};

export type DurableChatRequest = {
  requestId: string;
  sessionId: string;
  inputHash: string;
  idempotencyKey: string;
  status: ChatRequestStatus;
  createdAt: string;
  updatedAt: string;
  /** @deprecated use updatedAt */
  ts: string;
  attemptCount: number;
  activeWorker: string | null;
  failureClass: ChatFailureClass;
  brainResult: Record<string, unknown> | null;
  finalResult: Record<string, unknown> | null;
  deliveryState: ChatDeliveryState;
  lastError?: string;
  upstreamStatus?: number;
  messagePreview: string;
    observability: {
      brainStartedAt?: string;
      brainCompletedAt?: string;
      resultPersistedAt?: string;
      deliveryAttemptedAt?: string;
      deliveryCompletedAt?: string;
      contextAdmission?: "PASS" | "COMPACTED" | "REJECT";
      deploymentId?: string;
    };
};

const TTL_SEC = Math.max(300, Number(process.env.PILLOW_CHAT_REQUEST_TTL_SEC ?? 86_400));
const MEMORY_CAP = 500;
const KEY_PREFIX = "pillow:chatreq:v2:";
const IDEM_PREFIX = "pillow:chatreq:idem:";

const memory = new Map<string, DurableChatRequest>();
const memoryOrder: string[] = [];
let redis: RedisLike | null = null;

/** Inject Redis client from Tier-0 primary (preferred over auto-create). */
export function configureChatRequestStore(client: RedisLike | null): void {
  redis = client;
}

function ensureRedis(): RedisLike | null {
  return redis;
}

function key(id: string): string {
  return `${KEY_PREFIX}${id}`;
}

function idemKey(k: string): string {
  return `${IDEM_PREFIX}${k}`;
}

function touchMemory(rec: DurableChatRequest): void {
  memory.set(rec.requestId, rec);
  const idx = memoryOrder.indexOf(rec.requestId);
  if (idx >= 0) memoryOrder.splice(idx, 1);
  memoryOrder.unshift(rec.requestId);
  while (memoryOrder.length > MEMORY_CAP) {
    const drop = memoryOrder.pop();
    if (drop) memory.delete(drop);
  }
}

async function persist(rec: DurableChatRequest): Promise<void> {
  rec.updatedAt = new Date().toISOString();
  rec.ts = rec.updatedAt;
  touchMemory(rec);
  const r = ensureRedis();
  if (!r) return;
  try {
    await r.setex(key(rec.requestId), TTL_SEC, JSON.stringify(rec));
    if (rec.idempotencyKey) {
      await r.setex(idemKey(rec.idempotencyKey), TTL_SEC, rec.requestId);
    }
  } catch {
    /* memory remains authoritative for this process */
  }
}

export function hashChatInput(sessionId: string, message: string): string {
  return createHash("sha256")
    .update(`${sessionId}\n${String(message ?? "").trim()}`)
    .digest("hex")
    .slice(0, 32);
}

export function newPillowChatRequestId(): string {
  return `pcr_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function policyForFailure(fc: ChatFailureClass): FailurePolicy {
  return FAILURE_POLICY[fc] ?? "RETRY";
}

export function classifyUpstreamFailure(opts: {
  status?: number;
  code?: string;
  message?: string;
}): ChatFailureClass {
  const status = opts.status ?? 0;
  const blob = `${opts.code ?? ""} ${opts.message ?? ""}`.toLowerCase();
  if (blob.includes("recycl") || blob.includes("worker gone") || blob.includes("sigterm")) {
    return "WORKER_RECYCLED";
  }
  if (status === 408 || status === 504 || blob.includes("timeout")) {
    return "BRAIN_TIMEOUT_RETRYABLE";
  }
  if (status >= 500) return "UPSTREAM_5XX_RETRYABLE";
  if (status === 429 || status === 408) return "UPSTREAM_4XX_RETRYABLE";
  if (status === 400 || status === 401 || status === 403 || status === 404 || status === 422) {
    if (blob.includes("context") || blob.includes("schema") || blob.includes("zod")) {
      return "CONTEXT_ADMISSION_FAILURE";
    }
    return "UPSTREAM_4XX_FATAL";
  }
  if (status >= 400 && status < 500) return "UPSTREAM_4XX_FATAL";
  if (blob.includes("econnreset") || blob.includes("network") || blob.includes("fetch failed")) {
    return "NETWORK";
  }
  return "UNKNOWN";
}

/**
 * DUPLICATE_EXECUTION_POLICY=REUSE_INFLIGHT_OR_COMPLETED
 * Same idempotency key within TTL returns existing request; no second brain start while RUNNING.
 */
export async function acceptDurableChatRequest(opts: {
  sessionId: string | null;
  message: string;
  requestId?: string;
  idempotencyKey?: string;
  contextAdmission?: "PASS" | "COMPACTED" | "REJECT";
  deploymentId?: string | null;
}): Promise<DurableChatRequest> {
  const sessionId = opts.sessionId ?? "nosession";
  const inputHash = hashChatInput(sessionId, opts.message);
  const idempotencyKey =
    opts.idempotencyKey?.trim() ||
    `idem_${sessionId}_${inputHash}`;

  const r = ensureRedis();
  if (r) {
    try {
      const existingId = await r.get(idemKey(idempotencyKey));
      if (existingId) {
        const existing = await getChatRequest(existingId);
        if (
          existing &&
          (existing.status === "RUNNING" ||
            existing.status === "ACCEPTED" ||
            existing.status === "RETRYABLE" ||
            existing.status === "RECEIVED" ||
            existing.status === "COMPLETED")
        ) {
          return existing;
        }
      }
    } catch {
      /* fall through */
    }
  }

  const now = new Date().toISOString();
  const rec: DurableChatRequest = {
    requestId: opts.requestId?.trim() || newPillowChatRequestId(),
    sessionId,
    inputHash,
    idempotencyKey,
    status: "ACCEPTED",
    createdAt: now,
    updatedAt: now,
    ts: now,
    attemptCount: 0,
    activeWorker: null,
    failureClass: "NONE",
    brainResult: null,
    finalResult: null,
    deliveryState: "NOT_STARTED",
    messagePreview: String(opts.message ?? "").slice(0, 160),
    observability: {
      contextAdmission: opts.contextAdmission ?? "PASS",
      ...(opts.deploymentId ? { deploymentId: opts.deploymentId } : {}),
    },
  };
  await persist(rec);
  return rec;
}

export async function markChatRequestRunning(
  requestId: string,
  attempt: number,
  activeWorker?: string | null,
): Promise<void> {
  const rec = await getChatRequest(requestId);
  if (!rec) return;
  rec.status = "RUNNING";
  rec.attemptCount = attempt;
  if (activeWorker !== undefined) rec.activeWorker = activeWorker;
  rec.observability = {
    ...rec.observability,
    brainStartedAt: new Date().toISOString(),
  };
  await persist(rec);
}

export async function markChatRequestRetryable(
  requestId: string,
  opts: {
    failureClass: ChatFailureClass;
    error?: string;
    upstreamStatus?: number;
    attempt?: number;
  },
): Promise<void> {
  const rec = await getChatRequest(requestId);
  if (!rec) return;
  if (rec.status === "COMPLETED") return;
  rec.status = "RETRYABLE";
  rec.failureClass = opts.failureClass;
  if (opts.error) rec.lastError = opts.error.slice(0, 500);
  if (opts.upstreamStatus != null) rec.upstreamStatus = opts.upstreamStatus;
  if (opts.attempt != null) rec.attemptCount = opts.attempt;
  rec.activeWorker = null;
  await persist(rec);
}

/** Persist brain result BEFORE delivery attempt. */
export async function completeChatRequest(
  requestId: string,
  result: Record<string, unknown>,
): Promise<void> {
  const rec = await getChatRequest(requestId);
  if (!rec) return;
  const now = new Date().toISOString();
  rec.status = "COMPLETED";
  rec.brainResult = result;
  rec.finalResult = result;
  rec.failureClass = "BRAIN_SUCCESS";
  rec.observability = {
    ...rec.observability,
    brainCompletedAt: now,
    resultPersistedAt: now,
  };
  await persist(rec);
}

export async function markDeliveryAttempted(requestId: string): Promise<void> {
  const rec = await getChatRequest(requestId);
  if (!rec) return;
  rec.deliveryState = "ATTEMPTED";
  rec.observability = {
    ...rec.observability,
    deliveryAttemptedAt: new Date().toISOString(),
  };
  await persist(rec);
}

export async function failChatRequest(
  requestId: string,
  opts: {
    failureClass: ChatFailureClass;
    error?: string;
    /** @deprecated alias for error */
    errorClass?: string;
    upstreamStatus?: number;
    attempt?: number;
    fatal?: boolean;
  },
): Promise<void> {
  const rec = await getChatRequest(requestId);
  if (!rec) return;
  const errText = opts.error ?? opts.errorClass;
  const policy = policyForFailure(opts.failureClass);
  const forceFatal = opts.fatal === true || policy === "FAIL";
  if (!forceFatal && policy === "RETRY") {
    await markChatRequestRetryable(requestId, {
      failureClass: opts.failureClass,
      error: errText,
      upstreamStatus: opts.upstreamStatus,
      attempt: opts.attempt,
    });
    return;
  }
  rec.status = "FAILED_FATAL";
  rec.failureClass = opts.failureClass;
  if (errText) rec.lastError = errText.slice(0, 500);
  if (opts.upstreamStatus != null) rec.upstreamStatus = opts.upstreamStatus;
  if (opts.attempt != null) rec.attemptCount = opts.attempt;
  await persist(rec);
}

export async function markChatRequestDelivered(
  requestId: string,
  state: ChatDeliveryState = "DELIVERED",
): Promise<void> {
  const rec = await getChatRequest(requestId);
  if (!rec) return;
  rec.deliveryState = state;
  if (state === "DELIVERED") {
    rec.observability = {
      ...rec.observability,
      deliveryCompletedAt: new Date().toISOString(),
    };
  }
  await persist(rec);
}

export async function getChatRequest(requestId: string): Promise<DurableChatRequest | null> {
  if (memory.has(requestId)) return memory.get(requestId)!;
  const r = ensureRedis();
  if (!r) return null;
  try {
    const raw = await r.get(key(requestId));
    if (!raw) return null;
    const rec = JSON.parse(raw) as DurableChatRequest;
    if (rec.status === "FAILED") rec.status = "FAILED_FATAL";
    touchMemory(rec);
    return rec;
  } catch {
    return null;
  }
}

export function listRecentChatRequests(limit = 40): DurableChatRequest[] {
  return memoryOrder
    .slice(0, limit)
    .map((id) => memory.get(id)!)
    .filter(Boolean);
}

export function chatRequestDashboard() {
  const rows = listRecentChatRequests(200);
  return {
    TOTAL: rows.length,
    COMPLETED: rows.filter((r) => r.status === "COMPLETED").length,
    FAILED: rows.filter((r) => r.status === "FAILED_FATAL" || r.status === "FAILED").length,
    RETRYABLE: rows.filter((r) => r.status === "RETRYABLE").length,
    RUNNING: rows.filter(
      (r) => r.status === "RUNNING" || r.status === "ACCEPTED" || r.status === "RECEIVED",
    ).length,
    TTL_SEC,
    REQUEST_STATE_STORE: ensureRedis() ? "redis+memory" : "memory",
    recent: rows.slice(0, 30),
  };
}

export function durabilityMeta() {
  return {
    REQUEST_STATE_STORE: ensureRedis() ? "redis+memory" : "memory-fallback",
    DURABILITY_SCOPE: "cross-process when REDIS_URL set; process-local otherwise",
    TTL: `${TTL_SEC}s`,
    CLEANUP_POLICY: `Redis EX TTL ${TTL_SEC}s; memory LRU cap ${MEMORY_CAP}`,
    SYNC_WINDOW_MS: Number(process.env.PILLOW_CHAT_SYNC_WINDOW_MS ?? 120_000),
    REQUEST_LIFETIME: `${TTL_SEC}s`,
    RESULT_TTL: `${TTL_SEC}s`,
    RETRY_OWNER: "Tier-0",
    IDEMPOTENCY_KEY: "idem_${sessionId}_${inputHash}",
    DUPLICATE_EXECUTION_POLICY: "REUSE_INFLIGHT_OR_COMPLETED",
  };
}

/** Admit client workspace continuity envelope before hard validation failures. */
export function admitWorkspaceContextEnvelopeWithMeta(raw: unknown): {
  admitted: unknown;
  result: "PASS" | "COMPACTED" | "REJECT";
} {
  if (!raw || typeof raw !== "object") return { admitted: raw, result: "PASS" };
  const ctx = { ...(raw as Record<string, unknown>) };
  const turns = ctx.recentConversationTurns;
  if (!Array.isArray(turns)) return { admitted: ctx, result: "PASS" };
  let compacted = false;
  ctx.recentConversationTurns = turns.slice(-16).map((t) => {
    if (!t || typeof t !== "object") return t;
    const turn = { ...(t as Record<string, unknown>) };
    const content = String(turn.content ?? "");
    if (content.length > 8000) {
      turn.content = `${content.slice(0, 7970)}…`;
      compacted = true;
    }
    return turn;
  });
  return { admitted: ctx, result: compacted ? "COMPACTED" : "PASS" };
}

/** Backward-compatible: returns admitted envelope only. */
export function admitWorkspaceContextEnvelope(raw: unknown): unknown {
  return admitWorkspaceContextEnvelopeWithMeta(raw).admitted;
}

export function admitChatRequestBody(rawBody: string | Buffer | undefined): {
  bodyText: string;
  mutated: boolean;
  contextAdmission: "PASS" | "COMPACTED" | "REJECT";
} {
  if (rawBody == null) return { bodyText: "", mutated: false, contextAdmission: "PASS" };
  const text =
    typeof rawBody === "string"
      ? rawBody
      : Buffer.isBuffer(rawBody)
        ? rawBody.toString("utf8")
        : String(rawBody);
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") {
      return { bodyText: text, mutated: false, contextAdmission: "PASS" };
    }
    if (!parsed.workspaceContext) {
      return { bodyText: text, mutated: false, contextAdmission: "PASS" };
    }
    const before = JSON.stringify(parsed.workspaceContext);
    const { admitted, result } = admitWorkspaceContextEnvelopeWithMeta(parsed.workspaceContext);
    parsed.workspaceContext = admitted;
    const after = JSON.stringify(parsed.workspaceContext);
    if (before === after) return { bodyText: text, mutated: false, contextAdmission: result };
    return { bodyText: JSON.stringify(parsed), mutated: true, contextAdmission: result };
  } catch {
    return { bodyText: text, mutated: false, contextAdmission: "PASS" };
  }
}
