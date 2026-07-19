/** R1-14 — Marketplace Health Monitor Manager. */

import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import type { MarketplaceProductNormalizationEngine } from "../marketplace-product-normalization/engine.js";
import type { MarketplaceOrderNormalizationEngine } from "../marketplace-order-normalization/engine.js";
import { appendHealthMonitorLog } from "./mhm-logging.js";
import { ConnectorHealthEngine } from "./connector-health-engine.js";
import { ApiHealthMonitor } from "./api-health-monitor.js";
import { AuthenticationHealthMonitor } from "./authentication-health-monitor.js";
import { SynchronizationHealthMonitor } from "./synchronization-health-monitor.js";
import { FailureDetectionEngine } from "./failure-detection-engine.js";
import { AlertManager } from "./alert-manager.js";
import { HealthValidator } from "./health-validator.js";
import { HealthMetadataGenerator } from "./health-metadata-generator.js";
import {
  getAllMarketplaceFixtures,
  getDegradedFixture,
  getFixtureForMarketplace,
} from "./marketplace-health-fixtures.js";
import { SUPPORTED_MARKETPLACE_IDENTIFIERS } from "./paths.js";
import type { MarketplaceHealthMonitorConfiguration } from "./configuration.js";
import type {
  DetectFailuresInput,
  MarketplaceHealthCheckReport,
  MarketplaceHealthRecord,
  RunHealthCheckInput,
} from "./types.js";

export class MarketplaceHealthMonitorManager {
  private records: MarketplaceHealthRecord[] = [];
  private useDegradedFixture = false;
  private readonly connectorHealth = new ConnectorHealthEngine();
  private readonly apiHealth = new ApiHealthMonitor();
  private readonly authHealth = new AuthenticationHealthMonitor();
  private readonly syncHealth = new SynchronizationHealthMonitor();
  private readonly failureDetection = new FailureDetectionEngine();
  private readonly alertManager = new AlertManager();
  private readonly healthValidator = new HealthValidator();
  private readonly metadataGenerator = new HealthMetadataGenerator();

  constructor(
    private readonly mcf: MarketplaceConnectorFrameworkEngine | null,
    private readonly productNormalization: MarketplaceProductNormalizationEngine | null,
    private readonly orderNormalization: MarketplaceOrderNormalizationEngine | null,
  ) {}

  getRecords(): MarketplaceHealthRecord[] {
    return [...this.records];
  }

  setUseDegradedFixtureForTesting(value: boolean): void {
    this.useDegradedFixture = value;
  }

  async runHealthCheck(
    input: RunHealthCheckInput,
    config: MarketplaceHealthMonitorConfiguration,
  ): Promise<MarketplaceHealthCheckReport> {
    const started = Date.now();
    const connectors = this.mcf?.getRegisteredConnectors() ?? [];
    const marketplaces = input.marketplaceIdentifier
      ? [input.marketplaceIdentifier]
      : input.includeAllMarketplaces !== false
        ? [...SUPPORTED_MARKETPLACE_IDENTIFIERS]
        : [...SUPPORTED_MARKETPLACE_IDENTIFIERS];

    const records: MarketplaceHealthRecord[] = [];

    for (const marketplaceIdentifier of marketplaces) {
      const fixture =
        this.useDegradedFixture && marketplaceIdentifier === "amazon"
          ? getDegradedFixture()
          : getFixtureForMarketplace(marketplaceIdentifier);
      const connector =
        connectors.find((c) => c.marketplaceIdentifier === marketplaceIdentifier) ?? null;
      const connectorId = this.connectorHealth.resolveConnectorId(marketplaceIdentifier, connectors);
      const api = this.apiHealth.assess(fixture, config);
      const authenticationStatus = this.authHealth.assess(fixture, connector);
      const productSynchronizationStatus = this.syncHealth.assessProductSync(
        fixture,
        this.productNormalization,
      );
      const orderSynchronizationStatus = this.syncHealth.assessOrderSync(
        fixture,
        this.orderNormalization,
      );

      const activeAlerts = [...fixture.activeAlerts];
      if (!connectorId) {
        activeAlerts.push("Connector not registered with MCF");
      }

      const overallHealthStatus = this.connectorHealth.resolveOverallHealth({
        authenticationStatus,
        apiAvailability: api.apiAvailability,
        apiErrorRate: api.apiErrorRate,
        rateLimitStatus: api.rateLimitStatus,
        hasActiveAlerts: activeAlerts.length > 0,
        connectorRegistered: Boolean(connectorId),
      });

      records.push({
        healthRecordId: this.connectorHealth.buildHealthRecordId(marketplaceIdentifier),
        timestamp: new Date().toISOString(),
        marketplaceIdentifier,
        connectorId,
        authenticationStatus,
        apiAvailability: api.apiAvailability,
        apiLatencyMs: api.apiLatencyMs,
        apiErrorRate: api.apiErrorRate,
        productSynchronizationStatus,
        orderSynchronizationStatus,
        rateLimitStatus: api.rateLimitStatus,
        activeAlerts,
        recoveryStatus: fixture.recoveryStatus,
        overallHealthStatus,
        metadataVersion: this.connectorHealth.getMetadataVersion(),
      });
    }

    const failures = this.failureDetection.detect(records, config);
    const alerts = this.alertManager.generateAlerts(records, config);
    const baseValidation = this.failureDetection.validateRecords(records, config);
    const validation = this.healthValidator.validateHealthCheckResult({
      records,
      alerts,
      failures,
      config,
      baseValidation,
    });

    if (validation.decision === "fail" && config.preserveHealthHistory) {
      appendHealthMonitorLog({
        event: "validation_result",
        level: "warn",
        details: "Validation failed — preserving existing health history",
      });
      return this.metadataGenerator.buildHealthCheckReport({
        action: "health_check",
        records: this.records,
        alerts: [],
        failures,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (validation.decision !== "fail") {
      this.records = records;
    }

    appendHealthMonitorLog({
      event: "health_check_complete",
      level: "info",
      details: `Monitored ${records.length} marketplace(s) · ${failures.length} failure(s)`,
    });

    return this.metadataGenerator.buildHealthCheckReport({
      action: "health_check",
      records: this.records,
      alerts,
      failures,
      validation,
      durationMs: Date.now() - started,
    });
  }

  detectFailures(
    input: DetectFailuresInput,
    config: MarketplaceHealthMonitorConfiguration,
  ): MarketplaceHealthCheckReport {
    const started = Date.now();
    const records = input.records ?? this.records;
    const failures = this.failureDetection.detect(records, config);
    const alerts = this.alertManager.generateAlerts(records, config);
    const validation = this.failureDetection.validateRecords(records, config);

    return this.metadataGenerator.buildHealthCheckReport({
      action: "detect_failures",
      records,
      alerts,
      failures,
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.records = [];
    this.useDegradedFixture = false;
  }
}
