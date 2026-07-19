/** R2-16 — Supplier Risk Monitor Manager. */

import type { SupplierRankingEngine } from "../supplier-ranking-engine/engine.js";
import type { ProcurementEngine } from "../procurement-engine/engine.js";
import type { SupplierInventorySyncEngine } from "../supplier-inventory-sync/engine.js";
import type { MultiWarehouseSupportEngine } from "../multi-warehouse-support/engine.js";
import { appendSrmLog } from "./srm-logging.js";
import { SupplierHealthEngine } from "./supplier-health-engine.js";
import { SupplierAvailabilityMonitor } from "./supplier-availability-monitor.js";
import { SupplierPerformanceMonitor } from "./supplier-performance-monitor.js";
import { RiskScoringEngine } from "./risk-scoring-engine.js";
import { SupplierRiskAnalysisEngine } from "./supplier-risk-analysis-engine.js";
import {
  SupplierRiskValidationEngine,
  SupplierRiskValidator,
  SupplierRiskMetadataGenerator,
} from "./supplier-risk-validator.js";
import type { SupplierRiskMonitorConfiguration } from "./configuration.js";
import { SRM_METADATA_VERSION } from "./paths.js";
import { buildSupplierRiskId, getFixtureRiskProfile, listSupplierIds } from "./risk-fixtures.js";
import type {
  InvalidSupplierRiskFinding,
  MonitorSupplierHealthInput,
  SupplierRiskFailureFinding,
  SupplierRiskRecord,
  SupplierRiskReport,
  SupportedSupplierIdentifier,
} from "./types.js";

export class SupplierRiskMonitorManager {
  private records: SupplierRiskRecord[] = [];
  private readonly healthEngine = new SupplierHealthEngine();
  private readonly availabilityMonitor = new SupplierAvailabilityMonitor();
  private readonly performanceMonitor = new SupplierPerformanceMonitor();
  private readonly riskScoringEngine = new RiskScoringEngine();
  private readonly riskAnalysisEngine = new SupplierRiskAnalysisEngine();
  private readonly validationEngine = new SupplierRiskValidationEngine();
  private readonly validator = new SupplierRiskValidator();
  private readonly metadataGenerator = new SupplierRiskMetadataGenerator();

  constructor(
    private readonly rankingEngine: SupplierRankingEngine | null,
    private readonly procurementEngine: ProcurementEngine | null,
    private readonly inventorySync: SupplierInventorySyncEngine | null,
    private readonly multiWarehouseSupport: MultiWarehouseSupportEngine | null,
  ) {}

  getRecords(): SupplierRiskRecord[] {
    return [...this.records];
  }

  resolveSupplierIds(input: MonitorSupplierHealthInput): SupportedSupplierIdentifier[] {
    if (input.supplierId) return [input.supplierId];
    return listSupplierIds();
  }

  buildRiskRecord(
    supplierId: SupportedSupplierIdentifier,
    config: SupplierRiskMonitorConfiguration,
    fixtureMode?: "healthy" | "elevated" | "disrupted" | "abnormal",
  ): SupplierRiskRecord {
    const rankings = this.rankingEngine?.getRankings() ?? [];
    const inventory = this.inventorySync?.getInventory() ?? [];
    const procurements = this.procurementEngine?.getRecords() ?? [];

    const ranking = rankings.find((r) => r.supplierId === supplierId) ?? null;
    const supplierInventory = inventory.filter((i) => i.supplierId === supplierId);
    const supplierProcurements = procurements.filter((p) => p.supplierId === supplierId);

    const fixture = fixtureMode ? getFixtureRiskProfile(supplierId, fixtureMode) : null;
    const healthScore =
      fixture?.supplierHealthScore ??
      this.healthEngine.computeHealthScore({
        ranking,
        inventoryItems: supplierInventory,
        procurements: supplierProcurements,
      });

    const availability =
      fixture?.availabilityStatus ?? this.availabilityMonitor.assessAvailability(supplierInventory);
    const inventoryStability =
      fixture?.inventoryStability ?? this.performanceMonitor.assessInventoryStability(ranking);
    const pricingStability =
      fixture?.pricingStability ?? this.performanceMonitor.assessPricingStability(ranking);
    const fulfilmentReliability =
      fixture?.fulfilmentReliability ??
      this.performanceMonitor.assessFulfilmentReliability(ranking, supplierProcurements);

    const riskScore =
      fixture?.riskScore ??
      this.riskScoringEngine.calculateRiskScore({
        healthScore,
        availabilityStatus: availability,
        inventoryStability,
        pricingStability,
        fulfilmentReliability,
        config,
      });

    const activeRiskAlerts =
      fixture?.activeRiskAlerts ??
      this.riskAnalysisEngine.generateAlerts({
        availability,
        inventoryStability,
        pricingStability,
        fulfilmentReliability,
        riskScore,
        config,
      });

    if (this.multiWarehouseSupport && this.riskScoringEngine.isHighRisk(riskScore, config)) {
      const warehouses = this.multiWarehouseSupport.getRecords();
      if (warehouses.some((w) => w.warehouseHealthStatus === "imbalanced")) {
        if (!activeRiskAlerts.includes("inventory_instability")) {
          activeRiskAlerts.push("inventory_instability");
        }
      }
    }

    return {
      supplierRiskId: buildSupplierRiskId(supplierId),
      timestamp: new Date().toISOString(),
      supplierId,
      supplierHealthScore: healthScore,
      riskScore,
      availabilityStatus: availability,
      inventoryStability,
      pricingStability,
      fulfilmentReliability,
      activeRiskAlerts,
      validationStatus: "pending",
      metadataVersion: SRM_METADATA_VERSION,
    };
  }

