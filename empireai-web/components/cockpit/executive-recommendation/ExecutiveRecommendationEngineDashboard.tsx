"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveRecommendationEngine } from "@/lib/executive-recommendation-engine/useExecutiveRecommendationEngine";

/** Compact Executive Recommendation Engine strip for Executive Home. */
export function ExecutiveRecommendationEngineStrip() {
  const { view, loading, live } = useExecutiveRecommendationEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Recommendation Engine…
      </section>
    );
  }

  if (!view) return null;

  const top = view.priorityQueue[0];

  return (
    <section className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/[0.12] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-04 Recommendations</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/resource-allocation" className="text-xs text-[#d4af37] hover:underline">
          Resource Allocation →
        </Link>
        <Link href="/cockpit/founder/executive-recommendations" className="text-xs text-[#d4af37] hover:underline">
          Recommendation panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active</p>
          <p className="text-sm text-[#d4af37]">{view.activeRecommendationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">High Priority</p>
          <p className="text-sm text-emerald-300">{view.highPriorityCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Top Recommendation</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{top?.title ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Engine Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.engineHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-04 — Permanent Executive Recommendation Engine panel. */
export function ExecutiveRecommendationEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveRecommendationEngine();

  if (loading && !view) {
    return <Panel title="Executive Recommendations">Loading recommendation engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Recommendations" subtitle="E2-04 · Executive Recommendation Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/[0.12] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E2-04 Executive Recommendations</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE205 && <Badge variant="gold">E2-05 Active</Badge>}
          <Link href="/cockpit/founder/resource-allocation" className="text-xs text-[#d4af37] hover:underline">
            Resource Allocation →
          </Link>
          <Link href="/cockpit/founder/decision-simulation" className="text-xs text-[#d4af37] hover:underline">
            Decision Simulation →
          </Link>
          <Link href="/cockpit/founder/risk-assessment" className="text-xs text-[#d4af37] hover:underline">
            Risk Assessment →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Engine Health" value={view.engineHealth} />
        <StatCard label="Active Recommendations" value={String(view.activeRecommendationCount)} />
        <StatCard label="High Priority" value={String(view.highPriorityCount)} />
        <StatCard label="Strategic Alignment" value={view.strategicAlignment} />
      </div>

      <Panel title="Priority Queue">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "title", header: "Recommendation" },
            { key: "priority", header: "Priority" },
            { key: "recommendationType", header: "Type" },
            { key: "confidence", header: "Confidence" },
            { key: "businessImpact", header: "Business" },
            { key: "status", header: "Status" },
          ]}
          rows={view.priorityQueue.map((r) => ({
            ...r,
            recommendationType: r.recommendationType.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Current Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "recommendationType", header: "Type" },
            { key: "priority", header: "Priority" },
            { key: "businessImpact", header: "Business" },
            { key: "financialImpact", header: "Financial" },
            { key: "strategicImpact", header: "Strategic" },
            { key: "riskAssessment", header: "Risk" },
            { key: "confidence", header: "Confidence" },
            { key: "status", header: "Status" },
          ]}
          rows={view.currentRecommendations.map((r) => ({
            ...r,
            recommendationType: r.recommendationType.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Explainability">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "why", header: "Why" },
            { key: "what", header: "What" },
            { key: "how", header: "How" },
            { key: "confidence", header: "Confidence" },
          ]}
          rows={view.explainability}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recommendation Quality">
          <DataTable
            columns={[
              { key: "label", header: "Dimension" },
              { key: "score", header: "Score" },
              { key: "status", header: "Status" },
            ]}
            rows={view.qualityMetrics}
          />
        </Panel>

        <Panel title="Recommended Actions">
          <DataTable
            columns={[
              { key: "title", header: "Action" },
              { key: "category", header: "Category" },
              { key: "why", header: "Why" },
              { key: "confidencePercent", header: "Confidence %" },
            ]}
            rows={view.recommendedActions}
          />
        </Panel>
      </div>

      <Panel title="Supporting Evidence & Alternatives">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "proof", header: "Evidence" },
            { key: "alternativeOptions", header: "Alternatives" },
            { key: "risk", header: "Risk" },
          ]}
          rows={view.explainability.map((e) => ({
            title: e.title,
            proof: e.proof,
            alternativeOptions: e.alternativeOptions.join(" · "),
            risk: e.risk,
          }))}
        />
      </Panel>

      <Panel title="Recommendation Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.recommendationPipeline}
        />
      </Panel>

      <Panel title="Pillow Generations">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.pillowGenerations}
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
