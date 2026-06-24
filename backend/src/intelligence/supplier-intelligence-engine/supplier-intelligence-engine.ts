import { randomUUID } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import { getMockSupplier, listMockCatalog } from "./mock-catalog.js";
import { deriveSupplierRecommendation } from "./recommendation-engine.js";
import { computeAllScores, computeConfidence } from "./score-computers.js";
import { supplierIntelligenceGuard } from "./supplier-guard.js";
import type {
  SupplierComparison,
  SupplierDiscoveryFilters,
  SupplierDiscoveryResult,
  SupplierEvaluation,
  SupplierEvaluationInput,
} from "./types.js";

/**
 * Supplier Intelligence Engine (Mission 006) — standalone supplier evaluation service.
 * Distinct from legacy SupplierIntelligenceFramework (Mission 002 scoring) while preserving exports.
 */
export class SupplierIntelligenceEvaluationEngine {
  discoverSuppliers(
    workspaceId: string,
    filters: SupplierDiscoveryFilters = {},
  ): SupplierDiscoveryResult {
    let suppliers = listMockCatalog();

    if (filters.region) {
      suppliers = suppliers.filter((s) => s.region === filters.region);
    }
    if (filters.maxShipDays !== undefined) {
      suppliers = suppliers.filter((s) => s.avgShipDays <= filters.maxShipDays!);
    }
    if (filters.minReliability !== undefined) {
      suppliers = suppliers.filter((s) => s.reliabilityScore >= filters.minReliability!);
    }
    if (filters.minProductCount !== undefined) {
      suppliers = suppliers.filter((s) => s.productCount >= filters.minProductCount!);
    }
    if (filters.excludeFakeRiskAbove !== undefined) {
      suppliers = suppliers.filter((s) => {
        const evaluation = this.evaluateSupplier({ supplierId: s.id, workspaceId });
        return evaluation.fakeSupplierRisk <= filters.excludeFakeRiskAbove!;
      });
    }

    return {
      workspaceId,
      filters,
      suppliers,
      count: suppliers.length,
      discoveredAt: new Date().toISOString(),
    };
  }

  evaluateSupplier(input: SupplierEvaluationInput): SupplierEvaluation {
    const supplier = getMockSupplier(input.supplierId);
    if (!supplier) {
      throw new Error(`Unknown supplier: ${input.supplierId}`);
    }

    const scores = computeAllScores(supplier, input);
    const confidence = computeConfidence(supplier, input);
    const guardianVerdict = supplierIntelligenceGuard.assess(scores, supplier.verified);
    const { overallRecommendation, explanation } = deriveSupplierRecommendation({
      supplierName: supplier.name,
      scores,
      guardianVerdict,
    });

    return {
      ...scores,
      supplierId: supplier.id,
      supplierName: supplier.name,
      overallRecommendation,
      explanation,
      confidence,
      guardianVerdict,
      evaluatedAt: new Date().toISOString(),
    };
  }

  compareSuppliers(
    workspaceId: string,
    supplierIds: string[],
    options?: { sellingPriceCents?: number; productCategory?: string },
  ): SupplierComparison {
    const evaluations = supplierIds.map((supplierId) =>
      this.evaluateSupplier({
        supplierId,
        workspaceId,
        sellingPriceCents: options?.sellingPriceCents,
        productCategory: options?.productCategory,
      }),
    );

    const ranking = [...evaluations]
      .sort((a, b) => {
        if (a.overallRecommendation === "REJECT" && b.overallRecommendation !== "REJECT") return 1;
        if (b.overallRecommendation === "REJECT" && a.overallRecommendation !== "REJECT") return -1;
        return b.trustScore - a.trustScore;
      })
      .map((e) => e.supplierId);

    const viable = evaluations.filter((e) => e.overallRecommendation !== "REJECT");
    const best = viable.sort((a, b) => b.trustScore - a.trustScore)[0] ?? null;

    const explanation =
      best !== null
        ? `Best supplier: ${best.supplierName} (trust ${best.trustScore}/100, ${best.overallRecommendation}). Compared ${evaluations.length} supplier(s).`
        : `No viable suppliers among ${evaluations.length} compared — all rejected by Guardian or recommendation engine.`;

    return {
      workspaceId,
      supplierIds,
      evaluations,
      ranking,
      bestSupplierId: best?.supplierId ?? null,
      explanation,
      comparedAt: new Date().toISOString(),
    };
  }

