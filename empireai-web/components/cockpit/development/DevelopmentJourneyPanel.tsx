"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type JourneySystemPayload = {
  journeySystem: {
    computedAt: string;
    cockpit: {
      currentJourney: string;
      currentRoadmapItem: string;
      currentMission: string;
      currentStep: string;
      timeline: string[];
      progress: number;
      eta: string;
      dependencies: string[];
      repositoryChanges: string[];
      productionStatus: string;
      recoveryEvents: string[];
      lessonsLearned: string[];
      evidence: string[];
      acceptanceStatus: string;
      analysis: {
        journeyCompleteness: number;
        journeyDrift: string[];
        recommendations: string[];
      };
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P4-08 — Journey System Cockpit panel. */
export function DevelopmentJourneyPanel() {
  const [data, setData] = useState<JourneySystemPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/journey-system", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as JourneySystemPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Journey System");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Journey">Loading journey state…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Journey">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, readiness } = data.journeySystem;

  return (
    <div className="space-y-6">
      <Panel title="Current Journey" subtitle="P4-08 · PILLOW-JR-001">
        <DataModeBadge mode="live" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-white/50">Journey ID</p>
            <p className="text-sm font-medium text-white">{cockpit.currentJourney}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Roadmap Item</p>
            <p className="text-sm font-medium text-white">{cockpit.currentRoadmapItem}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Current Mission</p>
            <p className="text-sm font-medium text-white">{cockpit.currentMission}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Current Step</p>
            <p className="text-sm font-medium text-white">{cockpit.currentStep}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Progress</p>
            <p className="text-sm font-medium text-white">{cockpit.progress}%</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Production Status</p>
            <p className="text-sm font-medium text-white">{cockpit.productionStatus}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/70">{cockpit.acceptanceStatus}</p>
      </Panel>

      <Panel title="Journey Timeline">
        {cockpit.timeline.length > 0 ? (
          <ul className="space-y-2 text-sm text-white/70">
            {cockpit.timeline.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-white/50">No timeline events yet.</p>
        )}
      </Panel>

      <Panel title="Journey Readiness">
        <DataTable
          columns={[
            { key: "label", header: "Check" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={readiness.steps.map((s) => ({
            label: s.label,
            status: s.status,
            summary: s.summary,
          }))}
        />
        <p className="mt-3 text-xs text-white/50">
          Readiness: {readiness.readinessScore}/100 · Completeness:{" "}
          {Math.round(cockpit.analysis.journeyCompleteness * 100)}%
        </p>
      </Panel>

      {cockpit.lessonsLearned.length > 0 && (
        <Panel title="Lessons Learned">
          <ul className="list-disc pl-5 text-sm text-white/70">
            {cockpit.lessonsLearned.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
