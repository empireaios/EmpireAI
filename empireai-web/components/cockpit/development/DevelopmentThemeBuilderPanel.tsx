"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ThemeBuilderPayload = {
  themeBuilder?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalGenerations: number; totalThemesGenerated: number };
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
      themesCount: number;
      validatedCount: number;
      blockedCount: number;
      confidenceScore: number;
      totalGenerations: number;
      recentLogs: string[];
    };
    latestReport: {
      themeGenerationReportId: string;
      records: {
        themeId: string;
        themeName: string;
        themeScope: string;
        targetFiles: string[];
        themeStatus: string;
        confidenceScore: number;
        colorTokens: { tokenName: string }[];
        typographyTokens: { tokenName: string }[];
        safetyChecks: { checkName: string; passed: boolean }[];
      }[];
      validation: { decision: string; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T3-04 — Theme Builder development panel. */
export function DevelopmentThemeBuilderPanel() {
  const [data, setData] = useState<ThemeBuilderPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/theme-builder", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ThemeBuilderPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Theme Builder");
    } finally {
      setLoading(false);
    }
  }, []);

  const runGenerate = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/theme-builder/generate", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate themes");
    } finally {
      setRunning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.themeBuilder;
  const report = snapshot?.latestReport;

  return (
    <div className="space-y-4">
      <Panel
        title="Theme Builder (T3-04)"
        description="Generates visual themes from design system intelligence and UX recommendations."
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
              onClick={() => void runGenerate()}
              disabled={running}
            >
              {running ? "Generating…" : "Generate Themes"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Theme Builder…</p>
        ) : snapshot ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Themes</p>
              <p className="text-2xl font-bold">{snapshot.cockpit.themesCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Validated / Blocked</p>
              <p className="font-medium">
                {snapshot.cockpit.validatedCount} / {snapshot.cockpit.blockedCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="font-medium">{snapshot.cockpit.confidenceScore}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Generations</p>
              <p className="font-medium">{snapshot.cockpit.totalGenerations}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {report && report.records.length > 0 ? (
        <>
          <Panel title="Theme Records" description={report.themeGenerationReportId}>
            <DataTable
              columns={[
                { key: "name", header: "Theme" },
                { key: "scope", header: "Scope" },
                { key: "status", header: "Status" },
                { key: "colors", header: "Colors" },
              ]}
              rows={report.records.map((r) => ({
                name: r.themeName,
                scope: r.themeScope,
                status: r.themeStatus,
                colors: String(r.colorTokens.length),
              }))}
            />
          </Panel>
          <Panel title="Recent Logs" description="Theme builder activity">
            <ul className="space-y-1 text-sm text-muted-foreground">
              {snapshot?.cockpit.recentLogs.map((log) => (
                <li key={log}>{log}</li>
              ))}
            </ul>
          </Panel>
        </>
      ) : null}
    </div>
  );
}
