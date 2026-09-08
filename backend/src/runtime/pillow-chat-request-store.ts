/**
 * Durable Pillow chat request/result registry (Tier-0 primary).
 * Survives Brain worker recycle. Redis when available; memory fallback.
 * Architecture MVA — not an incremental timeout/sanitizer patch.
 */
import { createHash, randomUUID } from "node:crypto";

export type ChatRequestStatus =
  | "ACCEPTED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED";

export type ChatFailureClass =
  | "NONE"
  | "REQUEST_NOT_ACCEPTED"
  | "WORKER_UNAVAILABLE"
  | "BRAIN_RETRYABLE_FAILURE"
  | "BRAIN_FATAL_FAILURE"
  | "BRAIN_SUCCESS"
  | "POSTPROCESS_FAILURE"
  | "DELIVERY_FAILURE"
  | "CLIENT_DISCONNECTED"
  | "BUDGET_EXHAUSTED"
  | "UPSTREAM_ERROR"
  | "TIMEOUT";

export type ChatDeliveryState = "NOT_DELIVERED" | "DELIVERED" | "RETRIEVED";

export type DurableChatRequest = {
  requestId: string;
  sessionId: string | null;
  status: ChatRequestStatus;
  inputHash: string;
  inputPreview: string;
  attempt: number;
  failureClass: ChatFailureClass;
  brainResult: {
    message: string;
    kind: string | null;
    outputHash: string;
    length: number;
  } | null;
  finalResult: {
    message: string;
    kind: string | null;
  } | null;
  deliveryState: ChatDeliveryState;
  errorClass: string | null;
  upstreamStatus: number | null;
  acceptedAt: number;
  startedAt: number | null;
  completedAt: number | null;
  deploymentId: string | null;
  ts: string;
};

type RedisLike = {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
};

const MEMORY_MAX = 500;
const TTL_SEC = 86_400;
const memory = new Map<string, DurableChatRequest>();
const memoryOrder: string[] = [];
let redis: RedisLike | null = null;

function key(id: string): string {
  return `pillow:chatreq:${id}`;
}

export function hashInput(text: string): string {
  return createHash("sha256").update(String(text || ""), "utf8").digest("hex").slice(0, 16);
}

