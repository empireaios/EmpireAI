/** R2-19 — Supplier Evaluation Engine. */

import type { SupplierRankingRecord } from "../supplier-ranking-engine/types.js";
import type { SupplierRiskRecord } from "../supplier-risk-monitor/types.js";
import type { ProcurementIntelligenceConfiguration } from "./configuration.js";
import type { SupportedSupplierIdentifier } from "./types.js";
import { SUPPORTED_SUPPLIER_IDENTIFIERS } from "./paths.js";

export class SupplierEvaluationEngine {
  evaluateSuppliers(
    rankings: SupplierRankingRecord[],
    risks: SupplierRiskRecord[],
    config: ProcurementIntelligenceConfiguration,
  ): { supplierId: SupportedSupplierIdentifier; score: number }[] {
    if (!config.supplierEvaluationRulesEnabled) {
      return SUPPORTED_SUPPLIER_IDENTIFIERS.map((id) => ({ supplierId: id, score: 50 }));
    }

    return SUPPORTED_SUPPLIER_IDENTIFIERS.map((supplierId) => {
      const ranking = rankings.find((r) => r.supplierId === supplierId);
      const risk = risks.find((r) => r.supplierId === supplierId);
      const rankingScore = ranking?.overallSupplierScore ?? 50;
      const riskPenalty = risk ? risk.riskScore * 0.3 : 0;
      const healthBonus = risk ? risk.supplierHealthScore * 0.2 : 10;
      const score = Math.max(0, Math.min(100, Math.round(rankingScore - riskPenalty + healthBonus * 0.1)));
      return { supplierId, score };
    }).sort((a, b) => b.score - a.score);
  }

  selectOptimalSupplier(
    evaluations: { supplierId: SupportedSupplierIdentifier; score: number }[],
  ): SupportedSupplierIdentifier {
    return evaluations[0]?.supplierId ?? SUPPORTED_SUPPLIER_IDENTIFIERS[0]!;
  }
}
