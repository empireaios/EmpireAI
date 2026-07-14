"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type FounderShellPayload = {
  founderShellEngine: {
    computedAt: string;
    cockpit: {
      shellHealth: string;
      activeWorkspace: string;
      navigation: Array<{ id: string; label: string; route: string }>;
      workspaces: Array<{
        id: string;
        label: string;
        route: string;
        status: string;
        integrated: boolean;
      }>;
      context: {
        currentBusiness: string | null;
        currentMission: string | null;
        currentJourney: string | null;
        currentNotifications: number;
        currentRecommendations: string[];
        currentWorkspace: string;
      };
      executiveHome: {
        businessStatus: string;
        missionStatus: string;
        builderStatus: string;
        supervisorStatus: string;
        productionStatus: string;
        revenue: string;
        alerts: string[];
        recommendations: string[];
        currentJourney: string;
        pendingActions: string[];
      };
      navigationConsistent: boolean;
      contextPreserved: boolean;
      cockpitIntegrated: boolean;
      grandKingSummary: string;
      metrics: {
        workspaceReadyCount: number;
        workspaceTotal: number;
        navigationItemCount: number;
        integrationScore: number;
      };
    };
    readiness: {
      readinessScore: number;
      steps: Array<{ label: string; status: string; summary: string }>;
    };
  };
};

/** P7-01 — Founder Shell Cockpit panel. */
export function DevelopmentFounderShellPanel() {
  const [data, setData] = useState<FounderShellPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/founder-shell", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as FounderShellPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Founder Shell");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 15_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return <Panel title="Founder Shell">Loading founder shell status…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Founder Shell">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const { cockpit, readiness } = data.founderShellEngine;
  const home = cockpit.executiveHome;

  return (
    <div className="space-y-6">
      <Panel title="Founder Shell (P7-01)">
        <div className="flex flex-wrap items-center gap-3">
          <DataModeBadge mode="live" />
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data.founderShellEngine.computedAt).toLocaleTimeString()}
          </span>
          <span className="text-xs capitalize text-[#d4af37]">{cockpit.shellHealth}</span>
        </div>
        <p className="mt-3 text-sm text-[#c8c0b0]">{cockpit.grandKingSummary}</p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Executive Home Summary">
          <dl className="space-y-2 text-sm">
            {[
              ["Business", home.businessStatus],
              ["Mission", home.missionStatus],
              ["Builder", home.builderStatus],
              ["Supervisor", home.supervisorStatus],
              ["Production", home.productionStatus],
              ["Revenue", home.revenue],
              ["Journey", home.currentJourney],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-[#6f6a60]">{label}</dt>
                <dd className="text-right text-[#c8c0b0]">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Founder Context">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Workspace</dt>
              <dd className="text-right text-[#d4af37]">{cockpit.context.currentWorkspace}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Mission</dt>
              <dd className="text-right">{cockpit.context.currentMission ?? "None"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Journey</dt>
              <dd className="text-right">{cockpit.context.currentJourney ?? "Unknown"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6f6a60]">Notifications</dt>
              <dd className="text-right">{cockpit.context.currentNotifications}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel title="Founder Navigation">
        <DataTable
          columns={[
            { key: "label", header: "Workspace" },
            { key: "route", header: "Route" },
            { key: "status", header: "Status" },
          ]}
          data={cockpit.workspaces.map((w) => ({
            id: w.id,
            label: w.label,
            route: w.route,
            status: w.status,
          }))}
          keyField="id"
        />
      </Panel>

      <Panel title="Readiness">
        <p className="mb-3 text-sm text-[#c8c0b0]">
          Score {readiness.readinessScore}/100 · Integration {cockpit.metrics.integrationScore}%
        </p>
        <ul className="space-y-1 text-sm text-[#8a847a]">
          {readiness.steps.map((step) => (
            <li key={step.label}>
              {step.status === "passed" ? "✅" : "⚠️"} {step.label} — {step.summary}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
