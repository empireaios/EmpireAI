/** R2-17 — Logistics Optimization Manager. */

import type { FulfilmentOrchestrator } from "../fulfilment-orchestrator/engine.js";
import type { ShippingCarrierIntegrationEngine } from "../shipping-carrier-integration/engine.js";
import type { ShipmentTrackingEngine } from "../shipment-tracking-engine/engine.js";
import type { MultiWarehouseSupportEngine } from "../multi-warehouse-support/engine.js";
import { appendLoLog } from "./lo-logging.js";
import { RouteOptimizationEngine } from "./route-optimization-engine.js";
import { CarrierSelectionEngine } from "./carrier-selection-engine.js";
import { WarehouseSelectionOptimizer } from "./warehouse-selection-optimizer.js";
import { ShippingCostAnalyzer } from "./shipping-cost-analyzer.js";
import { DeliveryTimeOptimizer } from "./delivery-time-optimizer.js";
import {
  LogisticsValidationEngine,
  LogisticsValidator,
  LogisticsMetadataGenerator,
} from "./logistics-validator.js";
import type { LogisticsOptimizationConfiguration } from "./configuration.js";
import { LO_METADATA_VERSION } from "./paths.js";
import {
  buildLogisticsRecordId,
  getFixtureLogisticsProfile,
  listFixtureOrderReferences,
} from "./logistics-fixtures.js";
import type {
  InvalidLogisticsFinding,
  LogisticsBottleneckFinding,
  LogisticsFailureFinding,
  LogisticsImprovementRecommendation,
  LogisticsRecord,
  LogisticsReport,
  OptimizeShippingInput,
} from "./types.js";

export class LogisticsOptimizationManager {
  private records: LogisticsRecord[] = [];
  private readonly routeEngine = new RouteOptimizationEngine();
  private readonly carrierEngine = new CarrierSelectionEngine();
  private readonly warehouseOptimizer = new WarehouseSelectionOptimizer();
  private readonly costAnalyzer = new ShippingCostAnalyzer();
  private readonly deliveryOptimizer = new DeliveryTimeOptimizer();
  private readonly validationEngine = new LogisticsValidationEngine();
  private readonly validator = new LogisticsValidator();
  private readonly metadataGenerator = new LogisticsMetadataGenerator();

  constructor(
    private readonly fulfilmentOrchestrator: FulfilmentOrchestrator | null,
    private readonly carrierIntegration: ShippingCarrierIntegrationEngine | null,
    private readonly shipmentTracking: ShipmentTrackingEngine | null,
    private readonly multiWarehouseSupport: MultiWarehouseSupportEngine | null,
  ) {}

  getRecords(): LogisticsRecord[] {
    return [...this.records];
  }

  resolveOrderReferences(input: OptimizeShippingInput): string[] {
    if (input.orderReference) return [input.orderReference];
    const fulfilments = this.fulfilmentOrchestrator?.getRecords() ?? [];
    const shipments = this.carrierIntegration?.getRecords() ?? [];
    const fromUpstream = [
      ...fulfilments.map((f) => f.orderReference),
      ...shipments.map((s) => s.orderReference),
    ].filter(Boolean);
    const unique = [...new Set(fromUpstream)];
    if (unique.length) return unique;
    if (input.includeFixtureOrders) return listFixtureOrderReferences();
    return [];
  }

