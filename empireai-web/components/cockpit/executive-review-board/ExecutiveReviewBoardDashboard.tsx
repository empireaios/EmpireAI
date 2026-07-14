"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveReviewBoard } from "@/lib/executive-review-board/useExecutiveReviewBoard";

/** Compact Executive Review Board strip for Executive Home. */
export function ExecutiveReviewBoardStrip() {
  const { view, loading, live } = useExecutiveReviewBoard();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Review Board…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-10 Review Board</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-review-board" className="text-xs text-[#d4af37] hover:underline">
          Review panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Total Reviews</p>
          <p className="text-sm text-[#d4af37]">{view.totalReviewCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Active</p>
          <p className="text-sm text-violet-300">{view.activeReviewCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Pending Actions</p>
          <p className="text-sm text-[#e8e0d0]">{view.pendingActionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Review Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.reviewHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-10 — Permanent Executive Review Board panel. */
export function ExecutiveReviewBoardDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveReviewBoard();

  if (loading && !view) {
    return <Panel title="Executive Review Board">Loading executive review board…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Review Board" subtitle="E5-10 · Executive Reviews">
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
          <Badge variant="gold">E5-10 Executive Review Board</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE511 && (
            <Link href="/cockpit/founder/executive-policy-evolution" className="text-xs text-[#d4af37] hover:underline">
              Ready for E5-11 →
            </Link>
          )}
          <Link href="/cockpit/founder/enterprise-risk-governance" className="text-xs text-[#d4af37] hover:underline">
            E5-09 Risk Governance →
          </Link>
          <Link href="/cockpit/founder/executive-exception-manager" className="text-xs text-[#d4af37] hover:underline">
            E5-08 Exceptions →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Review Health" value={view.reviewHealth} />
        <StatCard label="Total Reviews" value={String(view.totalReviewCount)} />
        <StatCard label="Active Reviews" value={String(view.activeReviewCount)} />
        <StatCard label="Completed" value={String(view.completedReviewCount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending Actions" value={String(view.pendingActionCount)} />
        <StatCard label="Unreviewed Critical" value={String(view.unreviewedCriticalCount)} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Executive Review Calendar">
          <DataTable
            columns={[
              { key: "title", header: "Review" },
              { key: "category", header: "Category" },
              { key: "scheduledDate", header: "Scheduled" },
              { key: "status", header: "Status" },
            ]}
            rows={view.reviewCalendar}
          />
        </Panel>

        <Panel title="Current Reviews">
          <DataTable
            columns={[
              { key: "title", header: "Review" },
              { key: "owner", header: "Owner" },
              { key: "progress", header: "Progress" },
              { key: "reviewStatus", header: "Status" },
            ]}
            rows={view.currentReviews}
          />
        </Panel>
      </div>

      <Panel title="Executive Findings">
        <DataTable
          columns={[
            { key: "title", header: "Review" },
            { key: "finding", header: "Finding" },
            { key: "severity", header: "Severity" },
            { key: "status", header: "Status" },
          ]}
          rows={view.executiveFindings}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Assigned Actions">
          <DataTable
            columns={[
              { key: "title", header: "Review" },
              { key: "action", header: "Action" },
              { key: "owner", header: "Owner" },
              { key: "progress", header: "Progress" },
            ]}
            rows={view.assignedActions}
          />
        </Panel>

        <Panel title="Strategic Progress">
          <DataTable
            columns={[
              { key: "objective", header: "Objective" },
              { key: "progress", header: "Progress" },
              { key: "trend", header: "Trend" },
              { key: "status", header: "Status" },
            ]}
            rows={view.strategicProgress}
          />
        </Panel>
      </div>

      <Panel title="Governance Health">
        <DataTable
          columns={[
            { key: "domain", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.governanceHealth}
        />
      </Panel>

      <Panel title="Executive Review Register">
        <DataTable
          columns={[
            { key: "reviewTitle", header: "Review" },
            { key: "category", header: "Category" },
            { key: "businessArea", header: "Business Area" },
            { key: "reviewStatus", header: "Status" },
            { key: "confidence", header: "Confidence" },
          ]}
          rows={view.executiveReviewRegister}
        />
      </Panel>

      <Panel title="Review Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.reviewAnalysis}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Executive Review Pipeline">
          <DataTable
            columns={[
              { key: "label", header: "Phase" },
              { key: "order", header: "Order" },
              { key: "status", header: "Status" },
            ]}
            rows={view.executiveReviewPipeline}
          />
        </Panel>

        <Panel title="Background Monitoring">
          <div className="space-y-2 text-sm text-[#c8c0b0]">
            <p>Status: {view.monitoringStatus.backgroundMonitoring}</p>
            <p>Active reviews: {view.monitoringStatus.activeReviewCount}</p>
            <p>Pending actions: {view.monitoringStatus.pendingActionCount}</p>
            <p>Review quality: {view.monitoringStatus.reviewQualityScore}/100</p>
            <p>Last scan: {new Date(view.monitoringStatus.lastScanAt).toLocaleString()}</p>
          </div>
        </Panel>
      </div>

      <Panel title="Executive Recommendations">
        <div className="space-y-4">
          {view.recommendedActions.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-gold/20 px-4 py-3">
              <p className="font-medium text-[#d4af37]">{rec.title}</p>
              <p className="mt-1 text-sm text-[#c8c0b0]">{rec.why}</p>
              <p className="mt-1 text-xs text-[#8a847a]">
                {rec.what} · Confidence {rec.confidencePercent}%
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Pillow Advisory">
        <ul className="list-inside list-disc space-y-1 text-sm text-[#c8c0b0]">
          {view.pillowAdvisory.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="E5 Integration Status">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(view.integrations).map(([key, value]) => (
            <div key={key} className="rounded border border-gold/10 px-3 py-2 text-xs">
              <p className="text-[#6f6a60]">{key}</p>
              <p className="text-[#e8e0d0]">{value}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
