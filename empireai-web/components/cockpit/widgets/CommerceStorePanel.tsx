"use client";

import { StoreGeneratedDataPanels } from "@/components/platform/modules/store-builder/StoreGeneratedDataPanels";
import { StorefrontPreviewViewer } from "@/components/platform/modules/store-builder/StorefrontPreviewViewer";
import {
  ActionButton,
  Badge,
  Panel,
} from "@/components/platform/ui/PlatformPrimitives";
import {
  COMMERCE_STORE_BUILD_STAGES,
  COMMERCE_STORE_DEMO_DATA,
  COMMERCE_STORE_PREVIEW_MODEL,
} from "@/components/cockpit/widgets/store/commerceStoreDemoData";

/** SCR-200 — Commerce Store panel (presentation-only demo mount). */
export function CommerceStorePanel() {
  const buildingName = "Nova Home";
  const buildingProgress = 72;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
          <Badge variant="warning">Building 1</Badge>
          <Badge variant="gold">Pipeline 68%</Badge>
          <Badge variant="success">Deployed 3</Badge>
        </div>

      <div className="rounded-xl border border-gold/20 bg-white/[0.02] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="warning">Building</Badge>
            <h2 className="mt-2 font-display text-2xl text-[#f0d78c]">{buildingName}</h2>
            <p className="text-sm text-[#8a847a]">
              Casey · Store Builder Agent · demo presentation mode
            </p>
          </div>
          <p className="font-display text-4xl text-[#d4af37]">{buildingProgress}%</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton variant="secondary" disabled>
            Preview store
          </ActionButton>
          <ActionButton disabled>Manufacture new</ActionButton>
        </div>
      </div>

      <Panel title="Build Pipeline" subtitle={buildingName}>
        <div className="space-y-4">
          {COMMERCE_STORE_BUILD_STAGES.map((stage) => (
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

      <StoreGeneratedDataPanels data={COMMERCE_STORE_DEMO_DATA} />

      <StorefrontPreviewViewer model={COMMERCE_STORE_PREVIEW_MODEL} />
    </div>
  );
}