  buildLogisticsRecord(
    orderReference: string,
    config: LogisticsOptimizationConfiguration,
    fixtureMode?: "optimal" | "bottleneck" | "inefficient" | "high_cost",
  ): {
    record: LogisticsRecord;
    bottlenecks: LogisticsBottleneckFinding[];
    recommendations: LogisticsImprovementRecommendation[];
    baselineCost: number;
    costSavings: number;
    deliveryImproved: boolean;
    inefficient: boolean;
  } {
    const fulfilments = (this.fulfilmentOrchestrator?.getRecords() ?? []).filter(
      (f) => f.orderReference === orderReference,
    );
    const shipments = (this.carrierIntegration?.getRecords() ?? []).filter(
      (s) => s.orderReference === orderReference,
    );
    const tracking = (this.shipmentTracking?.getRecords() ?? []).filter(
      (t) => t.orderReference === orderReference,
    );
    const warehouses = this.multiWarehouseSupport?.getRecords() ?? [];
    const carriers = this.carrierIntegration?.getCarriers() ?? [];
    const latestShipment = shipments[0] ?? null;
    const latestTracking = tracking[0] ?? null;

    const fixture = fixtureMode ? getFixtureLogisticsProfile(orderReference, fixtureMode) : null;

    const routeAnalysis = this.routeEngine.analyzeRoutes(fulfilments, tracking, config);
    const selectedRoute = fixture?.selectedRoute ?? routeAnalysis.route;

    const carrierSelection = this.carrierEngine.selectCarrier(
      carriers,
      [],
      config,
      selectedRoute === "dropship_express",
    );
    const carrierId = fixture?.carrierReference ?? carrierSelection.carrierId;
    const baselineCost = carrierSelection.rate + 5;

    const warehouseSelection = this.warehouseOptimizer.selectWarehouse(warehouses, config, orderReference);
    const warehouseRef = fixture?.warehouseReference ?? warehouseSelection.warehouseId;

    const costResult = this.costAnalyzer.analyzeCost(
      baselineCost,
      fixture?.estimatedShippingCost ?? carrierSelection.rate,
      config,
    );
    const deliveryResult = this.deliveryOptimizer.optimizeDeliveryTime(
      fixture?.estimatedDeliveryTime ?? carrierSelection.days,
      latestTracking,
      config,
    );

    const costScore = this.costAnalyzer.scoreCostEfficiency(costResult.estimatedCost, baselineCost);
    const deliveryScore = this.deliveryOptimizer.scoreDeliverySpeed(deliveryResult.estimatedDays);
    const optimizationScore =
      fixture?.optimizationScore ??
      Math.round((routeAnalysis.score + costScore + deliveryScore + warehouseSelection.score) / 4);

    const record: LogisticsRecord = {
      logisticsRecordId: buildLogisticsRecordId(orderReference),
      timestamp: new Date().toISOString(),
      orderReference,
      shipmentReference:
        fixture?.shipmentReference ?? latestShipment?.shipmentId ?? `ship-pending-${orderReference}`,
      warehouseReference: warehouseRef,
      carrierReference: carrierId,
      selectedRoute,
      estimatedShippingCost: costResult.estimatedCost,
      estimatedDeliveryTime: deliveryResult.estimatedDays,
      optimizationScore,
      validationStatus: "pending",
      metadataVersion: LO_METADATA_VERSION,
    };

    const bottlenecks: LogisticsBottleneckFinding[] = [];
    const warehouseHealth = warehouses.find((w) => w.warehouseId === warehouseRef)?.warehouseHealthStatus ?? null;
    const bottleneckType = this.routeEngine.detectBottleneck(
      selectedRoute,
      latestTracking?.delayStatus ?? null,
      warehouseHealth,
    );
    if (bottleneckType || fixtureMode === "bottleneck") {
      bottlenecks.push({
        logisticsRecordId: record.logisticsRecordId,
        bottleneckType: bottleneckType ?? "warehouse_capacity",
        details: `Bottleneck detected for ${orderReference}`,
      });
    }

    const recommendations: LogisticsImprovementRecommendation[] = [];
    const inefficient =
      fixtureMode === "inefficient" ||
      this.routeEngine.isInefficientRoute(selectedRoute, optimizationScore, config);

    if (inefficient) {
      recommendations.push({
        recommendationId: `lo-rec-${Date.now()}-${orderReference}`,
        orderReference,
        improvementType: "reroute_warehouse",
        details: `Reroute ${orderReference} from ${selectedRoute} to optimized_route`,
        estimatedSavings: costResult.savings,
      });
    }
    if (fixtureMode === "high_cost" || costResult.estimatedCost > baselineCost * 0.9) {
      recommendations.push({
        recommendationId: `lo-rec-cost-${Date.now()}-${orderReference}`,
        orderReference,
        improvementType: "switch_carrier",
        details: `Switch carrier for ${orderReference} to reduce cost`,
        estimatedSavings: Math.max(5, baselineCost - costResult.estimatedCost),
      });
    }
    if (deliveryResult.improved) {
      recommendations.push({
        recommendationId: `lo-rec-del-${Date.now()}-${orderReference}`,
        orderReference,
        improvementType: "expedite_delivery",
        details: `Expedite delivery for ${orderReference}`,
        estimatedSavings: 0,
      });
    }

    return {
      record,
      bottlenecks,
      recommendations,
      baselineCost,
      costSavings: costResult.savings,
      deliveryImproved: deliveryResult.improved,
      inefficient,
    };
  }