  monitorSupplierHealth(
    input: MonitorSupplierHealthInput,
    config: SupplierRiskMonitorConfiguration,
  ): SupplierRiskReport {
    const started = Date.now();
    const failures: SupplierRiskFailureFinding[] = [];
    const invalidRecords: InvalidSupplierRiskFinding[] = [];
    const updatedRecords: SupplierRiskRecord[] = [];

    if (!config.enabled) {
      failures.push({
        supplierRiskId: `srm-fail-${Date.now()}`,
        failureType: "monitoring_failure",
        details: "Supplier risk monitoring disabled",
      });
    }

    const fixtureMode =
      input.riskFixtureMode && input.riskFixtureMode !== "none"
        ? input.riskFixtureMode
        : undefined;

    const supplierIds = this.resolveSupplierIds(input);
    const hasUpstream =
      (this.rankingEngine?.getRankings().length ?? 0) > 0 ||
      (this.inventorySync?.getInventory().length ?? 0) > 0 ||
      input.includeFixtureSuppliers;

    if (!hasUpstream && !fixtureMode) {
      failures.push({
        supplierRiskId: `srm-fail-${Date.now()}`,
        failureType: "missing_supplier",
        details: "No supplier data available for monitoring",
      });
    }

    if (!this.rankingEngine?.getRankings().length && !input.includeFixtureSuppliers && !fixtureMode) {
      this.rankingEngine?.rankSuppliers({ includeFixtureMetrics: false });
    }

    for (const supplierId of supplierIds) {
      const record = this.buildRiskRecord(supplierId, config, fixtureMode);
      const invalid = this.validationEngine.detectInvalidSupplier(supplierId, record.riskScore);
      if (invalid) {
        invalidRecords.push(invalid);
        continue;
      }

      if (this.riskAnalysisEngine.detectDisruption(record.availabilityStatus)) {
        appendSrmLog({
          event: "risk_alert",
          level: "warn",
          details: `Supplier disruption detected: ${supplierId}`,
        });
      }
      if (this.riskAnalysisEngine.detectAbnormalBehaviour(record)) {
        appendSrmLog({
          event: "risk_alert",
          level: "warn",
          details: `Abnormal supplier behaviour: ${supplierId}`,
        });
      }

      appendSrmLog({
        event: "supplier_health_check",
        level: record.riskScore >= config.highRiskThresholdScore ? "warn" : "info",
        details: `Monitored ${supplierId} — health ${record.supplierHealthScore} risk ${record.riskScore}`,
      });
      appendSrmLog({
        event: "risk_calculation",
        level: "info",
        details: `Risk score ${record.riskScore} for ${supplierId}`,
      });

      updatedRecords.push(record);
    }

    const validation = this.validator.validateRiskResult({
      records: updatedRecords,
      failures,
      config,
      startedAt: started,
    });

    if (validation.decision !== "fail" || !config.preserveExistingOnValidationFailure) {
      for (const record of updatedRecords) {
        const idx = this.records.findIndex((r) => r.supplierId === record.supplierId);
        if (idx >= 0) this.records[idx] = record;
        else this.records.push(record);
      }
    }

    return this.metadataGenerator.generateRiskReport({
      action: "monitor",
      records:
        validation.decision === "fail" && config.preserveExistingOnValidationFailure ? [] : updatedRecords,
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
