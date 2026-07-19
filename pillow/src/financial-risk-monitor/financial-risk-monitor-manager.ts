/** R3-15 — Financial Risk Monitor Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import type { FinancialForecastEngine } from "../financial-forecast-engine/engine.js";
import type { BudgetManagementEngine } from "../budget-management-engine/engine.js";
import { FINANCIAL_RISK_MONITOR_ID, FRM_METADATA_VERSION } from "./paths.js";
import { appendFrmLog } from "./frm-logging.js";
import { RiskRegistry } from "./risk-registry.js";
import { RiskDataSource } from "./risk-data-source.js";
import { FinancialHealthEngine } from "./financial-health-engine.js";
import { FinancialRiskScoringEngine } from "./financial-risk-scoring-engine.js";
import { FinancialAnomalyDetector } from "./financial-anomaly-detector.js";
import { FinancialRiskAlertGenerator } from "./financial-risk-alert-generator.js";
import { RiskMetadataGenerator } from "./risk-metadata-generator.js";
import { RiskValidator } from "./risk-validator.js";
import { RiskRetryManager } from "./risk-retry-manager.js";
import type { FinancialRiskMonitorConfiguration } from "./configuration.js";
import type {
  CalculateFinancialRiskScoreInput,
  ConnectFinancialRiskMonitorInput,
  DetectFinancialAnomaliesInput,
  DetectThresholdBreachesInput,
  FinancialAnomaly,
  FinancialRiskAlert,
  FinancialRiskMonitorRecord,
  FinancialRiskRecord,
  FinancialRiskRunReport,
  GenerateFinancialRiskAlertsInput,
  MonitorFinancialHealthInput,
  RiskStatus,
} from "./types.js";

export class FinancialRiskMonitorManager {
  private engineRecord: FinancialRiskMonitorRecord | null = null;
  private readonly registry = new RiskRegistry();
  private readonly validator = new RiskValidator();
  private readonly metadataGenerator = new RiskMetadataGenerator();
  private readonly healthEngine = new FinancialHealthEngine();
  private readonly scoringEngine = new FinancialRiskScoringEngine();
  private readonly anomalyDetector = new FinancialAnomalyDetector();
  private readonly alertGenerator = new FinancialRiskAlertGenerator();
  private readonly retryManager = new RiskRetryManager();
  private readonly dataSource: RiskDataSource;

  constructor(
    private readonly framework: FinancialFrameworkEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly cashFlowMonitor: CashFlowMonitorEngine | null,
    private readonly financialForecastEngine: FinancialForecastEngine | null,
    private readonly budgetManagementEngine: BudgetManagementEngine | null,
  ) {
    this.dataSource = new RiskDataSource(
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
      cashFlowMonitor,
      financialForecastEngine,
      budgetManagementEngine,
    );
  }

  getEngineRecord(): FinancialRiskMonitorRecord | null {
    return this.engineRecord;
  }

  getRiskRecords() {
    return this.registry.list();
  }

  private isConnected(record: { currentOperationalState?: string } | null | undefined): boolean {
    const state = record?.currentOperationalState;
    return state === "active" || state === "connected";
  }

  private probeConnections() {
    const reConnected = this.isConnected(this.revenueEngine?.getEngineRecord?.());
    const exConnected = this.isConnected(this.expenseEngine?.getEngineRecord?.());
    const pcConnected = this.isConnected(this.profitCalculationEngine?.getEngineRecord?.());
    const cfConnected = this.isConnected(this.cashFlowMonitor?.getMonitorRecord?.());
    const fctConnected = this.isConnected(this.financialForecastEngine?.getEngineRecord?.());
    const bmgConnected = this.isConnected(this.budgetManagementEngine?.getEngineRecord?.());
    return { reConnected, exConnected, pcConnected, cfConnected, fctConnected, bmgConnected };
  }

  registerWithFramework(
    config: FinancialRiskMonitorConfiguration,
  ): { frameworkModuleId: string | null; validation: FinancialRiskRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: FINANCIAL_RISK_MONITOR_ID,
        moduleVersion: FRM_METADATA_VERSION,
        moduleType: "financial",
        integrationMissionId: "R3-15",
        authenticationMethod: "none",
        apiEndpointConfig: {
          baseUrl: "internal://financial-risk-monitor",
          protocol: "sdk",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["risk.detected", "risk.alert", "risk.threshold_breach", "risk.failed"],
          maxEventsPerMinute: 120,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: false,
          requestsPerMinute: 120,
          burstLimit: 20,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "financial_module_registration",
          "financial_module_activation",
          "financial_event_routing",
        ],
      },
      forceRegister: true,
    });

    appendFrmLog({
      event: "engine_initialization",
      level: "info",
      details: `Registered financial risk monitor with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `frm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: FRM_METADATA_VERSION,
      },
    };
  }

  connectFinancialRiskMonitor(
    _input: ConnectFinancialRiskMonitorInput,
    config: FinancialRiskMonitorConfiguration,
  ): FinancialRiskRunReport {
    const started = Date.now();
    const { reConnected, exConnected, pcConnected, cfConnected, fctConnected, bmgConnected } =
      this.probeConnections();

    const frameworkReg = this.registerWithFramework(config);

    if (this.framework) {
      this.framework.activateFinancialModule(FINANCIAL_RISK_MONITOR_ID);
    }

    const allConnected = reConnected && exConnected && cfConnected;
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: allConnected ? "active" : "connected",
      validationStatus: allConnected ? "passed" : "partial",
      revenueEngineConnected: reConnected,
      expenseEngineConnected: exConnected,
      profitCalculationEngineConnected: pcConnected,
      cashFlowMonitorConnected: cfConnected,
      financialForecastEngineConnected: fctConnected,
      budgetManagementEngineConnected: bmgConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (!reConnected) validation.warnings.push("Revenue Engine not active");
    if (!exConnected) validation.warnings.push("Expense Engine not active");
    if (!cfConnected) validation.warnings.push("Cash Flow Monitor not active");
    if (!allConnected) validation.decision = "partial";

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      riskRecords: [],
      alerts: [],
      anomalies: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private resolveTargetRecord(riskRecordId?: string): FinancialRiskRecord | null {
    return riskRecordId ? this.registry.get(riskRecordId) : this.registry.latest();
  }

  private statusToRisk(status: RiskStatus): RiskStatus {
    return status;
  }

  private buildRiskRecord(
    category: string,
    scores: ReturnType<FinancialRiskScoringEngine["calculate"]>,
    health: ReturnType<FinancialHealthEngine["assess"]>,
    alertCount: number,
  ): FinancialRiskRecord {
    return this.metadataGenerator.buildRiskRecord({
      riskCategory: category,
      riskScore: scores.compositeScore,
      liquidityStatus: this.statusToRisk(health.liquidityStatus),
      profitabilityStatus: this.statusToRisk(health.profitabilityStatus),
      budgetStatus: this.statusToRisk(health.budgetStatus),
      revenueRisk: scores.revenueRisk,
      expenseRisk: scores.expenseRisk,
      activeAlerts: alertCount,
      validationStatus: "passed",
    });
  }

  private runRiskAction(
    action: FinancialRiskRunReport["action"],
    fn: () => {
      records: FinancialRiskRecord[];
      alerts: FinancialRiskAlert[];
      anomalies: FinancialAnomaly[];
      error: string | null;
      warnings: string[];
    },
    config: FinancialRiskMonitorConfiguration,
    eventTopic?: string,
  ): FinancialRiskRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Financial risk monitor not connected");

    const result = fn();
    const validation = this.validator.validateEngineRecord(engineRecord);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    if (this.framework && result.records.length > 0 && eventTopic) {
      for (const record of result.records) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: FINANCIAL_RISK_MONITOR_ID,
          topic: eventTopic,
          payloadRef: record.financialRiskId,
        });
      }
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      riskRecords: result.records,
      alerts: result.alerts,
      anomalies: result.anomalies,
      validation,
      durationMs: Date.now() - started,
    });
  }

  private evaluateRisk(
    category: string,
    config: FinancialRiskMonitorConfiguration,
    dedupeKey?: string,
  ): {
    record: FinancialRiskRecord | null;
    alerts: FinancialRiskAlert[];
    anomalies: FinancialAnomaly[];
    error: string | null;
    warnings: string[];
  } {
    if (dedupeKey && this.registry.hasDedupeKey(dedupeKey)) {
      return {
        record: null,
        alerts: [],
        anomalies: [],
        error: "Duplicate risk assessment",
        warnings: [],
      };
    }

    const snapshot = this.dataSource.snapshot();
    const health = this.healthEngine.assess(snapshot, config);
    const scores = this.scoringEngine.calculate(snapshot, config);
    const record = this.buildRiskRecord(category, scores, health, 0);

    const recordValidation = this.validator.validateRiskRecord(record, config);
    if (recordValidation.decision === "fail") {
      return {
        record: null,
        alerts: [],
        anomalies: [],
        error: recordValidation.errors.join("; "),
        warnings: [...snapshot.warnings, ...recordValidation.warnings],
      };
    }

    const alerts = this.alertGenerator.generateFromHealth(record, health, config);
    record.activeAlerts = alerts.length;
    const anomalies = this.anomalyDetector.detect(record, snapshot, config);

    if (dedupeKey) this.registry.store(record, dedupeKey);
    else this.registry.store(record);

    appendFrmLog({
      event: "risk_calculation",
      level: "info",
      details: `Risk ${record.financialRiskId} category=${category} score=${record.riskScore}`,
    });

    return {
      record,
      alerts,
      anomalies,
      error: null,
      warnings: [...snapshot.warnings, ...recordValidation.warnings],
    };
  }

  monitorFinancialHealth(
    input: MonitorFinancialHealthInput,
    config: FinancialRiskMonitorConfiguration,
  ): FinancialRiskRunReport {
    const category = input.riskCategory ?? "composite";
    const dedupeKey = `health:${category}`;

    return this.runRiskAction(
      "monitor_health",
      () => {
        const result = this.evaluateRisk(category, config, dedupeKey);
        appendFrmLog({
          event: "financial_health_monitoring",
          level: "info",
          details: `Health monitoring for ${category}`,
        });
        return {
          records: result.record ? [result.record] : [],
          alerts: result.alerts,
          anomalies: result.anomalies,
          error: result.error,
          warnings: result.warnings,
        };
      },
      config,
      "risk.detected",
    );
  }

  calculateFinancialRiskScore(
    input: CalculateFinancialRiskScoreInput,
    config: FinancialRiskMonitorConfiguration,
  ): FinancialRiskRunReport {
    const category = input.riskCategory ?? "composite";

    return this.runRiskAction(
      "calculate_risk_score",
      () => {
        const result = this.evaluateRisk(category, config);
        return {
          records: result.record ? [result.record] : [],
          alerts: result.alerts,
          anomalies: result.anomalies,
          error: result.error,
          warnings: result.warnings,
        };
      },
      config,
      "risk.detected",
    );
  }

  detectFinancialAnomalies(
    input: DetectFinancialAnomaliesInput,
    config: FinancialRiskMonitorConfiguration,
  ): FinancialRiskRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Financial risk monitor not connected");

    const target = this.resolveTargetRecord(input.riskRecordId);
    if (!target) {
      const validation = this.validator.validateEngineRecord(engineRecord);
      validation.decision = "fail";
      validation.errors.push("No risk record available for anomaly detection");
      return this.metadataGenerator.buildRunReport({
        action: "detect_anomalies",
        engineRecord,
        riskRecords: [],
        alerts: [],
        anomalies: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const snapshot = this.dataSource.snapshot();
    const anomalies = this.anomalyDetector.detect(target, snapshot, config);
    const validation = this.validator.validateEngineRecord(engineRecord);

    appendFrmLog({
      event: "anomaly_detection",
      level: anomalies.length > 0 ? "warn" : "info",
      details: `Detected ${anomalies.length} anomaly(ies)`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "detect_anomalies",
      engineRecord,
      riskRecords: [target],
      alerts: [],
      anomalies,
      validation,
      durationMs: Date.now() - started,
    });
  }

  detectThresholdBreaches(
    input: DetectThresholdBreachesInput,
    config: FinancialRiskMonitorConfiguration,
  ): FinancialRiskRunReport {
    return this.runRiskAction(
      "detect_threshold_breaches",
      () => {
        const target = this.resolveTargetRecord(input.riskRecordId);
        if (!target) {
          return {
            records: [],
            alerts: [],
            anomalies: [],
            error: "No risk record available for threshold breach detection",
            warnings: [],
          };
        }

        const alerts = this.alertGenerator.detectThresholdBreaches(target, config);

        appendFrmLog({
          event: "threshold_breach",
          level: alerts.length > 0 ? "warn" : "info",
          details: `Detected ${alerts.length} threshold breach(es)`,
        });

        return {
          records: [target],
          alerts,
          anomalies: [],
          error: null,
          warnings: [],
        };
      },
      config,
      "risk.threshold_breach",
    );
  }

  generateFinancialRiskAlerts(
    input: GenerateFinancialRiskAlertsInput,
    config: FinancialRiskMonitorConfiguration,
  ): FinancialRiskRunReport {
    return this.runRiskAction(
      "generate_alerts",
      () => {
        const target = this.resolveTargetRecord(input.riskRecordId);
        if (!target) {
          return {
            records: [],
            alerts: [],
            anomalies: [],
            error: "No risk record available for alert generation",
            warnings: [],
          };
        }

        const snapshot = this.dataSource.snapshot();
        const health = this.healthEngine.assess(snapshot, config);
        const alerts = this.alertGenerator.generateFromHealth(target, health, config);
        const thresholdAlerts = this.alertGenerator.detectThresholdBreaches(target, config);
        const allAlerts = [...alerts, ...thresholdAlerts];

        appendFrmLog({
          event: "alert_generation",
          level: "info",
          details: `Generated ${allAlerts.length} alert(s)`,
        });

        return {
          records: [target],
          alerts: allAlerts,
          anomalies: [],
          error: null,
          warnings: snapshot.warnings,
        };
      },
      config,
      "risk.alert",
    );
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
  }
}