  optimizeShipping(
    input: OptimizeShippingInput,
    config: LogisticsOptimizationConfiguration,
  ): LogisticsReport {
    const started = Date.now();
    const failures: LogisticsFailureFinding[] = [];
    const invalidRecords: InvalidLogisticsFinding[] = [];
    const updatedRecords: LogisticsRecord[] = [];
    const allBottlenecks: LogisticsBottleneckFinding[] = [];
    const allRecommendations: LogisticsImprovementRecommendation[] = [];

    if (!config.enabled) {
      failures.push({
        logisticsRecordId: `lo-fail-${Date.now()}`,
        failureType: "optimization_failure",
        details: "Logistics optimization disabled",
      });
    }

    const fixtureMode =
      input.logisticsFixtureMode && input.logisticsFixtureMode !== "none"
        ? input.logisticsFixtureMode
        : undefined;

    const orderRefs = this.resolveOrderReferences(input);
    const hasUpstream =
      (this.fulfilmentOrchestrator?.getRecords().length ?? 0) > 0 ||
      (this.carrierIntegration?.getRecords().length ?? 0) > 0 ||
      input.includeFixtureOrders;

    if (!hasUpstream && !fixtureMode) {
      failures.push({
        logisticsRecordId: `lo-fail-${Date.now()}`,
        failureType: "missing_shipment",
        details: "No shipment or fulfilment data available for optimization",
      });
    }

    if (!this.multiWarehouseSupport?.getRecords().length && !input.includeFixtureOrders && !fixtureMode) {
      this.multiWarehouseSupport?.registerWarehouses({ includeFixtureWarehouses: true });
    }

    if (!this.fulfilmentOrchestrator?.getRecords().length && !input.includeFixtureOrders && !fixtureMode) {
      failures.push({
        logisticsRecordId: `lo-fail-${Date.now()}`,
        failureType: "route_calculation_failure",
        details: "No fulfilment records available — route optimization limited",
      });
    }

    const targets = orderRefs.length ? orderRefs : fixtureMode ? listFixtureOrderReferences() : [];

    for (const orderReference of targets) {
      const built = this.buildLogisticsRecord(orderReference, config, fixtureMode);
      const invalid = this.validationEngine.detectInvalidOrder(
        orderReference,
        built.record.optimizationScore,
      );
      if (invalid) {
        invalidRecords.push(invalid);
        continue;
      }

      if (this.carrierEngine.estimateCarrierFailure(built.record.carrierReference, this.carrierIntegration?.getCarriers() ?? [])) {
        failures.push({
          logisticsRecordId: built.record.logisticsRecordId,
          failureType: "carrier_failure",
          details: `Carrier unavailable for ${orderReference}`,
        });
      }

      if (built.inefficient) {
        appendLoLog({
          event: "inefficient_route",
          level: "warn",
          details: `Inefficient route detected: ${orderReference}`,
        });
      }
      if (built.bottlenecks.length) {
        appendLoLog({
          event: "bottleneck_detected",
          level: "warn",
          details: `Logistics bottleneck: ${orderReference}`,
        });
      }

      appendLoLog({
        event: "route_optimization",
        level: "info",
        details: `Route ${built.record.selectedRoute} for ${orderReference} score ${built.record.optimizationScore}`,
      });
      appendLoLog({
        event: "carrier_selection",
        level: "info",
        details: `Carrier ${built.record.carrierReference} for ${orderReference}`,
      });
      appendLoLog({
        event: "warehouse_selection",
        level: "info",
        details: `Warehouse ${built.record.warehouseReference} for ${orderReference}`,
      });
      appendLoLog({
        event: "cost_optimization",
        level: built.record.estimatedShippingCost < built.baselineCost ? "info" : "warn",
        details: `Cost ${built.record.estimatedShippingCost} savings ${built.costSavings}`,
      });

      updatedRecords.push(built.record);
      allBottlenecks.push(...built.bottlenecks);
      allRecommendations.push(...built.recommendations);
    }

    const validation = this.validator.validateOptimizationResult({
      records: updatedRecords,
      failures,
      config,
      startedAt: started,
    });

    if (validation.decision !== "fail" || !config.preserveExistingOnValidationFailure) {
      for (const record of updatedRecords) {
        const idx = this.records.findIndex((r) => r.orderReference === record.orderReference);
        if (idx >= 0) this.records[idx] = record;
        else this.records.push(record);
      }
    }

    return this.metadataGenerator.generateLogisticsReport({
      action: "optimize",
      records:
        validation.decision === "fail" && config.preserveExistingOnValidationFailure ? [] : updatedRecords,
      bottlenecks: allBottlenecks,
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
