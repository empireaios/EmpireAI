"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useEmpireEvolution } from "@/lib/empire-evolution/useEmpireEvolution";

/** Compact Empire evolution strip for Executive Home — capstone of P9. */
export function EmpireEvolutionStrip() {
  const { view, loading, live } = useEmpireEvolution();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Empire Evolution…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/25 bg-gradient-to-r from-gold/[0.1] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">P9-05 Empire</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          {view.constitutionalExecutionComplete && (
            <Badge variant="gold">P1–P9 Complete</Badge>
          )}
        </div>
        <Link href="/cockpit/founder/empire-evolution" className="text-xs text-[#d4af37] hover:underline">
          Empire panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Empire Health</p>
          <p className="text-sm text-[#d4af37]">{view.empireHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Vision</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.visionAlignment}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Roadmap</p>
          <p className="text-sm text-[#e8e0d0]">{view.roadmapItemsExecuted} items</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Evolution</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.currentEvolution}</p>
        </div>
      </div>
    </section>
  );
}

/** P9-05 — Permanent Continuous Empire Evolution Architecture panel. */
export function EmpireEvolutionDashboard() {
  const { view, loading, error, reload, live, data } = useEmpireEvolution();

  if (loading && !view) {
    return <Panel title="Empire Evolution">Loading Empire evolution analysis…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Empire Evolution" subtitle="P9-05 · Constitutional completion · perpetual improvement">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/25 bg-gradient-to-br from-gold/[0.1] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">P9-05 Empire Evolution</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.constitutionalExecutionComplete && (
            <Badge variant="gold">Constitutional Execution P1–P9 Complete</Badge>
          )}
          <Link href="/cockpit/founder/grand-king" className="text-xs text-[#d4af37] hover:underline">
            Grand King →
          </Link>
          <Link href="/cockpit/founder/ai-evolution" className="text-xs text-[#d4af37] hover:underline">
            AI Evolution →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.grandKingSummary.slice(0, 400)}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Empire Health" value={view.empireHealth} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
        <StatCard label="Strategic Direction" value={view.strategicDirection} />
        <StatCard label="Current Evolution" value={view.currentEvolution} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Architecture" value={view.architectureHealth} />
        <StatCard label="Repository" value={view.repositoryHealth} />
        <StatCard label="Business" value={view.businessHealth} />
        <StatCard label="Commercial" value={view.commercialHealth} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Production" value={view.productionHealth} />
        <StatCard label="Knowledge Growth" value={view.knowledgeGrowth} />
        <StatCard label="AI Evolution" value={view.aiEvolution} />
      </div>

      <Panel title="Constitutional Phases (P1–P9)">
        <DataTable
          columns={[
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
            { key: "itemCount", header: "Items" },
          ]}
          rows={view.constitutionalPhases}
        />
        <p className="mt-3 text-sm text-[#8a847a]">
          {view.roadmapItemsExecuted} constitutional roadmap items executed · future programmes append without modifying locked roadmap
        </p>
      </Panel>

      <Panel title="Empire Health Domains">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.empireHealthMetrics}
        />
      </Panel>

      <Panel title="Continuous Review">
        <DataTable
          columns={[
            { key: "label", header: "Review" },
            { key: "alignment", header: "Alignment" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.continuousReviews}
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

      <Panel title="Current Recommendations">
        <div className="grid gap-3 lg:grid-cols-2">
          {view.currentRecommendations.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-gold/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                <Badge variant="gold">{rec.category}</Badge>
                <span className="text-xs text-[#6f6a60]">{rec.confidencePercent}%</span>
              </div>
              <h4 className="mt-2 font-medium text-[#f0d78c]">{rec.title}</h4>
              <p className="mt-1 text-xs text-[#8a847a]">{rec.how}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Cross-System Integrations">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {Object.entries(view.integrations).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4 border-b border-gold/5 py-2">
              <span className="text-[#6f6a60]">{key.replace(/([A-Z])/g, " $1")}</span>
              <span className="text-[#e8e0d0]">{value}</span>
            </div>
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
