"use client";

import { BrainModuleShell } from "@/components/platform/brain/BrainModuleShell";
import {
  ActionButton,
  Badge,
  Panel,
  PlatformPageHeader,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { useBrainAction } from "@/lib/brain/hooks/useBrainAction";
import type { Metric } from "@/lib/platform/types";

type AdsView = {
  metrics?: Metric[];
  channels: Array<{
    channel: string;
    spend: string;
    roas: string;
    status: string;
  }>;
};

export function AdManagerModule() {
  const { data, loading, error, reload } = useBrainModule<AdsView>("ads");
  const { execute, loading: optimizing } = useBrainAction();

  return (
    <BrainModuleShell loading={loading} error={error} onRetry={reload}>
      {!data ? null : (
        <>
          <PlatformPageHeader
            eyebrow="Paid Acquisition"
            title="Ad Manager"
            description="Multi-channel campaign orchestration with autonomous budget optimization across Meta, Google, and TikTok."
            actions={
              <>
                <ActionButton
                  variant="secondary"
                  disabled={optimizing}
                  onClick={() =>
                    void execute({
                      module: "ads",
                      action: "optimize",
                      payload: { mode: "pause_all" },
                    }).then(() => reload())
                  }
                >
                  Pause all
                </ActionButton>
                <ActionButton
                  disabled={optimizing}
                  onClick={() =>
                    void execute({
                      module: "ads",
                      action: "optimize",
                      payload: { mode: "adjust_budget" },
                    }).then(() => reload())
                  }
                >
                  Adjust budget
                </ActionButton>
              </>
            }
          />

          {data.metrics && (
            <div className="mb-8 grid gap-4 sm:grid-cols-4">
              {data.metrics.map((metric) => (
                <StatCard key={metric.label} {...metric} />
              ))}
            </div>
          )}

          <Panel title="Channel Performance" subtitle="Taylor · Media Buyer Agent">
            <div className="grid gap-4 sm:grid-cols-3">
              {data.channels.map((channel) => (
                <div
                  key={channel.channel}
                  className="rounded-lg border border-gold/10 bg-white/[0.02] p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[#f0d78c]">{channel.channel}</p>
                    <Badge variant={channel.status === "Live" ? "success" : "warning"}>
                      {channel.status}
                    </Badge>
                  </div>
                  <p className="mt-4 font-display text-2xl text-[#d4af37]">
                    {channel.roas}
                  </p>
                  <p className="text-xs text-[#6f6a60]">ROAS</p>
                  <p className="mt-2 text-sm text-[#8a847a]">{channel.spend} spent</p>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </BrainModuleShell>
  );
}
