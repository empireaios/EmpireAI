"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ContextSyncPayload = {
  contextSync: {
    computedAt: string;
    cockpit: {
      synchronizationStatus: string;
      roadmapPosition: string;
      contextCompleteness: number;
      architectureVersion: string;
      repositoryVersion: string | null;
      productionAlignment: string;
      synchronizedAt: string | null;
    };
    pipeline: {
      steps: Array<{ label: string; status: string; summary: string }>;
      alignmentFindings: Array<{ severity: string; signal: string }>;
      contextPackage: {
        currentPhase: string;
        missionPurpose: string;
        relevantVision: string;
        relevantSoul: string;
      };
    };
  };
};

/** P4-03 — Context Synchronization Cockpit panel. */
export function DevelopmentContextSyncPanel() {
  const [data, setData] = useState<ContextSyncPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/context-sync", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ContextSyncPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Context Synchronization");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Context Synchronization">Loading operational context…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Context Synchronization">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, pipeline } = data.contextSync;

  return (
    <div className="space-y-6">
      <Panel title="Context Synchronization Status" subtitle="P4-03 · PILLOW-CS-001">
        <DataModeBadge mode="live" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Stat label="Status" value={cockpit.synchronizationStatus} />
          <Stat label="Completeness" value={`${cockpit.contextCompleteness}%`} />
          <Stat label="Roadmap Position" value={cockpit.roadmapPosition} />
          <Stat label="Architecture" value={cockpit.architectureVersion.slice(0, 60)} />
          <Stat label="Repository Version" value={cockpit.repositoryVersion ?? "—"} />
          <Stat label="Production" value={cockpit.productionAlignment.slice(0, 60)} />
          <Stat label="Synchronized At" value={cockpit.synchronizedAt ?? "—"} />
        </div>
      </Panel>

      <Panel title="Context Package">
        <ul className="space-y-2 text-sm text-[#c8c0b0]">
          <li>Phase: {pipeline.contextPackage.currentPhase}</li>
          <li>Purpose: {pipeline.contextPackage.missionPurpose}</li>
          <li>Vision: {pipeline.contextPackage.relevantVision.slice(0, 160)}</li>
          <li>Soul: {pipeline.contextPackage.relevantSoul.slice(0, 160)}</li>
        </ul>
      </Panel>

      <Panel title="Context Pipeline">
        <DataTable
          keyField="label"
          data={pipeline.steps.map((s) => ({
            label: s.label,
            status: s.status,
            summary: s.summary.slice(0, 100),
          }))}
          columns={[
            { key: "label", header: "Step" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
        />
      </Panel>

      {pipeline.alignmentFindings.length > 0 && (
        <Panel title="Alignment Findings">
          <DataTable
            keyField="signal"
            data={pipeline.alignmentFindings}
            columns={[
              { key: "severity", header: "Severity" },
              { key: "signal", header: "Signal" },
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
