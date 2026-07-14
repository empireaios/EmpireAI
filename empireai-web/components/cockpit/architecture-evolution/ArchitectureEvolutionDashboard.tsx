"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useArchitectureEvolution } from "@/lib/architecture-evolution/useArchitectureEvolution";
import type { ArchitectureEvolutionRecommendation } from "@/lib/architecture-evolution/types";

function RecommendationCard({ rec }: { rec: ArchitectureEvolutionRecommendation }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="gold">{rec.domain.replace(/_/g, " ")}</Badge>
        <span className="text-xs text-[#6f6a60]">{rec.confidencePercent}% · {rec.riskLevel} risk</span>
      </div>
      <h4 className="mt-2 font-medium text-[#f0d78c]">{rec.title}</h4>
      <p className="mt-2 text-xs text-[#8a847a]"><span className="text-[#6f6a60]">WHY:</span> {rec.why}</p>
      <p className="mt-1 text-xs text-[#8a847a]"><span className="text-[#6f6a60]">WHAT:</span> {rec.what}</p>
      <p className="mt-1 text-xs text-[#8a847a]"><span className="text-[#6f6a60]">HOW:</span> {rec.how}</p>
    </div>
  );
}

/** Compact architecture evolution strip for Executive Home. */
export function ArchitectureEvolutionStrip() {
  const { view, loading, live } = useArchitectureEvolution();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Architecture Evolution…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/[0.05] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">P9-03 Architecture</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/architecture-evolution" className="text-xs text-[#d4af37] hover:underline">
          Architecture panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Health</p>
          <p className="text-sm text-[#d4af37]">{view.architectureHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Drift</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.architectureDrift}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Improvements</p>
          <p className="text-sm text-[#e8e0d0]">{view.currentImprovements.length}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Risks</p>
          <p className="text-sm text-amber-200/90">{view.architectureRisks.length}</p>
        </div>
      </div>
    </section>
  );
}

/** P9-03 — Permanent Continuous Architecture Evolution Architecture panel. */
export function ArchitectureEvolutionDashboard() {
  const { view, loading, error, reload, live, data } = useArchitectureEvolution();

  if (loading && !view) {
    return <Panel title="Architecture Evolution">Loading architecture evolution analysis…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Architecture Evolution" subtitle="P9-03 · Constitutional stability · traceable evolution">
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
          <Badge variant="gold">P9-03 Architecture Evolution</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          <Link href="/cockpit/founder/repository-evolution" className="text-xs text-[#d4af37] hover:underline">
            Repository Evolution →
          </Link>
          <Link href="/cockpit/founder/knowledge-evolution" className="text-xs text-[#d4af37] hover:underline">
            Knowledge Evolution →
          </Link>
          <Link href="/cockpit/founder/architecture" className="text-xs text-[#d4af37] hover:underline">
            Architecture Intelligence →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.grandKingSummary.slice(0, 400)}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Architecture Health" value={view.architectureHealth} />
        <StatCard label="Architecture Drift" value={view.architectureDrift} />
        <StatCard label="Technical Debt" value={view.technicalDebt} />
        <StatCard label="Opportunities" value={String(view.architectureOpportunities.length)} />
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

      <Panel title="Architecture Reviews">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.architectureReviews}
        />
      </Panel>

      <Panel title="Current Improvements">
        <DataTable
          columns={[
            { key: "title", header: "Improvement" },
            { key: "domain", header: "Domain" },
            { key: "priority", header: "Priority" },
            { key: "riskLevel", header: "Risk" },
            { key: "status", header: "Status" },
          ]}
          rows={view.currentImprovements}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Architecture Timeline">
          <ul className="space-y-2 text-sm text-[#c8c0b0]">
            {view.architectureTimeline.map((entry) => (
              <li key={entry} className="rounded border border-gold/10 px-3 py-2">
                {entry}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Architecture Risks">
          <ul className="space-y-2 text-sm text-[#c8c0b0]">
            {view.architectureRisks.length === 0 ? (
              <li className="text-[#6f6a60]">No active architecture risks</li>
            ) : (
              view.architectureRisks.map((risk) => (
                <li key={risk} className="rounded border border-amber-500/20 px-3 py-2 text-amber-100/90">
                  {risk}
                </li>
              ))
            )}
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

      <Panel title="Architecture Governance">
        <div className="flex flex-wrap gap-2">
          {view.architectureGovernance.map((field) => (
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
