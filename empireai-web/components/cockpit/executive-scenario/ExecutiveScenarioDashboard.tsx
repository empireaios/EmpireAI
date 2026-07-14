"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveScenarioPlanner } from "@/lib/executive-scenario-planner/useExecutiveScenarioPlanner";

/** Compact Executive Scenario strip for Executive Home. */
export function ExecutiveScenarioStrip() {
  const { view, loading, live } = useExecutiveScenarioPlanner();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Scenarios…
      </section>
    );
  }

  if (!view) return null;

  const recommended = view.recommendedScenario;

  return (
    <section className="rounded-xl border border-gold/40 bg-gradient-to-r from-gold/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E1-10 Scenarios</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-scenarios" className="text-xs text-[#d4af37] hover:underline">
          Scenario panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Available Scenarios</p>
          <p className="text-sm text-[#d4af37]">{view.availableScenarioCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Recommended</p>
          <p className="line-clamp-1 text-sm text-[#e8e0d0]">{recommended?.title ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Success Probability</p>
          <p className="text-sm text-[#e8e0d0]">{recommended?.successProbability ?? 0}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Vision Alignment</p>
          <p className="text-sm text-[#e8e0d0]">{view.visionAlignment}</p>
        </div>
      </div>
    </section>
  );
}

/** E1-10 — Permanent Executive Scenario Planner panel. */
export function ExecutiveScenarioDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveScenarioPlanner();

  if (loading && !view) {
    return <Panel title="Executive Scenarios">Loading scenario planner…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Scenarios" subtitle="E1-10 · Executive Scenario Planner">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const recommended = view.recommendedScenario;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E1-10 Executive Scenarios</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE111 && <Badge variant="gold">Ready for E1-11</Badge>}
          <Link href="/cockpit/founder/long-term-growth" className="text-xs text-[#d4af37] hover:underline">
            Long-Term Growth →
          </Link>
          <Link href="/cockpit/founder/executive-dependencies" className="text-xs text-[#d4af37] hover:underline">
            Executive Dependencies →
          </Link>
          <Link href="/cockpit/founder/corporate-vision" className="text-xs text-[#d4af37] hover:underline">
            Corporate Vision →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.plannerSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Planner Health" value={view.plannerHealth} />
        <StatCard label="Available Scenarios" value={String(view.availableScenarioCount)} />
        <StatCard label="Success Probability" value={`${recommended?.successProbability ?? 0}%`} />
        <StatCard label="Strategic Alignment" value={view.strategicAlignment} />
      </div>

      {recommended && (
        <Panel title="Recommended Scenario">
          <div className="space-y-2 text-sm text-[#c8c0b0]">
            <p className="text-base text-[#f0d78c]">{recommended.title}</p>
            <p>{recommended.purpose}</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-[#6f6a60]">Success</p>
                <p>{recommended.successProbability}%</p>
              </div>
              <div>
                <p className="text-xs text-[#6f6a60]">Failure</p>
                <p>{recommended.failureProbability}%</p>
              </div>
              <div>
                <p className="text-xs text-[#6f6a60]">Confidence</p>
                <p>{recommended.confidence}%</p>
              </div>
              <div>
                <p className="text-xs text-[#6f6a60]">Type</p>
                <p>{recommended.scenarioType.replace(/_/g, " ")}</p>
              </div>
            </div>
          </div>
        </Panel>
      )}

      <Panel title="Scenario Comparison">
        <DataTable
          columns={[
            { key: "title", header: "Scenario" },
            { key: "scenarioType", header: "Type" },
            { key: "successProbability", header: "Success %" },
            { key: "riskLevel", header: "Risk" },
            { key: "financialImpact", header: "Financial" },
            { key: "strategicAlignment", header: "Alignment" },
          ]}
          rows={view.scenarioComparison.map((row) => ({
            ...row,
            scenarioType: row.scenarioType.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Predicted Outcomes">
          <DataTable
            columns={[
              { key: "label", header: "Output" },
              { key: "value", header: "Prediction" },
              { key: "status", header: "Status" },
            ]}
            rows={view.simulationOutputs}
          />
        </Panel>

        <Panel title="Trade-off Analysis">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "score", header: "Score" },
              { key: "weight", header: "Weight" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.tradeOffAnalysis}
          />
        </Panel>
      </div>

      <Panel title="Available Scenarios">
        <DataTable
          columns={[
            { key: "title", header: "Scenario" },
            { key: "scenarioType", header: "Type" },
            { key: "domain", header: "Domain" },
            { key: "successProbability", header: "Success %" },
            { key: "failureProbability", header: "Failure %" },
            { key: "confidence", header: "Confidence" },
            { key: "recommended", header: "Recommended" },
          ]}
          rows={view.availableScenarios.map((s) => ({
            ...s,
            scenarioType: s.scenarioType.replace(/_/g, " "),
            domain: s.domain.replace(/_/g, " "),
            recommended: s.recommended ? "yes" : "—",
          }))}
        />
      </Panel>

      <Panel title="Alternative Options">
        <DataTable
          columns={[
            { key: "title", header: "Scenario" },
            { key: "scenarioType", header: "Type" },
            { key: "successProbability", header: "Success %" },
            { key: "financialImpact", header: "Financial" },
            { key: "businessImpact", header: "Business" },
          ]}
          rows={view.alternativeOptions.map((s) => ({
            ...s,
            scenarioType: s.scenarioType.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Scenario Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.scenarioPipeline}
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