export function previewInput(text: string, n = 160): string {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

export function configureChatRequestStore(client: RedisLike | null): void {
  redis = client;
}

function touchMemory(rec: DurableChatRequest): void {
  memory.set(rec.requestId, rec);
  const idx = memoryOrder.indexOf(rec.requestId);
  if (idx >= 0) memoryOrder.splice(idx, 1);
  memoryOrder.unshift(rec.requestId);
  while (memoryOrder.length > MEMORY_MAX) {
    const drop = memoryOrder.pop();
    if (drop) memory.delete(drop);
  }
}

async function persist(rec: DurableChatRequest): Promise<void> {
  touchMemory(rec);
  if (!redis) return;
  try {
    await redis.setex(key(rec.requestId), TTL_SEC, JSON.stringify(rec));
  } catch {
    /* memory remains source for this process */
  }
}

export async function acceptDurableChatRequest(input: {
  requestId?: string;
  sessionId: string | null;
  message: string;
  deploymentId?: string | null;
}): Promise<DurableChatRequest> {
  const requestId = input.requestId || `pcr_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const rec: DurableChatRequest = {
    requestId,
    sessionId: input.sessionId,
    status: "ACCEPTED",
    inputHash: hashInput(input.message),
    inputPreview: previewInput(input.message),
    attempt: 0,
    failureClass: "NONE",
    brainResult: null,
    finalResult: null,
    deliveryState: "NOT_DELIVERED",
    errorClass: null,
    upstreamStatus: null,
    acceptedAt: Date.now(),
    startedAt: null,
    completedAt: null,
    deploymentId: input.deploymentId ?? null,
    ts: new Date().toISOString(),
  };
  await persist(rec);
  return rec;
}

export async function markChatRequestRunning(
  requestId: string,
  attempt: number,
): Promise<DurableChatRequest | null> {
  const rec = await getChatRequest(requestId);
  if (!rec) return null;
  rec.status = "RUNNING";
  rec.attempt = attempt;
  rec.startedAt = rec.startedAt ?? Date.now();
  rec.ts = new Date().toISOString();
  await persist(rec);
  return rec;
}

export async function completeChatRequest(
  requestId: string,
  result: { message: string; kind?: string | null },
): Promise<DurableChatRequest | null> {
  const rec = await getChatRequest(requestId);
  if (!rec) return null;
  const message = String(result.message || "");
  const outputHash = hashInput(message);
  rec.status = "COMPLETED";
  rec.failureClass = "BRAIN_SUCCESS";
  rec.brainResult = {
    message,
    kind: result.kind ?? null,
    outputHash,
    length: message.length,
  };
  rec.finalResult = { message, kind: result.kind ?? null };
  rec.completedAt = Date.now();
  rec.errorClass = null;
  rec.ts = new Date().toISOString();
  await persist(rec);
  return rec;
}

export async function failChatRequest(
  requestId: string,
  opts: {
    failureClass: ChatFailureClass;
    errorClass?: string | null;
    upstreamStatus?: number | null;
    attempt?: number;
  },
): Promise<DurableChatRequest | null> {
  const rec = await getChatRequest(requestId);
  if (!rec) return null;
  rec.status = "FAILED";
  rec.failureClass = opts.failureClass;
  rec.errorClass = opts.errorClass ?? null;
  rec.upstreamStatus = opts.upstreamStatus ?? null;
  if (typeof opts.attempt === "number") rec.attempt = opts.attempt;
  rec.completedAt = Date.now();
  rec.ts = new Date().toISOString();
  await persist(rec);
  return rec;
}

export async function markChatRequestDelivered(
  requestId: string,
  state: ChatDeliveryState = "DELIVERED",
): Promise<void> {
  const rec = await getChatRequest(requestId);
  if (!rec) return;
  rec.deliveryState = state;
  rec.ts = new Date().toISOString();
  await persist(rec);
}

export async function getChatRequest(requestId: string): Promise<DurableChatRequest | null> {
  if (memory.has(requestId)) return memory.get(requestId)!;
  if (!redis) return null;
  try {
    const raw = await redis.get(key(requestId));
    if (!raw) return null;
    const rec = JSON.parse(raw) as DurableChatRequest;
    touchMemory(rec);
    return rec;
  } catch {
    return null;
  }
}

export function listRecentChatRequests(limit = 40): DurableChatRequest[] {
  return memoryOrder.slice(0, limit).map((id) => memory.get(id)!).filter(Boolean);
}

export function chatRequestDashboard() {
  const rows = listRecentChatRequests(200);
  return {
    TOTAL: rows.length,
    COMPLETED: rows.filter((r) => r.status === "COMPLETED").length,
    FAILED: rows.filter((r) => r.status === "FAILED").length,
    RUNNING: rows.filter((r) => r.status === "RUNNING" || r.status === "ACCEPTED").length,
    recent: rows.slice(0, 30),
  };
}

/** Admit client workspace continuity envelope before hard validation failures. */
export function admitWorkspaceContextEnvelope(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const ctx = { ...(raw as Record<string, unknown>) };
  const turns = ctx.recentConversationTurns;
  if (!Array.isArray(turns)) return ctx;
  ctx.recentConversationTurns = turns.slice(-16).map((t) => {
    if (!t || typeof t !== "object") return t;
    const turn = { ...(t as Record<string, unknown>) };
    const content = String(turn.content ?? "");
    if (content.length > 8000) turn.content = `${content.slice(0, 7970)}…`;
    return turn;
  });
  return ctx;
}

export function admitChatRequestBody(rawBody: string | Buffer | undefined): {
  bodyText: string;
  mutated: boolean;
} {
  if (rawBody == null) return { bodyText: "", mutated: false };
  const text =
    typeof rawBody === "string"
      ? rawBody
      : Buffer.isBuffer(rawBody)
        ? rawBody.toString("utf8")
        : String(rawBody);
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return { bodyText: text, mutated: false };
    if (!parsed.workspaceContext) return { bodyText: text, mutated: false };
    const before = JSON.stringify(parsed.workspaceContext);
    parsed.workspaceContext = admitWorkspaceContextEnvelope(parsed.workspaceContext);
    const after = JSON.stringify(parsed.workspaceContext);
    if (before === after) return { bodyText: text, mutated: false };
    return { bodyText: JSON.stringify(parsed), mutated: true };
  } catch {
    return { bodyText: text, mutated: false };
  }
}
