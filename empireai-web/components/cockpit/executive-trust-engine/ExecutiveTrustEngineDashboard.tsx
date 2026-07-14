"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveTrustEngine } from "@/lib/executive-trust-engine/useExecutiveTrustEngine";

/** Compact Executive Trust Engine strip for Executive Home. */
export function ExecutiveTrustEngineStrip() {
  const { view, loading, live } = useExecutiveTrustEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Trust Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-sky-500/40 bg-gradient-to-r from-sky-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-12 Trust Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-trust-engine" className="text-xs text-[#d4af37] hover:underline">
          Trust panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Executive Trust</p>
          <p className="text-sm text-[#d4af37]">{view.executiveTrustScore}/100</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Governance Trust</p>
          <p className="text-sm text-sky-300">{view.governanceTrustScore}/100</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Decision Confidence</p>
          <p className="text-sm text-[#e8e0d0]">{view.decisionConfidence}/100</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Trust Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.trustHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-12 — Permanent Executive Trust Engine panel. */
export function ExecutiveTrustEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveTrustEngine();

  if (loading && !view) {
    return <Panel title="Executive Trust Engine">Loading executive trust engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Trust Engine" subtitle="E5-12 · Executive Trust">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-sky-500/50 bg-gradient-to-br from-sky-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E5-12 Executive Trust Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE513 && (
            <Link href="/cockpit/founder/enterprise-constitutional-guardian" className="text-xs text-[#d4af37] hover:underline">
              Ready for E5-13 →
            </Link>
          )}
          <Link href="/cockpit/founder/executive-policy-evolution" className="text-xs text-[#d4af37] hover:underline">
            E5-11 Policy Evolution →
          </Link>
          <Link href="/cockpit/founder/executive-review-board" className="text-xs text-[#d4af37] hover:underline">
            E5-10 Review Board →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Executive Trust" value={`${view.executiveTrustScore}/100`} />
        <StatCard label="Governance Trust" value={`${view.governanceTrustScore}/100`} />
        <StatCard label="Decision Confidence" value={`${view.decisionConfidence}/100`} />
        <StatCard label="Trust Health" value={view.trustHealth} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="High Trust" value={String(view.highTrustCount)} />
        <StatCard label="Unsupported Ratings" value={String(view.unsupportedRatingCount)} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Executive Trust Scores">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "trustScore", header: "Trust" },
              { key: "confidenceScore", header: "Confidence" },
              { key: "level", header: "Level" },
            ]}
            rows={view.executiveTrustScores}
          />
        </Panel>

        <Panel title="Governance Trust Scores">
          <DataTable
            columns={[
              { key: "engine", header: "Engine" },
              { key: "trustScore", header: "Trust" },
              { key: "complianceRate", header: "Compliance" },
              { key: "status", header: "Status" },
            ]}
            rows={view.governanceTrustScores}
          />
        </Panel>
      </div>

      <Panel title="Decision Confidence">
        <DataTable
          columns={[
            { key: "subject", header: "Subject" },
            { key: "confidenceScore", header: "Confidence" },
            { key: "trustScore", header: "Trust" },
            { key: "evidenceCount", header: "Evidence" },
          ]}
          rows={view.decisionConfidenceEntries}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Trust Trends">
          <DataTable
            columns={[
              { key: "subject", header: "Subject" },
              { key: "trend", header: "Trend" },
              { key: "currentScore", header: "Score" },
              { key: "direction", header: "Direction" },
            ]}
            rows={view.trustTrends}
          />
        </Panel>

        <Panel title="Trust History">
          <DataTable
            columns={[
              { key: "subject", header: "Subject" },
              { key: "event", header: "Event" },
              { key: "previousScore", header: "Previous" },
              { key: "newScore", header: "New" },
            ]}
            rows={view.trustHistory}
          />
        </Panel>
      </div>

      <Panel title="Confidence Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "confidence", header: "Confidence" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.confidenceAnalysis}
        />
      </Panel>

      <Panel title="Trust Assessment Register">
        <DataTable
          columns={[
            { key: "subject", header: "Subject" },
            { key: "category", header: "Category" },
            { key: "trustScore", header: "Trust" },
            { key: "confidenceScore", header: "Confidence" },
            { key: "classification", header: "Classification" },
          ]}
          rows={view.trustAssessmentRegister}
        />
      </Panel>

      <Panel title="Trust Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.trustAnalysis}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Executive Trust Pipeline">
          <DataTable
            columns={[
              { key: "label", header: "Phase" },
              { key: "order", header: "Order" },
              { key: "status", header: "Status" },
            ]}
            rows={view.executiveTrustPipeline}
          />
        </Panel>

        <Panel title="Background Monitoring">
          <div className="space-y-2 text-sm text-[#c8c0b0]">
            <p>Status: {view.monitoringStatus.backgroundMonitoring}</p>
            <p>Total assessments: {view.monitoringStatus.totalAssessments}</p>
            <p>Low trust: {view.monitoringStatus.lowTrustCount}</p>
            <p>Trust health: {view.monitoringStatus.trustHealthScore}/100</p>
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
