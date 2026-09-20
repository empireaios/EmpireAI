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
  eval?(script: string, numKeys: number, ...args: Array<string | number>): Promise<unknown>;
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
  ownerId?: string;
  workspaceId?: string;
  /** Only reasoning requests use the durable replay queue. Never action tools. */
  queued?: boolean;
  leaseToken?: number;
  leaseExpiresAt?: number;
  nextAttemptAt?: number;
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
const JOB_PREFIX = "pillow:chatreq:job:";
const DUE_KEY = "pillow:chatreq:due";
const DLQ_KEY = "pillow:chatreq:dead";

const memory = new Map<string, DurableChatRequest>();
const memoryOrder: string[] = [];
let redis: RedisLike | null = null;
let requireRedisDurability = false;

export class PillowDurableStoreUnavailableError extends Error {
  constructor(message = "pillow_durable_store_unavailable", options?: ErrorOptions) {
    super(message, options);
    this.name = "PillowDurableStoreUnavailableError";
  }
}

export class PillowIdempotencyConflictError extends Error {
  constructor() { super("pillow_idempotency_key_reused_for_different_input"); }
}

export type RecoverableReasoningInput = {
  kind: "reasoning";
  bodyText: string;
  /** Kept only in the private job key, never returned in request/status APIs. */
  sessionToken: string;
};

export type ChatAcceptance = {
  request: DurableChatRequest;
  disposition: "CREATED" | "EXISTING_PENDING" | "EXISTING_COMPLETED" | "EXISTING_FAILED";
};

async function evalStore(script: string, keys: string[], args: Array<string | number>): Promise<unknown> {
  try {
    if (!redis?.eval) throw new Error("redis_atomic_operations_unavailable");
    return await redis.eval(script, keys.length, ...keys, ...args);
  } catch (cause) {
    throw new PillowDurableStoreUnavailableError(undefined, { cause });
  }
}

/** Inject Redis client from Tier-0 primary (preferred over auto-create). */
export function configureChatRequestStore(
  client: RedisLike | null,
  options: { requireRedisDurability?: boolean } = {},
): void {
  redis = client;
  requireRedisDurability = options.requireRedisDurability ?? false;
}

/** Test-only: clear process memory so Redis is the sole recovery path (BFF/process restart). */
export function dropChatRequestMemoryCacheForTests(): void {
  memory.clear();
  memoryOrder.length = 0;
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
  // Legacy mutators must never bypass the queue's lease/fence compare-and-set.
  if (rec.queued) throw new Error("queued_transition_requires_lease");
  rec.updatedAt = new Date().toISOString();
  rec.ts = rec.updatedAt;
  const r = ensureRedis();
  if (!r) {
    if (requireRedisDurability) {
      throw new PillowDurableStoreUnavailableError();
    }
    touchMemory(rec);
    return;
  }
  try {
    const requestWrite = await r.setex(
      key(rec.requestId),
      TTL_SEC,
      JSON.stringify(rec),
    );
    if (requireRedisDurability && requestWrite !== "OK") {
      throw new Error("redis_setex_request_not_acknowledged");
    }
    if (rec.idempotencyKey) {
      const idempotencyWrite = await r.setex(
        idemKey(rec.idempotencyKey),
        TTL_SEC,
        rec.requestId,
      );
      if (requireRedisDurability && idempotencyWrite !== "OK") {
        throw new Error("redis_setex_idempotency_not_acknowledged");
      }
    }
  } catch (error) {
    if (requireRedisDurability) {
      throw new PillowDurableStoreUnavailableError(undefined, { cause: error });
    }
  }
  // In strict Tier-0 mode, only expose a state transition in process memory
  // after Redis has acknowledged it. This keeps memory from contradicting the
  // durable source of truth when SETEX fails after a successful PING.
  touchMemory(rec);
}

function cloneRecord(rec: DurableChatRequest): DurableChatRequest {
  return structuredClone(rec);
}

