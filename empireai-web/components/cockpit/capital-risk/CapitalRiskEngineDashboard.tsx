"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useCapitalRiskEngine } from "@/lib/capital-risk-engine/useCapitalRiskEngine";

/** Compact Capital Risk Engine strip for Executive Home. */
export function CapitalRiskEngineStrip() {
  const { view, loading, live } = useCapitalRiskEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Capital Risk Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-11 Risk</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/capital-risk" className="text-xs text-[#d4af37] hover:underline">
          Risk panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Total Exposure</p>
          <p className="text-sm text-[#d4af37]">{view.totalCapitalExposure}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">High Risks</p>
          <p className="text-sm text-amber-300">{view.highRiskCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Mitigated</p>
          <p className="text-sm text-[#e8e0d0]">{view.mitigatedRiskCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Risk Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.capitalRiskHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E3-11 — Permanent Capital Risk Engine panel. */
export function CapitalRiskEngineDashboard() {
  const { view, loading, error, reload, live, data } = useCapitalRiskEngine();

  if (loading && !view) {
    return <Panel title="Capital Risk">Loading capital risk engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Capital Risk" subtitle="E3-11 · Capital Risk Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-amber-500/50 bg-gradient-to-br from-amber-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-11 Capital Risk Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE312 && (
            <Link href="/cockpit/founder/executive-forecast">
              <Badge variant="gold">E3-12 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-kpi" className="text-xs text-[#d4af37] hover:underline">
            Executive KPI →
          </Link>
          <Link href="/cockpit/founder/executive-finance" className="text-xs text-[#d4af37] hover:underline">
            Executive Finance →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Capital Risk Health" value={view.capitalRiskHealth} />
        <StatCard label="Total Exposure" value={view.totalCapitalExposure} />
        <StatCard label="High Risks" value={String(view.highRiskCount)} />
        <StatCard label="Mitigated" value={String(view.mitigatedRiskCount)} />
      </div>

      <Panel title="Capital Exposure">
        <DataTable
          columns={[
            { key: "title", header: "Risk" },
            { key: "category", header: "Category" },
            { key: "domain", header: "Domain" },
            { key: "capitalExposure", header: "Exposure" },
            { key: "riskScore", header: "Score" },
            { key: "residualRisk", header: "Residual" },
            { key: "status", header: "Status" },
          ]}
          rows={view.capitalExposure}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Risk Distribution">
          <DataTable
            columns={[
              { key: "category", header: "Category" },
              { key: "riskCount", header: "Count" },
              { key: "totalExposure", header: "Exposure" },
              { key: "averageScore", header: "Avg Score" },
              { key: "severity", header: "Severity" },
            ]}
            rows={view.riskDistribution}
          />
        </Panel>

        <Panel title="Risk Trends">
          <DataTable
            columns={[
              { key: "period", header: "Period" },
              { key: "totalExposure", header: "Exposure" },
              { key: "highRiskCount", header: "High" },
              { key: "mitigatedCount", header: "Mitigated" },
              { key: "residualExposure", header: "Residual" },
              { key: "trend", header: "Trend" },
            ]}
            rows={view.riskTrends}
          />
        </Panel>
      </div>

      <Panel title="Mitigation Status">
        <DataTable
          columns={[
            { key: "title", header: "Risk" },
            { key: "mitigationStrategy", header: "Strategy" },
            { key: "progress", header: "Progress" },
            { key: "residualRisk", header: "Residual" },
            { key: "owner", header: "Owner" },
            { key: "status", header: "Status" },
          ]}
          rows={view.mitigationStatus}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Liquidity Position">
          <DataTable
            columns={[
              { key: "metric", header: "Metric" },
              { key: "value", header: "Value" },
              { key: "target", header: "Target" },
              { key: "buffer", header: "Buffer" },
              { key: "status", header: "Status" },
            ]}
            rows={view.liquidityPosition}
          />
        </Panel>

        <Panel title="Financial Stability">
          <DataTable
            columns={[
              { key: "metric", header: "Metric" },
              { key: "value", header: "Value" },
              { key: "riskLevel", header: "Risk Level" },
              { key: "trend", header: "Trend" },
              { key: "status", header: "Status" },
            ]}
            rows={view.financialStability}
          />
        </Panel>
      </div>

      <Panel title="Capital Protection">
        <DataTable
          columns={[
            { key: "domain", header: "Domain" },
            { key: "protectionScore", header: "Score" },
            { key: "exposure", header: "Exposure" },
            { key: "mitigationCoverage", header: "Coverage" },
            { key: "status", header: "Status" },
          ]}
          rows={view.capitalProtection}
        />
      </Panel>

      <Panel title="Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "category", header: "Category" },
            { key: "why", header: "Why" },
            { key: "what", header: "What" },
            { key: "confidencePercent", header: "Confidence %" },
          ]}
          rows={view.recommendedActions}
        />
      </Panel>

      <Panel title="Risk Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.riskAnalysis}
        />
      </Panel>

      <Panel title="Capital Risk Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.capitalRiskPipeline}
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
    </div>
  );
}
