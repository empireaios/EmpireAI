/**
 * Pillow host client — connects empireai-web to existing /api/pillow/* backend routes.
 */

import type {
  PillowChatResult,
  PillowHealth,
  PillowHostStatus,
  PillowWorkspaceSession,
} from "./types";

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

  const response = await fetch(url.pathname + url.search, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Pillow request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
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