function requireMutableRecord(
  rec: DurableChatRequest | null,
): DurableChatRequest | null {
  if (rec) return cloneRecord(rec);
  if (requireRedisDurability) {
    throw new PillowDurableStoreUnavailableError("pillow_durable_record_unavailable");
  }
  return null;
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
type AcceptOptions = {
  sessionId: string | null;
  message: string;
  requestId?: string;
  idempotencyKey?: string;
  contextAdmission?: "PASS" | "COMPACTED" | "REJECT";
  deploymentId?: string | null;
  ownerId?: string;
  workspaceId?: string;
  input?: RecoverableReasoningInput;
};

const ATOMIC_ACCEPT = `
local function expectType(k, expected)
  local t = redis.call('TYPE', k).ok
  if t ~= 'none' and t ~= expected then error('pillow_queue_wrong_type') end
end
expectType(KEYS[1], 'string')
expectType(KEYS[2], 'string')
expectType(KEYS[3], 'string')
expectType(KEYS[4], 'zset')
local existingId = redis.call('GET', KEYS[1])
if existingId then
  local raw = redis.call('GET', ARGV[4] .. existingId)
  if not raw then return {'BROKEN', ''} end
  local rec = cjson.decode(raw)
  if rec.inputHash ~= ARGV[5] then return {'CONFLICT', ''} end
  if rec.queued and rec.status ~= 'COMPLETED' and rec.status ~= 'FAILED_FATAL' then
    if not redis.call('GET', ARGV[8] .. existingId) or not redis.call('ZSCORE', KEYS[4], existingId) then
      return {'BROKEN', ''}
    end
  end
  return {'EXISTING', raw}
end
if redis.call('EXISTS', KEYS[2]) == 1 then return {'CONFLICT', ''} end
local encoded = ARGV[1]
local clock = redis.call('TIME')
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
if ARGV[6] ~= '' then
  local rec = cjson.decode(encoded)
  rec.nextAttemptAt = now
  encoded = cjson.encode(rec)
end
redis.call('SET', KEYS[2], encoded, 'EX', ARGV[2])
redis.call('SET', KEYS[1], ARGV[3], 'EX', ARGV[2])
if ARGV[6] ~= '' then
  redis.call('SET', KEYS[3], ARGV[6], 'EX', ARGV[2])
  redis.call('ZADD', KEYS[4], now, ARGV[3])
end
return {'CREATED', encoded}
`;

/** Record + deduplication + recovery index are one Redis transaction. */
export async function acceptDurableChatRequestClaim(opts: AcceptOptions): Promise<ChatAcceptance> {
  const sessionId = opts.sessionId ?? "nosession";
  if (opts.input && opts.input.kind !== "reasoning") throw new Error("side_effect_retry_forbidden");
  const scope = `${opts.workspaceId ?? ""}:${opts.ownerId ?? ""}:${sessionId}`;
  const inputHash = hashChatInput(scope, opts.input?.bodyText ?? opts.message);
  const idempotencyKey =
    opts.idempotencyKey?.trim()
      ? hashChatInput(scope, opts.idempotencyKey.trim())
      : `idem_${inputHash}`;

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
    ...(opts.ownerId ? { ownerId: opts.ownerId } : {}),
    ...(opts.workspaceId ? { workspaceId: opts.workspaceId } : {}),
    ...(opts.input ? { queued: true, leaseToken: 0, leaseExpiresAt: 0, nextAttemptAt: Date.now() } : {}),
    observability: {
      contextAdmission: opts.contextAdmission ?? "PASS",
      ...(opts.deploymentId ? { deploymentId: opts.deploymentId } : {}),
    },
  };
  if (redis?.eval || requireRedisDurability || opts.input) {
    const response = await evalStore(ATOMIC_ACCEPT,
      [idemKey(idempotencyKey), key(rec.requestId), `${JOB_PREFIX}${rec.requestId}`, DUE_KEY],
      [JSON.stringify(rec), TTL_SEC, rec.requestId, KEY_PREFIX, inputHash,
        opts.input ? JSON.stringify(opts.input) : "", rec.nextAttemptAt ?? Date.now(), JOB_PREFIX]);
    if (!Array.isArray(response) || response.length !== 2) throw new PillowDurableStoreUnavailableError();
    if (response[0] === "CONFLICT") throw new PillowIdempotencyConflictError();
    if (response[0] === "BROKEN") throw new PillowDurableStoreUnavailableError("pillow_durable_idempotency_record_unavailable");
    const request = JSON.parse(String(response[1])) as DurableChatRequest;
    touchMemory(request);
    return { request, disposition: response[0] === "CREATED" ? "CREATED" :
      request.status === "COMPLETED" ? "EXISTING_COMPLETED" :
      request.status === "FAILED_FATAL" || request.status === "FAILED" ? "EXISTING_FAILED" : "EXISTING_PENDING" };
  }
  // Explicitly process-local test/development mode, never production acceptance.
  const existing = [...memory.values()].find((item) => item.idempotencyKey === idempotencyKey);
  if (existing) {
    if (existing.inputHash !== inputHash) throw new PillowIdempotencyConflictError();
    return { request: cloneRecord(existing), disposition: existing.status === "COMPLETED" ? "EXISTING_COMPLETED" :
      existing.status === "FAILED_FATAL" ? "EXISTING_FAILED" : "EXISTING_PENDING" };
  }
  await persist(rec);
  return { request: rec, disposition: "CREATED" };
}

