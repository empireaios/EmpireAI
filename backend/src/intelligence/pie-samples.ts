import type { PieScoreInput } from "./pie-engine.js";
import type { PieScoreDimension } from "./types.js";

/** Sample product signals for mock PIE scoring — no live connector data required. */
export const PIE_SAMPLE_PRODUCTS: Array<{
  productId: string;
  productName: string;
  signals: Partial<Record<PieScoreDimension, { score: number; evidence: string[] }>>;
}> = [
  {
    productId: "prod-portable-blender",
    productName: "Portable USB Blender",
    signals: {
      demand: { score: 88, evidence: ["Google Trends index 78", "Seasonal peak Q2-Q3"] },
      competition: { score: 62, evidence: ["12 active competitors on Amazon", "Moderate ad saturation"] },
      margin: { score: 74, evidence: ["Unit cost $8.50", "Retail price $29.99", "Margin ~72%"] },
      shipping: { score: 81, evidence: ["Avg ship 8 days via CJ", "Lightweight under 500g"] },
      supplierReliability: { score: 85, evidence: ["CJ reliability 82/100", "Low defect rate"] },
      adDifficulty: { score: 58, evidence: ["CPM rising on Meta", "Creative fatigue risk"] },
      refundRisk: { score: 22, evidence: ["Low return rate category", "Durable goods profile"] },
    },
  },
  {
    productId: "prod-posture-corrector",
    productName: "Posture Corrector Brace",
    signals: {
      demand: { score: 71, evidence: ["Steady search volume", "Health/wellness trend"] },
      competition: { score: 45, evidence: ["High competitor count", "Price compression"] },
      margin: { score: 68, evidence: ["Unit cost $4.20", "Retail $19.99"] },
      shipping: { score: 90, evidence: ["Flat envelope shipping", "3-5 day US fulfillment"] },
      supplierReliability: { score: 91, evidence: ["Spocket US supplier 91/100"] },
      adDifficulty: { score: 72, evidence: ["Health claims restrictions", "Policy review required"] },
      refundRisk: { score: 38, evidence: ["Sizing-related returns common"] },
    },
  },
  {
    productId: "prod-pet-hair-remover",
    productName: "Pet Hair Remover Roller",
    signals: {
      demand: { score: 92, evidence: ["Viral TikTok potential", "Pet owner TAM large"] },
      competition: { score: 55, evidence: ["Many generic listings", "Brand differentiation possible"] },
      margin: { score: 80, evidence: ["Unit cost $2.10", "Retail $14.99"] },
      shipping: { score: 86, evidence: ["Compact packaging", "Multi-warehouse available"] },
      supplierReliability: { score: 78, evidence: ["AliExpress direct 71/100 — backup CJ available"] },
      adDifficulty: { score: 42, evidence: ["UGC-friendly product", "Low CPM pet niche"] },
      refundRisk: { score: 15, evidence: ["Simple product", "Minimal defect risk"] },
    },
  },
];

export function buildSamplePieInput(
  workspaceId: string,
  sampleIndex = 0,
): PieScoreInput {
  const sample = PIE_SAMPLE_PRODUCTS[sampleIndex % PIE_SAMPLE_PRODUCTS.length];
  if (!sample) {
    throw new Error("No PIE sample products configured");
  }
  return {
    workspaceId,
    productId: sample.productId,
    productName: sample.productName,
    signals: sample.signals,
  };
}
