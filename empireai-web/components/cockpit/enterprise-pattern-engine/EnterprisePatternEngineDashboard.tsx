"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useEnterprisePatternEngine } from "@/lib/enterprise-pattern-engine/useEnterprisePatternEngine";

/** Compact Enterprise Pattern Engine strip for Executive Home. */
export function EnterprisePatternEngineStrip() {
  const { view, loading, live } = useEnterprisePatternEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Enterprise Pattern Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-11 Pattern Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/enterprise-pattern" className="text-xs text-[#d4af37] hover:underline">
          Patterns →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active Patterns</p>
          <p className="text-sm text-[#d4af37]">{view.activePatternCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Recurring</p>
          <p className="text-sm text-emerald-300">{view.recurringPatternCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Avg Confidence</p>
          <p className="text-sm text-teal-300">{view.averagePatternConfidence}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Pattern Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.patternIntelligenceHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E4-11 — Permanent Enterprise Pattern Engine panel. */
export function EnterprisePatternEngineDashboard() {
  const { view, loading, error, reload, live, data } = useEnterprisePatternEngine();

  if (loading && !view) {
    return <Panel title="Enterprise Pattern Engine">Loading enterprise pattern engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Enterprise Pattern Engine" subtitle="E4-11 · Enterprise Pattern Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E4-11 Enterprise Pattern Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE412 && (
            <Link href="/cockpit/founder/executive-benchmark" className="text-xs text-[#d4af37] hover:underline">
              <Badge variant="gold">Ready for E4-12 →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-insight" className="text-xs text-[#d4af37] hover:underline">
            Insight Engine →
          </Link>
          <Link href="/cockpit/founder/executive-prediction" className="text-xs text-[#d4af37] hover:underline">
            Prediction Engine →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Patterns" value={String(view.activePatternCount)} />
        <StatCard label="Recurring Patterns" value={String(view.recurringPatternCount)} />
        <StatCard label="Emerging Patterns" value={String(view.emergingPatternCount)} />
        <StatCard label="Avg Confidence" value={`${view.averagePatternConfidence}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Pattern Health" value={view.patternIntelligenceHealth} />
        <StatCard label="Risk Patterns" value={String(view.riskPatternCount)} />
      </div>

      <Panel title="Pattern Catalogue">
        <DataTable
          columns={[
            { key: "patternName", header: "Pattern" },
            { key: "category", header: "Category" },
            { key: "occurrenceFrequency", header: "Frequency" },
            { key: "trendDirection", header: "Trend" },
            { key: "confidence", header: "Confidence %" },
          ]}
          rows={view.patternCatalogue.map((p) => ({
            ...p,
            category: p.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recurring Patterns">
          <DataTable
            columns={[
              { key: "patternName", header: "Pattern" },
              { key: "occurrenceFrequency", header: "Frequency" },
              { key: "trendDirection", header: "Trend" },
              { key: "confidence", header: "Confidence %" },
            ]}
            rows={view.recurringPatterns}
          />
        </Panel>

        <Panel title="Emerging Patterns">
          <DataTable
            columns={[
              { key: "patternName", header: "Pattern" },
              { key: "patternDescription", header: "Description" },
              { key: "trendDirection", header: "Trend" },
              { key: "status", header: "Status" },
            ]}
            rows={view.emergingPatterns}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Growth Patterns">
          <DataTable
            columns={[
              { key: "patternName", header: "Pattern" },
              { key: "businessImpact", header: "Business Impact" },
              { key: "financialImpact", header: "Financial Impact" },
              { key: "confidence", header: "Confidence %" },
            ]}
            rows={view.growthPatterns}
          />
        </Panel>

        <Panel title="Risk Patterns">
          <DataTable
            columns={[
              { key: "patternName", header: "Pattern" },
              { key: "businessImpact", header: "Impact" },
              { key: "occurrenceFrequency", header: "Frequency" },
              { key: "status", header: "Status" },
            ]}
            rows={view.riskPatterns}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pattern Trends">
          <DataTable
            columns={[
              { key: "patternName", header: "Pattern" },
              { key: "trendDirection", header: "Trend" },
              { key: "predictiveValue", header: "Predictive Value" },
              { key: "status", header: "Status" },
            ]}
            rows={view.patternTrends}
          />
        </Panel>

        <Panel title="Strategic Signals">
          <DataTable
            columns={[
              { key: "patternName", header: "Pattern" },
              { key: "strategicImpact", header: "Impact" },
              { key: "confidence", header: "Confidence %" },
              { key: "status", header: "Status" },
            ]}
            rows={view.strategicSignals}
          />
        </Panel>
      </div>

      <Panel title="Business Impact">
        <DataTable
          columns={[
            { key: "patternName", header: "Pattern" },
            { key: "businessImpact", header: "Business" },
            { key: "financialImpact", header: "Financial" },
            { key: "strategicImpact", header: "Strategic" },
          ]}
          rows={view.businessImpact}
        />
      </Panel>

      <Panel title="Executive Recommendations">
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

      <Panel title="Pattern Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.patternAnalysis}
        />
      </Panel>

      <Panel title="Pattern Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.patternPipeline}
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
        <Panel title="Pattern Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.patternPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Pattern Domains">
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
