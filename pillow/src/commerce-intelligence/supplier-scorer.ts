import type { SupplierProfile, SupplierRanking } from "./types.js";

export function rankSuppliers(suppliers: SupplierProfile[]): SupplierRanking[] {
  return suppliers
    .map((supplier) => {
      const compositeScore = Math.round(
        supplier.reliabilityScore * 0.25 +
        supplier.qualityScore * 0.2 +
        (100 - supplier.returnRatePercent * 5) * 0.15 +
        supplier.communicationScore * 0.1 +
        supplier.capacityScore * 0.1 +
        supplier.stabilityScore * 0.15 +
        (supplier.shippingDaysAvg <= 12 ? 10 : supplier.shippingDaysAvg <= 15 ? 5 : 0),
      );

      const strengths: string[] = [];
      const risks: string[] = [];
      if (supplier.reliabilityScore >= 88) strengths.push("High reliability");
      if (supplier.shippingDaysAvg <= 12) strengths.push("Fast shipping");
      if (supplier.returnRatePercent <= 4) strengths.push("Low return rate");
      if (supplier.returnRatePercent > 5) risks.push("Elevated return rate");
      if (supplier.shippingDaysAvg > 14) risks.push("Slow fulfilment");

      return {
        supplier,
        compositeScore,
        preferred: compositeScore >= 82,
        strengths,
        risks,
      };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);
}

export function findSupplierRanking(
  supplierId: string,
  rankings: SupplierRanking[],
): SupplierRanking | null {
  return rankings.find((r) => r.supplier.id === supplierId) ?? null;
}
