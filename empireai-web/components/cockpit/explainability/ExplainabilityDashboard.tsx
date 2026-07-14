"use client";

import Link from "next/link";
import { Badge, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { useExplainability } from "@/lib/explainability/useExplainability";
import type { ExplainabilityRecommendation, ExplainabilitySystemPanel } from "@/lib/explainability/types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gold/5 py-2 text-sm last:border-0">
      <span className="text-[10px] uppercase tracking-wide text-[#6f6a60]">{label}</span>
      <span className="text-[#e8e0d0]">{value}</span>
    </div>
  );
}

function RecommendationDetail({ rec }: { rec: ExplainabilityRecommendation }) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="gold">{rec.system}</Badge>
        <Badge variant="default">{rec.classification}</Badge>
        <span className="text-xs text-[#6f6a60]">{rec.confidence.confidencePercent}% confidence</span>
      </div>
      <h3 className="mt-2 font-display text-lg text-[#f0d78c]">{rec.title}</h3>
      <Row label="WHY" value={rec.why} />
      <Row label="WHAT" value={rec.what} />
      <Row label="HOW" value={rec.how} />
      <Row label="PROOF" value={rec.proof} />
      <Row label="Business Impact" value={rec.businessImpact} />
      <Row label="Engineering Impact" value={rec.engineeringImpact} />
      <Row label="Architecture Impact" value={rec.architectureImpact} />
      <Row label="Production Impact" value={rec.productionImpact} />
      <Row label="Risk" value={rec.risk} />
      <Row label="Expected Benefit" value={rec.expectedBenefit} />
      {rec.evidence.length > 0 && (
        <div className="pt-2">
          <p className="text-[10px] uppercase text-[#6f6a60]">Evidence</p>
          <ul className="mt-1 list-inside list-disc text-xs text-[#8a847a]">
            {rec.evidence.map((e) => (
              <li key={`${e.kind}-${e.source}-${e.summary.slice(0, 30)}`}>
                [{e.kind}] {e.source}: {e.summary}
              </li>
            ))}
          </ul>
        </div>
      )}
      {rec.alternativeOptions.length > 0 && (
        <div className="pt-2">
          <p className="text-[10px] uppercase text-[#6f6a60]">Alternative Options</p>
          <ul className="mt-1 list-inside list-disc text-xs text-[#c8c0b0]">
            {rec.alternativeOptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SystemPanel({ panel }: { panel: ExplainabilitySystemPanel }) {
  return (
    <Panel title={panel.system} subtitle={`${panel.status} · ${panel.summary.slice(0, 60)}`}>
      {panel.explanations.length === 0 ? (
        <p className="text-sm text-[#6f6a60]">No active explanations</p>
      ) : (
        <ul className="space-y-2 text-sm text-[#c8c0b0]">
          {panel.explanations.map((e) => (
            <li key={e}>◆ {e}</li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** Compact explainability strip for Executive Home. */
export function ExplainabilityStrip() {
  const { view, loading, live } = useExplainability();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading constitutional explainability…
      </section>
    );
  }

  if (!view?.currentRecommendation) return null;

  const rec = view.currentRecommendation;

  return (
    <section className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/[0.05] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">P7-07 Explainability</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/explainability" className="text-xs text-[#d4af37] hover:underline">
          Full explanation →
        </Link>
      </div>
      <p className="mt-2 text-sm font-medium text-[#f0d78c]">{rec.title}</p>
      <p className="mt-1 text-sm text-[#c8c0b0]">
        <span className="text-[#6f6a60]">WHY:</span> {rec.why.slice(0, 160)}
        {rec.why.length > 160 ? "…" : ""}
      </p>
    </section>
  );
}

/** P7-07 — Permanent Explainability Architecture panel. */
export function ExplainabilityDashboard() {
  const { view, loading, error, reload, live, data } = useExplainability();

  if (loading && !view) {
    return <Panel title="Explainability">Loading constitutional explainability…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Explainability" subtitle="P7-07 · WHY · WHAT · HOW · PROOF">
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
          <Badge variant="gold">P7-07 Explainability</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 text-sm text-[#c8c0b0]">{view.grandKingSummary}</p>
        <p className="mt-2 text-xs text-[#6f6a60]">
          Systems covered: {view.systemsCovered.join(" · ")}
        </p>
      </section>

      {view.currentRecommendation && (
        <Panel title="Current Recommendation" subtitle="Primary explainable action">
          <RecommendationDetail rec={view.currentRecommendation} />
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <SystemPanel panel={view.pillow} />
        <SystemPanel panel={view.ecc} />
        <SystemPanel panel={view.supervisor} />
        <SystemPanel panel={view.builder} />
        <SystemPanel panel={view.guardian} />
        <SystemPanel panel={view.vie} />
        <SystemPanel panel={view.recovery} />
        <SystemPanel panel={view.automation} />
      </div>

      {view.recommendations.length > 1 && (
        <Panel title="All Recommendations" subtitle={`${view.recommendations.length} explainable items`}>
          <div className="space-y-6">
            {view.recommendations.slice(1, 8).map((rec) => (
              <div key={rec.id} className="border-t border-gold/10 pt-4 first:border-0 first:pt-0">
                <RecommendationDetail rec={rec} />
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
