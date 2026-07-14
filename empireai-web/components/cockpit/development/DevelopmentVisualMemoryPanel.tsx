"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type VisualMemoryPayload = {
  visualMemory?: {
    computedAt: string;
    engine: {
      status: string;
      performance: {
        successfulRecords: number;
        maskedSensitiveFields: number;
        retrievals: number;
      };
      health: { status: string; healthScore: number; storageUsedBytes: number };
    };
    cockpit: {
      memoryStatus: string;
      healthStatus: string;
      recordsStored: number;
      latestScreenId: string | null;
      storageUsedBytes: number;
      confidenceScore: number;
      recentLogs: string[];
    };
    latestRecord: {
      memoryRecordId: string;
      screenId: string | null;
      stateSummary: string;
      retentionCategory: string;
      confidence: number;
    } | null;
    recentRecords: {
      memoryRecordId: string;
      screenId: string | null;
      stateSummary: string;
      timestamp: string;
    }[];
  };
  live?: boolean;
};

/** T1-08 — Visual Memory development panel. */
export function DevelopmentVisualMemoryPanel() {
  const [data, setData] = useState<VisualMemoryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/visual-memory", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as VisualMemoryPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Visual Memory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  const vme = data?.visualMemory;
  const engine = vme?.engine;
  const cockpit = vme?.cockpit;
  const latest = vme?.latestRecord;

  if (loading && !data) {
    return <Panel title="Visual Memory">Loading visual memory…</Panel>;
  }

  if (error) {
    return (
      <Panel title="Visual Memory" subtitle="T1-08 · Store historical UI states">
        <p className="text-sm text-amber-200">{error}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel title="Visual Memory" subtitle="T1-08 · Persistent UI memory">
        <div className="flex flex-wrap items-center gap-2">
          <DataModeBadge mode={data?.live === false ? "sandbox" : "live"} />
          <span className="text-xs text-[#6f6a60]">
            Status: {engine?.status ?? cockpit?.memoryStatus ?? "unknown"}
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-[#6f6a60]">Records Stored</p>
            <p className="text-[#d4af37]">
              {cockpit?.recordsStored ?? engine?.performance.successfulRecords ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Storage Used</p>
            <p>{cockpit?.storageUsedBytes ?? engine?.health.storageUsedBytes ?? 0} B</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Masked Fields</p>
            <p>{engine?.performance.maskedSensitiveFields ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Confidence</p>
            <p>{cockpit?.confidenceScore ?? latest?.confidence ?? 0}</p>
          </div>
        </div>
      </Panel>

      {latest && (
        <Panel title="Latest Memory Record">
          <DataTable
            columns={[
              { key: "field", header: "Field" },
              { key: "value", header: "Value" },
            ]}
            rows={[
              { field: "Record ID", value: latest.memoryRecordId, key: "id" },
              { field: "Screen", value: latest.screenId ?? "—", key: "screen" },
              { field: "Summary", value: latest.stateSummary, key: "summary" },
              { field: "Retention", value: latest.retentionCategory, key: "retention" },
            ]}
          />
        </Panel>
      )}

      {vme?.recentRecords && vme.recentRecords.length > 0 && (
        <Panel title="Recent Memory Records">
          <DataTable
            columns={[
              { key: "id", header: "Record" },
              { key: "screen", header: "Screen" },
              { key: "time", header: "Time" },
            ]}
            rows={vme.recentRecords.slice(0, 10).map((r) => ({
              id: r.memoryRecordId,
              screen: r.screenId ?? "—",
              time: new Date(r.timestamp).toLocaleTimeString(),
              key: r.memoryRecordId,
            }))}
          />
        </Panel>
      )}

      {cockpit?.recentLogs && cockpit.recentLogs.length > 0 && (
        <Panel title="Memory Logs">
          <DataTable
            columns={[{ key: "log", header: "Event" }]}
            rows={cockpit.recentLogs.map((log, i) => ({ log, key: String(i) }))}
          />
        </Panel>
      )}
    </div>
  );
}
