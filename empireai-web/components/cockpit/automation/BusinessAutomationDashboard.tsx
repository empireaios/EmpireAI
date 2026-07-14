"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useBusinessAutomation } from "@/lib/business-automation/useBusinessAutomation";

/** Compact automation strip for Executive Home. */
export function BusinessAutomationStrip() {
  const { view, loading, live } = useBusinessAutomation();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Business Automation…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/[0.05] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">P8-04 Automation</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.automationHealth} />
        </div>
        <Link href="/cockpit/commerce/automation" className="text-xs text-[#d4af37] hover:underline">
          Automation panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Level</p>
          <p className="text-sm text-[#e8e0d0]">{view.automationLevel}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Active</p>
          <p className="text-sm text-[#d4af37]">{view.activeAutomations.length}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Performance</p>
          <p className="text-sm text-[#c8c0b0]">{view.automationPerformance}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Recovery</p>
          <p className="text-sm text-[#c8c0b0]">{view.automationRecovery}</p>
        </div>
      </div>
    </section>
  );
}

/** P8-04 — Permanent Business Automation Architecture panel. */
export function BusinessAutomationDashboard() {
  const { view, loading, error, reload, live, data } = useBusinessAutomation();

  if (loading && !view) {
    return <Panel title="Business Automation">Loading automation framework…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Business Automation" subtitle="P8-04 · Automate businesses, not merely tasks">
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
          <Badge variant="gold">P8-04 Business Automation</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.automationHealth} />
          <Link href="/cockpit/commerce/operating" className="text-xs text-[#d4af37] hover:underline">
            Commerce →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 text-sm text-[#c8c0b0]">{view.grandKingSummary}</p>
        <p className="mt-2 text-xs text-[#6f6a60]">Status: {view.automationStatus}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Automation Level" value={view.automationLevel} />
        <StatCard label="Target Level" value={view.targetAutomationLevel} />
        <StatCard label="Performance" value={view.automationPerformance} />
        <StatCard label="Business Efficiency" value={view.businessEfficiency} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Active Automations">
          {view.activeAutomations.length === 0 ? (
            <p className="text-sm text-[#6f6a60]">No active automations — rules loaded, awaiting gates</p>
          ) : (
            <DataTable
              columns={[
                { key: "name", header: "Automation" },
                { key: "status", header: "Status" },
                { key: "performance", header: "Performance" },
              ]}
              rows={view.activeAutomations}
            />
          )}
        </Panel>
        <Panel title="Pending Automations">
          {view.pendingAutomations.length === 0 ? (
            <p className="text-sm text-[#6f6a60]">None queued</p>
          ) : (
            <DataTable
              columns={[
                { key: "name", header: "Automation" },
                { key: "status", header: "Status" },
                { key: "performance", header: "State" },
              ]}
              rows={view.pendingAutomations}
            />
          )}
        </Panel>
      </div>

      <Panel title="Automation Levels">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {view.automationLevels.map((lvl) => (
            <div
              key={lvl.level}
              className={`rounded-lg border p-3 text-xs ${
                lvl.current
                  ? "border-gold/40 bg-gold/[0.08]"
                  : lvl.target
                    ? "border-emerald-900/40 bg-emerald-950/20"
                    : "border-gold/10 bg-white/[0.02]"
              }`}
            >
              <p className="font-medium text-[#f0d78c]">{lvl.label}</p>
              {lvl.current && <p className="mt-1 text-[#d4af37]">Current</p>}
              {lvl.target && !lvl.current && <p className="mt-1 text-emerald-300/80">Target</p>}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Automation Pipeline">
        <div className="flex flex-wrap gap-2">
          {view.pipeline.map((stage) => (
            <span
              key={stage.phase}
              className={`rounded px-2 py-1 text-xs ${
                stage.status === "active"
                  ? "bg-gold/20 text-[#f0d78c]"
                  : stage.status === "complete"
                    ? "bg-emerald-900/30 text-emerald-200"
                    : "bg-white/5 text-[#6f6a60]"
              }`}
            >
              {stage.order}. {stage.label}
            </span>
          ))}
        </div>
      </Panel>

      <Panel title="Automation Rules" subtitle="Trigger · Conditions · Actions · Safety · Recovery · Audit">
        <div className="space-y-4">
          {view.automationRules.map((rule) => (
            <div key={rule.id} className="rounded-lg border border-gold/10 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-[#f0d78c]">{rule.name}</span>
                <StatusBadge status={rule.status} />
              </div>
              <p className="mt-2 text-xs text-[#8a847a]">
                <span className="text-[#6f6a60]">Trigger:</span> {rule.trigger}
              </p>
              <p className="mt-1 text-xs text-[#8a847a]">
                <span className="text-[#6f6a60]">Rollback:</span> {rule.rollbackStrategy}
              </p>
              <p className="mt-1 text-xs text-[#8a847a]">
                <span className="text-[#6f6a60]">Recovery:</span> {rule.recoveryStrategy}
              </p>
              <p className="mt-1 text-xs text-[#6f6a60]">Audit: {rule.auditTrail}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Pillow Automation Intelligence">
        <ul className="space-y-1 text-sm text-[#c8c0b0]">
          {view.pillow.recommendations.map((r) => (
            <li key={r}>◆ {r}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