  persist(evaluation: SupplierEvaluation, workspaceId: string): void {
    const db = getDatabase();
    const existing = db
      .prepare(
        `SELECT id FROM supplier_intelligence_evaluations
         WHERE workspace_id = @workspaceId AND supplier_id = @supplierId`,
      )
      .get({ workspaceId, supplierId: evaluation.supplierId }) as { id: string } | undefined;

    const scoresJson = JSON.stringify({
      qualityScore: evaluation.qualityScore,
      shippingScore: evaluation.shippingScore,
      reliabilityScore: evaluation.reliabilityScore,
      pricingScore: evaluation.pricingScore,
      profitMarginEstimate: evaluation.profitMarginEstimate,
      trustScore: evaluation.trustScore,
    });

    if (existing) {
      db.prepare(
        `UPDATE supplier_intelligence_evaluations SET
          supplier_name = @supplierName,
          scores = @scores,
          trust_score = @trustScore,
          overall_recommendation = @overallRecommendation,
          explanation = @explanation,
          confidence = @confidence,
          fake_supplier_risk = @fakeSupplierRisk,
          guardian_verdict = @guardianVerdict,
          created_at = @createdAt
         WHERE id = @id`,
      ).run({
        id: existing.id,
        supplierName: evaluation.supplierName,
        scores: scoresJson,
        trustScore: evaluation.trustScore,
        overallRecommendation: evaluation.overallRecommendation,
        explanation: evaluation.explanation,
        confidence: evaluation.confidence,
        fakeSupplierRisk: evaluation.fakeSupplierRisk,
        guardianVerdict: JSON.stringify(evaluation.guardianVerdict),
        createdAt: evaluation.evaluatedAt,
      });
      return;
    }

    db.prepare(
      `INSERT INTO supplier_intelligence_evaluations
        (id, workspace_id, supplier_id, supplier_name, scores, trust_score, overall_recommendation,
         explanation, confidence, fake_supplier_risk, guardian_verdict, created_at)
       VALUES (@id, @workspaceId, @supplierId, @supplierName, @scores, @trustScore, @overallRecommendation,
         @explanation, @confidence, @fakeSupplierRisk, @guardianVerdict, @createdAt)`,
    ).run({
      id: randomUUID(),
      workspaceId,
      supplierId: evaluation.supplierId,
      supplierName: evaluation.supplierName,
      scores: scoresJson,
      trustScore: evaluation.trustScore,
      overallRecommendation: evaluation.overallRecommendation,
      explanation: evaluation.explanation,
      confidence: evaluation.confidence,
      fakeSupplierRisk: evaluation.fakeSupplierRisk,
      guardianVerdict: JSON.stringify(evaluation.guardianVerdict),
      createdAt: evaluation.evaluatedAt,
    });
  }
}

export const supplierIntelligenceEvaluationEngine = new SupplierIntelligenceEvaluationEngine();

export const evaluateSupplier = (input: SupplierEvaluationInput): SupplierEvaluation =>
  supplierIntelligenceEvaluationEngine.evaluateSupplier(input);

export const compareSuppliers = (
  workspaceId: string,
  supplierIds: string[],
  options?: { sellingPriceCents?: number; productCategory?: string },
): SupplierComparison =>
  supplierIntelligenceEvaluationEngine.compareSuppliers(workspaceId, supplierIds, options);

export const discoverSuppliers = (
  workspaceId: string,
  filters?: SupplierDiscoveryFilters,
): SupplierDiscoveryResult =>
  supplierIntelligenceEvaluationEngine.discoverSuppliers(workspaceId, filters);
