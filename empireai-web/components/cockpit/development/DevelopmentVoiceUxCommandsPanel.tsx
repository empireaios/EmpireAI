"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type VoiceUxPayload = {
  voiceUxCommands?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalCommands: number; totalTranscriptions: number };
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
      totalCommands: number;
      clarificationsPending: number;
      conversationLinks: number;
      confidenceScore: number;
      totalTranscriptions: number;
      recentLogs: string[];
    };
    latestReport: {
      voiceCommandRunReportId: string;
      latestCommand: {
        voiceCommandId: string;
        voiceCommandType: string;
        transcribedText: string;
        transcriptionConfidence: number;
        confidenceScore: number;
        processingStatus: string;
        userRequestSummary: string;
        uxConcernSummary: string;
        designPreferenceSummary: string | null;
        clarificationRequirement: string | null;
        clarificationQuestions: { question: string }[];
        linkedConversationRunId: string | null;
        linkedBuilderCapabilities: string[];
        currentScreenId: string | null;
      } | null;
      validation: { decision: string; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T4-02 — Voice UX Commands development panel. */
export function DevelopmentVoiceUxCommandsPanel() {
  const [data, setData] = useState<VoiceUxPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState(
    "Improve the layout spacing on the current screen",
  );
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/voice-ux-commands", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as VoiceUxPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Voice UX Commands");
    } finally {
      setLoading(false);
    }
  }, []);

  const runProcess = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/voice-ux-commands/process", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcribedText: transcript,
          sessionId,
        }),
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
      setError(e instanceof Error ? e.message : "Failed to process voice command");
    } finally {
      setRunning(false);
    }
  }, [load, transcript, sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.voiceUxCommands;
  const command = snapshot?.latestReport?.latestCommand;

  return (
    <div className="space-y-4">
      <Panel
        title="Voice UX Commands (T4-02)"
        description="Hands-free UX redesign intake — speech-to-text, intent parsing, and Natural UX Conversation linkage. No automatic apply or approve."
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
              onClick={() => void runProcess()}
              disabled={running || !transcript.trim()}
            >
              {running ? "Processing…" : "Process voice text"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <textarea
          className="mt-2 w-full rounded-md border border-border bg-background p-2 text-sm"
          rows={3}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Simulated voice transcript (STT passthrough)…"
        />
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Voice UX Commands…</p>
        ) : snapshot ? (
          <div className="mt-3 space-y-3">
            <DataTable
              columns={["Metric", "Value"]}
              rows={[
                ["Mission", snapshot.readiness.missionId],
                ["Engine", snapshot.engine.status],
                ["Health", `${snapshot.engine.health.status} (${snapshot.engine.health.healthScore})`],
                ["Commands", String(snapshot.cockpit.totalCommands)],
                ["Transcriptions", String(snapshot.cockpit.totalTranscriptions)],
                ["Conversation links", String(snapshot.cockpit.conversationLinks)],
                ["Clarifications pending", String(snapshot.cockpit.clarificationsPending)],
                ["Last decision", snapshot.cockpit.lastDecision ?? "—"],
                ["Confidence", `${snapshot.cockpit.confidenceScore}%`],
              ]}
            />
            {command ? (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Type:</span> {command.voiceCommandType}
                </p>
                <p>
                  <span className="text-muted-foreground">Transcript:</span> {command.transcribedText}
                </p>
                <p>
                  <span className="text-muted-foreground">Summary:</span> {command.userRequestSummary}
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span> {command.processingStatus}
                </p>
                {command.linkedConversationRunId ? (
                  <p>
                    <span className="text-muted-foreground">NUC link:</span>{" "}
                    {command.linkedConversationRunId}
                  </p>
                ) : null}
                {command.clarificationQuestions.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {command.clarificationQuestions.map((q, i) => (
                      <li key={i}>{q.question}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
            {snapshot.cockpit.recentLogs.length > 0 ? (
              <div className="text-xs text-muted-foreground">
                {snapshot.cockpit.recentLogs.slice(-5).map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
