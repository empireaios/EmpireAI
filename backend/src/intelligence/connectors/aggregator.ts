import type { ProductIntelligenceInput } from "../product-intelligence-engine/types.js";
import type { ProductIntelligenceConnectorRegistry } from "./registry.js";
import type {
  ProductIntelligenceConnectorContext,
  ProductIntelligenceSignal,
  ProductSignalQuery,
  SupplierAvailability,
  TrendDirection,
} from "./types.js";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function majorityTrend(signals: ProductIntelligenceSignal[]): TrendDirection {
  const counts: Record<TrendDirection, number> = {
    rising: 0,
    stable: 0,
    falling: 0,
  };
  for (const signal of signals) {
    counts[signal.trendDirection] += 1;
  }
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "stable") as TrendDirection;
}

function supplierAvailabilityFromSignals(
  signals: ProductIntelligenceSignal[],
): SupplierAvailability {
  const supplierSignals = signals.filter(
    (s) => s.providerId !== "google-trends" && s.providerId !== "meta-ad-library",
  );
  if (supplierSignals.length === 0) return "medium";

  const availableCount = supplierSignals.filter((s) => s.supplierAvailable).length;
  const ratio = availableCount / supplierSignals.length;
  if (ratio >= 0.75) return "high";
  if (ratio >= 0.4) return "medium";
  if (ratio > 0) return "low";
  return "unavailable";
}

export function aggregateSignalsToInput(
  signals: ProductIntelligenceSignal[],
  workspaceId: string,
  productId?: string,
): ProductIntelligenceInput {
  if (signals.length === 0) {
    throw new Error("Cannot aggregate empty signal set");
  }

  const query = signals[0]!;
  const purchasePrices = signals
    .map((s) => s.purchasePriceCents)
    .filter((v): v is number => typeof v === "number");
  const sellingPrices = signals
    .map((s) => s.estimatedSellingPriceCents)
    .filter((v): v is number => typeof v === "number");
  const shippingCosts = signals
    .map((s) => s.shippingCostCents)
    .filter((v): v is number => typeof v === "number");

  const supplierSignal =
    signals.find((s) => s.providerId === "cj-dropshipping") ??
    signals.find((s) => s.providerId === "aliexpress") ??
    signals[0]!;

  return {
    productTitle: query.productTitle,
    category: query.category,
    supplierData: {
      supplierId: `sup-${supplierSignal.providerId}`,
      name: supplierSignal.providerName,
      region: supplierSignal.providerId.includes("amazon") ? "US" : "CN",
      reliabilityScore: Math.round(average(signals.map((s) => s.confidence))),
      avgShipDays: supplierSignal.providerId === "cj-dropshipping" ? 10 : 14,
      defectRatePct: 3,
    },
    purchasePriceCents: Math.round(average(purchasePrices.length ? purchasePrices : [800])),
    estimatedSellingPriceCents: Math.round(
      average(sellingPrices.length ? sellingPrices : [2999]),
    ),
    shippingCostCents: Math.round(average(shippingCosts.length ? shippingCosts : [350])),
    historicalDemand: {
      searchVolumeIndex: Math.round(average(signals.map((s) => s.demandIndex))),
      trendDirection: majorityTrend(signals),
      monthlyOrdersEstimate: Math.round(
        average(
          signals
            .map((s) => s.monthlyOrdersEstimate)
            .filter((v): v is number => typeof v === "number"),
        ) || 1000,
      ),
    },
    competitionScore: Math.round(average(signals.map((s) => s.competitionIndex))),
    workspaceId,
    productId,
  };
}

export type AggregatedProductSignals = {
  signals: ProductIntelligenceSignal[];
  input: ProductIntelligenceInput;
  supplierAvailability: SupplierAvailability;
  providerCount: number;
};

export async function fetchAndAggregateProductSignals(
  registry: ProductIntelligenceConnectorRegistry,
  context: ProductIntelligenceConnectorContext,
  query: ProductSignalQuery,
  productId?: string,
): Promise<AggregatedProductSignals> {
  const signals = await registry.fetchAllSignals(context, query);
  const input = aggregateSignalsToInput(signals, context.workspaceId, productId);
  return {
    signals,
    input,
    supplierAvailability: supplierAvailabilityFromSignals(signals),
    providerCount: signals.length,
  };
}

export { majorityTrend, supplierAvailabilityFromSignals };
