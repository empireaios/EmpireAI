"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useAiEvolution } from "@/lib/ai-evolution/useAiEvolution";
import type { AiEvolutionRecommendation } from "@/lib/ai-evolution/types";

function RecommendationCard({ rec }: { rec: AiEvolutionRecommendation }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="gold">{rec.domain.replace(/_/g, " ")}</Badge>
        <span className="text-xs text-[#6f6a60]">{rec.confidencePercent}% confidence</span>
      </div>
      <h4 className="mt-2 font-medium text-[#f0d78c]">{rec.title}</h4>
      <p className="mt-2 text-xs text-[#8a847a]"><span className="text-[#6f6a60]">WHY:</span> {rec.why}</p>
      <p className="mt-1 text-xs text-[#8a847a]"><span className="text-[#6f6a60]">WHAT:</span> {rec.what}</p>
      <p className="mt-1 text-xs text-[#8a847a]"><span className="text-[#6f6a60]">HOW:</span> {rec.how}</p>
      <p className="mt-1 text-xs text-[#6f6a60]">Evidence: {rec.evidence.slice(0, 120)}</p>
    </div>
  );
}

/** Compact AI evolution strip for Executive Home. */
export function AiEvolutionStrip() {
  const { view, loading, live } = useAiEvolution();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading AI Evolution…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/[0.05] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">P9-04 Intelligence</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/ai-evolution" className="text-xs text-[#d4af37] hover:underline">
          AI Evolution panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">AI Health</p>
          <p className="text-sm text-[#d4af37]">{view.aiHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Reasoning</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.reasoningQuality}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Recommendations</p>
          <p className="text-sm text-[#e8e0d0]">{view.recommendations.length}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Improvements</p>
          <p className="text-sm text-[#e8e0d0]">{view.currentImprovements.length}</p>
        </div>
      </div>
    </section>
  );
}

/** P9-04 — Permanent Continuous AI Evolution Architecture panel. */
export function AiEvolutionDashboard() {
  const { view, loading, error, reload, live, data } = useAiEvolution();

  if (loading && !view) {
    return <Panel title="AI Evolution">Loading AI evolution analysis…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="AI Evolution" subtitle="P9-04 · Explainable · constitutionally governed">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/[0.06] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">P9-04 AI Evolution</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          <Link href="/cockpit/commerce/intelligence" className="text-xs text-[#d4af37] hover:underline">
            Commercial Intelligence →
          </Link>
          <Link href="/cockpit/founder/explainability" className="text-xs text-[#d4af37] hover:underline">
            Explainability →
          </Link>
          <Link href="/cockpit/founder/knowledge-evolution" className="text-xs text-[#d4af37] hover:underline">
            Knowledge Evolution →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.grandKingSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="AI Health" value={view.aiHealth} />
        <StatCard label="Reasoning Quality" value={view.reasoningQuality} />
        <StatCard label="Recommendation Quality" value={view.recommendationQuality} />
        <StatCard label="Knowledge Growth" value={view.knowledgeGrowth} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Architecture Alignment" value={view.architectureAlignment} />
        <StatCard label="Commercial Intelligence" value={view.commercialIntelligence} />
      </div>

      <Panel title="Intelligence Quality">
        <DataTable
          columns={[
            { key: "label", header: "Evaluation" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
          ]}
          rows={view.intelligenceQuality}
        />
      </Panel>

      <Panel title="Evolution Pipeline">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {view.evolutionPipeline.map((step) => (
            <div
              key={step.phase}
              className="flex items-center justify-between rounded border border-gold/10 px-3 py-2 text-sm"
            >
              <span className="text-[#c8c0b0]">{step.label}</span>
              <StatusBadge status={step.status} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Current Improvements">
        <DataTable
          columns={[
            { key: "title", header: "Improvement" },
            { key: "capability", header: "Capability" },
            { key: "priority", header: "Priority" },
            { key: "expectedImprovement", header: "Expected" },
            { key: "status", header: "Status" },
          ]}
          rows={view.currentImprovements}
        />
      </Panel>

      <Panel title="Evolution Timeline">
        <ul className="space-y-2 text-sm text-[#c8c0b0]">
          {view.evolutionTimeline.map((entry) => (
            <li key={entry} className="rounded border border-gold/10 px-3 py-2">
              {entry}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Recommendations">
        <div className="grid gap-4 lg:grid-cols-2">
          {view.recommendations.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      </Panel>

      <Panel title="AI Governance">
        <div className="flex flex-wrap gap-2">
          {view.aiGovernance.map((field) => (
            <Badge key={field} variant="gold">
              {field.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </Panel>

      <Panel title="Pillow Advisory">
        <ul className="space-y-2 text-sm text-[#c8c0b0]">
          {view.pillowAdvisory.map((item) => (
            <li key={item} className="rounded border border-gold/10 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
