"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type LayoutUnderstandingPayload = {
  layoutUnderstanding?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { successfulLayouts: number; totalRegionsDetected: number };
      health: { status: string; healthScore: number };
      configuration: { confidenceThreshold: number };
    };
    cockpit: {
      layoutStatus: string;
      healthStatus: string;
      regionsDetected: number;
      regionTypeCounts: Record<string, number>;
      changeDetected: boolean;
      confidenceScore: number;
      recentLogs: string[];
    };
    latestLayout: {
      metadata: { timestamp: string; layoutId: string; confidenceScore: number };
      regions: { regionId: string; regionType: string; confidence: number }[];
    } | null;
  };
  live?: boolean;
};

/** T1-04 — Layout Understanding development panel. */
export function DevelopmentLayoutUnderstandingPanel() {
  const [data, setData] = useState<LayoutUnderstandingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/layout-understanding", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as LayoutUnderstandingPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Layout Understanding");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  const lue = data?.layoutUnderstanding;
  const engine = lue?.engine;
  const cockpit = lue?.cockpit;

  if (loading && !data) {
    return <Panel title="Layout Understanding">Loading layout understanding…</Panel>;
  }

  if (error) {
    return (
      <Panel title="Layout Understanding" subtitle="T1-04 · Structural page layout awareness">
        <p className="text-sm text-amber-200">{error}</p>
      </Panel>
    );
  }

  const typeEntries = Object.entries(cockpit?.regionTypeCounts ?? {});

  return (
    <div className="space-y-4">
      <Panel title="Layout Understanding" subtitle="T1-04 · Understand page layouts structurally">
        <div className="flex flex-wrap items-center gap-2">
          <DataModeBadge mode={data?.live === false ? "sandbox" : "live"} />
          <span className="text-xs text-[#6f6a60]">
            Status: {engine?.status ?? cockpit?.layoutStatus ?? "unknown"}
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-[#6f6a60]">Regions Detected</p>
            <p className="text-[#d4af37]">
              {cockpit?.regionsDetected ?? engine?.performance.totalRegionsDetected ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Health</p>
            <p>{engine?.health.status ?? cockpit?.healthStatus ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Layouts</p>
            <p>{engine?.performance.successfulLayouts ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Changes</p>
            <p>{cockpit?.changeDetected ? "detected" : "none"}</p>
          </div>
        </div>
        {lue?.latestLayout && (
          <p className="mt-3 text-xs text-[#8a847a]">
            Latest {lue.latestLayout.metadata.layoutId} · {lue.latestLayout.regions.length} regions ·
            confidence {lue.latestLayout.metadata.confidenceScore}
          </p>
        )}
      </Panel>

      {typeEntries.length > 0 && (
        <Panel title="Structural Regions">
          <DataTable
            columns={[
              { key: "type", header: "Region Type" },
              { key: "count", header: "Count" },
            ]}
            rows={typeEntries.map(([type, count]) => ({ type, count: String(count), key: type }))}
          />
        </Panel>
      )}

      {cockpit?.recentLogs && cockpit.recentLogs.length > 0 && (
        <Panel title="Layout Logs">
          <DataTable
            columns={[{ key: "log", header: "Event" }]}
            rows={cockpit.recentLogs.map((log, i) => ({ log, key: String(i) }))}
          />
        </Panel>
      )}
    </div>
  );
}