/** Compatibility reader. Callers dispatching work must use the disposition API. */
export async function acceptDurableChatRequest(opts: AcceptOptions): Promise<DurableChatRequest> {
  return (await acceptDurableChatRequestClaim(opts)).request;
}

const CLAIM_DUE = `
local clock = redis.call('TIME')
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', now - tonumber(ARGV[5]) * 1000)
local ids = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', now, 'LIMIT', 0, 100)
for _, id in ipairs(ids) do
  local rk = ARGV[1] .. id
  local jk = ARGV[2] .. id
  local raw = redis.call('GET', rk)
  local body = redis.call('GET', jk)
  if not raw then
    redis.call('ZREM', KEYS[1], id)
    redis.call('DEL', jk)
  else
    local rec = cjson.decode(raw)
    if rec.status == 'COMPLETED' or rec.status == 'FAILED_FATAL' then
      redis.call('ZREM', KEYS[1], id)
      redis.call('DEL', jk)
    elseif tonumber(rec.leaseExpiresAt or 0) <= now then
      if not body or tonumber(rec.attemptCount) >= tonumber(ARGV[4]) then
        rec.status = 'FAILED_FATAL'
        rec.failureClass = 'BUDGET_EXHAUSTED'
        rec.lastError = body and 'durable_retry_limit_exhausted' or 'durable_recovery_input_missing'
        rec.activeWorker = cjson.null
        rec.leaseExpiresAt = 0
        rec.updatedAt = ARGV[7]
        rec.ts = ARGV[7]
        redis.call('SET', rk, cjson.encode(rec), 'EX', ARGV[5])
        redis.call('ZREM', KEYS[1], id)
        redis.call('ZADD', KEYS[2], now, id)
        redis.call('DEL', jk)
      else
        rec.status = 'RUNNING'
        rec.attemptCount = tonumber(rec.attemptCount) + 1
        rec.leaseToken = tonumber(rec.leaseToken or 0) + 1
        rec.leaseExpiresAt = now + tonumber(ARGV[3])
        rec.activeWorker = ARGV[6]
        rec.updatedAt = ARGV[7]
        rec.ts = ARGV[7]
        rec.observability.brainStartedAt = ARGV[7]
        local encoded = cjson.encode(rec)
        redis.call('SET', rk, encoded, 'EX', ARGV[5])
        redis.call('EXPIRE', jk, ARGV[5])
        redis.call('ZADD', KEYS[1], rec.leaseExpiresAt, id)
        return {encoded, body}
      end
    end
  end
end
return {}
`;

export type ClaimedReasoningRequest = { request: DurableChatRequest; input: RecoverableReasoningInput };

export async function claimNextReasoningRequest(options: {
  owner: string;
  leaseMs: number;
  maxAttempts?: number;
}): Promise<ClaimedReasoningRequest | null> {
  const result = await evalStore(CLAIM_DUE, [DUE_KEY, DLQ_KEY],
    [KEY_PREFIX, JOB_PREFIX, Math.max(1, options.leaseMs), options.maxAttempts ?? 3,
      TTL_SEC, options.owner, new Date().toISOString()]);
  if (!Array.isArray(result)) throw new PillowDurableStoreUnavailableError();
  if (result.length === 0) return null;
  const request = JSON.parse(String(result[0])) as DurableChatRequest;
  const input = JSON.parse(String(result[1])) as RecoverableReasoningInput;
  if (input.kind !== "reasoning") throw new Error("side_effect_retry_forbidden");
  touchMemory(request);
  return { request, input };
}

