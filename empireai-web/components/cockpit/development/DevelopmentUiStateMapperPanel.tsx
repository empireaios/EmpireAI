"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type UiStateMapperPayload = {
  uiStateMapper?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { successfulStates: number; failedStates: number };
      health: { status: string; healthScore: number; notes: string[] };
      configuration: { serializationFormat: string; updateIntervalMs: number };
    };
    cockpit: {
      mappingStatus: string;
      healthStatus: string;
      statesGenerated: number;
      viewportDimensions: string;
      regionCount: number;
      changeDetected: boolean;
      recentLogs: string[];
    };
    latestState: {
      metadata: {
        timestamp: string;
        stateId: string;
        processingDurationMs: number;
      };
      screen: { regions: { regionId: string }[] };
      changeSummary: { hasChanges: boolean; modified: string[] } | null;
    } | null;
  };
  live?: boolean;
};

/** T1-02 — UI State Mapper development panel. */
export function DevelopmentUiStateMapperPanel() {
  const [data, setData] = useState<UiStateMapperPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/ui-state-mapper", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as UiStateMapperPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load UI State Mapper");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  const usm = data?.uiStateMapper;
  const engine = usm?.engine;
  const cockpit = usm?.cockpit;

  if (loading && !data) {
    return <Panel title="UI State Mapper">Loading UI state mapper…</Panel>;
  }

  if (error) {
    return (
      <Panel title="UI State Mapper" subtitle="T1-02 · Machine-readable UI model">
        <p className="text-sm text-amber-200">{error}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel title="UI State Mapper" subtitle="T1-02 · Full UI state mapping">
        <div className="flex flex-wrap items-center gap-2">
          <DataModeBadge mode={data?.live === false ? "sandbox" : "live"} />
          <span className="text-xs text-[#6f6a60]">
            Status: {engine?.status ?? cockpit?.mappingStatus ?? "unknown"}
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-[#6f6a60]">States Generated</p>
            <p className="text-[#d4af37]">
              {engine?.performance.successfulStates ?? cockpit?.statesGenerated ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Health</p>
            <p>{engine?.health.status ?? cockpit?.healthStatus ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Regions</p>
            <p>{cockpit?.regionCount ?? usm?.latestState?.screen.regions.length ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Changes</p>
            <p>{cockpit?.changeDetected ? "detected" : "none"}</p>
          </div>
        </div>
        {usm?.latestState && (
          <p className="mt-3 text-xs text-[#8a847a]">
            Latest state {usm.latestState.metadata.stateId} ·{" "}
            {usm.latestState.metadata.processingDurationMs}ms · viewport{" "}
            {cockpit?.viewportDimensions ?? "—"}
          </p>
        )}
      </Panel>

      {cockpit?.recentLogs && cockpit.recentLogs.length > 0 && (
        <Panel title="Mapping Logs">
          <DataTable
            columns={[{ key: "log", header: "Event" }]}
            rows={cockpit.recentLogs.map((log, i) => ({ log, key: String(i) }))}
          />
        </Panel>
      )}
    </div>
  );
}
