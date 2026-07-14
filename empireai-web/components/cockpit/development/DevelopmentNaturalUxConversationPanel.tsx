"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type NaturalUxPayload = {
  naturalUxConversation?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalConversations: number; totalTurns: number };
      health: { status: string; healthScore: number };
    };
    readiness: {
      missionId: string;
      healthScore: number;
      engineStatus: string;
      lastDecision: string | null;
    };
    cockpit: {
      engineStatus: string;
      healthStatus: string;
      lastDecision: string | null;
      activeSessions: number;
      totalTurns: number;
      clarificationsPending: number;
      builderRequestsCount: number;
      confidenceScore: number;
      totalConversations: number;
      recentLogs: string[];
    };
    latestReport: {
      conversationRunReportId: string;
      latestTurn: {
        conversationId: string;
        intentCategory: string;
        recognizedIntent: string;
        confidenceScore: number;
        clarificationStatus: string;
        generatedUxActions: { actionType: string; description: string }[];
        generatedBuilderRequests: { requestType: string; summary: string }[];
        clarificationQuestions: { question: string }[];
      } | null;
      validation: { decision: string; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T4-01 — Natural UX Conversation development panel. */
export function DevelopmentNaturalUxConversationPanel() {
  const [data, setData] = useState<NaturalUxPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState(
    "Improve the layout spacing on the cockpit dashboard screen",
  );
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/natural-ux-conversation", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as NaturalUxPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Natural UX Conversation");
    } finally {
      setLoading(false);
    }
  }, []);

  const runConverse = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/natural-ux-conversation/converse", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userRequest: request, sessionId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as {
        report?: { session?: { sessionId?: string } };
      };
      if (body.report?.session?.sessionId) {
        setSessionId(body.report.session.sessionId);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to converse");
    } finally {
      setRunning(false);
    }
  }, [load, request, sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.naturalUxConversation;
  const turn = snapshot?.latestReport?.latestTurn;

  return (
    <div className="space-y-4">
      <Panel
        title="Natural UX Conversation (T4-01)"
        description="Natural-language UX collaboration — intent, context, clarification, and structured builder requests."
        actions={
          <div className="flex items-center gap-2">
            <DataModeBadge live={data?.live !== false && !!snapshot} />
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1 text-sm"
              onClick={() => void load()}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
              onClick={() => void runConverse()}
              disabled={running || !request.trim()}
            >
              {running ? "Conversing…" : "Send"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <textarea
          className="mt-2 w-full rounded-md border border-border bg-background p-2 text-sm"
          rows={3}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          placeholder="Describe a UX improvement…"
        />
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Natural UX Conversation…</p>
        ) : snapshot ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Turns</p>
              <p className="text-2xl font-bold">{snapshot.cockpit.totalTurns}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="font-medium">{snapshot.cockpit.confidenceScore}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Clarifications</p>
              <p className="font-medium">{snapshot.cockpit.clarificationsPending}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Decision</p>
              <p className="font-medium">{snapshot.cockpit.lastDecision ?? "—"}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {turn ? (
        <Panel title="Latest Turn" description={turn.conversationId}>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Intent:</span> {turn.intentCategory} —{" "}
              {turn.recognizedIntent}
            </p>
            <p>
              <span className="text-muted-foreground">Clarification:</span>{" "}
              {turn.clarificationStatus}
            </p>
          </div>
          {turn.generatedUxActions.length > 0 ? (
            <div className="mt-3">
              <DataTable
                columns={[
                  { key: "type", header: "Action" },
                  { key: "description", header: "Description" },
                ]}
                rows={turn.generatedUxActions.map((a) => ({
                  type: a.actionType,
                  description: a.description.slice(0, 80),
                }))}
              />
            </div>
          ) : null}
          {turn.clarificationQuestions.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {turn.clarificationQuestions.map((q) => (
                <li key={q.question}>{q.question}</li>
              ))}
            </ul>
          ) : null}
        </Panel>
      ) : null}

      {snapshot?.cockpit.recentLogs.length ? (
        <Panel title="Recent Logs" description="Conversation activity">
          <ul className="space-y-1 text-sm text-muted-foreground">
            {snapshot.cockpit.recentLogs.map((log) => (
              <li key={log}>{log}</li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
