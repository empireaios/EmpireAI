"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ProductionModePayload = {
  productionMode: {
    computedAt: string;
    cockpit: {
      productionStatus: string;
      enabledModules: string[];
      disabledModules: string[];
      limitedModules: string[];
      deferredModules: string[];
      featureFlags: string[];
      runtimeConfiguration: string;
      knownLimitations: string[];
      deploymentHealth: string;
      grandKingSummary: string;
      analysis: { recommendations: string[] };
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P5-02 — Production Mode Cockpit panel. */
export function DevelopmentProductionModePanel() {
  const [data, setData] = useState<ProductionModePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/production-mode", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ProductionModePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Production Mode");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Production Mode">Loading production operational state…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Production Mode">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, readiness } = data.productionMode;

  return (
    <div className="space-y-6">
      <Panel title="Production Status" subtitle="P5-02 · PILLOW-PM-001">
        <DataModeBadge mode="live" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-white/50">Overall Status</p>
            <p className="text-sm font-medium text-[#f0d78c]">{cockpit.productionStatus}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Runtime Configuration</p>
            <p className="text-sm text-[#c8c0b0]">{cockpit.runtimeConfiguration}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-[#c8c0b0]">{cockpit.grandKingSummary}</p>
        <p className="mt-2 text-xs text-white/50">{cockpit.deploymentHealth}</p>
      </Panel>

      <Panel title="Module States">
        <DataTable
          columns={[
            { key: "category", header: "Category" },
            { key: "modules", header: "Modules" },
          ]}
          rows={[
            { category: "Enabled", modules: cockpit.enabledModules.join(", ") || "none" },
            { category: "Limited", modules: cockpit.limitedModules.join(", ") || "none" },
            { category: "Disabled", modules: cockpit.disabledModules.join(", ") || "none" },
            { category: "Deferred", modules: cockpit.deferredModules.join(", ") || "none" },
          ]}
        />
      </Panel>

      <Panel title="Feature Flags">
        <ul className="space-y-1 text-sm text-[#c8c0b0]">
          {cockpit.featureFlags.map((flag) => (
            <li key={flag}>{flag}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="Known Limitations">
        <ul className="list-disc space-y-1 pl-5 text-sm text-[#c8c0b0]">
          {cockpit.knownLimitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="Readiness" subtitle={`Score ${readiness.readinessScore}/100`}>
        <ul className="space-y-2 text-sm">
          {readiness.steps.map((step) => (
            <li key={step.label} className="text-[#c8c0b0]">
              <span
                className={
                  step.status === "passed"
                    ? "text-emerald-300"
                    : step.status === "degraded"
                      ? "text-amber-300"
                      : "text-red-300"
                }
              >
                {step.status}
              </span>
              {" — "}
              {step.label}: {step.summary}
            </li>
          ))}
        </ul>
      </Panel>

      {cockpit.analysis.recommendations.length > 0 && (
        <Panel title="Recommendations">
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#c8c0b0]">
            {cockpit.analysis.recommendations.map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
