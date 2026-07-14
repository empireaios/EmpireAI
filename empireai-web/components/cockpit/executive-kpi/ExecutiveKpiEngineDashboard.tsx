"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveKpiEngine } from "@/lib/executive-kpi-engine/useExecutiveKpiEngine";

/** Compact Executive KPI Engine strip for Executive Home. */
export function ExecutiveKpiEngineStrip() {
  const { view, loading, live } = useExecutiveKpiEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive KPI Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-10 KPI</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-kpi" className="text-xs text-[#d4af37] hover:underline">
          KPI panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active KPIs</p>
          <p className="text-sm text-[#d4af37]">{view.activeKpiCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Performance Index</p>
          <p className="text-sm text-rose-300">{view.enterprisePerformanceIndex}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Financial Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.financialHealthScore}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Avg Confidence</p>
          <p className="text-sm text-[#e8e0d0]">{view.averageConfidence}%</p>
        </div>
      </div>
    </section>
  );
}

/** E3-10 — Permanent Executive KPI Engine panel. */
export function ExecutiveKpiEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveKpiEngine();

  if (loading && !view) {
    return <Panel title="Executive KPI">Loading executive KPI engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive KPI" subtitle="E3-10 · Executive KPI Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-rose-500/50 bg-gradient-to-br from-rose-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-10 Executive KPI Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE311 && (
            <Link href="/cockpit/founder/capital-risk">
              <Badge variant="gold">E3-11 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/financial-scenario" className="text-xs text-[#d4af37] hover:underline">
            Financial Scenario →
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
        <StatCard label="KPI Health" value={view.kpiHealth} />
        <StatCard label="Performance Index" value={String(view.enterprisePerformanceIndex)} />
        <StatCard label="Financial Health" value={`${view.financialHealthScore}%`} />
        <StatCard label="Avg Confidence" value={`${view.averageConfidence}%`} />
      </div>

      <Panel title="Enterprise KPIs">
        <DataTable
          columns={[
            { key: "title", header: "KPI" },
            { key: "category", header: "Category" },
            { key: "domain", header: "Domain" },
            { key: "currentValue", header: "Current" },
            { key: "targetValue", header: "Target" },
            { key: "variance", header: "Variance" },
            { key: "confidence", header: "Confidence" },
            { key: "status", header: "Status" },
          ]}
          rows={view.enterpriseKpis}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Financial KPIs">
          <DataTable
            columns={[
              { key: "title", header: "KPI" },
              { key: "currentValue", header: "Current" },
              { key: "targetValue", header: "Target" },
              { key: "trend", header: "Trend" },
              { key: "variance", header: "Variance" },
              { key: "status", header: "Status" },
            ]}
            rows={view.financialKpis}
          />
        </Panel>

        <Panel title="Business KPIs">
          <DataTable
            columns={[
              { key: "title", header: "KPI" },
              { key: "businessUnit", header: "Unit" },
              { key: "currentValue", header: "Current" },
              { key: "targetValue", header: "Target" },
              { key: "trend", header: "Trend" },
              { key: "status", header: "Status" },
            ]}
            rows={view.businessKpis}
          />
        </Panel>
      </div>

      <Panel title="Performance Trends">
        <DataTable
          columns={[
            { key: "period", header: "Period" },
            { key: "revenue", header: "Revenue" },
            { key: "profit", header: "Profit" },
            { key: "cashFlow", header: "Cash Flow" },
            { key: "roi", header: "ROI" },
            { key: "trend", header: "Trend" },
          ]}
          rows={view.performanceTrends}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Variance Analysis">
          <DataTable
            columns={[
              { key: "title", header: "KPI" },
              { key: "targetValue", header: "Target" },
              { key: "currentValue", header: "Current" },
              { key: "variance", header: "Variance" },
              { key: "variancePercent", header: "Var %" },
              { key: "severity", header: "Severity" },
            ]}
            rows={view.varianceAnalysis}
          />
        </Panel>

        <Panel title="Executive Scorecard">
          <DataTable
            columns={[
              { key: "domain", header: "Domain" },
              { key: "score", header: "Score" },
              { key: "target", header: "Target" },
              { key: "status", header: "Status" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.executiveScorecard}
          />
        </Panel>
      </div>

      <Panel title="Financial Health">
        <DataTable
          columns={[
            { key: "metric", header: "Metric" },
            { key: "value", header: "Value" },
            { key: "target", header: "Target" },
            { key: "status", header: "Status" },
            { key: "trend", header: "Trend" },
          ]}
          rows={view.financialHealth}
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

      <Panel title="KPI Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.kpiAnalysis}
        />
      </Panel>

      <Panel title="Executive KPI Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.executiveKpiPipeline}
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
