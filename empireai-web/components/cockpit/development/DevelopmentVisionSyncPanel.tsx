"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type VisionSyncPayload = {
  visionSync: {
    computedAt: string;
    cockpit: {
      synchronizationStatus: string;
      visionVersion: string | null;
      currentRoadmapItem: string;
      constitutionalState: string;
      architectureState: string;
      repositoryState: string;
      productionAlignment: string;
      driftStatus: string;
      synchronizedAt: string | null;
    };
    pipeline: {
      steps: Array<{ label: string; status: string; summary: string }>;
      driftFindings: Array<{ severity: string; signal: string; recommendation: string }>;
      missionContext: { why: string; what: string; how: string; proof: string };
    };
  };
};

/** P4-02 — Vision Synchronization Cockpit panel (Development → Pillow). */
export function DevelopmentVisionSyncPanel() {
  const [data, setData] = useState<VisionSyncPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/vision-sync", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as VisionSyncPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Vision Synchronization");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Vision Synchronization">Loading constitutional sync state…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Vision Synchronization">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, pipeline } = data.visionSync;

  return (
    <div className="space-y-6">
      <Panel title="Synchronization Status" subtitle="P4-02 · PILLOW-VS-001">
        <DataModeBadge mode="live" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Stat label="Status" value={cockpit.synchronizationStatus} />
          <Stat label="Vision Version" value={cockpit.visionVersion ?? "—"} />
          <Stat label="Roadmap Item" value={cockpit.currentRoadmapItem} />
          <Stat label="Drift" value={cockpit.driftStatus} />
          <Stat label="Synchronized At" value={cockpit.synchronizedAt ?? "—"} />
        </div>
      </Panel>

      <Panel title="Constitutional Alignment">
        <ul className="space-y-2 text-sm text-[#c8c0b0]">
          <li>Constitution: {cockpit.constitutionalState}</li>
          <li>Architecture: {cockpit.architectureState}</li>
          <li>Repository: {cockpit.repositoryState}</li>
          <li>Production: {cockpit.productionAlignment}</li>
        </ul>
      </Panel>

      <Panel title="WHY → WHAT → HOW → PROOF">
        <ul className="space-y-2 text-sm text-[#c8c0b0]">
          <li>
            <span className="text-[#d4af37]">WHY</span> — {pipeline.missionContext.why}
          </li>
          <li>
            <span className="text-[#d4af37]">WHAT</span> — {pipeline.missionContext.what}
          </li>
          <li>
            <span className="text-[#d4af37]">HOW</span> — {pipeline.missionContext.how}
          </li>
          <li>
            <span className="text-[#d4af37]">PROOF</span> — {pipeline.missionContext.proof}
          </li>
        </ul>
      </Panel>

      <Panel title="Pipeline Steps">
        <DataTable
          keyField="label"
          data={pipeline.steps.map((s) => ({
            label: s.label,
            status: s.status,
            summary: s.summary.slice(0, 120),
          }))}
          columns={[
            { key: "label", header: "Step" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
        />
      </Panel>

      {pipeline.driftFindings.length > 0 && (
        <Panel title="Drift Findings">
          <DataTable
            keyField="signal"
            data={pipeline.driftFindings}
            columns={[
              { key: "severity", header: "Severity" },
              { key: "signal", header: "Signal" },
              { key: "recommendation", header: "Recommendation" },
            ]}
          />
        </Panel>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">{label}</p>
      <p className="mt-1 text-sm text-[#e8e0d0]">{value}</p>
    </div>
  );
}
