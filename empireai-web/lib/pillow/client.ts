/**
 * Pillow host client — connects empireai-web to existing /api/pillow/* backend routes.
 */

import type {
  PillowChatResult,
  PillowHealth,
  PillowHostStatus,
  PillowWorkspaceSession,
} from "./types";

const PILLOW_REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePillowNetworkError(error: unknown): Error {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return new Error("Pillow request timed out — Brain may still be processing. Try again.");
    }
    if (error.message === "Failed to fetch") {
      return new Error("Pillow host connection failed — check network and try again.");
    }
    return error;
  }
  return new Error("Pillow request failed");
}

async function pillowFetchWithRetry(
  input: string,
  init: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PILLOW_REQUEST_TIMEOUT_MS);

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
  init?: RequestInit & { params?: Record<string, string | undefined> },
): Promise<T> {
  const url = new URL(path, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  if (init?.params) {
    for (const [key, value] of Object.entries(init.params)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }

  try {
    const response = await pillowFetchWithRetry(url.pathname + url.search, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Pillow request failed (${response.status})`);
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

export async function createPillowHostSession(workspaceId?: string): Promise<PillowWorkspaceSession> {
  const result = await pillowRequest<{ session: PillowWorkspaceSession }>("/api/pillow/session", {
    method: "POST",
    body: JSON.stringify(workspaceId ? { workspaceId } : {}),
  });
  return result.session;
}

export async function sendPillowChat(input: {
  message: string;
  sessionId: string;
  workspaceId?: string;
}): Promise<PillowChatResult> {
  const result = await pillowRequest<{ result: PillowChatResult }>("/api/pillow/chat", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return result.result;
}

export async function fetchPillowApprovals(includeHistory = false): Promise<{
  approvals: import("./types").PillowApproval[];
  pendingCount: number;
}> {
  return pillowRequest("/api/pillow/approval", {
    params: { includeHistory: includeHistory ? "true" : undefined },
  });
}
