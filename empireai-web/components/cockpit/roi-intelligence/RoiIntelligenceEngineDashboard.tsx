"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useRoiIntelligenceEngine } from "@/lib/roi-intelligence-engine/useRoiIntelligenceEngine";

/** Compact ROI Intelligence Engine strip for Executive Home. */
export function RoiIntelligenceEngineStrip() {
  const { view, loading, live } = useRoiIntelligenceEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading ROI Intelligence Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-05 ROI</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/roi-intelligence" className="text-xs text-[#d4af37] hover:underline">
          ROI panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Enterprise ROI</p>
          <p className="text-sm text-[#d4af37]">{view.enterpriseRoiPercentage}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Revenue</p>
          <p className="text-sm text-cyan-300">{view.totalRevenueGenerated}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Profit</p>
          <p className="text-sm text-[#e8e0d0]">{view.totalProfitGenerated}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Payback</p>
          <p className="text-sm text-[#e8e0d0]">{view.averagePaybackMonths} mo</p>
        </div>
      </div>
    </section>
  );
}

/** E3-05 — Permanent ROI Intelligence Engine panel. */
export function RoiIntelligenceEngineDashboard() {
  const { view, loading, error, reload, live, data } = useRoiIntelligenceEngine();

  if (loading && !view) {
    return <Panel title="ROI Intelligence">Loading ROI intelligence engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="ROI Intelligence" subtitle="E3-05 · ROI Intelligence Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-cyan-500/50 bg-gradient-to-br from-cyan-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-05 ROI Intelligence Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE306 && (
            <Link href="/cockpit/founder/cash-reserve">
              <Badge variant="gold">E3-06 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/investment-evaluation" className="text-xs text-[#d4af37] hover:underline">
            Investment Evaluation →
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
        <StatCard label="ROI Health" value={view.roiHealth} />
        <StatCard label="Enterprise ROI" value={`${view.enterpriseRoiPercentage}%`} />
        <StatCard label="Total Revenue" value={view.totalRevenueGenerated} />
        <StatCard label="Total Profit" value={view.totalProfitGenerated} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Avg Investment ROI" value={`${view.averageInvestmentRoi}%`} />
        <StatCard label="Avg Payback" value={`${view.averagePaybackMonths} months`} />
      </div>

      <Panel title="Enterprise ROI">
        <DataTable
          columns={[
            { key: "title", header: "Assessment" },
            { key: "category", header: "Category" },
            { key: "roiPercentage", header: "ROI %" },
            { key: "profitGenerated", header: "Profit" },
            { key: "paybackPeriod", header: "Payback" },
            { key: "trend", header: "Trend" },
            { key: "status", header: "Status" },
          ]}
          rows={view.enterpriseRoi}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Business ROI">
          <DataTable
            columns={[
              { key: "businessUnit", header: "Business Unit" },
              { key: "roiPercentage", header: "ROI %" },
              { key: "revenueGenerated", header: "Revenue" },
              { key: "profitGenerated", header: "Profit" },
              { key: "trend", header: "Trend" },
              { key: "status", header: "Status" },
            ]}
            rows={view.businessRoi}
          />
        </Panel>

        <Panel title="Investment ROI">
          <DataTable
            columns={[
              { key: "title", header: "Investment" },
              { key: "investmentCost", header: "Cost" },
              { key: "roiPercentage", header: "Actual ROI %" },
              { key: "expectedRoi", header: "Expected %" },
              { key: "variance", header: "Variance" },
              { key: "paybackPeriod", header: "Payback" },
              { key: "status", header: "Status" },
            ]}
            rows={view.investmentRoi}
          />
        </Panel>
      </div>

      <Panel title="Department ROI">
        <DataTable
          columns={[
            { key: "department", header: "Department" },
            { key: "title", header: "Assessment" },
            { key: "roiPercentage", header: "ROI %" },
            { key: "operatingCost", header: "Operating Cost" },
            { key: "profitGenerated", header: "Profit" },
            { key: "trend", header: "Trend" },
            { key: "status", header: "Status" },
          ]}
          rows={view.departmentRoi}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="ROI Trends">
          <DataTable
            columns={[
              { key: "period", header: "Period" },
              { key: "enterpriseRoi", header: "Enterprise %" },
              { key: "businessRoi", header: "Business %" },
              { key: "investmentRoi", header: "Investment %" },
              { key: "trend", header: "Trend" },
            ]}
            rows={view.roiTrends}
          />
        </Panel>

        <Panel title="Financial Performance">
          <DataTable
            columns={[
              { key: "metric", header: "Metric" },
              { key: "value", header: "Value" },
              { key: "trend", header: "Trend" },
              { key: "status", header: "Status" },
            ]}
            rows={view.financialPerformance}
          />
        </Panel>
      </div>

      <Panel title="ROI Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.roiAnalysis}
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

      <Panel title="ROI Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.roiPipeline}
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
