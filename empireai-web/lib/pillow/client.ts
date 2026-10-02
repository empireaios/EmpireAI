/**
 * Pillow host client — connects empireai-web to existing /api/pillow/* backend routes.
 */

import type {
  PillowChatResult,
  PillowHealth,
  PillowHostStatus,
  PillowWorkspaceSession,
} from "./types";
import { toExecutiveSurfaceMessage } from "./executive-surface";
import {
  pendingDurableResult,
  resultFromDurableRecord,
  type DurableChatRecord,
  type DurableReceipt,
} from "./durable-delivery";

/** Outer of BFF (280s) — must exceed upstream so first request can finish. */
const PILLOW_REQUEST_TIMEOUT_MS = 290_000;
const PILLOW_SESSION_TIMEOUT_MS = 60_000;
/** Non-chat routes only. Chat retry ownership is Tier-0 durable recovery. */
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 400;
const CHAT_RESULT_POLL_MS = 2_000;
/** Align with Tier-0 total budget (260s) so slow recoveries still surface in ordinary chat. */
const CHAT_RESULT_POLL_BUDGET_MS = 240_000;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const done = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const timer = setTimeout(done, ms);
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
  });
}

function normalizePillowNetworkError(error: unknown): Error {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return new Error("The connection timed out. Completion has not been confirmed.");
    }
    if (error.message === "Failed to fetch") {
      return new Error("The connection was interrupted. Completion has not been confirmed.");
    }
    return error;
  }
  return new Error("Starting Executive Systems…");
}

async function pillowFetchWithRetry(
  input: string,
  init: RequestInit,
  retries = MAX_RETRIES,
  timeoutMs = PILLOW_REQUEST_TIMEOUT_MS,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const abort = () => controller.abort();
    if (init.signal?.aborted) controller.abort();
    init.signal?.addEventListener("abort", abort, { once: true });

    try {
      const response = await fetch(input, {
        ...init,
        credentials: "include",
        signal: controller.signal,
      });

      if (response.ok || response.status < 500 || attempt === retries) {
        return response;
      }

      lastError = new Error(`Pillow request failed (${response.status})`);
      if (attempt < retries) {
        await sleep(BASE_DELAY_MS * 2 ** attempt);
      }
    } catch (error) {
      if (init.signal?.aborted) throw error;
      lastError = normalizePillowNetworkError(error);
      if (attempt < retries) {
        await sleep(BASE_DELAY_MS * 2 ** attempt);
      }
    } finally {
      clearTimeout(timeout);
      init.signal?.removeEventListener("abort", abort);
    }
  }

  throw lastError ?? new Error("Pillow request failed");
}

