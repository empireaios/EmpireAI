"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ComponentRecognitionPayload = {
  componentRecognition?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { successfulRecognitions: number; totalComponentsDetected: number };
      health: { status: string; healthScore: number };
      configuration: { confidenceThreshold: number };
    };
    cockpit: {
      recognitionStatus: string;
      healthStatus: string;
      componentsDetected: number;
      componentTypeCounts: Record<string, number>;
      changeDetected: boolean;
      recentLogs: string[];
    };
    latestResult: {
      metadata: { timestamp: string; recognitionId: string; totalComponents: number };
      components: { componentId: string; componentType: string; detectionConfidence: number }[];
    } | null;
  };
  live?: boolean;
};

/** T1-03 — Component Recognition development panel. */
export function DevelopmentComponentRecognitionPanel() {
  const [data, setData] = useState<ComponentRecognitionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/component-recognition", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ComponentRecognitionPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Component Recognition");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  const cre = data?.componentRecognition;
  const engine = cre?.engine;
  const cockpit = cre?.cockpit;

  if (loading && !data) {
    return <Panel title="Component Recognition">Loading component recognition…</Panel>;
  }

  if (error) {
    return (
      <Panel title="Component Recognition" subtitle="T1-03 · Complete component awareness">
        <p className="text-sm text-amber-200">{error}</p>
      </Panel>
    );
  }

  const typeEntries = Object.entries(cockpit?.componentTypeCounts ?? {});

  return (
    <div className="space-y-4">
      <Panel title="Component Recognition" subtitle="T1-03 · Detect all UI components">
        <div className="flex flex-wrap items-center gap-2">
          <DataModeBadge mode={data?.live === false ? "sandbox" : "live"} />
          <span className="text-xs text-[#6f6a60]">
            Status: {engine?.status ?? cockpit?.recognitionStatus ?? "unknown"}
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-[#6f6a60]">Components Detected</p>
            <p className="text-[#d4af37]">
              {cockpit?.componentsDetected ?? engine?.performance.totalComponentsDetected ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Health</p>
            <p>{engine?.health.status ?? cockpit?.healthStatus ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Recognitions</p>
            <p>{engine?.performance.successfulRecognitions ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Changes</p>
            <p>{cockpit?.changeDetected ? "detected" : "none"}</p>
          </div>
        </div>
        {cre?.latestResult && (
          <p className="mt-3 text-xs text-[#8a847a]">
            Latest {cre.latestResult.metadata.recognitionId} ·{" "}
            {cre.latestResult.metadata.totalComponents} components
          </p>
        )}
      </Panel>

      {typeEntries.length > 0 && (
        <Panel title="Component Types">
          <DataTable
            columns={[
              { key: "type", header: "Type" },
              { key: "count", header: "Count" },
            ]}
            rows={typeEntries.map(([type, count]) => ({ type, count: String(count), key: type }))}
          />
        </Panel>
      )}

      {cockpit?.recentLogs && cockpit.recentLogs.length > 0 && (
        <Panel title="Recognition Logs">
          <DataTable
            columns={[{ key: "log", header: "Event" }]}
            rows={cockpit.recentLogs.map((log, i) => ({ log, key: String(i) }))}
          />
        </Panel>
      )}
    </div>
  );
}
