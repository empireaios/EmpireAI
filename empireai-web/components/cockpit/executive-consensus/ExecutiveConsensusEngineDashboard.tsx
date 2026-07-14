"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveConsensusEngine } from "@/lib/executive-consensus-engine/useExecutiveConsensusEngine";

/** Compact Executive Consensus Engine strip for Executive Home. */
export function ExecutiveConsensusEngineStrip() {
  const { view, loading, live } = useExecutiveConsensusEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Consensus Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-teal-500/40 bg-gradient-to-r from-teal-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-11 Consensus</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-consensus" className="text-xs text-[#d4af37] hover:underline">
          Consensus panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active</p>
          <p className="text-sm text-[#d4af37]">{view.activeConsensusCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Strong</p>
          <p className="text-sm text-teal-300">{view.strongConsensusCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Consensus Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.consensusHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Engine Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.engineHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-11 — Permanent Executive Consensus Engine panel. */
export function ExecutiveConsensusEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveConsensusEngine();

  if (loading && !view) {
    return <Panel title="Executive Consensus">Loading executive consensus engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Consensus" subtitle="E2-11 · Executive Consensus Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-teal-500/50 bg-gradient-to-br from-teal-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E2-11 Executive Consensus</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE212 && <Badge variant="gold">E2-12 Active</Badge>}
          <Link href="/cockpit/founder/executive-policies" className="text-xs text-[#d4af37] hover:underline">
            Executive Policies →
          </Link>
          <Link href="/cockpit/founder/trade-off-analysis" className="text-xs text-[#d4af37] hover:underline">
            Trade-off Analysis →
          </Link>
          <Link href="/cockpit/founder/executive-recommendations" className="text-xs text-[#d4af37] hover:underline">
            Executive Recommendations →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Engine Health" value={view.engineHealth} />
        <StatCard label="Active Consensus" value={String(view.activeConsensusCount)} />
        <StatCard label="Strong Consensus" value={String(view.strongConsensusCount)} />
        <StatCard label="Consensus Health" value={view.consensusHealth} />
      </div>

      <Panel title="Current Decisions & Consensus">
        <DataTable
          columns={[
            { key: "title", header: "Decision" },
            { key: "category", header: "Category" },
            { key: "consensusStrength", header: "Strength %" },
            { key: "businessImpact", header: "Business" },
            { key: "riskAssessment", header: "Risk" },
            { key: "recommendedDecision", header: "Recommended" },
            { key: "confidence", header: "Confidence" },
            { key: "status", header: "Status" },
          ]}
          rows={view.activeConsensus.map((c) => ({
            ...c,
            category: c.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Executive Perspectives">
        <DataTable
          columns={[
            { key: "label", header: "Participant" },
            { key: "perspective", header: "Perspective" },
            { key: "alignment", header: "Alignment" },
            { key: "confidence", header: "Confidence" },
          ]}
          rows={view.executivePerspectives}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Areas of Agreement">
          <DataTable
            columns={[
              { key: "area", header: "Agreement" },
              { key: "strength", header: "Strength %" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.agreementAreas.slice(0, 12)}
          />
        </Panel>

        <Panel title="Areas of Disagreement">
          <DataTable
            columns={[
              { key: "area", header: "Disagreement" },
              { key: "resolution", header: "Resolution" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.disagreementAreas}
          />
        </Panel>
      </div>

      <Panel title="Consensus Analysis">
        <DataTable
          columns={[
            { key: "title", header: "Decision" },
            { key: "dimension", header: "Dimension" },
            { key: "score", header: "Score" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.consensusAnalysis.slice(0, 18).map((a) => ({
            ...a,
            dimension: a.dimension.replace(/_/g, " "),
          }))}
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

      <Panel title="Consensus Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.consensusPipeline}
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
