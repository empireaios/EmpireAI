"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Panel } from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import {
  CockpitErrorState,
  CockpitHealthBadge,
  CockpitLoadingState,
  DataModeBadge,
  StatusBadge,
} from "@/components/cockpit/ui";
import { engineHealthToStatus } from "@/components/cockpit/ui/CockpitHealthBadge";
import { EngineCenterAiInsightPanel } from "@/components/cockpit/interaction/CockpitInteractionDrawer";
import type { CockpitEngineId, EngineCenterSection, EngineCenterView } from "@/lib/cockpit/panel-types";

const SECTION_LABELS: Record<keyof EngineCenterView["sections"], string> = {
  overview: "Overview",
  health: "Health",
  currentActivity: "Current Activity",
  dependencies: "Dependencies",
  executiveAudit: "Executive Audit",
  configuration: "Configuration",
  futureExpansion: "Future Expansion",
  nextActions: "Next Actions",
};

function healthToStatus(health: EngineCenterView["health"]): string {
  return engineHealthToStatus(health);
}

function EngineCenterSectionPanel({
  title,
  section,
}: {
  title: string;
  section: EngineCenterSection;
}) {
  return (
    <Panel title={title}>
      {section.available ? (
        <div className="space-y-3 text-sm">
          {section.headline && (
            <p className="font-display text-lg text-[#f0d78c]">{section.headline}</p>
          )}
          <p className="text-[#c8c0b0]">{section.status}</p>
          {section.metrics && section.metrics.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {section.metrics.map((m) => (
                <div key={m.label} className="rounded-lg border border-gold/10 px-3 py-2">
                  <p className="text-[10px] uppercase text-[#6f6a60]">{m.label}</p>
                  <p className="text-[#e8e0d0]">{m.value}</p>
                </div>
              ))}
            </div>
          )}
          {section.items && section.items.length > 0 && (
            <ul className="space-y-1.5 text-xs">
              {section.items.slice(0, 5).map((item) => (
                <li
                  key={`${item.label}-${item.value}`}
                  className="flex justify-between gap-2 rounded border border-gold/5 px-2 py-1.5"
                >
                  <span className="text-[#6f6a60]">{item.label}</span>
                  <span className="truncate text-right text-[#c8c0b0]">{item.value}</span>
                </li>
              ))}
            </ul>
          )}
          {section.artifactRef && (
            <p className="text-xs text-[#8a847a]">Ref: {section.artifactRef}</p>
          )}
          <p className="text-xs text-[#d4af37]">{section.nextAction}</p>
        </div>
      ) : (
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-[10px] uppercase text-[#6f6a60]">Status</dt>
            <dd className="text-[#c8c0b0]">{section.status}</dd>
          </div>
          {section.dependency && (
            <div>
              <dt className="text-[10px] uppercase text-[#6f6a60]">Dependency</dt>
              <dd className="text-[#8a847a]">{section.dependency}</dd>
            </div>
          )}
          <div>
            <dt className="text-[10px] uppercase text-[#6f6a60]">Next Action</dt>
            <dd className="text-[#d4af37]">{section.nextAction}</dd>
          </div>
        </dl>
      )}
    </Panel>
  );
}

type EngineCenterLayoutProps = {
  engineId: CockpitEngineId;
  children?: React.ReactNode;
};

