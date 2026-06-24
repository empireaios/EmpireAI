import { randomUUID } from "node:crypto";
import { getDatabase } from "../brain/database.js";
import {
  evaluateSupplier,
  listMockCatalog,
  SIE_MOCK_CATALOG,
} from "./supplier-intelligence-engine/index.js";
import type {
  SupplierCostProfile,
  SupplierIntelligenceScore,
  SupplierRecord,
} from "./supplier-types.js";

/** @deprecated Use SIE_MOCK_CATALOG from supplier-intelligence-engine — preserved for Mission 002 exports. */
export const MOCK_SUPPLIER_CATALOG: SupplierRecord[] = SIE_MOCK_CATALOG.filter(
  (s) => !s.id.startsWith("sup-fake") && !s.id.startsWith("sup-fraud"),
);

export type SupplierScoreInput = {
  workspaceId: string;
  supplierId: string;
  signals?: {
    reliability?: number;
    costEfficiency?: number;
    shippingSpeed?: number;
    catalogDepth?: number;
  };
};

/**
 * Legacy Supplier Intelligence Framework (Mission 002) — thin wrapper over Mission 006 engine.
 * Preserves score()/persist() API for existing foundation and workforce queries.
 */
export class SupplierIntelligenceFramework {
  listCatalog(): SupplierRecord[] {
    return listMockCatalog().filter(
      (s) => !s.id.startsWith("sup-fake") && !s.id.startsWith("sup-fraud"),
    );
  }

  get(supplierId: string): SupplierRecord | undefined {
    return this.listCatalog().find((s) => s.id === supplierId);
  }

  buildCostProfile(supplier: SupplierRecord): SupplierCostProfile {
    const estimatedMonthlyOrders = 200;
    const unitCost = supplier.avgUnitCostCents;
    const shippingPerOrderCents = Math.round(supplier.avgShipDays * 45);
    return {
      supplierId: supplier.id,
      unitCostCents: unitCost,
      shippingPerOrderCents,
      estimatedMonthlyCostCents: (unitCost + shippingPerOrderCents) * estimatedMonthlyOrders,
      marginImpactPct: Math.max(0, Math.round(100 - unitCost / 50)),
      currency: "USD",
    };
  }

  score(input: SupplierScoreInput): SupplierIntelligenceScore {
    const supplier = this.get(input.supplierId);
    if (!supplier) {
      throw new Error(`Unknown supplier: ${input.supplierId}`);
    }

    const evaluation = evaluateSupplier({
      supplierId: input.supplierId,
      workspaceId: input.workspaceId,
      signals: {
        reliability: input.signals?.reliability,
        shipping: input.signals?.shippingSpeed,
        quality: input.signals?.catalogDepth,
        pricing: input.signals?.costEfficiency,
      },
    });

    const signals = input.signals ?? {};
    const reliability = signals.reliability ?? evaluation.reliabilityScore;
    const costEfficiency = signals.costEfficiency ?? evaluation.pricingScore;
    const shippingSpeed = signals.shippingSpeed ?? evaluation.shippingScore;
    const catalogDepth = signals.catalogDepth ?? evaluation.qualityScore;

    const compositeScore = Math.round(
      reliability * 0.35 + costEfficiency * 0.25 + shippingSpeed * 0.2 + catalogDepth * 0.2,
    );

    const why: string[] = [
      evaluation.explanation,
      `Reliability (${reliability}/100): ${supplier.name} historical fulfillment rate`,
      `Cost efficiency (${costEfficiency}/100): avg unit cost $${(supplier.avgUnitCostCents / 100).toFixed(2)}`,
      `Shipping speed (${shippingSpeed}/100): avg ${supplier.avgShipDays} days to deliver`,
      `Catalog depth (${catalogDepth}/100): ${supplier.productCount} products available`,
    ];

    const recommendation =
      evaluation.overallRecommendation === "SELL"
        ? compositeScore >= 85
          ? "preferred"
          : "approved"
        : evaluation.overallRecommendation === "REVIEW"
          ? "conditional"
          : "avoid";

    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      workspaceId: input.workspaceId,
      reliabilityScore: reliability,
      costEfficiencyScore: costEfficiency,
      shippingSpeedScore: shippingSpeed,
      catalogDepthScore: catalogDepth,
      compositeScore,
      costProfile: this.buildCostProfile(supplier),
      recommendation,
      why,
      scoredAt: new Date().toISOString(),
    };
  }

  persist(score: SupplierIntelligenceScore): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO supplier_intelligence_scores
        (id, workspace_id, supplier_id, supplier_name, scores, recommendation, rationale, created_at)
       VALUES (@id, @workspaceId, @supplierId, @supplierName, @scores, @recommendation, @rationale, @createdAt)`,
    ).run({
      id: randomUUID(),
      workspaceId: score.workspaceId,
      supplierId: score.supplierId,
      supplierName: score.supplierName,
      scores: JSON.stringify({
        reliability: score.reliabilityScore,
        costEfficiency: score.costEfficiencyScore,
        shippingSpeed: score.shippingSpeedScore,
        catalogDepth: score.catalogDepthScore,
        composite: score.compositeScore,
        costProfile: score.costProfile,
      }),
      recommendation: score.recommendation,
      rationale: JSON.stringify(score.why),
      createdAt: score.scoredAt,
    });
  }
}

export const supplierIntelligenceFramework = new SupplierIntelligenceFramework();
