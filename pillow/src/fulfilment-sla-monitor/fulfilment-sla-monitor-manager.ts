/** R2-18 — Fulfilment SLA Monitor Manager. */

import type { FulfilmentOrchestrator } from "../fulfilment-orchestrator/engine.js";
import type { ShipmentTrackingEngine } from "../shipment-tracking-engine/engine.js";
import type { LogisticsOptimizationEngine } from "../logistics-optimization/engine.js";
import { appendFsmLog } from "./fsm-logging.js";
import { SlaMonitoringEngine } from "./sla-monitoring-engine.js";
import { SlaComplianceEngine } from "./sla-compliance-engine.js";
import { SlaAlertEngine } from "./sla-alert-engine.js";
import { SlaRiskAnalyzer } from "./sla-risk-analyzer.js";
import { SlaHistoryEngine } from "./sla-history-engine.js";
import { SlaValidationEngine, SlaValidator, SlaMetadataGenerator } from "./sla-validator.js";
import type { FulfilmentSlaMonitorConfiguration } from "./configuration.js";
import { FSM_METADATA_VERSION } from "./paths.js";
import { buildSlaRecordId, getFixtureSlaProfile, listFixtureOrderReferences } from "./sla-fixtures.js";
import type {
  InvalidSlaFinding,
  MonitorFulfilmentSlaInput,
  SlaFailureFinding,
  SlaHistoryEntry,
  SlaRecord,
  SlaReport,
  SupportedSupplierIdentifier,
} from "./types.js";

export class FulfilmentSlaMonitorManager {
  private records: SlaRecord[] = [];
  private readonly monitoringEngine = new SlaMonitoringEngine();
  private readonly complianceEngine = new SlaComplianceEngine();
  private readonly alertEngine = new SlaAlertEngine();
  private readonly riskAnalyzer = new SlaRiskAnalyzer();
  private readonly historyEngine = new SlaHistoryEngine();
  private readonly validationEngine = new SlaValidationEngine();
  private readonly validator = new SlaValidator();
  private readonly metadataGenerator = new SlaMetadataGenerator();

  constructor(
    private readonly fulfilmentOrchestrator: FulfilmentOrchestrator | null,
    private readonly shipmentTracking: ShipmentTrackingEngine | null,
    private readonly logisticsOptimization: LogisticsOptimizationEngine | null,
  ) {}

  getRecords(): SlaRecord[] {
    return [...this.records];
  }

  getHistory(): SlaHistoryEntry[] {
    return this.historyEngine.getHistory();
  }

  resolveOrderReferences(input: MonitorFulfilmentSlaInput): string[] {
    if (input.orderReference) return [input.orderReference];
    const fulfilments = this.fulfilmentOrchestrator?.getRecords() ?? [];
    const tracking = this.shipmentTracking?.getRecords() ?? [];
    const logistics = this.logisticsOptimization?.getRecords() ?? [];
    const fromUpstream = [
      ...fulfilments.map((f) => f.orderReference),
      ...tracking.map((t) => t.orderReference),
      ...logistics.map((l) => l.orderReference),
    ].filter(Boolean);
    const unique = [...new Set(fromUpstream)];
    if (unique.length) return unique;
    if (input.includeFixtureOrders) return listFixtureOrderReferences();
    return [];
  }

  buildSlaRecord(
    orderReference: string,
    config: FulfilmentSlaMonitorConfiguration,
    fixtureMode?: "compliant" | "at_risk" | "breached",
  ): SlaRecord {
    const fulfilments = (this.fulfilmentOrchestrator?.getRecords() ?? []).filter(
      (f) => f.orderReference === orderReference,
    );
    const tracking = (this.shipmentTracking?.getRecords() ?? []).filter(
      (t) => t.orderReference === orderReference,
    );
    const logistics = (this.logisticsOptimization?.getRecords() ?? []).filter(
      (l) => l.orderReference === orderReference,
    );

    const fulfilment = fulfilments[0] ?? null;
    const track = tracking[0] ?? null;
    const logistic = logistics[0] ?? null;
    const fixture = fixtureMode ? getFixtureSlaProfile(orderReference, fixtureMode) : null;

    const slaTarget = fixture?.slaTarget ?? this.monitoringEngine.resolveSlaTarget(logistic, config);
    const actualFulfilmentTime =
      fixture?.actualFulfilmentTime ??
      this.monitoringEngine.estimateActualFulfilmentTime(fulfilment, track, logistic);

    const complianceScore =
      fixture?.complianceScore ??
      this.complianceEngine.calculateComplianceScore(slaTarget, actualFulfilmentTime, config);

    const complianceStatus =
      fixture?.complianceStatus ??
      this.complianceEngine.determineComplianceStatus(
        complianceScore,
        actualFulfilmentTime,
        slaTarget,
        config,
      );

    const supplierCompliant = this.complianceEngine.isSupplierCompliant(
      fulfilment?.supplierId ?? fixture?.supplierReference ?? "",
      fulfilment?.fulfilmentStatus ?? null,
    );
    const carrierCompliant = this.complianceEngine.isCarrierCompliant(track?.delayStatus ?? null);

    const activeAlerts =
      fixture?.activeAlerts ??
      this.alertEngine.generateAlerts({
        complianceStatus,
        supplierCompliant,
        carrierCompliant,
        fulfilmentFailed: fulfilment?.fulfilmentStatus === "failed",
        config,
      });

    const supplierRef = (fixture?.supplierReference ??
      fulfilment?.supplierId ??
      "cj-dropshipping") as SupportedSupplierIdentifier | string;
    const carrierRef = fixture?.carrierReference ?? track?.carrierId ?? logistic?.carrierReference ?? "ups";

    return {
      slaRecordId: buildSlaRecordId(orderReference),
      timestamp: new Date().toISOString(),
      orderReference,
      shipmentReference:
        fixture?.shipmentReference ?? track?.shipmentId ?? logistic?.shipmentReference ?? `ship-pending-${orderReference}`,
      supplierReference: supplierRef,
      carrierReference: carrierRef,
      slaTarget,
      actualFulfilmentTime,
      complianceStatus,
      complianceScore,
      activeAlerts,
      validationStatus: "pending",
      metadataVersion: FSM_METADATA_VERSION,
    };
  }

