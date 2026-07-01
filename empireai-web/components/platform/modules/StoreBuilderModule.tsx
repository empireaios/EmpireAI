"use client";

import { useState } from "react";
import { BrainModuleShell } from "@/components/platform/brain/BrainModuleShell";
import {
  ActionButton,
  Badge,
  Panel,
  PlatformPageHeader,
} from "@/components/platform/ui/PlatformPrimitives";
import { useBrainAction } from "@/lib/brain/hooks/useBrainAction";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import type { Company } from "@/lib/platform/types";

type StoreView = {
  companies: Company[];
  buildStages: Array<{ stage: string; progress: number; status: string }>;
  buildingCompany?: { id: string; name: string; progress: number } | null;
};

export function StoreBuilderModule() {
  const { data, loading, error, reload } = useBrainModule<StoreView>("store");
  const { execute, loading: acting } = useBrainAction<{ companyId: string }>();
  const [actionError, setActionError] = useState<string | null>(null);

  const building = data?.buildingCompany ?? null;
  const buildingName =
    building?.name ??
    data?.companies.find((company) => company.status === "building")?.name;
  const buildingProgress = building?.progress ?? 68;

  async function handleManufactureNew() {
    setActionError(null);
    try {
      const created = await execute({
        module: "store",
        action: "create",
        payload: {
          name: `Venture ${Date.now().toString(36).slice(-4).toUpperCase()}`,
          category: "Commerce",
        },
      });

      await execute({
        module: "store",
        action: "manufacture",
        companyId: created.result?.companyId,
        payload: { confirmed: true, objective: "Manufacture new company end-to-end" },
      });

      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Manufacture failed");
    }
  }

  return (
    <BrainModuleShell
      loading={loading}
      error={error}
      onRetry={reload}
      actionError={actionError}
    >
      {!data ? null : (
        <>
          <PlatformPageHeader
            eyebrow="Manufacturing Pipeline"
            title="Store Builder"
            description="AI-generated storefronts, brand systems, and product catalogs — manufactured and deployed autonomously."
            actions={
              <>
                <ActionButton variant="secondary">Preview store</ActionButton>
                <ActionButton disabled={acting} onClick={() => void handleManufactureNew()}>
                  {acting ? "Manufacturing…" : "Manufacture new"}
                </ActionButton>
              </>
            }
          />

          {buildingName && (
            <div className="mb-8 rounded-xl border border-gold/20 bg-white/[0.02] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Badge variant="warning">Building</Badge>
                  <h2 className="mt-2 font-display text-2xl text-[#f0d78c]">
                    {buildingName}
                  </h2>
                  <p className="text-sm text-[#8a847a]">
                    Casey · Store Builder Agent · pipeline active
                  </p>
                </div>
                <p className="font-display text-4xl text-[#d4af37]">{buildingProgress}%</p>
              </div>
            </div>
          )}

          <Panel title="Build Pipeline" subtitle={buildingName ?? "Portfolio builds"}>
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
          </Panel>
        </>
      )}
    </BrainModuleShell>
  );
}
