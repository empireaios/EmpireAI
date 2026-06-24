"use client";

import { useState } from "react";
import { BrainModuleShell } from "@/components/platform/brain/BrainModuleShell";
import {
  ActionButton,
  Badge,
  Panel,
  PlatformPageHeader,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { useBrainAction } from "@/lib/brain/hooks/useBrainAction";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import type { Metric } from "@/lib/platform/types";

type SuppliersView = {
  metrics?: Metric[];
  suppliers: Array<{
    id: string;
    name: string;
    region: string;
    products: number;
    reliability: number;
    avgShip: string;
    status: string;
  }>;
};

export function SuppliersModule() {
  const { data, loading, error, reload } = useBrainModule<SuppliersView>("suppliers");
  const { execute, loading: checking } = useBrainAction();
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleHealthCheck() {
    setActionError(null);
    try {
      await execute({
        module: "suppliers",
        action: "health_check",
        payload: { objective: "Run supplier network health check" },
      });
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Health check failed");
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
            eyebrow="Global Sourcing"
            title="Supplier Network"
            description="Connected fulfillment partners, reliability scoring, and autonomous supplier recovery across your portfolio."
            actions={
              <ActionButton disabled={checking} onClick={() => void handleHealthCheck()}>
                {checking ? "Checking…" : "Run health check"}
              </ActionButton>
            }
          />

          {data.metrics && (
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {data.metrics.map((metric) => (
                <StatCard key={metric.label} {...metric} />
              ))}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            {data.suppliers.map((supplier) => (
              <Panel key={supplier.id} title={supplier.name} subtitle={supplier.region}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6f6a60]">Reliability</span>
                    <span className="text-sm font-semibold text-[#f0d78c]">
                      {supplier.reliability}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#b8922a] to-[#d4af37]"
                      style={{ width: `${supplier.reliability}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[#8a847a]">
                    <span>{supplier.products} products</span>
                    <span>{supplier.avgShip} avg ship</span>
                  </div>
                  <Badge
                    variant={supplier.status === "healthy" ? "success" : "warning"}
                  >
                    {supplier.status}
                  </Badge>
                </div>
              </Panel>
            ))}
          </div>
        </>
      )}
    </BrainModuleShell>
  );
}
