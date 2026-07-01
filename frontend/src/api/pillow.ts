import { apiRequest } from "./client";

export type PillowHealth = "Running" | "Idle" | "Busy" | "Recovering" | "Error";

export interface PillowHostStatus {
  lifecycle: string;
  health: PillowHealth;
  repositoryRoot: string | null;
  repositoryFingerprint: string | null;
  journeyPosition: string | null;
  currentMission: string | null;
  llmProviders: string[];
  missionId: string;
}

export interface PillowWorkspaceSession {
  sessionId: string;
  workspaceId: string;
  conversationHistory: PillowTurn[];
  approvalState: string;
  repositoryFingerprint: string;
  currentMission: string | null;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requestCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PillowTurn {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  requestId?: string;
  provider?: string;
}

export interface PillowChatResult {
  requestId: string;
  sessionId: string;
  message: string;
  kind: "llm" | "command_fallback" | "error";
  provider?: string;
  latencyMs: number;
  command?: {
    intent: string;
    category: string;
    plan?: { objective: string; steps?: Array<{ label: string }> };
    awareness?: {
      journeyPosition: string | null;
      currentMission: string | null;
      repositoryHealthScore: number;
    };
  };
  executiveRecommendation?: {
    recommendationId: string;
    debateId?: string;
    currentObjective: string | null;
    recommendation: string;
    reason: string;
    confidence: number;
    expectedProfitImpact: string;
    expectedEngineeringCost: string;
    expectedRisk: string;
    objectiveAlignment: string;
    status: string;
  };
}

export interface PillowApproval {
  approvalId: string;
  type: string;
  status: string;
  proposal: {
    title: string;
    summary: string;
    missionId?: string;
    evidence?: string[];
  };
  createdAt: string;
}

export interface PillowMissionRecord {
  missionId: string;
  title: string;
  phase: string;
  presence: string;
  dryRun: boolean;
  lastError: string | null;
  updatedAt: string;
}

export interface PillowMissionBoard {
  running: PillowMissionRecord[];
  completed: PillowMissionRecord[];
  failed: PillowMissionRecord[];
  queued: PillowMissionRecord[];
}

export interface PillowCursorStatus {
  presence: string;
  cursorOnline: boolean;
  activeMissionId: string | null;
  queuedCount: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  dryRunLaunch: boolean;
}

export function fetchPillowStatus() {
  return apiRequest<{ status: PillowHostStatus }>("/api/pillow/status");
}

export function fetchPillowHealth() {
  return apiRequest<{ health: PillowHealth; missionId: string }>("/api/pillow/health");
}

export function createPillowSession(workspaceId?: string) {
  return apiRequest<{ session: PillowWorkspaceSession }>("/api/pillow/session", {
    method: "POST",
    body: workspaceId ? { workspaceId } : {},
  });
}

export function fetchPillowHistory(sessionId: string) {
  return apiRequest<{
    history: PillowTurn[];
    currentMission: string | null;
    repositoryFingerprint: string;
    tokenUsage: PillowWorkspaceSession["tokenUsage"];
  }>("/api/pillow/history", { params: { sessionId } });
}

export function sendPillowChat(input: {
  message: string;
  sessionId: string;
  provider?: string;
  workspaceContext?: import("@/types/pillow-workspace-context").PillowWorkspaceContext;
}) {
  return apiRequest<{ result: PillowChatResult }>("/api/pillow/chat", {
    method: "POST",
    body: input,
  });
}

export function fetchPillowApprovals(includeHistory = true) {
  return apiRequest<{
    approvals: PillowApproval[];
    pendingCount: number;
    history?: unknown[];
  }>("/api/pillow/approval", {
    params: { includeHistory: includeHistory ? "true" : undefined },
  });
}

export function decidePillowApproval(input: {
  approvalId: string;
  outcome: "Approved" | "Rejected" | "Cancelled";
  notes?: string;
}) {
  return apiRequest<{ approval: PillowApproval }>("/api/pillow/approval", {
    method: "POST",
    body: { action: "decide", ...input },
  });
}

export function fetchPillowCursorStatus() {
  return apiRequest<{
    status: PillowCursorStatus;
    missions: PillowMissionBoard;
    pillowHost: { lifecycle: string; health: string };
  }>("/api/pillow/cursor/status");
}

export function fetchPillowMissionBoard() {
  return apiRequest<{ board: PillowMissionBoard }>("/api/pillow/missions");
}

function buildApiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? "";
  return new URL(`${base}${path}`, window.location.origin).toString();
}

export async function streamPillowChat(
  input: {
    message: string;
    sessionId: string;
    provider?: string;
    workspaceContext?: import("@/types/pillow-workspace-context").PillowWorkspaceContext;
  },
  handlers: {
    onToken: (delta: string) => void;
    onDone: (result: PillowChatResult) => void;
    onError: (message: string) => void;
  },
): Promise<void> {
  const response = await fetch(buildApiUrl("/api/pillow/chat/stream"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok || !response.body) {
    handlers.onError(`Stream failed (${response.status})`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const lines = part.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) event = line.slice(7);
        if (line.startsWith("data: ")) data = line.slice(6);
      }
      if (!data) continue;
      const parsed = JSON.parse(data) as Record<string, unknown>;
      if (event === "token" && typeof parsed.delta === "string") {
        handlers.onToken(parsed.delta);
      } else if (event === "done" && parsed.result) {
        handlers.onDone(parsed.result as PillowChatResult);
      } else if (event === "error") {
        handlers.onError(String(parsed.message ?? "Stream error"));
      }
    }
  }
}

export function subscribePillowEvents(
  onStatus: (payload: { pillow: PillowHostStatus; cursor: PillowCursorStatus | null }) => void,
): () => void {
  const url = buildApiUrl("/api/pillow/events/stream");
  const source = new EventSource(url, { withCredentials: true });

  source.addEventListener("status", (event) => {
    try {
      const data = JSON.parse((event as MessageEvent).data) as {
        pillow: PillowHostStatus;
        cursor: PillowCursorStatus | null;
      };
      onStatus(data);
    } catch {
      /* ignore malformed */
    }
  });

  return () => source.close();
}