const SETTLE_LEASE = `
for _, k in ipairs({KEYS[3], KEYS[4]}) do
  local t = redis.call('TYPE', k).ok
  if t ~= 'none' and t ~= 'zset' then error('pillow_queue_wrong_type') end
end
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local rec = cjson.decode(raw)
local clock = redis.call('TIME')
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
if rec.status ~= 'RUNNING' or tonumber(rec.leaseToken) ~= tonumber(ARGV[1]) or tonumber(rec.leaseExpiresAt) <= now then return 0 end
local patch = cjson.decode(ARGV[2])
rec.updatedAt = ARGV[3]
rec.ts = ARGV[3]
rec.activeWorker = cjson.null
rec.leaseExpiresAt = 0
rec.failureClass = patch.failureClass
if patch.result then
  rec.status = 'COMPLETED'
  rec.brainResult = patch.result
  rec.finalResult = patch.result
  rec.deliveryState = 'PENDING_CLIENT'
  rec.observability.brainCompletedAt = ARGV[3]
  rec.observability.resultPersistedAt = ARGV[3]
else
  rec.lastError = patch.error
  if patch.upstreamStatus then rec.upstreamStatus = patch.upstreamStatus end
  if patch.fatal or tonumber(rec.attemptCount) >= tonumber(ARGV[5]) then
    rec.status = 'FAILED_FATAL'
  else
    rec.status = 'RETRYABLE'
    rec.nextAttemptAt = now + tonumber(ARGV[6])
  end
end
redis.call('SET', KEYS[1], cjson.encode(rec), 'EX', ARGV[4])
-- Never remove recovery input/index before the final record has been persisted.
-- A later command error may leave cleanup work, but cannot lose the answer/job.
if rec.status == 'COMPLETED' or rec.status == 'FAILED_FATAL' then
  redis.call('ZREM', KEYS[3], rec.requestId)
  if rec.status == 'FAILED_FATAL' then redis.call('ZADD', KEYS[4], now, rec.requestId) end
  redis.call('DEL', KEYS[2])
else
  redis.call('ZADD', KEYS[3], rec.nextAttemptAt, rec.requestId)
end
return 1
`;

/** A stale/dead worker cannot overwrite a newer attempt's result. */
export async function settleReasoningRequest(options: {
  requestId: string;
  leaseToken: number;
  result?: Record<string, unknown>;
  failureClass?: ChatFailureClass;
  error?: string;
  upstreamStatus?: number;
  fatal?: boolean;
  maxAttempts?: number;
  retryDelayMs?: number;
}): Promise<boolean> {
  const patch = {
    result: options.result,
    failureClass: options.result ? "BRAIN_SUCCESS" : options.failureClass ?? "UNKNOWN",
    error: options.error?.slice(0, 500),
    upstreamStatus: options.upstreamStatus,
    fatal: options.fatal ?? false,
  };
  const result = await evalStore(SETTLE_LEASE,
    [key(options.requestId), `${JOB_PREFIX}${options.requestId}`, DUE_KEY, DLQ_KEY],
    [options.leaseToken, JSON.stringify(patch), new Date().toISOString(), TTL_SEC,
      options.maxAttempts ?? 3, Math.max(0, options.retryDelayMs ?? 5_000)]);
  if (result !== 0 && result !== 1) throw new PillowDurableStoreUnavailableError();
  memory.delete(options.requestId);
  return result === 1;
}

export async function markChatRequestRunning(
  requestId: string,
  attempt: number,
  activeWorker?: string | null,
): Promise<void> {
  const rec = requireMutableRecord(await getChatRequest(requestId));
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
  const rec = requireMutableRecord(await getChatRequest(requestId));
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
  const rec = requireMutableRecord(await getChatRequest(requestId));
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
  const rec = requireMutableRecord(await getChatRequest(requestId));
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
  const rec = requireMutableRecord(await getChatRequest(requestId));
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
  if (redis?.eval) {
    await evalStore(`
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local rec = cjson.decode(raw)
if rec.status ~= 'COMPLETED' then return 0 end
rec.deliveryState = ARGV[1]
rec.updatedAt = ARGV[2]
rec.ts = ARGV[2]
if ARGV[1] == 'DELIVERED' or ARGV[1] == 'RETRIEVED' then rec.observability.deliveryCompletedAt = ARGV[2] end
redis.call('SET', KEYS[1], cjson.encode(rec), 'EX', ARGV[3])
return 1
`, [key(requestId)], [state, new Date().toISOString(), TTL_SEC]);
    memory.delete(requestId);
    return;
  }
  const rec = requireMutableRecord(await getChatRequest(requestId));
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
  if (!requireRedisDurability && !redis && memory.has(requestId)) return cloneRecord(memory.get(requestId)!);
  const r = ensureRedis();
  if (!r) {
    if (requireRedisDurability) {
      throw new PillowDurableStoreUnavailableError();
    }
    return null;
  }
  try {
    const raw = await r.get(key(requestId));
    if (!raw) return null;
    const rec = JSON.parse(raw) as DurableChatRequest;
    if (rec.status === "FAILED") rec.status = "FAILED_FATAL";
    touchMemory(rec);
    return rec;
  } catch (error) {
    if (requireRedisDurability) {
      throw new PillowDurableStoreUnavailableError(undefined, { cause: error });
    }
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
    RECOVERY_QUEUE: "Redis due index; boot/periodic sweeper; leased and fenced reasoning only",
    MAX_ATTEMPTS: 3,
    SIDE_EFFECT_REPLAY: "FORBIDDEN",
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
