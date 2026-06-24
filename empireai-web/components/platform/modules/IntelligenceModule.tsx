"use client";

import { useState } from "react";
import { BrainModuleShell } from "@/components/platform/brain/BrainModuleShell";
import {
  ActionButton,
  Badge,
  DataTable,
  Panel,
  PlatformPageHeader,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { useBrainAction } from "@/lib/brain/hooks/useBrainAction";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import type { Metric } from "@/lib/platform/types";

type IntelligenceProductRow = {
  id: string;
  name: string;
  score: number;
  demand: string;
  demandScore: number;
  competitionScore: number;
  margin: string;
  marginScore: number;
  supplierAvailability: string;
  trend: string;
  trendDirection: string;
  confidence: number;
  recommendation: string;
};

type IntelligenceView = {
  metrics?: Metric[];
  products: IntelligenceProductRow[];
};

function recommendationVariant(
  recommendation: string,
): "success" | "danger" | "default" {
  if (recommendation === "Sell") return "success";
  if (recommendation === "Do Not Sell") return "danger";
  return "default";
}

export function IntelligenceModule() {
  const { data, loading, error, reload } = useBrainModule<IntelligenceView>("intelligence");
  const { execute, loading: scanning } = useBrainAction();
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleScan() {
    setActionError(null);
    try {
      await execute({
        module: "intelligence",
        action: "scan",
        payload: { objective: "Scan wireless accessories category", category: "wireless" },
      });
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Scan failed");
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
            eyebrow="Product Intelligence Engine"
            title="AI Product Intelligence"
            description="Multi-source product signals from CJ, Amazon, TikTok Shop, eBay, Walmart, AliExpress, Google Trends, and Meta Ad Library — aggregated into PIE scores."
            actions={
              <ActionButton disabled={scanning} onClick={() => void handleScan()}>
                {scanning ? "Scanning…" : "Run market scan"}
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

          <Panel
            title="Top-Ranked Opportunities"
            subtitle="Morgan · Product Research Agent · Mission 012 connector aggregation"
            action={<ActionButton variant="ghost">Full catalog</ActionButton>}
          >
            <DataTable
              keyField="id"
              data={data.products}
              columns={[
                { key: "name", header: "Product" },
                {
                  key: "demandScore",
                  header: "Demand",
                  render: (row) => (
                    <Badge variant={row.demand === "High" ? "success" : "default"}>
                      {String(row.demand)} ({String(row.demandScore)})
                    </Badge>
                  ),
                },
                {
                  key: "competitionScore",
                  header: "Competition",
                  render: (row) => (
                    <span className="text-sm text-neutral-300">
                      {String(row.competitionScore)}/100
                    </span>
                  ),
                },
                { key: "margin", header: "Est. Margin" },
                {
                  key: "supplierAvailability",
                  header: "Supplier",
                  render: (row) => (
                    <Badge
                      variant={
                        row.supplierAvailability === "High"
                          ? "success"
                          : row.supplierAvailability === "Unavailable"
                            ? "danger"
                            : "default"
                      }
                    >
                      {String(row.supplierAvailability)}
                    </Badge>
                  ),
                },
                {
                  key: "trend",
                  header: "Trend",
                  render: (row) => (
                    <Badge
                      variant={
                        row.trendDirection === "rising"
                          ? "success"
                          : row.trendDirection === "falling"
                            ? "danger"
                            : "default"
                      }
                    >
                      {String(row.trend)}
                    </Badge>
                  ),
                },
                {
                  key: "confidence",
                  header: "Confidence",
                  render: (row) => (
                    <span className="text-sm">{String(row.confidence)}%</span>
                  ),
                },
                {
                  key: "recommendation",
                  header: "Recommendation",
                  render: (row) => (
                    <Badge variant={recommendationVariant(String(row.recommendation))}>
                      {String(row.recommendation)}
                    </Badge>
                  ),
                },
                {
                  key: "score",
                  header: "PI Score",
                  render: (row) => (
                    <span className="font-semibold text-[#d4af37]">
                      {String(row.score)}/100
                    </span>
                  ),
                },
              ]}
            />
          </Panel>
        </>
      )}
    </BrainModuleShell>
  );
}