/** G4-04 — Full Engine Center with eight operational sections. */
export function EngineCenterLayout({ engineId, children }: EngineCenterLayoutProps) {
  const payload = useMemo(() => ({ engineId }), [engineId]);
  const { data, loading, error, reload } = useBrainModule<EngineCenterView>("cockpit-engine", "load", {
    payload,
  });

  if (loading) {
    return (
      <Panel title="Engine Center">
        <CockpitLoadingState message="Loading live engine center…" />
      </Panel>
    );
  }

  if (error || !data) {
    return (
      <Panel title="Engine Center">
        <CockpitErrorState
          message="Could not load engine center from Brain."
          onRetry={() => void reload()}
        />
      </Panel>
    );
  }

  const sectionEntries = Object.entries(data.sections) as Array<
    [keyof EngineCenterView["sections"], EngineCenterSection]
  >;

  return (
    <div className="space-y-6">
      <Panel
        title={data.displayName}
        subtitle={`Engine Center · ${data.engineId} · G4-04`}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <DataModeBadge mode={data.dataMode} />
          <CockpitHealthBadge health={data.health} />
          {!data.implemented && (
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
              Partial implementation
            </span>
          )}
        </div>
        <p className="text-sm text-[#8a847a]">{data.currentState}</p>
      </Panel>

      {data.aiInsight && (
        <EngineCenterAiInsightPanel insight={data.aiInsight} engineName={data.displayName} />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {sectionEntries.map(([key, section]) => (
          <EngineCenterSectionPanel key={key} title={SECTION_LABELS[key]} section={section} />
        ))}
      </div>

      {data.crossEngine && (
        <Panel title="Cross-Engine Awareness" subtitle="G4-05 · upstream · downstream · missions">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] uppercase text-[#6f6a60]">Upstream</p>
              {data.crossEngine.upstream.length === 0 ? (
                <p className="text-xs text-[#6f6a60]">No upstream engines in V1 graph.</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {data.crossEngine.upstream.map((e) => (
                    <li key={e.engineId}>
                      <Link href={e.route} className="text-[#d4af37]">
                        {e.displayName}
                      </Link>
                      <span className="text-[#6f6a60]"> · {e.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-[10px] uppercase text-[#6f6a60]">Downstream</p>
              {data.crossEngine.downstream.length === 0 ? (
                <p className="text-xs text-[#6f6a60]">No downstream engines in V1 graph.</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {data.crossEngine.downstream.map((e) => (
                    <li key={e.engineId}>
                      <Link href={e.route} className="text-[#d4af37]">
                        {e.displayName}
                      </Link>
                      <span className="text-[#6f6a60]"> · {e.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-[10px] uppercase text-[#6f6a60]">Related Engine Centers</p>
              <ul className="flex flex-wrap gap-2">
                {data.crossEngine.relatedEngines.map((e) => (
                  <Link
                    key={e.engineId}
                    href={e.route}
                    className="rounded border border-gold/15 px-2 py-1 text-[10px] text-[#c8c0b0]"
                  >
                    {e.displayName}
                  </Link>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-[10px] uppercase text-[#6f6a60]">Related Active Missions</p>
              {data.crossEngine.relatedMissions.length === 0 ? (
                <p className="text-xs text-[#6f6a60]">No matching OMS objectives.</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {data.crossEngine.relatedMissions.map((m) => (
                    <li key={m.id}>
                      <Link href={m.href} className="text-[#f0d78c]">
                        {m.title}
                      </Link>
                      <span className="text-[#6f6a60]"> · {m.progress}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Panel>
      )}

      <Panel title="Engine Centers" subtitle="Navigate operational departments">
        <div className="flex flex-wrap gap-2">
          {data.siblingEngines.map((sibling) => (
            <Link
              key={sibling.engineId}
              href={sibling.route}
              className="rounded-md border border-gold/15 px-3 py-1.5 text-xs text-[#c8c0b0] hover:border-gold/30 hover:text-[#f0d78c]"
            >
              {sibling.displayName}
            </Link>
          ))}
        </div>
      </Panel>

      {children}
    </div>
  );
}

/** @deprecated Use EngineCenterLayout — kept for backward imports during G4-04 migration. */
export function EngineCenterPanel({ engineId, children }: EngineCenterLayoutProps) {
  return <EngineCenterLayout engineId={engineId}>{children}</EngineCenterLayout>;
}

/** G4-02 compact panel — used where full center is not required. */
export function EnginePanelFrame({
  panel,
  children,
}: {
  panel: EngineCenterView | import("@/lib/cockpit/panel-types").EnginePanelView;
  children?: React.ReactNode;
}) {
  return (
    <Panel title={panel.displayName} subtitle={`Runtime · ${panel.engineId}`}>
      <div className="mb-3 flex gap-2">
        <DataModeBadge mode={panel.dataMode} />
        <StatusBadge status={healthToStatus(panel.health)} />
      </div>
      <p className="text-sm text-[#c8c0b0]">{panel.currentState}</p>
      <p className="mt-2 text-xs text-[#d4af37]">{panel.nextAction}</p>
      {children}
    </Panel>
  );
}