async function pillowRequest<T>(
  path: string,
  init?: RequestInit & { params?: Record<string, string | undefined>; timeoutMs?: number; retries?: number },
): Promise<T> {
  const url = new URL(path, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  if (init?.params) {
    for (const [key, value] of Object.entries(init.params)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }

  try {
    const response = await pillowFetchWithRetry(
      url.pathname + url.search,
      {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      },
      init?.retries ?? MAX_RETRIES,
      init?.timeoutMs ?? PILLOW_REQUEST_TIMEOUT_MS,
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(
        toExecutiveSurfaceMessage(
          body.error ?? `Pillow request failed (${response.status})`,
        ),
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    throw normalizePillowNetworkError(error);
  }
}

export async function fetchPillowHealth(): Promise<{ health: PillowHealth; missionId: string; lifecycle: string }> {
  return pillowRequest("/api/pillow/health");
}

export async function fetchPillowStatus(): Promise<{ status: PillowHostStatus }> {
  return pillowRequest("/api/pillow/status");
}

const inflightSessionCreates = new Map<string, Promise<PillowWorkspaceSession>>();

export async function createPillowHostSession(workspaceId?: string, ownerId?: string): Promise<PillowWorkspaceSession> {
  // Coalesce concurrent creates — cockpit bootstrap + recovery must not stampede Brain.
  // A new signed-in owner must never inherit another owner's in-flight session.
  const key = JSON.stringify([ownerId ?? null, workspaceId ?? null]);
  const existing = inflightSessionCreates.get(key);
  if (existing) return existing;
  const pending = pillowRequest<{ session: PillowWorkspaceSession }>("/api/pillow/session", {
      method: "POST",
      body: JSON.stringify(workspaceId ? { workspaceId } : {}),
      timeoutMs: PILLOW_SESSION_TIMEOUT_MS,
      // No automatic HTTP retries — caller owns backoff to avoid request storms.
      retries: 0,
    })
      .then((result) => result.session)
      .finally(() => {
        inflightSessionCreates.delete(key);
      });
  inflightSessionCreates.set(key, pending);
  return pending;
}

export async function fetchPillowChatRequest(requestId: string, signal?: AbortSignal, timeoutMs = 20_000): Promise<{
  ok: boolean;
  request?: DurableChatRecord;
}> {
  return pillowRequest(`/api/pillow/chat-request/${encodeURIComponent(requestId)}`, {
    method: "GET",
    cache: "no-store",
    signal,
    timeoutMs,
    retries: 0,
  });
}

export type DurablePollOptions = {
  signal?: AbortSignal;
  /** Injectable clock/wait for deterministic network-fault tests. */
  budgetMs?: number;
  pollMs?: number;
  wait?: (ms: number, signal?: AbortSignal) => Promise<void>;
};

export async function retrievePillowChat(
  receipt: DurableReceipt,
  options: DurablePollOptions = {},
): Promise<PillowChatResult> {
  const deadline = Date.now() + (options.budgetMs ?? CHAT_RESULT_POLL_BUDGET_MS);
  let status: string | undefined;
  while (Date.now() < deadline) {
    if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      const got = await fetchPillowChatRequest(receipt.requestId, options.signal, Math.min(20_000, deadline - Date.now()));
      const rec = got.ok ? got.request : undefined;
      status = rec?.status;
      if (rec) {
        const resolved = resultFromDurableRecord(receipt, rec);
        if (resolved) return resolved;
      }
    } catch {
      if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      // Network/not-found/auth failures do not prove continued execution or success.
      status = undefined;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await (options.wait ?? sleep)(Math.min(options.pollMs ?? CHAT_RESULT_POLL_MS, remaining), options.signal);
  }
  return pendingDurableResult(receipt, status);
}

export async function sendPillowChat(input: {
  message: string;
  sessionId: string;
  workspaceId?: string;
  workspaceContext?: Record<string, unknown>;
}, options: DurablePollOptions & { onAccepted?: (receipt: DurableReceipt) => void } = {}): Promise<PillowChatResult & { reboundSessionId?: string }> {
  // Exactly one POST. Unknown admission is not permission to start another job.
  let response: Response;
  try {
    response = await pillowFetchWithRetry("/api/pillow/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: options.signal,
    }, 0);
  } catch {
    throw new Error("The connection ended before acceptance was confirmed. Pillow may have received this instruction. It has not been sent again automatically.");
  }
  const result = await response.json().catch(() => ({})) as {
    result?: PillowChatResult;
    reboundSessionId?: string;
  };

  const chat = result.result;
  const requestId = chat?.requestId || response.headers.get("x-empire-pillow-request-id");
  const pending =
    response.status === 202 ||
    chat?.kind === "durable_pending" ||
    chat?.requestRemainsRunning === true ||
    (chat?.resultRetrievable === true && chat?.kind === "terminal_infrastructure") ||
    (!response.ok && Boolean(requestId));

  if (pending && requestId) {
    const receipt = { requestId, sessionId: result.reboundSessionId ?? input.sessionId };
    options.onAccepted?.(receipt);
    const retrieved = await retrievePillowChat(receipt, options);
    return {
      ...retrieved,
      reboundSessionId: retrieved.reboundSessionId ?? result.reboundSessionId,
    };
  }
  if (pending || !response.ok || !chat) {
    throw new Error(`Pillow did not return a usable acceptance receipt (HTTP ${response.status}). The instruction has not been sent again automatically; completion is unconfirmed.`);
  }

  return {
    ...chat,
    ...(result.reboundSessionId ? { reboundSessionId: result.reboundSessionId } : {}),
  };
}

export async function fetchPillowHistory(sessionId: string): Promise<{
  session: PillowWorkspaceSession;
}> {
  return pillowRequest("/api/pillow/history", {
    params: { sessionId },
    timeoutMs: PILLOW_SESSION_TIMEOUT_MS,
  });
}

export async function fetchPillowApprovals(includeHistory = false): Promise<{
  approvals: import("./types").PillowApproval[];
  pendingCount: number;
}> {
  return pillowRequest("/api/pillow/approval", {
    params: { includeHistory: includeHistory ? "true" : undefined },
  });
}
