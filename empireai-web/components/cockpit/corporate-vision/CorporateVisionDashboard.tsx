"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useCorporateVisionEngine } from "@/lib/corporate-vision-engine/useCorporateVisionEngine";

/** Compact Corporate Vision strip for Executive Home. */
export function CorporateVisionStrip() {
  const { view, loading, live } = useCorporateVisionEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Corporate Vision…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/35 bg-gradient-to-r from-gold/[0.14] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E1-02 Vision</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          {view.visionSyncRequired && <Badge variant="gold">Sync Required</Badge>}
        </div>
        <Link href="/cockpit/founder/corporate-vision" className="text-xs text-[#d4af37] hover:underline">
          Vision panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Vision Health</p>
          <p className="text-sm text-[#d4af37]">{view.visionHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Alignment</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.visionAlignment}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Vision Growth</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.visionGrowth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Sync Status</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.visionSyncStatus}</p>
        </div>
      </div>
    </section>
  );
}

/** E1-02 — Permanent Corporate Vision Engine panel. */
export function CorporateVisionDashboard() {
  const { view, loading, error, reload, live, data } = useCorporateVisionEngine();

  if (loading && !view) {
    return <Panel title="Corporate Vision">Loading vision engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Corporate Vision" subtitle="E1-02 · Corporate Vision Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/35 bg-gradient-to-br from-gold/[0.14] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E1-02 Corporate Vision</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.visionSyncRequired && <Badge variant="gold">Vision Sync Required</Badge>}
          {view.readyForE103 && <Badge variant="gold">Ready for E1-03</Badge>}
          <Link href="/cockpit/founder/executive-planning" className="text-xs text-[#d4af37] hover:underline">
            Executive Planning →
          </Link>
          <Link href="/cockpit/founder/empire-evolution" className="text-xs text-[#d4af37] hover:underline">
            Empire Evolution →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.visionSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Vision Health" value={view.visionHealth} />
        <StatCard label="Strategic Direction" value={view.strategicDirection} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
        <StatCard label="Vision Growth" value={view.visionGrowth} />
      </div>

      <Panel title="Current Vision">
        <p className="text-sm text-[#e8e0d0]">{view.currentVision}</p>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="WHY">
          <p className="text-sm text-[#c8c0b0]">{view.visionWhy}</p>
        </Panel>
        <Panel title="WHAT">
          <p className="text-sm text-[#c8c0b0]">{view.visionWhat}</p>
        </Panel>
        <Panel title="HOW">
          <p className="text-sm text-[#c8c0b0]">{view.visionHow}</p>
        </Panel>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="ECC Vision Gate" value={view.eccVisionGate} />
        <StatCard label="Executive Purpose" value={view.executivePurpose.slice(0, 80)} />
      </div>

      <Panel title="Vision Synchronization Pipeline">
        <p className="mb-3 text-xs text-[#8a847a]">
          No executive mission shall bypass Vision Synchronization · ECC requires successful sync before execution
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {view.visionSyncPipeline.map((step) => (
            <div
              key={step.phase}
              className="flex items-center justify-between rounded border border-gold/10 px-3 py-2 text-sm"
            >
              <div>
                <span className="text-[#c8c0b0]">{step.label}</span>
                <p className="text-xs text-[#6f6a60]">{step.owner}</p>
              </div>
              <StatusBadge status={step.status} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Vision Structure">
        <DataTable
          columns={[
            { key: "label", header: "Layer" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.visionStructure}
        />
      </Panel>

      <Panel title="Vision Health">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "status", header: "Status" },
            { key: "score", header: "Score" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.visionHealthMetrics}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recent Vision Additions">
          <div className="grid gap-3">
            {view.recentVisionAdditions.map((item) => (
              <div key={item.id} className="rounded-lg border border-gold/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="gold">{item.classification}</Badge>
                  <span className="text-xs text-[#6f6a60]">{item.source}</span>
                </div>
                <h4 className="mt-2 font-medium text-[#f0d78c]">{item.title}</h4>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Pending Vision Reviews">
          <DataTable
            columns={[
              { key: "title", header: "Review" },
              { key: "status", header: "Status" },
              { key: "reviewer", header: "Reviewer" },
            ]}
            rows={view.pendingVisionReviews}
          />
        </Panel>
      </div>

      <Panel title="Vision Accumulation">
        <p className="mb-3 text-xs text-[#8a847a]">
          Every item traceable · versioned · evidence-backed · constitutionally aligned
        </p>
        <DataTable
          columns={[
            { key: "label", header: "Source" },
            { key: "title", header: "Title" },
            { key: "classification", header: "Class" },
            { key: "disposition", header: "Disposition" },
          ]}
          rows={view.visionAccumulations}
        />
      </Panel>

      <Panel title="Pillow Vision Evaluations">
        <DataTable
          columns={[
            { key: "label", header: "Evaluation" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.pillowEvaluations}
        />
      </Panel>

      <Panel title="Vision Recommendations">
        <div className="grid gap-3 lg:grid-cols-2">
          {view.visionRecommendations.map((rec) => (
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
