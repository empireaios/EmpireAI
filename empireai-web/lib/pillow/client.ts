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

const PILLOW_REQUEST_TIMEOUT_MS = 60_000;
const PILLOW_SESSION_TIMEOUT_MS = 130_000;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePillowNetworkError(error: unknown): Error {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return new Error("Executive Intelligence is taking longer than usual. Retrying automatically…");
    }
    if (error.message === "Failed to fetch") {
      return new Error("Starting Executive Systems…");
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

    try {
      const response = await fetch(input, {
        ...init,
        credentials: "include",
        signal: init.signal ?? controller.signal,
      });

      if (response.ok || response.status < 500) {
        return response;
      }

      lastError = new Error(`Pillow request failed (${response.status})`);
      if (attempt < retries) {
        await sleep(BASE_DELAY_MS * 2 ** attempt);
      }
    } catch (error) {
      lastError = normalizePillowNetworkError(error);
      if (attempt < retries) {
        await sleep(BASE_DELAY_MS * 2 ** attempt);
      }
    } finally {
      clearTimeout(timeout);
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

let inflightSessionCreate: Promise<PillowWorkspaceSession> | null = null;

export async function createPillowHostSession(workspaceId?: string): Promise<PillowWorkspaceSession> {
  // Coalesce concurrent creates — cockpit bootstrap + recovery must not stampede Brain.
  if (!inflightSessionCreate) {
    inflightSessionCreate = pillowRequest<{ session: PillowWorkspaceSession }>("/api/pillow/session", {
      method: "POST",
      body: JSON.stringify(workspaceId ? { workspaceId } : {}),
      timeoutMs: PILLOW_SESSION_TIMEOUT_MS,
      // No automatic HTTP retries — caller owns backoff to avoid request storms.
      retries: 0,
    })
      .then((result) => result.session)
      .finally(() => {
        inflightSessionCreate = null;
      });
  }
  return inflightSessionCreate;
}

export async function sendPillowChat(input: {
  message: string;
  sessionId: string;
  workspaceId?: string;
  workspaceContext?: Record<string, unknown>;
}): Promise<PillowChatResult & { reboundSessionId?: string }> {
  const result = await pillowRequest<{
    result: PillowChatResult;
    reboundSessionId?: string;
  }>("/api/pillow/chat", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return {
    ...result.result,
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
