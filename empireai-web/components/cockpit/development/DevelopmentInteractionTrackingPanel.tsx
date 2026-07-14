"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type InteractionTrackingPayload = {
  interactionTracking?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { successfulEvents: number; ingestedEvents: number; inferredEvents: number; maskedSensitiveEvents: number };
      health: { status: string; healthScore: number };
    };
    cockpit: {
      trackingStatus: string;
      healthStatus: string;
      eventsRecorded: number;
      latestInteractionType: string | null;
      currentScreenId: string | null;
      maskedEvents: number;
      recentLogs: string[];
    };
    recentEvents: {
      eventId: string;
      interactionType: string;
      sourceComponentId: string | null;
      timestamp: string;
      confidence: number;
    }[];
  };
  live?: boolean;
};

/** T1-06 — Interaction Tracking development panel. */
export function DevelopmentInteractionTrackingPanel() {
  const [data, setData] = useState<InteractionTrackingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/interaction-tracking", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as InteractionTrackingPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Interaction Tracking");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  const ite = data?.interactionTracking;
  const engine = ite?.engine;
  const cockpit = ite?.cockpit;

  if (loading && !data) {
    return <Panel title="Interaction Tracking">Loading interaction tracking…</Panel>;
  }

  if (error) {
    return (
      <Panel title="Interaction Tracking" subtitle="T1-06 · Observe user interactions">
        <p className="text-sm text-amber-200">{error}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel title="Interaction Tracking" subtitle="T1-06 · Interaction awareness">
        <div className="flex flex-wrap items-center gap-2">
          <DataModeBadge mode={data?.live === false ? "sandbox" : "live"} />
          <span className="text-xs text-[#6f6a60]">
            Status: {engine?.status ?? cockpit?.trackingStatus ?? "unknown"}
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-[#6f6a60]">Events Recorded</p>
            <p className="text-[#d4af37]">
              {cockpit?.eventsRecorded ?? engine?.performance.successfulEvents ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Ingested</p>
            <p>{engine?.performance.ingestedEvents ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Masked</p>
            <p>{cockpit?.maskedEvents ?? engine?.performance.maskedSensitiveEvents ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Latest Type</p>
            <p>{cockpit?.latestInteractionType ?? "—"}</p>
          </div>
        </div>
      </Panel>

      {ite?.recentEvents && ite.recentEvents.length > 0 && (
        <Panel title="Recent Interactions">
          <DataTable
            columns={[
              { key: "type", header: "Type" },
              { key: "component", header: "Component" },
              { key: "time", header: "Time" },
            ]}
            rows={ite.recentEvents.slice(0, 15).map((e) => ({
              type: e.interactionType,
              component: e.sourceComponentId ?? "—",
              time: new Date(e.timestamp).toLocaleTimeString(),
              key: e.eventId,
            }))}
          />
        </Panel>
      )}

      {cockpit?.recentLogs && cockpit.recentLogs.length > 0 && (
        <Panel title="Tracking Logs">
          <DataTable
            columns={[{ key: "log", header: "Event" }]}
            rows={cockpit.recentLogs.map((log, i) => ({ log, key: String(i) }))}
          />
        </Panel>
      )}
    </div>
  );
}
