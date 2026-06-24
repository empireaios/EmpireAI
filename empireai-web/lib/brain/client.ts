import type {
  BrainDispatchRequest,
  BrainDispatchResult,
  BrainError,
} from "./types";
import { brainLogger } from "./logger";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function fetchWithRetry(
  input: RequestInfo,
  init?: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  let lastError: BrainError | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (response.ok || response.status < 500) {
        return response;
      }

      lastError = normalizeError(
        new Error(`Brain request failed (${response.status})`),
        response.status,
      );

      if (attempt < retries) {
        brainLogger.warn("Retrying Brain request", {
          attempt: attempt + 1,
          status: response.status,
        });
        await sleep(BASE_DELAY_MS * 2 ** attempt);
      }
    } catch (error) {
      lastError = normalizeError(error);
      if (attempt < retries) {
        brainLogger.warn("Retrying Brain request after network error", {
          attempt: attempt + 1,
        });
        await sleep(BASE_DELAY_MS * 2 ** attempt);
      }
    }
  }

  throw lastError ?? normalizeError(new Error("Brain request failed"));
}

export async function brainDispatch<T = unknown>(
  request: BrainDispatchRequest,
): Promise<BrainDispatchResult<T>> {
  brainLogger.info("Dispatching to Brain", {
    module: request.module,
    action: request.action,
  });

  const response = await fetchWithRetry("/api/brain/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
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
  const response = await fetchWithRetry("/api/auth/me", {
    credentials: "include",
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw normalizeError(new Error(body.error ?? "Session check failed"), response.status);
  }

  const data = (await response.json()) as { user: import("../auth/types").SessionUser };
  return data.user;
}

export async function login(email: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw normalizeError(new Error(body.error ?? "Login failed"), response.status);
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
