"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useEnterpriseValuationEngine } from "@/lib/enterprise-valuation-engine/useEnterpriseValuationEngine";

/** Compact Enterprise Valuation Engine strip for Executive Home. */
export function EnterpriseValuationEngineStrip() {
  const { view, loading, live } = useEnterpriseValuationEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Enterprise Valuation Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-violet-500/50 bg-gradient-to-r from-violet-500/[0.2] via-purple-500/[0.12] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-14 Valuation</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/enterprise-valuation" className="text-xs text-[#d4af37] hover:underline">
          Valuation panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Enterprise Value</p>
          <p className="text-sm text-violet-300">{view.estimatedEnterpriseValue}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Business Value</p>
          <p className="text-sm text-[#d4af37]">{view.businessValue}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Growth Trend</p>
          <p className="text-sm text-purple-300">{view.growthTrend}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Valuation Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.valuationHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E3-14 — Permanent Enterprise Valuation Engine panel. */
export function EnterpriseValuationEngineDashboard() {
  const { view, loading, error, reload, live, data } = useEnterpriseValuationEngine();

  if (loading && !view) {
    return <Panel title="Enterprise Valuation">Loading enterprise valuation engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Enterprise Valuation" subtitle="E3-14 · Enterprise Valuation Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-violet-500/50 bg-gradient-to-br from-violet-500/[0.18] via-purple-500/[0.1] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-14 Enterprise Valuation Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE315 && (
            <Link href="/cockpit/founder/executive-capital-strategy">
              <Badge variant="gold">E3-15 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-performance" className="text-xs text-[#d4af37] hover:underline">
            Performance Dashboard →
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
        <StatCard label="Estimated Enterprise Value" value={view.estimatedEnterpriseValue} />
        <StatCard label="Business Value" value={view.businessValue} />
        <StatCard label="Growth Trend" value={view.growthTrend} />
        <StatCard label="Risk Adjustment" value={view.totalRiskAdjustment} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Valuation Health" value={view.valuationHealth} />
        <StatCard label="Active Valuations" value={String(view.activeValuationCount)} />
        <StatCard label="Avg Confidence" value={`${view.averageConfidence}%`} />
        <StatCard label="Health Score" value={String(view.healthScore)} />
      </div>

      <Panel title="Enterprise Valuations">
        <DataTable
          columns={[
            { key: "title", header: "Valuation" },
            { key: "category", header: "Category" },
            { key: "estimatedEnterpriseValue", header: "Value" },
            { key: "revenueContribution", header: "Revenue" },
            { key: "profitContribution", header: "Profit" },
            { key: "riskAdjustment", header: "Risk Adj." },
            { key: "valuationMethod", header: "Method" },
            { key: "confidence", header: "Conf." },
            { key: "status", header: "Status" },
          ]}
          rows={view.enterpriseValuations}
        />
      </Panel>

      <Panel title="Valuation Drivers">
        <DataTable
          columns={[
            { key: "title", header: "Driver" },
            { key: "category", header: "Category" },
            { key: "contribution", header: "Contribution" },
            { key: "impact", header: "Impact" },
            { key: "trend", header: "Trend" },
            { key: "confidence", header: "Conf." },
            { key: "status", header: "Status" },
          ]}
          rows={view.valuationDrivers}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Revenue Contribution">
          <DataTable
            columns={[
              { key: "domain", header: "Domain" },
              { key: "revenue", header: "Revenue" },
              { key: "contributionPercent", header: "% Contrib." },
              { key: "growthRate", header: "Growth" },
              { key: "status", header: "Status" },
            ]}
            rows={view.revenueContribution}
          />
        </Panel>

        <Panel title="Profit Contribution">
          <DataTable
            columns={[
              { key: "domain", header: "Domain" },
              { key: "profit", header: "Profit" },
              { key: "contributionPercent", header: "% Contrib." },
              { key: "margin", header: "Margin" },
              { key: "status", header: "Status" },
            ]}
            rows={view.profitContribution}
          />
        </Panel>
      </div>

      <Panel title="Risk Adjustments">
        <DataTable
          columns={[
            { key: "factor", header: "Factor" },
            { key: "adjustment", header: "Adjustment" },
            { key: "impact", header: "Impact" },
            { key: "severity", header: "Severity" },
            { key: "status", header: "Status" },
          ]}
          rows={view.riskAdjustments}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Growth Trends">
          <DataTable
            columns={[
              { key: "period", header: "Period" },
              { key: "enterpriseValue", header: "Value" },
              { key: "growthRate", header: "Growth" },
              { key: "trend", header: "Trend" },
              { key: "confidence", header: "Conf." },
            ]}
            rows={view.growthTrends}
          />
        </Panel>

        <Panel title="Valuation Analysis">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "score", header: "Score" },
              { key: "status", header: "Status" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.valuationAnalysis}
          />
        </Panel>
      </div>

      <Panel title="Recommended Actions">
        <div className="space-y-3">
          {view.recommendedActions.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-violet-500/20 bg-violet-500/[0.04] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-[#f0d78c]">{rec.title}</span>
                <Badge variant="gold">{rec.category}</Badge>
                <span className="text-xs text-[#6f6a60]">{rec.confidencePercent}% confidence</span>
              </div>
              <p className="mt-2 text-xs text-[#8a847a]">
                <span className="text-violet-300">Why:</span> {rec.why}
              </p>
              <p className="mt-1 text-xs text-[#8a847a]">
                <span className="text-purple-300">What:</span> {rec.what}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Integrations">
        <DataTable
          columns={[
            { key: "module", header: "Module" },
            { key: "status", header: "Status" },
          ]}
          rows={Object.entries(view.integrations).map(([module, status]) => ({ module, status }))}
        />
      </Panel>
    </div>
  );
}
