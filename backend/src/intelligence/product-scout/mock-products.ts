import type { ProductScoutScoreInput } from "./types.js";

/** Extended mock catalog for AI Product Scout — wraps PIE samples with trend/brandability signals. */
export const SCOUT_MOCK_PRODUCTS: Array<{
  productId: string;
  productName: string;
  category: string;
  signals: NonNullable<ProductScoutScoreInput["signals"]>;
}> = [
  {
    productId: "prod-portable-blender",
    productName: "Portable USB Blender",
    category: "kitchen",
    signals: {
      demand: { score: 88, evidence: ["Google Trends index 78", "Seasonal peak Q2-Q3"] },
      competition: { score: 62, evidence: ["12 active competitors on Amazon"] },
      margin: { score: 74, evidence: ["Unit cost $8.50", "Retail $29.99"] },
      shipping: { score: 81, evidence: ["Avg ship 8 days via CJ"] },
      supplierReliability: { score: 85, evidence: ["CJ reliability 82/100"] },
      adDifficulty: { score: 58, evidence: ["CPM rising on Meta"] },
      refundRisk: { score: 22, evidence: ["Low return rate category"] },
      trend: { score: 76, evidence: ["Upward search trend", "Social UGC momentum"] },
      brandability: { score: 68, evidence: ["Moderate differentiation potential"] },
    },
  },
  {
    productId: "prod-posture-corrector",
    productName: "Posture Corrector Brace",
    category: "health",
    signals: {
      demand: { score: 71, evidence: ["Steady search volume"] },
      competition: { score: 45, evidence: ["High competitor count"] },
      margin: { score: 68, evidence: ["Unit cost $4.20", "Retail $19.99"] },
      shipping: { score: 90, evidence: ["Flat envelope shipping"] },
      supplierReliability: { score: 91, evidence: ["Spocket US supplier 91/100"] },
      adDifficulty: { score: 72, evidence: ["Health claims restrictions"] },
      refundRisk: { score: 38, evidence: ["Sizing-related returns common"] },
      trend: { score: 64, evidence: ["Stable wellness niche"] },
      brandability: { score: 55, evidence: ["Commodity appearance"] },
    },
  },
  {
    productId: "prod-pet-hair-remover",
    productName: "Pet Hair Remover Roller",
    category: "pets",
    signals: {
      demand: { score: 92, evidence: ["Viral TikTok potential"] },
      competition: { score: 55, evidence: ["Many generic listings"] },
      margin: { score: 80, evidence: ["Unit cost $2.10", "Retail $14.99"] },
      shipping: { score: 86, evidence: ["Compact packaging"] },
      supplierReliability: { score: 78, evidence: ["AliExpress direct — backup CJ available"] },
      adDifficulty: { score: 42, evidence: ["UGC-friendly product"] },
      refundRisk: { score: 15, evidence: ["Simple product", "Minimal defect risk"] },
      trend: { score: 88, evidence: ["Pet content viral cycle", "High shareability"] },
      brandability: { score: 82, evidence: ["Strong lifestyle branding angle"] },
    },
  },
  {
    productId: "prod-mystery-gadget",
    productName: "Generic LED Strip Kit",
    category: "electronics",
    signals: {
      demand: { score: 48, evidence: ["Declining search interest"] },
      competition: { score: 28, evidence: ["Saturated marketplace"] },
      margin: { score: 32, evidence: ["Unit cost $12", "Retail $15.99"] },
      shipping: { score: 70, evidence: ["Standard parcel shipping"] },
      supplierReliability: { score: 42, evidence: ["Unverified supplier", "High defect reports"] },
      adDifficulty: { score: 78, evidence: ["Crowded ad auctions", "Low CTR category"] },
      refundRisk: { score: 82, evidence: ["Electronics defect rate high", "Chargeback risk"] },
      trend: { score: 35, evidence: ["Downward trend"] },
      brandability: { score: 30, evidence: ["No differentiation"] },
    },
  },
  {
    productId: "prod-eco-bottle",
    productName: "Insulated Eco Water Bottle",
    category: "lifestyle",
    signals: {
      demand: { score: 79, evidence: ["Sustainability trend"] },
      competition: { score: 58, evidence: ["Established brands present"] },
      margin: { score: 62, evidence: ["Unit cost $6.50", "Retail $24.99"] },
      shipping: { score: 84, evidence: ["Durable packaging"] },
      supplierReliability: { score: 88, evidence: ["Verified US warehouse supplier"] },
      adDifficulty: { score: 52, evidence: ["Moderate CPM"] },
      refundRisk: { score: 28, evidence: ["Low defect rate"] },
      trend: { score: 81, evidence: ["Eco-conscious consumer growth"] },
      brandability: { score: 90, evidence: ["Strong brand story potential"] },
    },
  },
];

export function buildScoutInput(
  workspaceId: string,
  productIdOrIndex?: string | number,
): ProductScoutScoreInput {
  if (typeof productIdOrIndex === "string") {
    const match = SCOUT_MOCK_PRODUCTS.find((p) => p.productId === productIdOrIndex);
    if (!match) {
      throw new Error(`Unknown scout product: ${productIdOrIndex}`);
    }
    return {
      workspaceId,
      productId: match.productId,
      productName: match.productName,
      signals: match.signals,
    };
  }

  const index = typeof productIdOrIndex === "number" ? productIdOrIndex : 0;
  const sample = SCOUT_MOCK_PRODUCTS[index % SCOUT_MOCK_PRODUCTS.length];
  if (!sample) {
    throw new Error("No scout mock products configured");
  }
  return {
    workspaceId,
    productId: sample.productId,
    productName: sample.productName,
    signals: sample.signals,
  };
}

export function listScoutCatalog(): Array<{
  productId: string;
  productName: string;
  category: string;
}> {
  return SCOUT_MOCK_PRODUCTS.map(({ productId, productName, category }) => ({
    productId,
    productName,
    category,
  }));
}
