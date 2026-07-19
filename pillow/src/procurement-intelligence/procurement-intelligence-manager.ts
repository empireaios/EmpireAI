/** R2-19 — Procurement Intelligence Manager. */

import type { ProcurementEngine } from "../procurement-engine/engine.js";
import type { SupplierRankingEngine } from "../supplier-ranking-engine/engine.js";
import type { SupplierPricingEngine } from "../supplier-pricing-engine/engine.js";
import type { SupplierRiskMonitorEngine } from "../supplier-risk-monitor/engine.js";
import type { LogisticsOptimizationEngine } from "../logistics-optimization/engine.js";
import { appendPiLog } from "./pi-logging.js";
import { ProcurementAnalyticsEngine } from "./procurement-analytics-engine.js";
import { SupplierEvaluationEngine } from "./supplier-evaluation-engine.js";
import { PurchasingRecommendationEngine } from "./purchasing-recommendation-engine.js";
import { CostOptimizationEngine } from "./cost-optimization-engine.js";
import {
  ProcurementIntelligenceValidationEngine,
  ProcurementIntelligenceValidator,
  ProcurementMetadataGenerator,
} from "./procurement-intelligence-validator.js";
import type { ProcurementIntelligenceConfiguration } from "./configuration.js";
import { PI_METADATA_VERSION } from "./paths.js";
import {
  buildProcurementIntelligenceId,
  getFixtureIntelligenceProfile,
  listFixtureProductReferences,
} from "./pi-fixtures.js";
import type {
  AnalyzeProcurementInput,
  InvalidProcurementIntelligenceFinding,
  ProcurementAnomalyFinding,
  ProcurementIntelligenceFailureFinding,
  ProcurementIntelligenceRecord,
  ProcurementIntelligenceReport,
  PurchasingRecommendation,
  SupportedSupplierIdentifier,
} from "./types.js";

export class ProcurementIntelligenceManager {
  private records: ProcurementIntelligenceRecord[] = [];
  private readonly analyticsEngine = new ProcurementAnalyticsEngine();
  private readonly supplierEvaluationEngine = new SupplierEvaluationEngine();
  private readonly purchasingEngine = new PurchasingRecommendationEngine();
  private readonly costEngine = new CostOptimizationEngine();
  private readonly validationEngine = new ProcurementIntelligenceValidationEngine();
  private readonly validator = new ProcurementIntelligenceValidator();
  private readonly metadataGenerator = new ProcurementMetadataGenerator();

  constructor(
    private readonly procurementEngine: ProcurementEngine | null,
    private readonly rankingEngine: SupplierRankingEngine | null,
    private readonly pricingEngine: SupplierPricingEngine | null,
    private readonly riskMonitor: SupplierRiskMonitorEngine | null,
    private readonly logisticsOptimization: LogisticsOptimizationEngine | null,
  ) {}

  getRecords(): ProcurementIntelligenceRecord[] {
    return [...this.records];
  }

  resolveProductReferences(input: AnalyzeProcurementInput): string[] {
    if (input.productReference) return [input.productReference];
    const procurements = this.procurementEngine?.getRecords() ?? [];
    const fromUpstream = procurements.map((p) => p.productReference).filter(Boolean);
    const unique = [...new Set(fromUpstream)];
    if (unique.length) return unique;
    if (input.includeFixtureProcurements) return listFixtureProductReferences();
    return [];
  }

  detectAnomalies(
    record: ProcurementIntelligenceRecord,
    priceTrend: "rising" | "falling" | "stable",
    riskScore: number,
    quantity: number,
    historicalAverage: number,
  ): ProcurementAnomalyFinding[] {
    const anomalies: ProcurementAnomalyFinding[] = [];
    if (priceTrend === "rising") {
      anomalies.push({
        procurementIntelligenceId: record.procurementIntelligenceId,
        anomalyType: "price_spike",
        details: `Price rising for ${record.productReference}`,
      });
    }
    if (quantity > historicalAverage * 2 && historicalAverage > 0) {
      anomalies.push({
        procurementIntelligenceId: record.procurementIntelligenceId,
        anomalyType: "quantity_surge",
        details: `Quantity surge for ${record.productReference}`,
      });
    }
    if (record.recommendedSupplier !== record.supplierReference) {
      anomalies.push({
        procurementIntelligenceId: record.procurementIntelligenceId,
        anomalyType: "supplier_switch",
        details: `Supplier switch recommended for ${record.productReference}`,
      });
    }
    if (riskScore >= 70) {
      anomalies.push({
        procurementIntelligenceId: record.procurementIntelligenceId,
        anomalyType: "risk_elevation",
        details: `Elevated supplier risk for ${record.productReference}`,
      });
    }
    if (record.estimatedProcurementCost > 200) {
      anomalies.push({
        procurementIntelligenceId: record.procurementIntelligenceId,
        anomalyType: "logistics_cost_increase",
        details: `High procurement cost for ${record.productReference}`,
      });
    }
    return anomalies;
  }

