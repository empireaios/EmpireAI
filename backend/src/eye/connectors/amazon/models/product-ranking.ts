/** Bestseller and category ranking signals derived from Amazon listings. */

export type ProductRanking = {
  asin: string;
  bestsellerRank: number | null;
  categoryRank: number | null;
  categoryPath: string[];
  estimatedPopularityScore: number;
  rankTrend: "rising" | "stable" | "falling";
  observedAt: string;
};
