"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useInitiativePortfolioEngine } from "@/lib/initiative-portfolio-engine/useInitiativePortfolioEngine";

/** Compact Initiative Portfolio strip for Executive Home. */
export function InitiativePortfolioStrip() {
  const { view, loading, live } = useInitiativePortfolioEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Initiative Portfolio…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/40 bg-gradient-to-r from-gold/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E1-06 Portfolio</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/initiative-portfolio" className="text-xs text-[#d4af37] hover:underline">
          Portfolio panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Portfolio Health</p>
          <p className="text-sm text-[#d4af37]">{view.portfolioHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Active Initiatives</p>
          <p className="text-sm text-[#e8e0d0]">{view.activeInitiativeCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Strategic Coverage</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.strategicCoverage}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Progress</p>
          <p className="text-sm text-[#e8e0d0]">{view.overallProgress}%</p>
        </div>
      </div>
    </section>
  );
}

/** E1-06 — Permanent Initiative Portfolio Engine panel. */
export function InitiativePortfolioDashboard() {
  const { view, loading, error, reload, live, data } = useInitiativePortfolioEngine();

  if (loading && !view) {
    return <Panel title="Initiative Portfolio">Loading portfolio engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Initiative Portfolio" subtitle="E1-06 · Initiative Portfolio Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E1-06 Initiative Portfolio</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE107 && <Badge variant="gold">Ready for E1-07</Badge>}
          <Link href="/cockpit/founder/department-planning" className="text-xs text-[#d4af37] hover:underline">
            Department Planning →
          </Link>
          <Link href="/cockpit/founder/priority-management" className="text-xs text-[#d4af37] hover:underline">
            Priority Management →
          </Link>
          <Link href="/cockpit/founder/executive-roadmap" className="text-xs text-[#d4af37] hover:underline">
            Executive Roadmap →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.portfolioSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Portfolio Health" value={view.portfolioHealth} />
        <StatCard label="Strategic Coverage" value={view.strategicCoverage} />
        <StatCard label="Active Initiatives" value={String(view.activeInitiativeCount)} />
        <StatCard label="Overall Progress" value={`${view.overallProgress}%`} />
      </div>

      <Panel title="Active Initiatives">
        <DataTable
          columns={[
            { key: "priority", header: "Priority" },
            { key: "title", header: "Initiative" },
            { key: "owner", header: "Owner" },
            { key: "portfolio", header: "Portfolio" },
            { key: "progressPercent", header: "Progress" },
            { key: "currentStatus", header: "Status" },
            { key: "businessValue", header: "Business Value" },
            { key: "expectedRoi", header: "ROI" },
          ]}
          rows={view.activeInitiatives}
        />
      </Panel>

      <Panel title="Portfolio Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Metric" },
            { key: "value", header: "Value" },
            { key: "status", header: "Status" },
          ]}
          rows={view.portfolioAnalysis}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Dependencies & Risks">
          {view.activeInitiatives.slice(0, 6).map((init) => (
            <div key={init.initiativeId} className="mb-3 rounded border border-gold/10 px-3 py-2 text-sm">
              <p className="font-medium text-[#f0d78c]">{init.title}</p>
              <p className="mt-1 text-xs text-[#8a847a]">
                Dependencies: {init.dependencies.length ? init.dependencies.join(", ") : "None"}
              </p>
              <p className="text-xs text-[#8a847a]">
                Risks: {init.risks.length ? init.risks.join(", ") : "None"}
              </p>
              <p className="text-xs text-[#8a847a]">
                Capacity: {init.resources} · Budget: {init.budget}
              </p>
            </div>
          ))}
        </Panel>

        <Panel title="Portfolio Segments">
          <DataTable
            columns={[
              { key: "label", header: "Segment" },
              { key: "count", header: "Count" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.portfolioSegments}
          />
        </Panel>
      </div>

      <Panel title="Portfolio Hierarchy">
        <DataTable
          columns={[
            { key: "label", header: "Layer" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.portfolioHierarchy}
        />
      </Panel>

      <Panel title="Initiative Lifecycle">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {view.initiativeLifecycle.map((step) => (
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

      <Panel title="Recommendations">
        <div className="grid gap-3 lg:grid-cols-2">
          {view.recommendedActions.map((rec) => (
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

      <Panel title="Pillow Portfolio Evaluations">
        <DataTable
          columns={[
            { key: "label", header: "Evaluation" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.pillowEvaluations}
        />
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
