"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useInvestmentEvaluationEngine } from "@/lib/investment-evaluation-engine/useInvestmentEvaluationEngine";

/** Compact Investment Evaluation Engine strip for Executive Home. */
export function InvestmentEvaluationEngineStrip() {
  const { view, loading, live } = useInvestmentEvaluationEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Investment Evaluation Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-04 Investment</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/investment-evaluation" className="text-xs text-[#d4af37] hover:underline">
          Investment panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Capital Required</p>
          <p className="text-sm text-[#d4af37]">{view.totalCapitalRequired}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Avg ROI</p>
          <p className="text-sm text-emerald-300">{view.averageExpectedRoi}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Confidence</p>
          <p className="text-sm text-[#e8e0d0]">{view.averageConfidence}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Pending</p>
          <p className="text-sm text-[#e8e0d0]">{view.pendingEvaluationCount}</p>
        </div>
      </div>
    </section>
  );
}

/** E3-04 — Permanent Investment Evaluation Engine panel. */
export function InvestmentEvaluationEngineDashboard() {
  const { view, loading, error, reload, live, data } = useInvestmentEvaluationEngine();

  if (loading && !view) {
    return <Panel title="Investment Evaluation">Loading investment evaluation engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Investment Evaluation" subtitle="E3-04 · Investment Evaluation Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-04 Investment Evaluation Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE305 && (
            <Link href="/cockpit/founder/roi-intelligence">
              <Badge variant="gold">E3-05 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-finance" className="text-xs text-[#d4af37] hover:underline">
            Executive Finance →
          </Link>
          <Link href="/cockpit/founder/capital-allocation" className="text-xs text-[#d4af37] hover:underline">
            Capital Allocation →
          </Link>
          <Link href="/cockpit/founder/executive-budget" className="text-xs text-[#d4af37] hover:underline">
            Executive Budget →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Investment Health" value={view.investmentHealth} />
        <StatCard label="Capital Required" value={view.totalCapitalRequired} />
        <StatCard label="Avg Expected ROI" value={`${view.averageExpectedRoi}%`} />
        <StatCard label="Avg Confidence" value={`${view.averageConfidence}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Active Investments" value={String(view.activeInvestmentCount)} />
        <StatCard label="Pending Evaluation" value={String(view.pendingEvaluationCount)} />
      </div>

      <Panel title="Investment Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.investmentPipeline}
        />
      </Panel>

      <Panel title="Investment Portfolio">
        <DataTable
          columns={[
            { key: "title", header: "Investment" },
            { key: "category", header: "Category" },
            { key: "requiredCapital", header: "Capital Required" },
            { key: "expectedRoi", header: "Expected ROI" },
            { key: "investmentHorizon", header: "Horizon" },
            { key: "strategicAlignment", header: "Alignment" },
            { key: "status", header: "Status" },
          ]}
          rows={view.investmentPortfolio}
        />
      </Panel>

      <Panel title="Enterprise Investments">
        <DataTable
          columns={[
            { key: "title", header: "Investment" },
            { key: "category", header: "Category" },
            { key: "requiredCapital", header: "Capital" },
            { key: "expectedRoi", header: "ROI" },
            { key: "investmentHorizon", header: "Horizon" },
            { key: "riskAssessment", header: "Risk" },
            { key: "confidence", header: "Confidence" },
            { key: "status", header: "Status" },
          ]}
          rows={view.enterpriseInvestments.map((i) => ({
            ...i,
            category: i.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Investment Analysis">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "score", header: "Score" },
              { key: "status", header: "Status" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.investmentAnalysis}
          />
        </Panel>

        <Panel title="Risk Assessment">
          <DataTable
            columns={[
              { key: "title", header: "Investment" },
              { key: "severity", header: "Severity" },
              { key: "exposure", header: "Exposure" },
              { key: "mitigation", header: "Mitigation" },
              { key: "status", header: "Status" },
            ]}
            rows={view.investmentRisks}
          />
        </Panel>
      </div>

      <Panel title="Strategic Alignment">
        <DataTable
          columns={[
            { key: "title", header: "Investment" },
            { key: "visionAlignment", header: "Vision" },
            { key: "strategicAlignment", header: "Strategic" },
            { key: "constitutionalAlignment", header: "Constitutional" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
          ]}
          rows={view.strategicAlignments}
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
