import type {
  BrainDispatchRequest,
  BrainDispatchResult,
  BrainError,
} from "./types";
import { brainLogger } from "./logger";
import {
  fetchWithRetry as sharedFetchWithRetry,
  SESSION_FETCH_TIMEOUT_MS,
  BRAIN_DISPATCH_TIMEOUT_MS,
} from "./fetch-utils";

function normalizeError(error: unknown, status?: number): BrainError {
  if (error instanceof Error) {
    return {
      message: error.message,
      status,
      retryable: status ? status >= 500 || status === 429 : true,
    };
  }
  return { message: "Unknown Brain error", status, retryable: true };
}

export async function brainDispatch<T = unknown>(
  request: BrainDispatchRequest,
): Promise<BrainDispatchResult<T>> {
  brainLogger.info("Dispatching to Brain", {
    module: request.module,
    action: request.action,
  });

  const response = await sharedFetchWithRetry("/api/brain/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
    retries: 1,
    timeoutMs: BRAIN_DISPATCH_TIMEOUT_MS,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw normalizeError(
      new Error(body.error ?? `Dispatch failed (${response.status})`),
      response.status,
    );
  }

  const result = (await response.json()) as BrainDispatchResult<T>;
  brainLogger.info("Brain dispatch completed", {
    module: request.module,
    action: request.action,
    correlationId: result.correlationId,
    status: result.status,
  });

  return result;
}

export async function fetchSessionUser() {
  const response = await sharedFetchWithRetry("/api/auth/me", {
    credentials: "include",
    timeoutMs: SESSION_FETCH_TIMEOUT_MS,
    retries: 0,
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw normalizeError(new Error(body.error ?? "Session check failed"), response.status);
  }

  const data = (await response.json()) as {
    user: import("../auth/types").SessionUser;
  };
  return data.user;
}

export async function login(email: string, password: string) {
  let response: Response;
  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch {
    throw normalizeError(
      new Error(
        "Authentication service unavailable. Empire Brain did not respond — retry shortly.",
      ),
      503,
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    const upstream = body.error ?? body.message;
    let message = upstream ?? null;
    if (!message) {
      if (response.status === 502 || response.status === 503) {
        message =
          "Authentication service unavailable. Empire Brain is not ready — retry after restart.";
      } else if (response.status === 504) {
        message =
          "Authentication timed out. Empire Brain may be restarting — retry shortly.";
      } else if (response.status === 401 || response.status === 403) {
        message = "Invalid email or password";
      } else {
        message =
          "Authentication service unavailable. Please retry — this is not necessarily an invalid password.";
      }
    }
    throw normalizeError(new Error(message), response.status);
  }

  return response.json() as Promise<{ user: import("../auth/types").SessionUser }>;
}

export async function logout() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export function connectBrainEvents(
  onEvent: (event: import("./types").BrainEvent) => void,
  onError?: (error: Event) => void,
): () => void {
  const source = new EventSource("/api/brain/events", { withCredentials: true });

  source.onmessage = (message) => {
    try {
      const event = JSON.parse(message.data) as import("./types").BrainEvent;
      onEvent(event);
    } catch {
      brainLogger.warn("Failed to parse Brain event");
    }
  };

  for (const type of [
    "connected",
    "request",
    "tool_executed",
    "task_complete",
    "workflow_completed",
    "workflow_failed",
    "agent_invoked",
  ]) {
    source.addEventListener(type, (message) => {
      try {
        const event = JSON.parse((message as MessageEvent).data) as import("./types").BrainEvent;
        onEvent(event);
      } catch {
        brainLogger.warn("Failed to parse Brain typed event", { type });
      }
    });
  }

  source.onerror = (error) => {
    brainLogger.error("Brain event stream error");
    onError?.(error);
  };

  return () => source.close();
}
