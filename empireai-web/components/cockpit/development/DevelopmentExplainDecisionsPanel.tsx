"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ExplainDecisionsPayload = {
  explainDecisions?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalExplanations: number; evidenceLinked: number };
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
      totalExplanations: number;
      evidenceLinked: number;
      confidenceScore: number;
      weakEvidenceWarnings: number;
      recentLogs: string[];
    };
    latestReport: {
      explanationRunReportId: string;
      explanation: {
        explanationId: string;
        explanationType: string;
        designRationale: string;
        uxBenefitSummary: string;
        tradeoffSummary: string;
        confidenceScore: number;
        weakEvidenceNotes: string[];
        evidenceReferences: Array<{
          evidenceId: string;
          evidenceType: string;
          summary: string;
          strength: string;
        }>;
      };
      validation: { decision: string; evidenceLinked: number; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T4-06 — Explain Decisions development panel. */
export function DevelopmentExplainDecisionsPanel() {
  const [data, setData] = useState<ExplainDecisionsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/explain-decisions", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExplainDecisionsPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Explain Decisions");
    } finally {
      setLoading(false);
    }
  }, []);

  const runExplain = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/explain-decisions/explain", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ explanationType: "proposal_rationale" }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate explanation");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.explainDecisions;
  const explanation = snapshot?.latestReport?.explanation;
  const evidence = explanation?.evidenceReferences ?? [];

  return (
    <div className="space-y-4">
      <Panel
        title="Explain Decisions (T4-06)"
        description="Transparent design rationale — explanation only, no auto-apply."
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
              onClick={() => void runExplain()}
              disabled={running}
            >
              {running ? "Explaining…" : "Explain rationale"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Explain Decisions…</p>
        ) : snapshot ? (
          <div className="mt-3 space-y-3">
            <DataTable
              columns={["Metric", "Value"]}
              rows={[
                ["Mission", snapshot.readiness.missionId],
                ["Engine", snapshot.engine.status],
                ["Health", `${snapshot.engine.health.status} (${snapshot.engine.health.healthScore})`],
                ["Explanations", String(snapshot.cockpit.totalExplanations)],
                ["Evidence linked", String(snapshot.cockpit.evidenceLinked)],
                ["Weak evidence warnings", String(snapshot.cockpit.weakEvidenceWarnings)],
                ["Last decision", snapshot.cockpit.lastDecision ?? "—"],
              ]}
            />
            {explanation ? (
              <div className="space-y-3">
                <p className="text-sm">
                  <span className="font-medium">{explanation.explanationType}</span>
                  {" · "}
                  {Math.round(explanation.confidenceScore * 100)}% confidence
                </p>
                <div className="rounded-md border border-border p-3 text-sm">
                  <p className="font-medium">Design rationale</p>
                  <p className="text-muted-foreground">{explanation.designRationale}</p>
                </div>
                <div className="rounded-md border border-border p-3 text-sm">
                  <p className="font-medium">UX benefits</p>
                  <p className="text-muted-foreground">{explanation.uxBenefitSummary}</p>
                </div>
                <div className="rounded-md border border-border p-3 text-sm">
                  <p className="font-medium">Tradeoffs</p>
                  <p className="text-muted-foreground">{explanation.tradeoffSummary}</p>
                </div>
                {explanation.weakEvidenceNotes.length > 0 ? (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
                    <p className="font-medium">Weak or missing evidence</p>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {explanation.weakEvidenceNotes.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {evidence.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Evidence references</p>
                    {evidence.map((e) => (
                      <div key={e.evidenceId} className="rounded-md border border-border p-2 text-sm">
                        <p>
                          {e.evidenceType} · {e.strength}
                        </p>
                        <p className="text-muted-foreground">{e.summary}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No explanation yet. Generate proposals and comparisons first, then explain rationale.
              </p>
            )}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
