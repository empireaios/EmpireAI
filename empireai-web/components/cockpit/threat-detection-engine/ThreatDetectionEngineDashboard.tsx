"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useThreatDetectionEngine } from "@/lib/threat-detection-engine/useThreatDetectionEngine";

/** Compact Threat Detection Engine strip for Executive Home. */
export function ThreatDetectionEngineStrip() {
  const { view, loading, live } = useThreatDetectionEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Threat Detection Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-red-500/40 bg-gradient-to-r from-red-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-04 Threats</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/threat-detection" className="text-xs text-[#d4af37] hover:underline">
          Threat detection →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Detected</p>
          <p className="text-sm text-[#d4af37]">{view.detectedThreatCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Critical</p>
          <p className="text-sm text-red-300">{view.criticalThreatCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Emerging</p>
          <p className="text-sm text-amber-300">{view.emergingThreatCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Detection Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.threatDetectionHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E4-04 — Permanent Threat Detection Engine panel. */
export function ThreatDetectionEngineDashboard() {
  const { view, loading, error, reload, live, data } = useThreatDetectionEngine();

  if (loading && !view) {
    return <Panel title="Threat Detection">Loading threat detection engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Threat Detection" subtitle="E4-04 · Threat Detection Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-red-500/50 bg-gradient-to-br from-red-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E4-04 Threat Detection</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE405 && (
            <Link href="/cockpit/founder/industry-intelligence">
              <Badge variant="gold">E4-05 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/opportunity-discovery" className="text-xs text-[#d4af37] hover:underline">
            Opportunity Discovery →
          </Link>
          <Link href="/cockpit/founder/competitor-intelligence" className="text-xs text-[#d4af37] hover:underline">
            Competitor Intelligence →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Threats Detected" value={String(view.detectedThreatCount)} />
        <StatCard label="Critical Threats" value={String(view.criticalThreatCount)} />
        <StatCard label="Emerging Threats" value={String(view.emergingThreatCount)} />
        <StatCard label="Avg Threat Score" value={`${view.averageThreatScore}/100`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Detection Health" value={view.threatDetectionHealth} />
        <StatCard label="Engine Health" value={view.engineHealth} />
      </div>

      <Panel title="Threat Dashboard">
        <DataTable
          columns={[
            { key: "title", header: "Threat" },
            { key: "category", header: "Category" },
            { key: "severity", header: "Severity" },
            { key: "probability", header: "Probability" },
            { key: "impact", header: "Impact" },
            { key: "urgency", header: "Urgency" },
          ]}
          rows={view.threatDashboard.map((t) => ({
            ...t,
            category: t.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Critical Threats">
          <DataTable
            columns={[
              { key: "title", header: "Threat" },
              { key: "severity", header: "Severity" },
              { key: "probability", header: "Probability" },
              { key: "impact", header: "Impact" },
              { key: "urgency", header: "Urgency" },
              { key: "status", header: "Status" },
            ]}
            rows={view.criticalThreats}
          />
        </Panel>

        <Panel title="Emerging Threats">
          <DataTable
            columns={[
              { key: "title", header: "Threat" },
              { key: "category", header: "Category" },
              { key: "probability", header: "Probability" },
              { key: "timeHorizon", header: "Horizon" },
              { key: "discoverySignal", header: "Signal" },
            ]}
            rows={view.emergingThreats}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Threat Trends">
          <DataTable
            columns={[
              { key: "trend", header: "Trend" },
              { key: "direction", header: "Direction" },
              { key: "affectedThreats", header: "Threats" },
              { key: "detectionSignal", header: "Signal" },
            ]}
            rows={view.threatTrends}
          />
        </Panel>

        <Panel title="Business Impact">
          <DataTable
            columns={[
              { key: "title", header: "Threat" },
              { key: "businessImpact", header: "Business" },
              { key: "financialImpact", header: "Financial" },
              { key: "severity", header: "Severity" },
            ]}
            rows={view.businessImpact}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Risk Heatmap">
          <DataTable
            columns={[
              { key: "domain", header: "Domain" },
              { key: "threatCount", header: "Threats" },
              { key: "avgProbability", header: "Probability" },
              { key: "avgImpact", header: "Impact" },
              { key: "riskLevel", header: "Risk Level" },
            ]}
            rows={view.riskHeatmap.filter((r) => r.threatCount > 0)}
          />
        </Panel>

        <Panel title="Mitigation Status">
          <DataTable
            columns={[
              { key: "title", header: "Threat" },
              { key: "status", header: "Status" },
              { key: "residualRisk", header: "Residual Risk" },
              { key: "owner", header: "Owner" },
            ]}
            rows={view.mitigationStatus}
          />
        </Panel>
      </div>

      <Panel title="Threat Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.threatAnalysis}
        />
      </Panel>

      <Panel title="Executive Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "category", header: "Category" },
            { key: "why", header: "Why" },
            { key: "confidencePercent", header: "Confidence %" },
          ]}
          rows={view.recommendedActions}
        />
      </Panel>

      <Panel title="Threat Detection Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.threatDetectionPipeline}
        />
      </Panel>

      <Panel title="Pillow Evaluations">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.pillowEvaluations}
        />
      </Panel>

      <Panel title="Integrations">
        <DataTable
          columns={[
            { key: "engine", header: "Engine" },
            { key: "status", header: "Status" },
          ]}
          rows={Object.entries(view.integrations).map(([engine, status]) => ({ engine, status }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Threat Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.threatPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Threat Domains">
          <DataTable
            columns={[{ key: "domain", header: "Domain" }]}
            rows={view.governedDomains.map((domain) => ({
              domain: domain.replace(/_/g, " "),
            }))}
          />
        </Panel>
      </div>

      <Panel title="Pillow Advisory">
        <ul className="space-y-2 text-sm text-[#c8c0b0]">
          {view.pillowAdvisory.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
