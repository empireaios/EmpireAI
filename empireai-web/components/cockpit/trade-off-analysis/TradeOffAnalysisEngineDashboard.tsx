"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useTradeOffAnalysisEngine } from "@/lib/trade-off-analysis-engine/useTradeOffAnalysisEngine";

/** Compact Trade-off Analysis Engine strip for Executive Home. */
export function TradeOffAnalysisEngineStrip() {
  const { view, loading, live } = useTradeOffAnalysisEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Trade-off Analysis Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-10 Trade-offs</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/trade-off-analysis" className="text-xs text-[#d4af37] hover:underline">
          Trade-off panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active</p>
          <p className="text-sm text-[#d4af37]">{view.activeTradeOffCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Pending</p>
          <p className="text-sm text-violet-300">{view.pendingDecisionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Recommended</p>
          <p className="text-sm text-[#e8e0d0]">{view.recommendedOptionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Engine Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.engineHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-10 — Permanent Trade-off Analysis Engine panel. */
export function TradeOffAnalysisEngineDashboard() {
  const { view, loading, error, reload, live, data } = useTradeOffAnalysisEngine();

  if (loading && !view) {
    return <Panel title="Trade-off Analysis">Loading trade-off analysis engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Trade-off Analysis" subtitle="E2-10 · Trade-off Analysis Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-violet-500/50 bg-gradient-to-br from-violet-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E2-10 Trade-off Analysis</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE211 && <Badge variant="gold">E2-11 Active</Badge>}
          <Link href="/cockpit/founder/executive-consensus" className="text-xs text-[#d4af37] hover:underline">
            Executive Consensus →
          </Link>
          <Link href="/cockpit/founder/executive-escalations" className="text-xs text-[#d4af37] hover:underline">
            Executive Escalations →
          </Link>
          <Link href="/cockpit/founder/decision-simulation" className="text-xs text-[#d4af37] hover:underline">
            Decision Simulation →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Engine Health" value={view.engineHealth} />
        <StatCard label="Active Trade-offs" value={String(view.activeTradeOffCount)} />
        <StatCard label="Pending Decisions" value={String(view.pendingDecisionCount)} />
        <StatCard label="Trade-off Health" value={view.tradeOffHealth} />
      </div>

      <Panel title="Trade-off Analyses">
        <DataTable
          columns={[
            { key: "title", header: "Decision" },
            { key: "category", header: "Category" },
            { key: "businessImpact", header: "Business" },
            { key: "financialImpact", header: "Financial" },
            { key: "riskAssessment", header: "Risk" },
            { key: "tradeOffScore", header: "Score" },
            { key: "recommendedOption", header: "Recommended" },
            { key: "status", header: "Status" },
          ]}
          rows={view.tradeOffAnalyses.map((t) => ({
            ...t,
            category: t.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Decision Alternatives">
        <DataTable
          columns={[
            { key: "label", header: "Alternative" },
            { key: "businessImpact", header: "Business" },
            { key: "financialImpact", header: "Financial" },
            { key: "expectedRoi", header: "ROI" },
            { key: "riskAssessment", header: "Risk" },
            { key: "tradeOffScore", header: "Score" },
            { key: "confidence", header: "Confidence" },
            { key: "recommended", header: "Recommended" },
          ]}
          rows={view.decisionAlternatives.map((a) => ({
            ...a,
            recommended: a.recommended ? "Yes" : "No",
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Trade-off Comparison">
          <DataTable
            columns={[
              { key: "title", header: "Decision" },
              { key: "dimension", header: "Dimension" },
              { key: "bestAlternative", header: "Best Alternative" },
              { key: "score", header: "Score" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.tradeOffComparisons.slice(0, 18).map((c) => ({
              ...c,
              dimension: c.dimension.replace(/_/g, " "),
            }))}
          />
        </Panel>

        <Panel title="Trade-off Scoring">
          <DataTable
            columns={[
              { key: "alternativeLabel", header: "Alternative" },
              { key: "tradeOffScore", header: "Score" },
              { key: "expectedRoi", header: "ROI" },
              { key: "riskLevel", header: "Risk" },
              { key: "strategicAlignment", header: "Strategic" },
              { key: "recommended", header: "Recommended" },
            ]}
            rows={view.tradeOffScoring.map((s) => ({
              ...s,
              recommended: s.recommended ? "Yes" : "No",
            }))}
          />
        </Panel>
      </div>

      <Panel title="Recommendations">
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

      <Panel title="Trade-off Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.tradeOffPipeline}
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
