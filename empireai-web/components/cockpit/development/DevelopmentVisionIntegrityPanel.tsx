"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type VisionIntegrityPayload = {
  visionIntegrity: {
    computedAt: string;
    cockpit: {
      visionAlignment: string;
      visionAlignmentScore: number;
      currentDrift: string[];
      currentRecommendations: string[];
      currentViolations: string[];
      repositoryAlignment: string;
      architectureAlignment: string;
      missionAlignment: string;
      businessAlignment: string;
      productionAlignment: string;
      approvalStatus: string;
      grandKingSummary: string;
      analysis: { recommendations: string[] };
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P6-02 — Vision Integrity Engine Cockpit panel. */
export function DevelopmentVisionIntegrityPanel() {
  const [data, setData] = useState<VisionIntegrityPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/vision-integrity", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as VisionIntegrityPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Vision Integrity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Vision Integrity">Loading VIE state…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Vision Integrity">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, readiness } = data.visionIntegrity;

  return (
    <div className="space-y-6">
      <Panel title="Vision Integrity" subtitle="P6-02 · PILLOW-VIE-001">
        <DataModeBadge mode="live" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-white/50">Vision Alignment</p>
            <p className="text-sm font-medium text-[#f0d78c]">
              {cockpit.visionAlignment} · {cockpit.visionAlignmentScore}/100
            </p>
          </div>
          <div>
            <p className="text-xs text-white/50">Approval Status</p>
            <p className="text-sm font-medium text-[#f0d78c]">{cockpit.approvalStatus}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-[#c8c0b0]">{cockpit.grandKingSummary}</p>
      </Panel>

      <Panel title="Alignment Domains">
        <DataTable
          columns={[
            { key: "domain", header: "Domain" },
            { key: "status", header: "Status" },
          ]}
          rows={[
            { domain: "Repository", status: cockpit.repositoryAlignment },
            { domain: "Architecture", status: cockpit.architectureAlignment },
            { domain: "Mission", status: cockpit.missionAlignment },
            { domain: "Business", status: cockpit.businessAlignment },
            { domain: "Production", status: cockpit.productionAlignment },
          ]}
        />
      </Panel>

      {cockpit.currentDrift.length > 0 && (
        <Panel title="Current Drift">
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-200">
            {cockpit.currentDrift.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </Panel>
      )}

      {cockpit.currentViolations.length > 0 && (
        <Panel title="Violations">
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-200">
            {cockpit.currentViolations.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Readiness" subtitle={`Score ${readiness.readinessScore}/100`}>
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
      </Panel>

      {cockpit.currentRecommendations.length > 0 && (
        <Panel title="Recommendations">
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#c8c0b0]">
            {cockpit.currentRecommendations.map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
