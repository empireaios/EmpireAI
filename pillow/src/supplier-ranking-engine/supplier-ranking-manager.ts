/** R2-08 — Supplier Ranking Manager. */

import type { SupplierProductSyncEngine } from "../supplier-product-sync/engine.js";
import type { SupplierInventorySyncEngine } from "../supplier-inventory-sync/engine.js";
import type { SupplierPricingEngine } from "../supplier-pricing-engine/engine.js";
import { appendSreLog } from "./sre-logging.js";
import { SupplierScoringEngine } from "./supplier-scoring-engine.js";
import { SupplierPerformanceAnalyzer } from "./supplier-performance-analyzer.js";
import { SupplierComparisonEngine } from "./supplier-comparison-engine.js";
import { RankingValidationEngine } from "./ranking-validation-engine.js";
import { RankingValidator } from "./ranking-validator.js";
import { RankingMetadataGenerator } from "./ranking-metadata-generator.js";
import {
  getFixtureForSupplier,
  getFixtureMetrics,
  getPerformanceFixtures,
} from "./supplier-ranking-fixtures.js";
import { SUPPORTED_SUPPLIER_IDENTIFIERS } from "./paths.js";
import type { SupplierRankingEngineConfiguration } from "./configuration.js";
import type {
  EvaluateSupplierInput,
  RankSuppliersInput,
  SupplierMetricsSnapshot,
  SupplierRankingRecord,
  SupplierRankingReport,
} from "./types.js";

export class SupplierRankingManager {
  private rankings: SupplierRankingRecord[] = [];
  private readonly scoringEngine = new SupplierScoringEngine();
  private readonly performanceAnalyzer = new SupplierPerformanceAnalyzer();
  private readonly comparisonEngine = new SupplierComparisonEngine();
  private readonly validationEngine = new RankingValidationEngine();
  private readonly validator = new RankingValidator();
  private readonly metadataGenerator = new RankingMetadataGenerator();

  constructor(
    private readonly productSync: SupplierProductSyncEngine | null,
    private readonly inventorySync: SupplierInventorySyncEngine | null,
    private readonly pricingEngine: SupplierPricingEngine | null,
  ) {}

  getRankings(): SupplierRankingRecord[] {
    return [...this.rankings];
  }

  buildMetricsFromUpstream(): SupplierMetricsSnapshot[] {
    const catalog = this.productSync?.getCatalog() ?? [];
    const inventory = this.inventorySync?.getInventory() ?? [];
    const pricing = this.pricingEngine?.getPricing() ?? [];

    return SUPPORTED_SUPPLIER_IDENTIFIERS.map((supplierId) => {
      const products = catalog.filter((p) => p.supplierId === supplierId);
      const inv = inventory.filter((i) => i.supplierId === supplierId);
      const prices = pricing.filter((p) => p.supplierId === supplierId);

      const inStockCount = inv.filter(
        (i) => i.stockAvailabilityStatus === "in_stock",
      ).length;
      const outOfStockCount = inv.filter(
        (i) =>
          i.stockAvailabilityStatus === "out_of_stock" ||
          i.stockAvailabilityStatus === "discontinued",
      ).length;

      const avgPrice =
        prices.length > 0
          ? prices.reduce((s, p) => s + p.currentSupplierPrice, 0) / prices.length
          : 0;

      const anomalyCount = prices.filter(
        (p) =>
          p.priceChangePercentage !== null &&
          Math.abs(p.priceChangePercentage) >= 50,
      ).length;

      const stabilityScores = prices.map((p) => {
        if (p.priceChangePercentage === null) return 90;
        const abs = Math.abs(p.priceChangePercentage);
        return Math.max(0, 100 - abs * 2);
      });
      const priceStabilityScore =
        stabilityScores.length > 0
          ? Math.round(
              stabilityScores.reduce((s, v) => s + v, 0) / stabilityScores.length,
            )
          : 75;

      const responseTimeMs =
        supplierId === "cj-dropshipping" ? 800 : supplierId === "aliexpress" ? 1200 : 1500;

      return {
        supplierId,
        productCount: products.length,
        activeProductCount: products.filter((p) => p.productStatus === "active").length,
        inStockCount,
        outOfStockCount,
        averagePrice: Math.round(avgPrice * 100) / 100,
        priceAnomalyCount: anomalyCount,
        priceStabilityScore,
        responseTimeMs,
      };
    });
  }

