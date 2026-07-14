"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutivePredictionEngine } from "@/lib/executive-prediction-engine/useExecutivePredictionEngine";

/** Compact Executive Prediction Engine strip for Executive Home. */
export function ExecutivePredictionEngineStrip() {
  const { view, loading, live } = useExecutivePredictionEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Prediction Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-09 Prediction Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-prediction" className="text-xs text-[#d4af37] hover:underline">
          Predictions →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active Predictions</p>
          <p className="text-sm text-[#d4af37]">{view.activePredictionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">High Probability</p>
          <p className="text-sm text-violet-300">{view.highProbabilityCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Avg Confidence</p>
          <p className="text-sm text-purple-300">{view.averagePredictionConfidence}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Prediction Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.predictionIntelligenceHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E4-09 — Permanent Executive Prediction Engine panel. */
export function ExecutivePredictionEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutivePredictionEngine();

  if (loading && !view) {
    return <Panel title="Executive Prediction Engine">Loading executive prediction engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Prediction Engine" subtitle="E4-09 · Executive Prediction Engine">
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
          <Badge variant="gold">E4-09 Executive Prediction Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE410 && (
            <Link href="/cockpit/founder/executive-insight" className="text-xs text-[#d4af37] hover:underline">
              <Badge variant="gold">Ready for E4-10 →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-knowledge-graph" className="text-xs text-[#d4af37] hover:underline">
            Knowledge Graph →
          </Link>
          <Link href="/cockpit/founder/market-intelligence" className="text-xs text-[#d4af37] hover:underline">
            Market Intelligence →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Predictions" value={String(view.activePredictionCount)} />
        <StatCard label="High Probability" value={String(view.highProbabilityCount)} />
        <StatCard label="Strategic Forecasts" value={String(view.strategicForecastCount)} />
        <StatCard label="Avg Confidence" value={`${view.averagePredictionConfidence}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Prediction Health" value={view.predictionIntelligenceHealth} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Prediction Dashboard">
        <DataTable
          columns={[
            { key: "title", header: "Prediction" },
            { key: "category", header: "Category" },
            { key: "probability", header: "Probability %" },
            { key: "confidence", header: "Confidence %" },
            { key: "predictionHorizon", header: "Horizon" },
          ]}
          rows={view.predictionDashboard.map((p) => ({
            ...p,
            category: p.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Future Outlook">
          <DataTable
            columns={[
              { key: "title", header: "Outlook" },
              { key: "horizon", header: "Horizon" },
              { key: "probability", header: "Probability %" },
              { key: "status", header: "Status" },
            ]}
            rows={view.futureOutlook}
          />
        </Panel>

        <Panel title="Probability Scores">
          <DataTable
            columns={[
              { key: "title", header: "Prediction" },
              { key: "probability", header: "Probability %" },
              { key: "confidence", header: "Confidence %" },
              { key: "trend", header: "Trend" },
            ]}
            rows={view.probabilityScores}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Prediction Confidence">
          <DataTable
            columns={[
              { key: "title", header: "Prediction" },
              { key: "confidence", header: "Confidence %" },
              { key: "evidenceQuality", header: "Evidence" },
              { key: "validationStatus", header: "Validation" },
            ]}
            rows={view.predictionConfidence}
          />
        </Panel>

        <Panel title="Strategic Forecasts">
          <DataTable
            columns={[
              { key: "title", header: "Forecast" },
              { key: "predictedOutcome", header: "Outcome" },
              { key: "probability", header: "Probability %" },
              { key: "horizon", header: "Horizon" },
            ]}
            rows={view.strategicForecasts}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Emerging Risks">
          <DataTable
            columns={[
              { key: "title", header: "Risk" },
              { key: "probability", header: "Probability %" },
              { key: "severity", header: "Severity" },
              { key: "horizon", header: "Horizon" },
            ]}
            rows={view.emergingRisks}
          />
        </Panel>

        <Panel title="Emerging Opportunities">
          <DataTable
            columns={[
              { key: "title", header: "Opportunity" },
              { key: "probability", header: "Probability %" },
              { key: "strategicValue", header: "Value" },
              { key: "horizon", header: "Horizon" },
            ]}
            rows={view.emergingOpportunities}
          />
        </Panel>
      </div>

      <Panel title="Prediction Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.predictionAnalysis}
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

      <Panel title="Prediction Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.predictionPipeline}
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
        <Panel title="Prediction Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.predictionPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Prediction Domains">
          <DataTable
            columns={[{ key: "domain", header: "Domain" }]}
            rows={view.governedDomains.map((domain) => ({
              domain: domain.replace(/_/g, " "),
            }))}
          />
        </Panel>
      </div>

      {view.pillowAdvisory.length > 0 && (
        <Panel title="Pillow Advisory">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.pillowAdvisory.map((note) => (
              <li key={note}>
                <span className="text-[#d4af37]">•</span> {note}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
