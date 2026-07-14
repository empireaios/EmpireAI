"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useRepositoryEvolution } from "@/lib/repository-evolution/useRepositoryEvolution";
import type { RepositoryEvolutionRecommendation } from "@/lib/repository-evolution/types";

function RecommendationCard({ rec }: { rec: RepositoryEvolutionRecommendation }) {
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

/** Compact repository evolution strip for Executive Home. */
export function RepositoryEvolutionStrip() {
  const { view, loading, live } = useRepositoryEvolution();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Repository Evolution…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/[0.05] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">P9-01 Repository</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/repository-evolution" className="text-xs text-[#d4af37] hover:underline">
          Evolution panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Health</p>
          <p className="text-sm text-[#d4af37]">{view.repositoryHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Architecture</p>
          <p className="text-sm text-[#e8e0d0]">{view.architectureHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Canonical</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.canonicalIntegrity}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Drift Signals</p>
          <p className="text-sm text-amber-200/90">{view.driftSignals.length}</p>
        </div>
      </div>
    </section>
  );
}

/** P9-01 — Permanent Continuous Repository Evolution Architecture panel. */
export function RepositoryEvolutionDashboard() {
  const { view, loading, error, reload, live, data } = useRepositoryEvolution();

  if (loading && !view) {
    return <Panel title="Repository Evolution">Loading repository evolution analysis…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Repository Evolution" subtitle="P9-01 · Constitutional memory · continuous improvement">
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
          <Badge variant="gold">P9-01 Repository Evolution</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          <Link href="/cockpit/founder/architecture" className="text-xs text-[#d4af37] hover:underline">
            Architecture Intelligence →
          </Link>
          <Link href="/cockpit/founder/builder" className="text-xs text-[#d4af37] hover:underline">
            Builder Console →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.grandKingSummary.slice(0, 400)}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Repository Health" value={view.repositoryHealth} />
        <StatCard label="Architecture Health" value={view.architectureHealth} />
        <StatCard label="Repository Drift" value={String(view.driftSignals.length)} />
        <StatCard label="Technical Debt" value={view.technicalDebt} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Canonical Integrity" value={view.canonicalIntegrity} />
        <StatCard label="Documentation" value={view.documentationHealth} />
        <StatCard label="Repository Quality" value={view.repositoryQuality} />
      </div>

      <Panel title="Repository Health Monitoring">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.repositoryHealthMetrics}
        />
      </Panel>

      <Panel title="Drift Detection">
        <DataTable
          columns={[
            { key: "label", header: "Drift Type" },
            { key: "detected", header: "Detected" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.driftDetection.map((d) => ({
            ...d,
            detected: d.detected ? "yes" : "no",
          }))}
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

      <Panel title="Evolution Queue">
        <DataTable
          columns={[
            { key: "title", header: "Improvement" },
            { key: "category", header: "Category" },
            { key: "priority", header: "Priority" },
            { key: "effort", header: "Effort" },
            { key: "status", header: "Status" },
          ]}
          rows={view.evolutionQueue}
        />
      </Panel>

      <Panel title="Executive Recommendations">
        <div className="grid gap-4 lg:grid-cols-2">
          {view.executiveRecommendations.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Drift Signals">
          <ul className="space-y-2 text-sm text-[#c8c0b0]">
            {view.driftSignals.length === 0 ? (
              <li className="text-[#6f6a60]">No active drift signals</li>
            ) : (
              view.driftSignals.map((signal) => (
                <li key={signal} className="rounded border border-amber-500/20 px-3 py-2 text-amber-100/90">
                  {signal}
                </li>
              ))
            )}
          </ul>
        </Panel>
        <Panel title="Integrations">
          <div className="grid gap-2 text-sm">
            {Object.entries(view.integrations).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 border-b border-gold/5 py-2">
                <span className="text-[#6f6a60]">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className="text-[#e8e0d0]">{value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Pillow Advisory">
        <ul className="space-y-2 text-sm text-[#c8c0b0]">
          {view.pillowAdvisory.map((item) => (
            <li key={item} className="rounded border border-gold/10 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Evolution Principles">
        <div className="flex flex-wrap gap-2">
          {view.evolutionPrinciples.map((principle) => (
            <Badge key={principle} variant="gold">
              {principle.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </Panel>
    </div>
  );
}
