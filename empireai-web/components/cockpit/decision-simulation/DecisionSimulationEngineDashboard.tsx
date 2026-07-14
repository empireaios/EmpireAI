"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useDecisionSimulationEngine } from "@/lib/decision-simulation-engine/useDecisionSimulationEngine";

/** Compact Decision Simulation Engine strip for Executive Home. */
export function DecisionSimulationEngineStrip() {
  const { view, loading, live } = useDecisionSimulationEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Decision Simulation Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/[0.12] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-03 Simulations</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-recommendations" className="text-xs text-[#d4af37] hover:underline">
          Executive Recommendations →
        </Link>
        <Link href="/cockpit/founder/decision-simulation" className="text-xs text-[#d4af37] hover:underline">
          Simulation panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Simulations</p>
          <p className="text-sm text-[#d4af37]">{view.availableSimulationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Recommended</p>
          <p className="text-sm text-violet-300 line-clamp-1">{view.recommendedOption}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Confidence</p>
          <p className="text-sm text-[#e8e0d0]">{view.recommendedConfidence}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Engine Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.engineHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-03 — Permanent Decision Simulation Engine panel. */
export function DecisionSimulationEngineDashboard() {
  const { view, loading, error, reload, live, data } = useDecisionSimulationEngine();

  if (loading && !view) {
    return <Panel title="Decision Simulation">Loading decision simulation engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Decision Simulation" subtitle="E2-03 · Decision Simulation Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-violet-500/40 bg-gradient-to-br from-violet-500/[0.12] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E2-03 Decision Simulation</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE204 && <Badge variant="gold">E2-04 Active</Badge>}
          <Link href="/cockpit/founder/executive-recommendations" className="text-xs text-[#d4af37] hover:underline">
            Executive Recommendations →
          </Link>
          <Link href="/cockpit/founder/risk-assessment" className="text-xs text-[#d4af37] hover:underline">
            Risk Assessment →
          </Link>
          <Link href="/cockpit/founder/decision-architecture" className="text-xs text-[#d4af37] hover:underline">
            Decision Architecture →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
        <p className="mt-2 text-sm text-violet-200">
          Recommended: <span className="text-[#e8e0d0]">{view.recommendedOption}</span> · {view.recommendedConfidence}% confidence
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Engine Health" value={view.engineHealth} />
        <StatCard label="Available Simulations" value={String(view.availableSimulationCount)} />
        <StatCard label="Active Simulations" value={String(view.activeSimulationCount)} />
        <StatCard label="Strategic Alignment" value={view.strategicAlignment} />
      </div>

      <Panel title="Scenario Comparison">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "title", header: "Simulation" },
            { key: "scenario", header: "Scenario" },
            { key: "successProbability", header: "Success %" },
            { key: "failureProbability", header: "Failure %" },
            { key: "riskProfile", header: "Risk" },
            { key: "expectedRoi", header: "ROI" },
            { key: "recommended", header: "Recommended" },
          ]}
          rows={view.scenarioComparison.map((r) => ({
            ...r,
            scenario: r.scenario.replace(/_/g, " "),
            recommended: r.recommended ? "yes" : "—",
          }))}
        />
      </Panel>

      <Panel title="Predicted Outcomes">
        <DataTable
          columns={[
            { key: "title", header: "Simulation" },
            { key: "scenario", header: "Scenario" },
            { key: "outcome", header: "Outcome" },
            { key: "successProbability", header: "Success %" },
            { key: "businessImpact", header: "Business" },
            { key: "financialImpact", header: "Financial" },
            { key: "confidence", header: "Confidence" },
          ]}
          rows={view.predictedOutcomes.map((r) => ({
            ...r,
            scenario: r.scenario.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Comparative Analysis">
          <DataTable
            columns={[
              { key: "label", header: "Dimension" },
              { key: "bestScenario", header: "Best Scenario" },
              { key: "score", header: "Score" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.comparativeAnalysis.map((r) => ({
              ...r,
              bestScenario: r.bestScenario.replace(/_/g, " "),
            }))}
          />
        </Panel>

        <Panel title="Simulation Outputs">
          <DataTable
            columns={[
              { key: "label", header: "Output" },
              { key: "value", header: "Value" },
              { key: "status", header: "Status" },
            ]}
            rows={view.simulationOutputs}
          />
        </Panel>
      </div>

      <Panel title="Available Simulations">
        <DataTable
          columns={[
            { key: "title", header: "Simulation" },
            { key: "scenario", header: "Scenario" },
            { key: "successProbability", header: "Success %" },
            { key: "riskProfile", header: "Risk" },
            { key: "expectedRoi", header: "ROI" },
            { key: "status", header: "Status" },
          ]}
          rows={view.availableSimulations.slice(0, 15).map((r) => ({
            ...r,
            scenario: r.scenario.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Simulation Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.simulationPipeline}
        />
      </Panel>

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
