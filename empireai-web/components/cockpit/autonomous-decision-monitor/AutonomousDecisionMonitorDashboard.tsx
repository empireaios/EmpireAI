"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useAutonomousDecisionMonitor } from "@/lib/autonomous-decision-monitor/useAutonomousDecisionMonitor";

/** Compact Autonomous Decision Monitor strip for Executive Home. */
export function AutonomousDecisionMonitorStrip() {
  const { view, loading, live } = useAutonomousDecisionMonitor();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Autonomous Decision Monitor…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-orange-500/40 bg-gradient-to-r from-orange-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-15 Monitor</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/autonomous-decision-monitor" className="text-xs text-[#d4af37] hover:underline">
          Monitor panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Monitored</p>
          <p className="text-sm text-[#d4af37]">{view.monitoredDecisionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Alerts</p>
          <p className="text-sm text-orange-300">{view.alertCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Decision Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.decisionHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Deviations</p>
          <p className="text-sm text-[#e8e0d0]">{view.deviationCount}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-15 — Permanent Autonomous Decision Monitor panel. */
export function AutonomousDecisionMonitorDashboard() {
  const { view, loading, error, reload, live, data } = useAutonomousDecisionMonitor();

  if (loading && !view) {
    return <Panel title="Autonomous Decision Monitor">Loading autonomous decision monitor…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Autonomous Decision Monitor" subtitle="E2-15 · Autonomous Decision Monitor">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-orange-500/50 bg-gradient-to-br from-orange-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E2-15 Autonomous Decision Monitor</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE216 && (
            <Link href="/cockpit/founder/executive-decision-certification">
              <Badge variant="gold">E2-16 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-confidence" className="text-xs text-[#d4af37] hover:underline">
            Executive Confidence →
          </Link>
          <Link href="/cockpit/founder/decision-audit" className="text-xs text-[#d4af37] hover:underline">
            Decision Audit →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Decision Health" value={view.decisionHealth} />
        <StatCard label="Monitored Decisions" value={String(view.monitoredDecisionCount)} />
        <StatCard label="Executive Alerts" value={String(view.alertCount)} />
        <StatCard label="Deviations" value={String(view.deviationCount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Healthy Decisions" value={String(view.healthyDecisionCount)} />
        <StatCard label="Degraded Decisions" value={String(view.degradedDecisionCount)} />
        <StatCard label="Avg Deviation" value={String(view.averageDeviationScore)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Engine Health" value={view.engineHealth} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Monitored Decisions">
        <DataTable
          columns={[
            { key: "title", header: "Decision" },
            { key: "currentStatus", header: "Status" },
            { key: "expectedOutcome", header: "Expected" },
            { key: "actualOutcome", header: "Actual" },
            { key: "performanceTrend", header: "Trend" },
            { key: "deviationScore", header: "Deviation" },
            { key: "confidenceTrend", header: "Confidence" },
          ]}
          rows={view.monitoredDecisions.map((d) => ({
            ...d,
            category: d.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Performance Trends">
          <DataTable
            columns={[
              { key: "title", header: "Decision" },
              { key: "previousHealth", header: "Previous" },
              { key: "currentHealth", header: "Current" },
              { key: "trend", header: "Trend" },
              { key: "monitoringStatus", header: "Status" },
            ]}
            rows={view.performanceTrends.slice(0, 12)}
          />
        </Panel>

        <Panel title="Current Deviations">
          <DataTable
            columns={[
              { key: "title", header: "Decision" },
              { key: "capability", header: "Capability" },
              { key: "deviationScore", header: "Score" },
              { key: "severity", header: "Severity" },
              { key: "status", header: "Status" },
            ]}
            rows={view.currentDeviations.map((d) => ({
              ...d,
              capability: d.capability.replace(/_/g, " "),
            }))}
          />
        </Panel>
      </div>

      <Panel title="Executive Alerts">
        <DataTable
          columns={[
            { key: "title", header: "Decision" },
            { key: "severity", header: "Severity" },
            { key: "category", header: "Category" },
            { key: "message", header: "Message" },
            { key: "autonomousAction", header: "Action" },
            { key: "status", header: "Status" },
          ]}
          rows={view.executiveAlerts.map((a) => ({
            ...a,
            autonomousAction: a.autonomousAction.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Confidence Changes">
          <DataTable
            columns={[
              { key: "title", header: "Decision" },
              { key: "previousConfidence", header: "Previous %" },
              { key: "currentConfidence", header: "Current %" },
              { key: "change", header: "Change" },
              { key: "reason", header: "Reason" },
              { key: "status", header: "Status" },
            ]}
            rows={view.confidenceChanges}
          />
        </Panel>

        <Panel title="Corrective Actions">
          <DataTable
            columns={[
              { key: "title", header: "Decision" },
              { key: "action", header: "Action" },
              { key: "priority", header: "Priority" },
              { key: "owner", header: "Owner" },
              { key: "status", header: "Status" },
              { key: "expectedImpact", header: "Expected Impact" },
            ]}
            rows={view.correctiveActions}
          />
        </Panel>
      </div>

      <Panel title="Business Outcomes">
        <DataTable
          columns={[
            { key: "title", header: "Decision" },
            { key: "outcome", header: "Outcome" },
            { key: "businessImpact", header: "Business" },
            { key: "financialImpact", header: "Financial" },
            { key: "status", header: "Status" },
            { key: "evidence", header: "Evidence" },
          ]}
          rows={view.businessOutcomes}
        />
      </Panel>

      <Panel title="Monitoring Capabilities">
        <DataTable
          columns={[
            { key: "label", header: "Capability" },
            { key: "detections", header: "Detections" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.monitoringCapabilities}
        />
      </Panel>

      <Panel title="Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "category", header: "Category" },
            { key: "why", header: "Why" },
            { key: "what", header: "What" },
            { key: "confidencePercent", header: "Confidence %" },
          ]}
          rows={view.recommendedActions}
        />
      </Panel>

      <Panel title="Monitoring Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.monitoringPipeline}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Monitoring Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.monitoringPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Monitor Domains">
          <DataTable
            columns={[
              { key: "domain", header: "Domain" },
            ]}
            rows={view.governedDomains.map((domain) => ({
              domain: domain.replace(/_/g, " "),
            }))}
          />
        </Panel>
      </div>

      <Panel title="Pillow Advisory">
        <ul className="space-y-2 text-sm text-[#c8c0b0]">
          {view.pillowAdvisory.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
