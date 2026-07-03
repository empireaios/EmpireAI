"use client";

import {
  ActionButton,
  Badge,
  Panel,
} from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { EngineCenterPanel } from "@/components/cockpit/widgets/EnginePanelFrame";

type StoreView = {
  companies: Array<{
    id: string;
    name: string;
    category: string;
    status: string;
    revenue: string;
    margin: string;
    agents: number;
  }>;
  buildStages: Array<{
    stage: string;
    progress: number;
    status: string;
  }>;
  buildingCompany: {
    id: string;
    name: string;
    progress: number;
  } | null;
};

/** SCR-200 — Commerce Store panel (Brain live — P0-4). */
export function CommerceStorePanel() {
  const { data, loading, error, reload } = useBrainModule<StoreView>("store");

  if (loading) {
    return <Panel title="Store Builder">Loading live store pipeline…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Store Builder" subtitle="Brain dispatch unavailable">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const building = data.buildingCompany;
  const buildingName = building?.name ?? "Awaiting implementation";
  const buildingProgress = building?.progress ?? 0;
  const liveCount = data.companies.filter((c) => c.status === "live").length;
  const buildingCount = data.companies.filter((c) => c.status === "building").length;

  return (
    <div className="space-y-6">
      <EngineCenterPanel engineId="storefront" />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="warning">Building {buildingCount}</Badge>
        <Badge variant="gold">
          Pipeline {buildingProgress > 0 ? `${buildingProgress}%` : "Awaiting implementation"}
        </Badge>
        <Badge variant="success">Live {liveCount}</Badge>
      </div>

      <div className="rounded-xl border border-gold/20 bg-white/[0.02] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant={building ? "warning" : "default"}>
              {building ? "Building" : "Idle"}
            </Badge>
            <h2 className="mt-2 font-display text-2xl text-[#f0d78c]">{buildingName}</h2>
            <p className="text-sm text-[#8a847a]">
              Store Builder · {data.companies.length} companies in workspace
            </p>
          </div>
          <p className="font-display text-4xl text-[#d4af37]">
            {building ? `${buildingProgress}%` : "—"}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton variant="secondary" disabled>
            Preview store
          </ActionButton>
          <ActionButton disabled>Manufacture new</ActionButton>
        </div>
      </div>

      <Panel title="Build Pipeline" subtitle={buildingName}>
        {data.buildStages.length === 0 ? (
          <p className="text-sm text-[#8a847a]">Awaiting implementation — no active build stages</p>
        ) : (
          <div className="space-y-4">
            {data.buildStages.map((stage) => (
              <div key={stage.stage}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-[#c8c0b0]">{stage.stage}</span>
                  <Badge
                    variant={
                      stage.status === "complete"
                        ? "success"
                        : stage.status === "in_progress"
                          ? "gold"
                          : "default"
                    }
                  >
                    {stage.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#b8922a] to-[#d4af37] transition-all duration-700"
                    style={{ width: `${stage.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Portfolio Companies" subtitle="Live Brain domain store">
        {data.companies.length === 0 ? (
          <p className="text-sm text-[#8a847a]">Awaiting implementation — no companies in workspace</p>
        ) : (
          <ul className="space-y-3">
            {data.companies.map((company) => (
              <li
                key={company.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold/10 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#f0d78c]">{company.name}</p>
                  <p className="text-xs text-[#8a847a]">
                    {company.category} · {company.revenue} · {company.margin} margin
                  </p>
                </div>
                <Badge
                  variant={
                    company.status === "live"
                      ? "success"
                      : company.status === "building"
                        ? "gold"
                        : "default"
                  }
                >
                  {company.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