  buildIntelligenceRecord(
    productReference: string,
    config: ProcurementIntelligenceConfiguration,
    fixtureMode?: "optimal" | "elevated_cost" | "anomaly" | "high_risk",
  ): {
    record: ProcurementIntelligenceRecord;
    anomalies: ProcurementAnomalyFinding[];
    recommendations: PurchasingRecommendation[];
    costSavings: number;
  } {
    const procurements = (this.procurementEngine?.getRecords() ?? []).filter(
      (p) => p.productReference === productReference,
    );
    const rankings = this.rankingEngine?.getRankings() ?? [];
    const pricing = this.pricingEngine?.getPricing() ?? [];
    const risks = this.riskMonitor?.getRecords() ?? [];
    const logistics = this.logisticsOptimization?.getRecords() ?? [];

    const procurement = procurements[0] ?? null;
    const logisticsRecord = logistics.find((l) => l.orderReference.includes(productReference.slice(0, 8))) ?? logistics[0] ?? null;
    const fixture = fixtureMode ? getFixtureIntelligenceProfile(productReference, fixtureMode) : null;

    const history = this.analyticsEngine.analyzeHistory(procurements);
    const evaluations = this.supplierEvaluationEngine.evaluateSuppliers(rankings, risks, config);
    const recommendedSupplier =
      fixture?.recommendedSupplier ??
      this.supplierEvaluationEngine.selectOptimalSupplier(evaluations);

    const supplierRef = (fixture?.supplierReference ??
      procurement?.supplierId ??
      recommendedSupplier) as SupportedSupplierIdentifier | string;

    const priceTrend = this.analyticsEngine.evaluatePricingTrend(pricing, String(recommendedSupplier));
    const riskRecord = risks.find((r) => r.supplierId === recommendedSupplier);
    const riskScore = riskRecord?.riskScore ?? (fixtureMode === "high_risk" ? 75 : 30);

    const recommendedQuantity =
      fixture?.recommendedPurchaseQuantity ??
      this.purchasingEngine.recommendQuantity(history.averageQuantity, 100, config);

    const recommendedTiming =
      fixture?.recommendedPurchaseTiming ??
      this.purchasingEngine.recommendTiming(priceTrend.trend, riskScore, config);

    const unitCost = procurement?.unitCost ?? (priceTrend.averagePrice || 12.5);
    const costResult = this.costEngine.estimateProcurementCost(
      unitCost,
      recommendedQuantity,
      logisticsRecord,
      config,
    );
    const estimatedCost = fixture?.estimatedProcurementCost ?? costResult.estimatedCost;

    const supplierEval = evaluations.find((e) => e.supplierId === recommendedSupplier);
    const confidenceScore =
      fixture?.procurementConfidenceScore ??
      this.costEngine.calculateConfidenceScore({
        supplierScore: supplierEval?.score ?? 50,
        priceTrendStable: priceTrend.trend === "stable",
        riskScore,
        hasProcurementHistory: procurements.length > 0,
        config,
      });

    const record: ProcurementIntelligenceRecord = {
      procurementIntelligenceId: buildProcurementIntelligenceId(productReference),
      timestamp: new Date().toISOString(),
      supplierReference: supplierRef,
      productReference,
      procurementReference:
        fixture?.procurementReference ?? procurement?.procurementId ?? `pce-pending-${productReference}`,
      recommendedSupplier,
      recommendedPurchaseQuantity: recommendedQuantity,
      recommendedPurchaseTiming: recommendedTiming,
      estimatedProcurementCost: estimatedCost,
      procurementConfidenceScore: confidenceScore,
      validationStatus: "pending",
      metadataVersion: PI_METADATA_VERSION,
    };

    const anomalies =
      fixtureMode === "anomaly" || fixtureMode === "elevated_cost" || fixtureMode === "high_risk"
        ? this.detectAnomalies(record, priceTrend.trend, riskScore, recommendedQuantity, history.averageQuantity)
        : this.detectAnomalies(record, priceTrend.trend, riskScore, recommendedQuantity, history.averageQuantity);

    const recommendations: PurchasingRecommendation[] = [];
    if (record.recommendedSupplier !== record.supplierReference) {
      recommendations.push({
        recommendationId: `pi-rec-${Date.now()}-${productReference}`,
        productReference,
        recommendedSupplier: String(record.recommendedSupplier),
        recommendedQuantity,
        recommendedTiming,
        estimatedSavings: costResult.savings,
        details: `Switch to ${record.recommendedSupplier} for ${productReference}`,
      });
    }
    if (recommendedTiming === "opportunistic" || recommendedTiming === "immediate") {
      recommendations.push({
        recommendationId: `pi-rec-time-${Date.now()}-${productReference}`,
        productReference,
        recommendedSupplier: String(record.recommendedSupplier),
        recommendedQuantity,
        recommendedTiming,
        estimatedSavings: costResult.savings,
        details: `Purchase ${productReference} with ${recommendedTiming} timing`,
      });
    }

    return { record, anomalies, recommendations, costSavings: costResult.savings };
  }

