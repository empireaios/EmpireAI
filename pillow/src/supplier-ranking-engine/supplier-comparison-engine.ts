/** R2-08 — Supplier Comparison Engine. */

import type { SupplierRankingRecord } from "./types.js";
import { SRE_METADATA_VERSION } from "./paths.js";
import type { ComponentScores } from "./supplier-scoring-engine.js";

export class SupplierComparisonEngine {
  buildRankingRecords(
    scores: Array<{ supplierId: string; components: ComponentScores }>,
  ): SupplierRankingRecord[] {
    const sorted = [...scores].sort(
      (a, b) => b.components.overallSupplierScore - a.components.overallSupplierScore,
    );

    return sorted.map((entry, index) => ({
      rankingRecordId: `sre-${entry.supplierId}`,
      supplierId: entry.supplierId,
      overallSupplierScore: entry.components.overallSupplierScore,
      qualityScore: entry.components.qualityScore,
      pricingScore: entry.components.pricingScore,
      inventoryReliabilityScore: entry.components.inventoryReliabilityScore,
      fulfilmentReliabilityScore: entry.components.fulfilmentReliabilityScore,
      responsivenessScore: entry.components.responsivenessScore,
      rankingPosition: index + 1,
      validationStatus: "pending" as const,
      metadataVersion: SRE_METADATA_VERSION,
    }));
  }
}
