"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type NavigationMappingPayload = {
  navigationMapping?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { successfulMappings: number; totalNodes: number; totalEdges: number };
      health: { status: string; healthScore: number };
      configuration: { confidenceThreshold: number };
    };
    cockpit: {
      mappingStatus: string;
      healthStatus: string;
      nodesMapped: number;
      edgesMapped: number;
      currentScreenId: string | null;
      currentRouteId: string | null;
      transitionDetected: boolean;
      recentLogs: string[];
    };
    latestGraph: {
      metadata: { timestamp: string; graphId: string; currentScreenId: string; confidenceScore: number };
      nodes: { nodeId: string; kind: string; label: string | null }[];
      edges: { edgeId: string; transitionType: string; observationCount: number }[];
    } | null;
  };
  live?: boolean;
};

/** T1-05 — Navigation Mapping development panel. */
export function DevelopmentNavigationMappingPanel() {
  const [data, setData] = useState<NavigationMappingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/navigation-mapping", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as NavigationMappingPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Navigation Mapping");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  const nme = data?.navigationMapping;
  const engine = nme?.engine;
  const cockpit = nme?.cockpit;

  if (loading && !data) {
    return <Panel title="Navigation Mapping">Loading navigation mapping…</Panel>;
  }

  if (error) {
    return (
      <Panel title="Navigation Mapping" subtitle="T1-05 · Learn application flow">
        <p className="text-sm text-amber-200">{error}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel title="Navigation Mapping" subtitle="T1-05 · Navigation graph">
        <div className="flex flex-wrap items-center gap-2">
          <DataModeBadge mode={data?.live === false ? "sandbox" : "live"} />
          <span className="text-xs text-[#6f6a60]">
            Status: {engine?.status ?? cockpit?.mappingStatus ?? "unknown"}
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-[#6f6a60]">Nodes Mapped</p>
            <p className="text-[#d4af37]">
              {cockpit?.nodesMapped ?? engine?.performance.totalNodes ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Edges</p>
            <p>{cockpit?.edgesMapped ?? engine?.performance.totalEdges ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Current Screen</p>
            <p className="truncate">{cockpit?.currentScreenId ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Transitions</p>
            <p>{cockpit?.transitionDetected ? "detected" : "none"}</p>
          </div>
        </div>
        {nme?.latestGraph && (
          <p className="mt-3 text-xs text-[#8a847a]">
            Graph {nme.latestGraph.metadata.graphId} · {nme.latestGraph.nodes.length} nodes ·{" "}
            {nme.latestGraph.edges.length} edges
          </p>
        )}
      </Panel>

      {nme?.latestGraph && nme.latestGraph.nodes.length > 0 && (
        <Panel title="Navigation Nodes">
          <DataTable
            columns={[
              { key: "kind", header: "Kind" },
              { key: "label", header: "Label" },
            ]}
            rows={nme.latestGraph.nodes.slice(0, 20).map((n) => ({
              kind: n.kind,
              label: n.label ?? n.nodeId,
              key: n.nodeId,
            }))}
          />
        </Panel>
      )}

      {nme?.latestGraph && nme.latestGraph.edges.length > 0 && (
        <Panel title="Navigation Edges">
          <DataTable
            columns={[
              { key: "type", header: "Transition" },
              { key: "count", header: "Observations" },
            ]}
            rows={nme.latestGraph.edges.map((e) => ({
              type: e.transitionType,
              count: String(e.observationCount),
              key: e.edgeId,
            }))}
          />
        </Panel>
      )}

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
