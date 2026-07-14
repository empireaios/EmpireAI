"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveAdvisoryEngine } from "@/lib/executive-advisory-engine/useExecutiveAdvisoryEngine";

/** Compact Executive Advisory Engine strip for Executive Home. */
export function ExecutiveAdvisoryEngineStrip() {
  const { view, loading, live } = useExecutiveAdvisoryEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Advisory Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-14 AI Executive Advisor</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-advisory" className="text-xs text-[#d4af37] hover:underline">
          Advisory →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Recommendations</p>
          <p className="text-sm text-[#d4af37]">{view.activeRecommendationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Immediate Actions</p>
          <p className="text-sm text-amber-300">{view.immediateActionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Avg Confidence</p>
          <p className="text-sm text-yellow-300">{view.averageRecommendationConfidence}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Advisory Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.advisoryIntelligenceHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E4-14 — Permanent Executive Advisory Engine panel. */
export function ExecutiveAdvisoryEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveAdvisoryEngine();

  if (loading && !view) {
    return <Panel title="Executive Advisory Engine">Loading executive advisory engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Advisory Engine" subtitle="E4-14 · AI Executive Advisor">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-amber-500/50 bg-gradient-to-br from-amber-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E4-14 Executive Advisory Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE415 && (
            <Link href="/cockpit/founder/executive-intelligence-certification">
              <Badge variant="gold">Ready for E4-15 →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/cross-business-intelligence" className="text-xs text-[#d4af37] hover:underline">
            Cross-Business →
          </Link>
          <Link href="/cockpit/founder/executive-insight" className="text-xs text-[#d4af37] hover:underline">
            Insight Engine →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Board Recommendations" value={String(view.activeRecommendationCount)} />
        <StatCard label="Immediate Actions" value={String(view.immediateActionCount)} />
        <StatCard label="Strategic Actions" value={String(view.strategicActionCount)} />
        <StatCard label="Avg Confidence" value={`${view.averageRecommendationConfidence}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Advisory Health" value={view.advisoryIntelligenceHealth} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Top Executive Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "priority", header: "Priority" },
            { key: "urgency", header: "Urgency" },
            { key: "expectedRoi", header: "Expected ROI" },
            { key: "confidence", header: "Confidence %" },
          ]}
          rows={view.topExecutiveRecommendations.map((r) => ({
            ...r,
            urgency: r.urgency.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Immediate Actions">
          <DataTable
            columns={[
              { key: "title", header: "Action" },
              { key: "recommendedAction", header: "Action Required" },
              { key: "urgency", header: "Urgency" },
              { key: "confidence", header: "Confidence %" },
            ]}
            rows={view.immediateActions.map((a) => ({
              ...a,
              urgency: a.urgency.replace(/_/g, " "),
            }))}
          />
        </Panel>

        <Panel title="Strategic Actions">
          <DataTable
            columns={[
              { key: "title", header: "Action" },
              { key: "strategicObjective", header: "Objective" },
              { key: "confidence", header: "Confidence %" },
              { key: "status", header: "Status" },
            ]}
            rows={view.strategicActions}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Growth Recommendations">
          <DataTable
            columns={[
              { key: "title", header: "Recommendation" },
              { key: "expectedRoi", header: "Expected ROI" },
              { key: "businessImpact", header: "Impact" },
              { key: "confidence", header: "Confidence %" },
            ]}
            rows={view.growthRecommendations}
          />
        </Panel>

        <Panel title="Financial Recommendations">
          <DataTable
            columns={[
              { key: "title", header: "Recommendation" },
              { key: "financialImpact", header: "Financial Impact" },
              { key: "expectedRoi", header: "Expected ROI" },
              { key: "confidence", header: "Confidence %" },
            ]}
            rows={view.financialRecommendations}
          />
        </Panel>
      </div>

      <Panel title="Risk Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "currentSituation", header: "Situation" },
            { key: "urgency", header: "Urgency" },
            { key: "confidence", header: "Confidence %" },
          ]}
          rows={view.riskRecommendations.map((r) => ({
            ...r,
            urgency: r.urgency.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Expected Outcomes">
          <DataTable
            columns={[
              { key: "title", header: "Recommendation" },
              { key: "expectedOutcome", header: "Outcome" },
              { key: "expectedRoi", header: "ROI" },
              { key: "confidence", header: "Confidence %" },
            ]}
            rows={view.expectedOutcomes.map((o) => ({
              ...o,
              status: o.status.replace(/_/g, " "),
            }))}
          />
        </Panel>

        <Panel title="Executive Confidence">
          <DataTable
            columns={[
              { key: "title", header: "Recommendation" },
              { key: "confidence", header: "Confidence %" },
              { key: "evidenceQuality", header: "Evidence" },
              { key: "validationStatus", header: "Validation" },
            ]}
            rows={view.executiveConfidence.map((c) => ({
              ...c,
              validationStatus: c.validationStatus.replace(/_/g, " "),
            }))}
          />
        </Panel>
      </div>

      <Panel title="Executive Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.executiveAnalysis}
        />
      </Panel>

      <Panel title="Advisory Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.advisoryPipeline}
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
        <Panel title="Advisory Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.advisoryPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Advisory Domains">
          <DataTable
            columns={[{ key: "domain", header: "Domain" }]}
            rows={view.governedDomains.map((domain) => ({
              domain: domain.replace(/_/g, " "),
            }))}
          />
        </Panel>
      </div>

      {view.pillowAdvisory.length > 0 && (
        <Panel title="Pillow Advisory">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.pillowAdvisory.map((note) => (
              <li key={note}>
                <span className="text-[#d4af37]">•</span> {note}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
