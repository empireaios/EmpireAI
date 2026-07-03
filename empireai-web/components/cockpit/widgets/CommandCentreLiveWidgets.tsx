"use client";

import { CockpitPanel } from "@/components/cockpit/layout/CockpitSectionPanel";
import { Panel } from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import {
  CockpitLoadingState,
  CockpitErrorState,
  DataModeBadge,
} from "@/components/cockpit/ui";
import { AgentActivityLive } from "@/components/cockpit/widgets/ExecutiveHomeLiveWidgets";
import type { ExecutiveHomeView } from "@/lib/cockpit/panel-types";

type CeoView = {
  briefing: {
    headline: string;
    summary: string;
    priorities: Array<{ title: string; impact: string; status: string }>;
    decisions: Array<{ id: string; title: string }>;
  };
};

/** SCR-010 — AI CEO briefing from seeded Brain view (no generative AI in G4-02). */
export function AiCeoBriefingLive() {
  const { data, loading, error, reload } = useBrainModule<CeoView>("ai-ceo");

  if (loading) {
    return (
      <CockpitPanel title="AI CEO Briefing">
        <CockpitLoadingState message="Loading briefing…" />
      </CockpitPanel>
    );
  }
  if (error || !data) {
    return (
      <CockpitPanel title="AI CEO Briefing">
        <CockpitErrorState onRetry={() => void reload()} />
      </CockpitPanel>
    );
  }

  return (
    <CockpitPanel
      title="AI CEO Briefing"
      action={
        <span className="rounded border border-gold/15 px-2 py-1 text-[10px] uppercase tracking-wider text-[#d4af37]">
          Live · ai-ceo
        </span>
      }
    >
      <div className="mb-3">
        <DataModeBadge mode="live" />
      </div>
      <p className="font-display text-lg text-[#f0d78c]">{data.briefing.headline}</p>
      <p className="mt-3 text-sm leading-relaxed text-[#c8c0b0]">{data.briefing.summary}</p>
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
        Priorities
      </p>
      <ul className="mt-3 space-y-2">
        {data.briefing.priorities.map((priority, index) => (
          <li
            key={priority.title}
            className="flex items-center justify-between gap-3 text-sm text-[#8a847a]"
          >
            <span>
              {index + 1}. {priority.title}
            </span>
            <span className="shrink-0 rounded border border-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#d4af37]">
              {priority.impact}
            </span>
          </li>
        ))}
      </ul>
    </CockpitPanel>
  );
}

/** SCR-010 — Pending decisions from ai-ceo repository. */
export function PendingDecisionsLive() {
  const { data, loading, error, reload } = useBrainModule<CeoView>("ai-ceo");

  if (loading) {
    return <CockpitPanel title="Pending Decisions">Loading…</CockpitPanel>;
  }
  if (error || !data) {
    return (
      <CockpitPanel title="Pending Decisions">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </CockpitPanel>
    );
  }

  const decisions = data.briefing.decisions;

  return (
    <CockpitPanel title="Pending Decisions">
      <div className="mb-3">
        <DataModeBadge mode="live" />
      </div>
      {decisions.length === 0 ? (
        <p className="text-sm text-[#6f6a60]">No pending decisions — portfolio is fully authorized.</p>
      ) : (
        <ul className="space-y-3">
          {decisions.map((decision) => (
            <li
              key={decision.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/10 bg-white/[0.02] px-4 py-3"
            >
              <span className="text-sm text-[#c8c0b0]">{decision.title}</span>
              <span className="rounded border border-gold/15 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#8a847a]">
                Awaiting approval
              </span>
            </li>
          ))}
        </ul>
      )}
    </CockpitPanel>
  );
}

/** SCR-010 — Portfolio table from executive-home domain store. */
export function PortfolioOverviewLive() {
  const { data, loading, error, reload } = useBrainModule<ExecutiveHomeView>("executive-home");

  if (loading) {
    return <CockpitPanel title="Portfolio">Loading…</CockpitPanel>;
  }
  if (error || !data) {
    return (
      <CockpitPanel title="Portfolio">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </CockpitPanel>
    );
  }

  return (
    <CockpitPanel title="Portfolio">
      <div className="mb-3">
        <DataModeBadge mode="live" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-gold/10 text-[10px] uppercase tracking-[0.15em] text-[#6f6a60]">
              <th className="pb-2 pr-4 font-semibold">Company</th>
              <th className="pb-2 pr-4 font-semibold">Revenue</th>
              <th className="pb-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.portfolio.companies.map((row) => (
              <tr key={row.id} className="border-b border-gold/5 last:border-0">
                <td className="py-2.5 pr-4 text-[#f0d78c]">{row.name}</td>
                <td className="py-2.5 pr-4 text-[#c8c0b0]">{row.revenue}</td>
                <td className="py-2.5 text-[#8a847a]">
                  <span className="text-[#d4af37]">●</span> {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CockpitPanel>
  );
}

/** SCR-010 — Operational readiness strip from cockpit-command. */
export function CommandReadinessLive() {
  const { data, loading, error, reload } = useBrainModule<ExecutiveHomeView["command"]>(
    "cockpit-command",
  );

  if (loading) {
    return <Panel title="Operational Readiness">Loading…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="Operational Readiness">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <Panel title="Operational Readiness" subtitle="Live · cockpit-command">
      <div className="mb-3">
        <DataModeBadge mode="live" />
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[#6f6a60]">Readiness</dt>
          <dd className="text-[#f0d78c]">
            {data.operationalReadiness.percent}% — {data.operationalReadiness.detail}
          </dd>
        </div>
        <div>
          <dt className="text-[#6f6a60]">PROOF-001</dt>
          <dd className="text-[#e8e0d0]">
            {data.proof001.stagesPassed}/{data.proof001.totalStages} · {data.proof001.detail}
          </dd>
        </div>
        <div>
          <dt className="text-[#6f6a60]">OMS objective</dt>
          <dd className="text-[#e8e0d0]">{data.oms.activeObjective}</dd>
        </div>
        <div>
          <dt className="text-[#6f6a60]">Pending approvals</dt>
          <dd className="text-[#e8e0d0]">{data.pendingApprovals.count}</dd>
        </div>
      </dl>
    </Panel>
  );
}

export { AgentActivityLive };
