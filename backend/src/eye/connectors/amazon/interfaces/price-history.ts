/** Contract for price snapshot time series — mock or future live implementations. */

export type PriceSnapshot = {
  asin: string;
  priceCents: number;
  currency: string;
  observedAt: string;
  source: "mock" | "live";
};

export type PriceHistory = {
  asin: string;
  snapshots: PriceSnapshot[];
  currency: string;
  lowestPriceCents: number;
  highestPriceCents: number;
  averagePriceCents: number;
  priceTrend: "rising" | "stable" | "falling";
};

export interface PriceHistoryProvider {
  getPriceHistory(asin: string, limit?: number): Promise<PriceHistory>;
}
