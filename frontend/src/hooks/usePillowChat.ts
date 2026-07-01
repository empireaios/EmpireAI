import { useCallback, useEffect, useRef, useState } from "react";
import {
  createPillowSession,
  decidePillowApproval,
  fetchPillowApprovals,
  fetchPillowCursorStatus,
  fetchPillowHistory,
  fetchPillowMissionBoard,
  fetchPillowStatus,
  streamPillowChat,
  subscribePillowEvents,
  type PillowApproval,
  type PillowChatResult,
  type PillowCursorStatus,
  type PillowHostStatus,
  type PillowMissionBoard,
  type PillowTurn,
} from "@/api/pillow";
import {
  listLocalSessions,
  searchLocalSessions,
  toggleBookmark,
  upsertLocalSession,
  type PillowLocalSession,
} from "@/lib/pillow-sessions";
import type { PillowWorkspaceContext } from "@/types/pillow-workspace-context";

export interface PillowChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  result?: PillowChatResult;
  streaming?: boolean;
}

export function usePillowChat(
  workspaceId: string,
  options?: {
    autoBootstrap?: boolean;
    getWorkspaceContext?: () => PillowWorkspaceContext | undefined;
  },
) {
  const autoBootstrap = options?.autoBootstrap ?? true;
  const getWorkspaceContext = options?.getWorkspaceContext;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PillowChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostStatus, setHostStatus] = useState<PillowHostStatus | null>(null);
  const [cursorStatus, setCursorStatus] = useState<PillowCursorStatus | null>(null);
  const [missionBoard, setMissionBoard] = useState<PillowMissionBoard | null>(null);
  const [approvals, setApprovals] = useState<PillowApproval[]>([]);
  const [localSessions, setLocalSessions] = useState<PillowLocalSession[]>([]);
  const [sessionSearch, setSessionSearch] = useState("");
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const streamRef = useRef("");

  const refreshLocalSessions = useCallback(() => {
    setLocalSessions(
      sessionSearch.trim()
        ? searchLocalSessions(workspaceId, sessionSearch)
        : listLocalSessions(workspaceId),
    );
  }, [workspaceId, sessionSearch]);

  const loadBoard = useCallback(async () => {
    try {
      const [cursor, missions] = await Promise.all([
        fetchPillowCursorStatus(),
        fetchPillowMissionBoard(),
      ]);
      setCursorStatus(cursor.status);
      setMissionBoard(cursor.missions ?? missions.board);
    } catch {
      /* non-fatal */
    }
  }, []);

  const loadApprovals = useCallback(async () => {
    try {
      const data = await fetchPillowApprovals(true);
      setApprovals(data.approvals);
    } catch {
      /* non-fatal */
    }
  }, []);

  const registerSession = useCallback(
    (id: string, label?: string) => {
      upsertLocalSession(workspaceId, {
        id,
        label: label ?? `Session ${new Date().toLocaleString()}`,
        bookmarked: listLocalSessions(workspaceId).find((s) => s.id === id)?.bookmarked ?? false,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      });
      refreshLocalSessions();
    },
    [workspaceId, refreshLocalSessions],
  );

  const bootstrapSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ status }, { session }] = await Promise.all([
        fetchPillowStatus(),
        createPillowSession(workspaceId),
      ]);
      setHostStatus(status);
      setSessionId(session.sessionId);
      setMessages([]);
      registerSession(session.sessionId);
      await Promise.all([loadBoard(), loadApprovals()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start Pillow session");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, loadBoard, loadApprovals, registerSession]);

  const restoreSession = useCallback(
    async (targetSessionId: string) => {
      setLoading(true);
      setError(null);
      try {
        const [{ status }, history] = await Promise.all([
          fetchPillowStatus(),
          fetchPillowHistory(targetSessionId),
        ]);
        setHostStatus(status);
        setSessionId(targetSessionId);
        setMessages(
          history.history
            .filter((turn): turn is PillowTurn & { role: "user" | "assistant" } =>
              turn.role === "user" || turn.role === "assistant",
            )
            .map((turn, index) => ({
              id: `${targetSessionId}-${index}`,
              role: turn.role,
              content: turn.content,
              provider: turn.provider,
            })),
        );
        registerSession(targetSessionId);
        await Promise.all([loadBoard(), loadApprovals()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to restore session");
      } finally {
        setLoading(false);
      }
    },
    [loadBoard, loadApprovals, registerSession],
  );

  const sendMessage = useCallback(
    async (text: string, provider?: string) => {
      if (!sessionId || !text.trim() || streaming) return;

      const userId = `user-${Date.now()}`;
      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", content: text.trim() },
        { id: assistantId, role: "assistant", content: "", streaming: true },
      ]);
      setStreaming(true);
      streamRef.current = "";

      try {
        await streamPillowChat(
          {
            message: text.trim(),
            sessionId,
            provider,
            workspaceContext: getWorkspaceContext?.(),
          },
          {
            onToken: (delta) => {
              streamRef.current += delta;
              const snapshot = streamRef.current;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: snapshot } : msg,
                ),
              );
            },
            onDone: (result) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        content: result.message,
                        provider: result.provider,
                        result,
                        streaming: false,
                      }
                    : msg,
                ),
              );
              registerSession(sessionId, text.trim().slice(0, 48));
              void loadApprovals();
            },
            onError: (message) => {
              setError(message);
              setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
            },
          },
        );
      } finally {
        setStreaming(false);
      }
    },
    [sessionId, streaming, registerSession, loadApprovals, getWorkspaceContext],
  );

  const decideApproval = useCallback(
    async (approvalId: string, outcome: "Approved" | "Rejected") => {
      setDecidingId(approvalId);
      try {
        await decidePillowApproval({ approvalId, outcome });
        await loadApprovals();
      } finally {
        setDecidingId(null);
      }
    },
    [loadApprovals],
  );

  const bookmarkSession = useCallback(
    (targetSessionId: string) => {
      toggleBookmark(workspaceId, targetSessionId);
      refreshLocalSessions();
    },
    [workspaceId, refreshLocalSessions],
  );

  useEffect(() => {
    refreshLocalSessions();
  }, [refreshLocalSessions]);

  useEffect(() => {
    if (!autoBootstrap) return;
    void bootstrapSession();
  }, [workspaceId, autoBootstrap]);

  useEffect(() => {
    const unsubscribe = subscribePillowEvents(({ pillow, cursor }) => {
      setHostStatus(pillow);
      if (cursor) setCursorStatus(cursor);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    void loadBoard();
    const timer = window.setInterval(() => void loadBoard(), 15000);
    return () => window.clearInterval(timer);
  }, [loadBoard]);

  const pendingApproval = approvals.find((item) => item.status === "Pending") ?? null;

  return {
    sessionId,
    messages,
    streaming,
    loading,
    error,
    hostStatus,
    cursorStatus,
    missionBoard,
    approvals,
    pendingApproval,
    localSessions,
    sessionSearch,
    setSessionSearch,
    decidingId,
    sendMessage,
    bootstrapSession,
    restoreSession,
    decideApproval,
    bookmarkSession,
    refreshLocalSessions,
    reload: bootstrapSession,
  };
}
