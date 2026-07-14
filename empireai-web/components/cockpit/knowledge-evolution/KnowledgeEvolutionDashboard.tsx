"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useKnowledgeEvolution } from "@/lib/knowledge-evolution/useKnowledgeEvolution";
import type { KnowledgeEvolutionRecommendation, KnowledgeItem } from "@/lib/knowledge-evolution/types";

function KnowledgeItemCard({ item }: { item: KnowledgeItem }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="gold">{item.classification.replace(/_/g, " ")}</Badge>
        <span className="text-xs text-[#6f6a60]">{item.source} · {item.validationStatus}</span>
      </div>
      <h4 className="mt-2 font-medium text-[#f0d78c]">{item.title}</h4>
      <p className="mt-2 text-xs text-[#8a847a]">{item.evidence}</p>
      <p className="mt-1 text-xs text-[#6f6a60]">Owner: {item.owner} · {item.knowledgeId}</p>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: KnowledgeEvolutionRecommendation }) {
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
    </div>
  );
}

/** Compact knowledge evolution strip for Executive Home. */
export function KnowledgeEvolutionStrip() {
  const { view, loading, live } = useKnowledgeEvolution();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Knowledge Evolution…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/[0.05] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">P9-02 Knowledge</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/knowledge-evolution" className="text-xs text-[#d4af37] hover:underline">
          Knowledge panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Health</p>
          <p className="text-sm text-[#d4af37]">{view.knowledgeHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Growth</p>
          <p className="text-sm text-[#e8e0d0]">{view.knowledgeGrowth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Recent</p>
          <p className="text-sm text-[#e8e0d0]">{view.recentKnowledge.length}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Gaps</p>
          <p className="text-sm text-amber-200/90">{view.knowledgeGaps.length}</p>
        </div>
      </div>
    </section>
  );
}

/** P9-02 — Permanent Continuous Knowledge Evolution Architecture panel. */
export function KnowledgeEvolutionDashboard() {
  const { view, loading, error, reload, live, data } = useKnowledgeEvolution();

  if (loading && !view) {
    return <Panel title="Knowledge Evolution">Loading knowledge evolution analysis…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Knowledge Evolution" subtitle="P9-02 · Evidence-based · constitutionally governed">
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
          <Badge variant="gold">P9-02 Knowledge Evolution</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          <Link href="/cockpit/founder/repository-evolution" className="text-xs text-[#d4af37] hover:underline">
            Repository Evolution →
          </Link>
          <Link href="/cockpit/founder/journey" className="text-xs text-[#d4af37] hover:underline">
            Journey →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.grandKingSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Knowledge Health" value={view.knowledgeHealth} />
        <StatCard label="Knowledge Growth" value={view.knowledgeGrowth} />
        <StatCard label="Knowledge Quality" value={view.knowledgeQuality} />
        <StatCard label="Knowledge Gaps" value={String(view.knowledgeGaps.length)} />
      </div>

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

      <Panel title="Recent Knowledge">
        {view.recentKnowledge.length === 0 ? (
          <p className="text-sm text-[#6f6a60]">No recent knowledge items — complete a mission to capture evidence</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {view.recentKnowledge.map((item) => (
              <KnowledgeItemCard key={item.knowledgeId} item={item} />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Knowledge Categories">
        <DataTable
          columns={[
            { key: "label", header: "Category" },
            { key: "count", header: "Count" },
            { key: "quality", header: "Quality" },
          ]}
          rows={view.knowledgeCategories}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Knowledge Gaps">
          <ul className="space-y-2 text-sm text-[#c8c0b0]">
            {view.knowledgeGaps.map((gap) => (
              <li key={gap} className="rounded border border-amber-500/20 px-3 py-2 text-amber-100/90">
                {gap}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Historical Growth">
          <ul className="space-y-2 text-sm text-[#c8c0b0]">
            {view.historicalGrowth.map((entry) => (
              <li key={entry} className="rounded border border-gold/10 px-3 py-2">
                {entry}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Recommendations">
        <div className="grid gap-4 lg:grid-cols-2">
          {view.recommendations.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      </Panel>

      <Panel title="Knowledge Governance">
        <div className="flex flex-wrap gap-2">
          {view.knowledgeGovernance.map((field) => (
            <Badge key={field} variant="gold">
              {field.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </Panel>

      <Panel title="Knowledge Classifications">
        <div className="flex flex-wrap gap-2">
          {view.knowledgeClassifications.map((c) => (
            <Badge key={c} variant="gold">
              {c.replace(/_/g, " ")}
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
