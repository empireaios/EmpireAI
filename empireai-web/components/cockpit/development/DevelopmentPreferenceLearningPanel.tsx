"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type PreferenceLearningPayload = {
  preferenceLearning?: {
    computedAt: string;
    engine: {
      status: string;
      currentPreferenceVersion: string;
      performance: {
        totalLearningSessions: number;
        totalPreferencesLearned: number;
      };
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
      totalLearningSessions: number;
      preferencesLearned: number;
      preferenceVersion: string;
      confidenceScore: number;
      recentLogs: string[];
    };
    learnedPreferences: Array<{
      preferenceId: string;
      preferenceCategory: string;
      preferenceDescription: string;
      confidenceScore: number;
      currentStatus: string;
    }>;
    latestReport: {
      preferenceLearningRunReportId: string;
      preferenceVersion: string;
      preferences: Array<{ preferenceId: string; preferenceCategory: string }>;
      validation: { decision: string; preferencesLearned: number };
    } | null;
  };
  live?: boolean;
};

/** T4-08 — Preference Learning development panel. */
export function DevelopmentPreferenceLearningPanel() {
  const [data, setData] = useState<PreferenceLearningPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/preference-learning", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as PreferenceLearningPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Preference Learning");
    } finally {
      setLoading(false);
    }
  }, []);

  const runLearn = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/preference-learning/learn", {
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
      setError(e instanceof Error ? e.message : "Failed to run preference learning");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.preferenceLearning;
  const report = snapshot?.latestReport;
  const preferences = snapshot?.learnedPreferences ?? [];

  return (
    <div className="space-y-4">
      <Panel
        title="Preference Learning (T4-08)"
        description="Learn Grand King collaboration preferences from explicit behavior — advisory only, never auto-approves."
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
              onClick={() => void runLearn()}
              disabled={running}
            >
              {running ? "Learning…" : "Learn preferences"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Preference Learning…</p>
        ) : snapshot ? (
          <div className="mt-3 space-y-3">
            <DataTable
              columns={["Metric", "Value"]}
              rows={[
                ["Mission", snapshot.readiness.missionId],
                ["Engine", snapshot.engine.status],
                ["Health", `${snapshot.engine.health.status} (${snapshot.engine.health.healthScore})`],
                ["Preference version", snapshot.cockpit.preferenceVersion],
                ["Learning sessions", String(snapshot.cockpit.totalLearningSessions)],
                ["Preferences learned", String(snapshot.cockpit.preferencesLearned)],
                ["Avg confidence", `${snapshot.cockpit.confidenceScore}%`],
                ["Last validation", snapshot.cockpit.lastDecision ?? "—"],
              ]}
            />
            {report ? (
              <p className="text-sm text-muted-foreground">
                Last run: {report.validation.decision} · {report.preferences.length} preference(s) · version{" "}
                {report.preferenceVersion}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No learning sessions yet — run Learn preferences.</p>
            )}
            {preferences.length > 0 ? (
              <DataTable
                columns={["Category", "Description", "Confidence", "Status"]}
                rows={preferences.slice(0, 8).map((p) => [
                  p.preferenceCategory,
                  p.preferenceDescription,
                  String(Math.round(p.confidenceScore * 100)),
                  p.currentStatus,
                ])}
              />
            ) : null}
            {snapshot.cockpit.recentLogs.length > 0 ? (
              <ul className="text-xs text-muted-foreground">
                {snapshot.cockpit.recentLogs.map((log) => (
                  <li key={log}>{log}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