  monitorFulfilmentSla(
    input: MonitorFulfilmentSlaInput,
    config: FulfilmentSlaMonitorConfiguration,
  ): SlaReport {
    const started = Date.now();
    const failures: SlaFailureFinding[] = [];
    const invalidRecords: InvalidSlaFinding[] = [];
    const updatedRecords: SlaRecord[] = [];
    const historyEntries: SlaHistoryEntry[] = [];

    if (!config.enabled) {
      failures.push({
        slaRecordId: `fsm-fail-${Date.now()}`,
        failureType: "monitoring_failure",
        details: "Fulfilment SLA monitoring disabled",
      });
    }

    const fixtureMode =
      input.slaFixtureMode && input.slaFixtureMode !== "none" ? input.slaFixtureMode : undefined;

    const hasUpstream =
      (this.fulfilmentOrchestrator?.getRecords().length ?? 0) > 0 ||
      (this.shipmentTracking?.getRecords().length ?? 0) > 0 ||
      (this.logisticsOptimization?.getRecords().length ?? 0) > 0 ||
      input.includeFixtureOrders;

    if (!hasUpstream && !fixtureMode) {
      failures.push({
        slaRecordId: `fsm-fail-${Date.now()}`,
        failureType: "missing_fulfilment",
        details: "No fulfilment data available for SLA monitoring",
      });
    }

    if (!this.logisticsOptimization?.getRecords().length && !input.includeFixtureOrders && !fixtureMode) {
      this.logisticsOptimization?.optimizeShipping({ includeFixtureOrders: true });
    }

    const targets = this.resolveOrderReferences(input);
    const orderRefs = targets.length ? targets : fixtureMode ? listFixtureOrderReferences() : [];

    for (const orderReference of orderRefs) {
      const record = this.buildSlaRecord(orderReference, config, fixtureMode);
      const invalid = this.validationEngine.detectInvalidOrder(orderReference, record.complianceScore);
      if (invalid) {
        invalidRecords.push(invalid);
        continue;
      }

      if (this.riskAnalyzer.detectSlaBreach(record.complianceStatus)) {
        appendFsmLog({
          event: "sla_alert",
          level: "warn",
          details: `SLA breach detected: ${orderReference}`,
        });
      }
      if (this.riskAnalyzer.detectSlaRisk(record.complianceStatus, record.complianceScore, config)) {
        appendFsmLog({
          event: "sla_alert",
          level: "warn",
          details: `SLA risk detected: ${orderReference}`,
        });
      }

      appendFsmLog({
        event: "sla_monitoring",
        level: record.complianceStatus === "breached" ? "warn" : "info",
        details: `Monitored ${orderReference} — score ${record.complianceScore} status ${record.complianceStatus}`,
      });
      appendFsmLog({
        event: "sla_compliance",
        level: "info",
        details: `Compliance ${record.complianceScore} for ${orderReference}`,
      });

      historyEntries.push(this.historyEngine.recordHistory(record));
      updatedRecords.push(record);
    }

    const validation = this.validator.validateSlaResult({
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

    return this.metadataGenerator.generateSlaReport({
      action: "monitor",
      records:
        validation.decision === "fail" && config.preserveExistingOnValidationFailure ? [] : updatedRecords,
      history: historyEntries,
      failures,
      invalidRecords,
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.records = [];
    this.historyEngine.resetForTesting();
  }
}