  analyzeProcurement(
    input: AnalyzeProcurementInput,
    config: ProcurementIntelligenceConfiguration,
  ): ProcurementIntelligenceReport {
    const started = Date.now();
    const failures: ProcurementIntelligenceFailureFinding[] = [];
    const invalidRecords: InvalidProcurementIntelligenceFinding[] = [];
    const updatedRecords: ProcurementIntelligenceRecord[] = [];
    const allAnomalies: ProcurementAnomalyFinding[] = [];
    const allRecommendations: PurchasingRecommendation[] = [];

    if (!config.enabled) {
      failures.push({
        procurementIntelligenceId: `pi-fail-${Date.now()}`,
        failureType: "optimization_failure",
        details: "Procurement intelligence disabled",
      });
    }

    const fixtureMode =
      input.intelligenceFixtureMode && input.intelligenceFixtureMode !== "none"
        ? input.intelligenceFixtureMode
        : undefined;

    const hasUpstream =
      (this.procurementEngine?.getRecords().length ?? 0) > 0 || input.includeFixtureProcurements;

    if (!hasUpstream && !fixtureMode) {
      failures.push({
        procurementIntelligenceId: `pi-fail-${Date.now()}`,
        failureType: "missing_procurement",
        details: "No procurement data available for analysis",
      });
    }

    if (!this.rankingEngine?.getRankings().length && !input.includeFixtureProcurements && !fixtureMode) {
      this.rankingEngine?.rankSuppliers({ includeFixtureMetrics: false });
    }
    if (!this.riskMonitor?.getRecords().length && !input.includeFixtureProcurements && !fixtureMode) {
      this.riskMonitor?.monitorSupplierHealth({ includeFixtureSuppliers: true });
    }
    if (!this.logisticsOptimization?.getRecords().length && !input.includeFixtureProcurements && !fixtureMode) {
      this.logisticsOptimization?.optimizeShipping({ includeFixtureOrders: true });
    }

    const targets = this.resolveProductReferences(input);
    const productRefs = targets.length ? targets : fixtureMode ? listFixtureProductReferences() : [];

    for (const productReference of productRefs) {
      const built = this.buildIntelligenceRecord(productReference, config, fixtureMode);
      const invalid = this.validationEngine.detectInvalidProduct(
        productReference,
        built.record.procurementConfidenceScore,
      );
      if (invalid) {
        invalidRecords.push(invalid);
        continue;
      }

      if (built.anomalies.length) {
        appendPiLog({
          event: "procurement_anomaly",
          level: "warn",
          details: `Anomaly detected: ${productReference}`,
        });
      }

      appendPiLog({
        event: "procurement_analysis",
        level: "info",
        details: `Analyzed ${productReference} confidence ${built.record.procurementConfidenceScore}`,
      });
      appendPiLog({
        event: "supplier_evaluation",
        level: "info",
        details: `Recommended ${built.record.recommendedSupplier} for ${productReference}`,
      });
      appendPiLog({
        event: "purchasing_recommendation",
        level: "info",
        details: `Qty ${built.record.recommendedPurchaseQuantity} timing ${built.record.recommendedPurchaseTiming}`,
      });

      updatedRecords.push(built.record);
      allAnomalies.push(...built.anomalies);
      allRecommendations.push(...built.recommendations);
    }

    const validation = this.validator.validateIntelligenceResult({
      records: updatedRecords,
      failures,
      config,
      startedAt: started,
    });

    if (validation.decision !== "fail" || !config.preserveExistingOnValidationFailure) {
      for (const record of updatedRecords) {
        const idx = this.records.findIndex((r) => r.productReference === record.productReference);
        if (idx >= 0) this.records[idx] = record;
        else this.records.push(record);
      }
    }

    return this.metadataGenerator.generateIntelligenceReport({
      action: "analyze",
      records:
        validation.decision === "fail" && config.preserveExistingOnValidationFailure ? [] : updatedRecords,
      anomalies: allAnomalies,
      recommendations: allRecommendations,
      failures,
      invalidRecords,
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.records = [];
  }
}
