import { randomUUID } from "node:crypto";
import {
  buildMockProductSignal,
  defaultProductIntelligenceConnectorRegistry,
  fetchAndAggregateProductSignals,
  PRODUCT_INTELLIGENCE_PROVIDER_IDS,
  supplierAvailabilityFromSignals,
  type ProductIntelligenceConnectorRegistry,
} from "../connectors/index.js";
import { PIE_MOCK_EVALUATIONS } from "./mock-samples.js";
import { evaluateProduct, productIntelligenceEvaluationEngine } from "./product-intelligence-engine.js";
import {
  productIntelligenceCatalogRepository,
  type ProductIntelligenceCatalogRecord,
} from "./catalog-repository.js";
import type { ProductIntelligenceEvaluation } from "./types.js";

export type EvaluateProductRequest = {
  productTitle: string;
  category: string;
  productId?: string;
  persist?: boolean;
};

export type ProductIntelligenceDetail = ProductIntelligenceCatalogRecord & {
  signals: ReturnType<typeof productIntelligenceCatalogRepository.listSignals>;
  evaluation: ProductIntelligenceEvaluation;
};

function scopedCatalogId(workspaceId: string, index: number): string {
  return `${workspaceId}__pie-catalog-${index + 1}`;
}

function toCatalogRecord(
  workspaceId: string,
  productId: string,
  evaluation: ProductIntelligenceEvaluation,
  supplierAvailability: ProductIntelligenceCatalogRecord["supplierAvailability"],
  providerCount: number,
  existing?: ProductIntelligenceCatalogRecord,
): ProductIntelligenceCatalogRecord {
  const now = new Date().toISOString();
  return {
    id: productId,
    workspaceId,
    productName: evaluation.productTitle,
    category: evaluation.category,
    demandScore: evaluation.demandScore,
    competitionScore: evaluation.competitionScore,
    marginScore: evaluation.marginScore,
    supplierAvailability,
    trendDirection: evaluation.overallScore >= 70 ? "rising" : evaluation.overallScore >= 45 ? "stable" : "falling",
    confidence: evaluation.confidence,
    recommendation: evaluation.recommendation,
    overallScore: evaluation.overallScore,
    explanation: evaluation.explanation,
    providerCount,
    evaluatedAt: evaluation.evaluatedAt,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export class ProductIntelligenceService {
  constructor(
    private readonly connectorRegistry: ProductIntelligenceConnectorRegistry = defaultProductIntelligenceConnectorRegistry,
  ) {}

  listProducts(workspaceId: string, limit = 50): ProductIntelligenceCatalogRecord[] {
    return productIntelligenceCatalogRepository.listByWorkspace(workspaceId, limit);
  }

  getProduct(workspaceId: string, productId: string): ProductIntelligenceDetail | undefined {
    const catalog = productIntelligenceCatalogRepository.getById(workspaceId, productId);
    if (!catalog) return undefined;

    const signals = productIntelligenceCatalogRepository.listSignals(productId, workspaceId);
    const evaluation = this.reconstructEvaluation(catalog);

    return { ...catalog, signals, evaluation };
  }

  async evaluateFromConnectors(
    workspaceId: string,
    request: EvaluateProductRequest,
  ): Promise<ProductIntelligenceDetail> {
    const productId = request.productId ?? randomUUID();
    const correlationId = randomUUID();

    const aggregated = await fetchAndAggregateProductSignals(
      this.connectorRegistry,
      { workspaceId, correlationId },
      { productTitle: request.productTitle, category: request.category },
      productId,
    );

    const evaluation = evaluateProduct(aggregated.input);
    const existing = productIntelligenceCatalogRepository.getById(workspaceId, productId);
    const catalog = toCatalogRecord(
      workspaceId,
      productId,
      evaluation,
      aggregated.supplierAvailability,
      aggregated.providerCount,
      existing,
    );

    catalog.trendDirection = aggregated.input.historicalDemand.trendDirection;

    if (request.persist !== false) {
      productIntelligenceCatalogRepository.upsertCatalog(catalog);
      productIntelligenceCatalogRepository.replaceSignals(
        productId,
        workspaceId,
        aggregated.signals,
      );
      productIntelligenceEvaluationEngine.persist(evaluation, workspaceId, productId);
    }

    return {
      ...catalog,
      signals: request.persist !== false
        ? productIntelligenceCatalogRepository.listSignals(productId, workspaceId)
        : aggregated.signals.map((signal) => ({
            id: randomUUID(),
            catalogId: productId,
            workspaceId,
            providerId: signal.providerId,
            providerName: signal.providerName,
            signal,
            fetchedAt: signal.fetchedAt,
          })),
      evaluation,
    };
  }

  seedCatalog(workspaceId: string): number {
    for (let i = 0; i < PIE_MOCK_EVALUATIONS.length; i++) {
      const productId = scopedCatalogId(workspaceId, i);

      const sample = PIE_MOCK_EVALUATIONS[i]!;
      const evaluation = evaluateProduct({ ...sample, workspaceId, productId });
      const signals = PRODUCT_INTELLIGENCE_PROVIDER_IDS.map((providerId) =>
        buildMockProductSignal(
          providerId,
          { workspaceId, correlationId: `seed:${productId}` },
          { productTitle: sample.productTitle, category: sample.category },
        ),
      );
      const supplierAvailability = supplierAvailabilityFromSignals(signals);
      const existing = productIntelligenceCatalogRepository.getById(workspaceId, productId);
      const catalog = toCatalogRecord(
        workspaceId,
        productId,
        evaluation,
        supplierAvailability,
        signals.length,
        existing,
      );
      catalog.trendDirection = sample.historicalDemand.trendDirection;

      productIntelligenceCatalogRepository.upsertCatalog(catalog);
      productIntelligenceCatalogRepository.replaceSignals(productId, workspaceId, signals);
      productIntelligenceEvaluationEngine.persist(evaluation, workspaceId, productId);
    }

    return productIntelligenceCatalogRepository.countByWorkspace(workspaceId);
  }

  async seedCatalogAsync(workspaceId: string): Promise<number> {
    const existing = productIntelligenceCatalogRepository.countByWorkspace(workspaceId);
    if (existing > 0) return existing;

    for (let i = 0; i < PIE_MOCK_EVALUATIONS.length; i++) {
      const sample = PIE_MOCK_EVALUATIONS[i]!;
      await this.evaluateFromConnectors(workspaceId, {
        productTitle: sample.productTitle,
        category: sample.category,
        productId: scopedCatalogId(workspaceId, i),
        persist: true,
      });
    }

    return productIntelligenceCatalogRepository.countByWorkspace(workspaceId);
  }

  viewStats(workspaceId: string) {
    return productIntelligenceCatalogRepository.statsForWorkspace(workspaceId);
  }

  private reconstructEvaluation(
    catalog: ProductIntelligenceCatalogRecord,
  ): ProductIntelligenceEvaluation {
    return {
      productTitle: catalog.productName,
      category: catalog.category,
      demandScore: catalog.demandScore,
      competitionScore: catalog.competitionScore,
      marginScore: catalog.marginScore,
      shippingScore: 0,
      supplierReliability: 0,
      overallScore: catalog.overallScore,
      recommendation: catalog.recommendation,
      explanation: catalog.explanation,
      confidence: catalog.confidence,
      evaluatedAt: catalog.evaluatedAt,
    };
  }
}

export const productIntelligenceService = new ProductIntelligenceService();

export function formatDemandLabel(score: number): string {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export function formatMarginPct(score: number): string {
  return `${score.toFixed(0)}% est.`;
}

export function formatTrendLabel(direction: string): string {
  switch (direction) {
    case "rising":
      return "Rising";
    case "falling":
      return "Falling";
    default:
      return "Stable";
  }
}

export function formatRecommendationLabel(
  recommendation: ProductIntelligenceCatalogRecord["recommendation"],
): string {
  switch (recommendation) {
    case "SELL":
      return "Sell";
    case "DO_NOT_SELL":
      return "Do Not Sell";
    default:
      return "Review";
  }
}

export function formatSupplierAvailability(
  availability: ProductIntelligenceCatalogRecord["supplierAvailability"],
): string {
  return availability.charAt(0).toUpperCase() + availability.slice(1);
}
