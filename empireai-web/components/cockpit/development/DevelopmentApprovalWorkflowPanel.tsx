"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ApprovalWorkflowPayload = {
  approvalWorkflow?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalApprovals: number; approvedCount: number; blockedActions: number };
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
      totalApprovals: number;
      approvedCount: number;
      blockedActions: number;
      dispatchedActions: number;
      confidenceScore: number;
      recentLogs: string[];
    };
    latestPresentation: {
      presentationId: string;
      proposalSummaries: Array<{ proposalId: string; title: string; category: string }>;
      comparisonSummary: string | null;
      explanationSummary: string | null;
      requiresApproval: boolean;
    } | null;
    latestReport: {
      approvalRunReportId: string;
      approval: {
        approvalId: string;
        approvalDecision: string;
        approvalStatus: string;
        approvalRationale: string | null;
        requestedChanges: string | null;
        approvedActionScope: string | null;
        blockedActionScope: string | null;
        confidenceScore: number;
      };
      gatekeeperResult: { allowed: boolean; blocked: boolean; reason: string };
      dispatchResult: { dispatched: boolean; targetSystem: string | null; scope: string | null };
      validation: { decision: string; actionsBlocked: number; actionsDispatched: number };
    } | null;
  };
  live?: boolean;
};

/** T4-07 — Approval Workflow development panel. */
export function DevelopmentApprovalWorkflowPanel() {
  const [data, setData] = useState<ApprovalWorkflowPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState("approve");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/approval-workflow", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ApprovalWorkflowPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Approval Workflow");
    } finally {
      setLoading(false);
    }
  }, []);

  const runPresent = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/approval-workflow/present", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to present approval");
    } finally {
      setRunning(false);
    }
  }, [load]);

  const runSubmit = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/approval-workflow/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalDecision: decision,
          approvalRationale: "Grand King development panel decision",
          grandKingConfirmationRef: `gk-dev-${Date.now()}`,
          requestedChanges: decision === "request_changes" ? "Revise layout spacing" : undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit approval");
    } finally {
      setRunning(false);
    }
  }, [decision, load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.approvalWorkflow;
  const presentation = snapshot?.latestPresentation;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Approval Workflow (T4-07)"
        description="Grand King approval governance — no auto-approve, blocks unapproved changes."
        actions={
          <div className="flex items-center gap-2">
            <DataModeBadge live={data?.live !== false && !!snapshot} />
            <select
              className="rounded-md border border-border px-2 py-1 text-sm"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
              <option value="defer">Defer</option>
              <option value="request_changes">Request changes</option>
            </select>
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
              className="rounded-md border border-border px-3 py-1 text-sm"
              onClick={() => void runPresent()}
              disabled={running}
            >
              Present
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
              onClick={() => void runSubmit()}
              disabled={running}
            >
              {running ? "Submitting…" : "Submit decision"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Approval Workflow…</p>
        ) : snapshot ? (
          <div className="mt-3 space-y-3">
            <DataTable
              columns={["Metric", "Value"]}
              rows={[
                ["Mission", snapshot.readiness.missionId],
                ["Engine", snapshot.engine.status],
                ["Health", `${snapshot.engine.health.status} (${snapshot.engine.health.healthScore})`],
                ["Total approvals", String(snapshot.cockpit.totalApprovals)],
                ["Approved", String(snapshot.cockpit.approvedCount)],
                ["Blocked actions", String(snapshot.cockpit.blockedActions)],
                ["Dispatched", String(snapshot.cockpit.dispatchedActions)],
                ["Last decision", snapshot.cockpit.lastDecision ?? "—"],
              ]}
            />
            {presentation ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Approval-ready proposals</p>
                {presentation.proposalSummaries.map((p) => (
                  <div key={p.proposalId} className="rounded-md border border-border p-2 text-sm">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-muted-foreground">
                      {p.category} · {p.proposalId}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            {report ? (
              <div className="rounded-md border border-border p-3 text-sm space-y-2">
                <p>
                  <span className="font-medium">{report.approval.approvalDecision}</span>
                  {" · "}
                  {report.approval.approvalStatus}
                  {" · "}
                  {Math.round(report.approval.confidenceScore * 100)}% confidence
                </p>
                <p className="text-muted-foreground">{report.gatekeeperResult.reason}</p>
                {report.dispatchResult.dispatched ? (
                  <p className="text-muted-foreground">
                    Dispatched to {report.dispatchResult.targetSystem}: {report.dispatchResult.scope}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No approval yet. Present proposals, then submit a Grand King decision.
              </p>
            )}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
