"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ContinuousCollaborationPayload = {
  continuousCollaboration?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalSynchronizations: number };
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
      totalSynchronizations: number;
      activeDiscussions: number;
      pendingProposals: number;
      pendingApprovals: number;
      confidenceScore: number;
      recentLogs: string[];
    };
    activeSession: {
      collaborationSessionId: string;
      sessionStatus: string;
      collaborationContextSummary: string;
      pendingProposalIds: string[];
      pendingApprovalIds: string[];
      activeDiscussionTopics: Array<{ topic: string; status: string }>;
      appliedCollaborationPreferences: Array<{ preferenceCategory: string; appliedSummary: string }>;
    } | null;
    latestReport: {
      collaborationRunReportId: string;
      session: { collaborationSessionId: string };
      validation: { decision: string };
    } | null;
  };
  live?: boolean;
};

/** T4-09 — Continuous Collaboration development panel. */
export function DevelopmentContinuousCollaborationPanel() {
  const [data, setData] = useState<ContinuousCollaborationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/continuous-collaboration", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ContinuousCollaborationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Continuous Collaboration");
    } finally {
      setLoading(false);
    }
  }, []);

  const runSynchronize = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/continuous-collaboration/synchronize", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restoreContext: true, applyPreferences: true }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to synchronize collaboration");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.continuousCollaboration;
  const session = snapshot?.activeSession;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Continuous Collaboration (T4-09)"
        description="Persistent UX partnership — maintains context, tracks pending items, applies preferences advisorially."
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
              onClick={() => void runSynchronize()}
              disabled={running}
            >
              {running ? "Synchronizing…" : "Synchronize"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Continuous Collaboration…</p>
        ) : snapshot ? (
          <div className="mt-3 space-y-3">
            <DataTable
              columns={["Metric", "Value"]}
              rows={[
                ["Mission", snapshot.readiness.missionId],
                ["Engine", snapshot.engine.status],
                ["Health", `${snapshot.engine.health.status} (${snapshot.engine.health.healthScore})`],
                ["Synchronizations", String(snapshot.cockpit.totalSynchronizations)],
                ["Active discussions", String(snapshot.cockpit.activeDiscussions)],
                ["Pending proposals", String(snapshot.cockpit.pendingProposals)],
                ["Pending approvals", String(snapshot.cockpit.pendingApprovals)],
                ["Confidence", `${snapshot.cockpit.confidenceScore}%`],
              ]}
            />
            {session ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Session {session.collaborationSessionId} · {session.sessionStatus}
                </p>
                <p className="text-sm">{session.collaborationContextSummary}</p>
                {session.activeDiscussionTopics.length > 0 ? (
                  <DataTable
                    columns={["Discussion", "Status"]}
                    rows={session.activeDiscussionTopics
                      .slice(0, 6)
                      .map((d) => [d.topic, d.status])}
                  />
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active session — run Synchronize to start collaboration.
              </p>
            )}
            {report ? (
              <p className="text-xs text-muted-foreground">
                Last run: {report.validation.decision} · {report.collaborationRunReportId}
              </p>
            ) : null}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
