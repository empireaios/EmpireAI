/** R2-09 — Supplier Selection Engine. */

import type { SupplierInventoryRecord } from "../supplier-inventory-sync/types.js";
import type { SupplierPricingRecord } from "../supplier-pricing-engine/types.js";
import type { SupplierRankingRecord } from "../supplier-ranking-engine/types.js";
import type { SupplierSelectionResult } from "./types.js";
import type { ProcurementEngineConfiguration } from "./configuration.js";

export type SupplierCandidate = {
  supplierId: string;
  supplierProductId: string;
  rankingScore: number;
  rankingPosition: number;
  unitCost: number;
  availableQuantity: number;
  inStock: boolean;
};

export class SupplierSelectionEngine {
  buildCandidates(input: {
    productReference: string;
    rankings: SupplierRankingRecord[];
    pricing: SupplierPricingRecord[];
    inventory: SupplierInventoryRecord[];
  }): SupplierCandidate[] {
    const candidates: SupplierCandidate[] = [];

    for (const ranking of input.rankings) {
      const price = input.pricing.find(
        (p) =>
          p.supplierId === ranking.supplierId &&
          (p.supplierProductId === input.productReference ||
            p.internalProductId === input.productReference),
      );
      const inv = input.inventory.find(
        (i) =>
          i.supplierId === ranking.supplierId &&
          (i.supplierProductId === input.productReference ||
            i.internalProductId === input.productReference),
      );

      if (!price) continue;

      const availableQuantity = inv?.currentStockQuantity ?? 0;
      const inStock = inv?.stockAvailabilityStatus === "in_stock";

      candidates.push({
        supplierId: ranking.supplierId,
        supplierProductId: price.supplierProductId,
        rankingScore: ranking.overallSupplierScore,
        rankingPosition: ranking.rankingPosition,
        unitCost: price.currentSupplierPrice,
        availableQuantity,
        inStock,
      });
    }

    return candidates;
  }

  selectOptimalSupplier(input: {
    productReference: string;
    rankings: SupplierRankingRecord[];
    pricing: SupplierPricingRecord[];
    inventory: SupplierInventoryRecord[];
    preferredSupplierId?: string;
    config: ProcurementEngineConfiguration;
  }): SupplierSelectionResult | null {
    if (!input.config.supplierSelectionRulesEnabled) return null;

    const candidates = this.buildCandidates({
      productReference: input.productReference,
      rankings: input.rankings,
      pricing: input.pricing,
      inventory: input.inventory,
    });

    if (!candidates.length) return null;

    const inStockCandidates = candidates.filter((c) => c.inStock && c.availableQuantity > 0);
    const pool = inStockCandidates.length ? inStockCandidates : candidates;

    if (input.preferredSupplierId) {
      const preferred = pool.find((c) => c.supplierId === input.preferredSupplierId);
      if (preferred) {
        return this.toSelectionResult(preferred, "Preferred supplier with available inventory");
      }
    }

    const sorted = [...pool].sort((a, b) => {
      if (a.rankingPosition !== b.rankingPosition) return a.rankingPosition - b.rankingPosition;
      return a.unitCost - b.unitCost;
    });

    const best = sorted[0]!;
    return this.toSelectionResult(
      best,
      `Optimal supplier: rank #${best.rankingPosition}, score ${best.rankingScore}, cost ${best.unitCost}`,
    );
  }

  private toSelectionResult(
    candidate: SupplierCandidate,
    reason: string,
  ): SupplierSelectionResult {
    return {
      selectionId: `pce-sel-${candidate.supplierId}-${Date.now()}`,
      selectedSupplierId: candidate.supplierId,
      supplierProductId: candidate.supplierProductId,
      rankingScore: candidate.rankingScore,
      unitCost: candidate.unitCost,
      availableQuantity: candidate.availableQuantity,
      selectionReason: reason,
    };
  }
}