  resolveMetrics(input: RankSuppliersInput): SupplierMetricsSnapshot[] {
    if (input.performanceFixtureMode && input.performanceFixtureMode !== "none") {
      return getPerformanceFixtures(input.performanceFixtureMode);
    }

    const upstream = this.buildMetricsFromUpstream();
    const hasData = upstream.some((m) => m.productCount > 0);

    if (hasData) {
      if (input.supplierId) {
        return upstream.filter((m) => m.supplierId === input.supplierId);
      }
      return upstream;
    }

    if (input.supplierId) {
      return getFixtureForSupplier(input.supplierId);
    }

    if (input.includeFixtureMetrics !== false) {
      return getFixtureMetrics();
    }

    return [];
  }

  rankSuppliers(
    input: RankSuppliersInput,
    config: SupplierRankingEngineConfiguration,
  ): SupplierRankingReport {
    const started = Date.now();
    const metrics = this.resolveMetrics(input);
    const invalidRecords = this.validationEngine.detectInvalidMetrics(metrics);

    const validMetrics = metrics.filter(
      (m) => !invalidRecords.some((inv) => inv.supplierId === m.supplierId),
    );

    const scoreEntries = validMetrics.map((m) => ({
      supplierId: m.supplierId,
      components: this.scoringEngine.calculateComponentScores(m, config),
    }));

    const rankings = this.comparisonEngine.buildRankingRecords(scoreEntries);
    const findings = this.performanceAnalyzer.analyzePerformance({
      previousRankings: this.rankings,
      currentRankings: rankings,
      config,
    });

    const validation = this.validator.validateRankingResult({
      rankings,
      findings,
      config,
      startedAt: started,
    });

    if (validation.decision === "fail" && config.preserveExistingOnValidationFailure) {
      appendSreLog({
        event: "ranking_validation_failed",
        level: "warn",
        details: `Validation failed — preserving existing rankings (${validation.errors.length} errors)`,
      });
    } else {
      this.rankings = rankings;
    }

    const highPerformers = findings.filter((f) => f.findingType === "high_performing").length;
    const declining = findings.filter((f) => f.findingType === "declining").length;

    appendSreLog({
      event: "ranking_calculation",
      level: validation.decision === "fail" ? "error" : "info",
      details: `Ranked ${validMetrics.length} suppliers — high performers: ${highPerformers}, declining: ${declining}`,
    });

    for (const finding of findings) {
      if (finding.findingType === "high_performing" || finding.findingType === "declining") {
        appendSreLog({
          event: "ranking_change",
          level: finding.findingType === "declining" ? "warn" : "info",
          details: `${finding.findingType} ${finding.supplierId}: ${finding.details}`,
        });
      }
    }

    return this.metadataGenerator.generateRankingReport({
      action: "rank",
      rankings:
        validation.decision === "fail" && config.preserveExistingOnValidationFailure
          ? this.rankings
          : rankings,
      findings,
      invalidRecords,
      validation,
      durationMs: Date.now() - started,
    });
  }

  evaluateSupplier(
    input: EvaluateSupplierInput,
    config: SupplierRankingEngineConfiguration,
  ): SupplierRankingReport {
    return this.rankSuppliers(
      { supplierId: input.supplierId, includeFixtureMetrics: false },
      config,
    );
  }

  resetForTesting(): void {
    this.rankings = [];
  }
}
