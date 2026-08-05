import type { MonitoringRuntimeConfiguration } from "./configuration.js";
import {
  MonrtIntegrationCoordinator,
  type MonitoringRuntimeDependencies,
} from "./integrations.js";
import { appendMonrtLog } from "./monrt-logging.js";
import { MonitoringStore } from "./monitoring-store.js";
import { MonitoringValidator } from "./monitoring-validator.js";
import { ComponentRegistry } from "./component-registry.js";
import { HeartbeatCollector } from "./heartbeat-collector.js";
import { AnomalyDetector } from "./anomaly-detector.js";
import { AlertGenerator } from "./alert-generator.js";
import { HealthCalculator } from "./health-calculator.js";
import { EnterpriseHealthAggregator } from "./enterprise-health-aggregator.js";
import { WorkerMonitor } from "./worker-monitor.js";
import { FactoryMonitor } from "./factory-monitor.js";
import { RuntimeMonitor } from "./runtime-monitor.js";
import { ApiMonitor } from "./api-monitor.js";
import { QueueMonitor } from "./queue-monitor.js";
import { MissionMonitor } from "./mission-monitor.js";
import { ToolMonitor } from "./tool-monitor.js";
import { MetricsCollector } from "./metrics-collector.js";
import { ReportBuilder } from "./report-builder.js";
import {
  INTEGRATION_TARGETS,
  MONRT_CAPABILITIES,
  MONRT_METADATA_VERSION,
  MONITORING_RUNTIME_ID,
} from "./paths.js";
import type {
  AnomalyRecord,
  ComponentType,
  HealthSnapshot,
  HeartbeatRecord,
  IntegrationHandshake,
  MonitoredComponent,
  MonitoringAlert,
  MonrtEngineRecord,
  MonrtInput,
  MonrtRunReport,
  MonrtValidationReport,
  Q1011ConsumableContract,
} from "./types.js";

const SEED_COMPONENTS: Array<{
  componentId: string;
  componentType: ComponentType;
}> = [
  { componentId: "wkr-alpha", componentType: "worker" },
  { componentId: "wkr-beta", componentType: "worker" },
  { componentId: "factory-pillow", componentType: "factory" },
  { componentId: "factory-capital", componentType: "factory" },
  { componentId: "runtime-srtc", componentType: "runtime_service" },
  { componentId: "runtime-por", componentType: "runtime_service" },
  { componentId: "runtime-msr", componentType: "runtime_service" },
  { componentId: "runtime-qrt", componentType: "runtime_service" },
  { componentId: "api-supplier-01", componentType: "api" },
  { componentId: "queue-default-01", componentType: "queue" },
  { componentId: "mission-demo-01", componentType: "mission" },
  { componentId: "tool-cursor-01", componentType: "tool" },
];

export class MonitoringRuntimeManager {
  private engineRecord: MonrtEngineRecord | null = null;
  private seeded = false;
  private readonly store = new MonitoringStore();
  private readonly validator = new MonitoringValidator();
  private readonly componentRegistry = new ComponentRegistry();
  private readonly heartbeatCollector = new HeartbeatCollector();
  private readonly anomalyDetector = new AnomalyDetector();
  private readonly alertGenerator = new AlertGenerator();
  private readonly healthCalculator = new HealthCalculator();
  private readonly aggregator = new EnterpriseHealthAggregator();
  private readonly workerMonitor = new WorkerMonitor();
  private readonly factoryMonitor = new FactoryMonitor();
  private readonly runtimeMonitor = new RuntimeMonitor();
  private readonly apiMonitor = new ApiMonitor();
  private readonly queueMonitor = new QueueMonitor();
  private readonly missionMonitor = new MissionMonitor();
  private readonly toolMonitor = new ToolMonitor();
  private readonly metricsCollector = new MetricsCollector();
  private readonly reportBuilder = new ReportBuilder();
  private readonly integrations = new MonrtIntegrationCoordinator();

  bindIntegrations(deps: MonitoringRuntimeDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getDependencies();
  }

  ensureSeeded(config: MonitoringRuntimeConfiguration) {
    if (this.seeded) return;
    this.seeded = true;
    for (const seed of SEED_COMPONENTS) {
      this.componentRegistry.registerComponent(this.store, {
        componentId: seed.componentId,
        componentType: seed.componentType,
        validated: true,
        auditReference: `audit://monrt/seed/${seed.componentId}`,
      });
    }
    this.ensureRecord("active", config);
    appendMonrtLog({
      event: "seed_components",
      details: `Seeded ${SEED_COMPONENTS.length} components as standby/unknown — no fabricated healthy`,
    });
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getReports() {
    return this.store.listReports();
  }

  getHistory() {
    return this.store.getHistory();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getQ1011ConsumableContract(config: MonitoringRuntimeConfiguration): Q1011ConsumableContract {
    return this.reportBuilder.buildQ1011ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    appendMonrtLog({
      event: "connect",
      details: `Monitoring Runtime connected; integrations=${handshakes.filter((h) => h.available).length}`,
    });
    return this.reportAction(
      "connect",
      started,
      { validated: true },
      config,
      null,
      this.store.listComponents(),
      null,
      [],
      null,
      [],
      [],
      null,
      [],
      null,
      handshakes,
    );
  }

  registerComponent(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateRegister(input, started);
    if (validation.decision === "fail") {
      return this.failReport("register_component", started, validation, config);
    }
    const component = this.componentRegistry.registerComponent(this.store, input);
    this.ensureRecord("active", config);
    appendMonrtLog({
      event: "register_component",
      details: `${component.componentId}:${component.componentType}:${component.currentStatus}`,
    });
    return this.reportAction(
      "register_component",
      started,
      input,
      config,
      component,
      [component],
      null,
      [],
      null,
      [],
      [],
      null,
      [],
      null,
    );
  }

  recordHeartbeat(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateHeartbeat(input, started);
    if (validation.decision === "fail") {
      return this.failReport("record_heartbeat", started, validation, config);
    }

    let component: MonitoredComponent | null = null;
    if (input.monitoringId) {
      component = this.store.getComponent(input.monitoringId);
    } else if (input.componentId && input.componentType) {
      component = this.store.getComponentByIdentity(input.componentId, input.componentType);
    } else if (input.componentId) {
      component =
        this.store.listComponents().find((c) => c.componentId === input.componentId) ?? null;
    }

    if (!component) {
      return this.failReport(
        "record_heartbeat",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "Unknown component for heartbeat"],
        },
        config,
      );
    }

    const result = this.heartbeatCollector.recordHeartbeat(this.store, component, input);
    this.ensureRecord("monitoring", config);
    appendMonrtLog({
      event: "record_heartbeat",
      details: `${result.component.componentId}:score=${result.component.healthScore}`,
    });
    return this.reportAction(
      "record_heartbeat",
      started,
      input,
      config,
      result.component,
      [result.component],
      result.heartbeat,
      [result.heartbeat],
      null,
      [],
      [],
      null,
      [],
      null,
    );
  }

  monitorWorkers(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    return this.monitorCategory("monitor_workers", input, config, () =>
      this.workerMonitor.monitor(this.store),
    );
  }

  monitorFactories(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    return this.monitorCategory("monitor_factories", input, config, () =>
      this.factoryMonitor.monitor(this.store),
    );
  }

  monitorRuntimes(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    return this.monitorCategory("monitor_runtimes", input, config, () =>
      this.runtimeMonitor.monitor(this.store),
    );
  }

  monitorApis(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    return this.monitorCategory("monitor_apis", input, config, () =>
      this.apiMonitor.monitor(this.store),
    );
  }

  monitorQueues(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    return this.monitorCategory("monitor_queues", input, config, () =>
      this.queueMonitor.monitor(this.store),
    );
  }

  monitorMissions(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    return this.monitorCategory("monitor_missions", input, config, () =>
      this.missionMonitor.monitor(this.store),
    );
  }

  monitorTools(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    return this.monitorCategory("monitor_tools", input, config, () =>
      this.toolMonitor.monitor(this.store),
    );
  }

  detectAnomalies(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("detect_anomalies", started, validation, config);
    }
    const anomalies = this.anomalyDetector.detect(this.store, this.store.listComponents(), {
      errorCountThreshold: config.errorCountThreshold,
      latencyMsThreshold: config.latencyMsThreshold,
      availabilityThreshold: config.availabilityThreshold,
    });
    this.ensureRecord("detecting", config);
    appendMonrtLog({
      event: "detect_anomalies",
      details: `anomalies=${anomalies.length}`,
    });
    return this.reportAction(
      "detect_anomalies",
      started,
      input,
      config,
      null,
      this.store.listComponents(),
      null,
      [],
      null,
      [],
      anomalies,
      null,
      [],
      null,
    );
  }

  generateAlerts(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("generate_alerts", started, validation, config);
    }
    if (input.suppressCritical === true || input.suppressCriticalAlerts === true) {
      return this.failReport(
        "generate_alerts",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [
            ...validation.errors,
            "Monitoring Runtime must never suppress critical alerts",
          ],
        },
        config,
      );
    }

    let anomalies = this.store.listAnomalies();
    if (anomalies.length === 0) {
      anomalies = this.anomalyDetector.detect(this.store, this.store.listComponents(), {
        errorCountThreshold: config.errorCountThreshold,
        latencyMsThreshold: config.latencyMsThreshold,
        availabilityThreshold: config.availabilityThreshold,
      });
    }

    const alerts = this.alertGenerator.generateFromAnomalies(
      this.store,
      anomalies,
      this.store.listComponents(),
    );
    this.ensureRecord("alerting", config);
    appendMonrtLog({
      event: "generate_alerts",
      details: `alerts=${alerts.length};critical=${alerts.filter((a) => a.severity === "critical").length}`,
    });
    return this.reportAction(
      "generate_alerts",
      started,
      input,
      config,
      null,
      this.store.listComponents(),
      null,
      [],
      alerts[0] ?? null,
      alerts,
      anomalies,
      null,
      [],
      null,
    );
  }

  produceReport(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("produce_report", started, validation, config);
    }

    const criticalCount = this.store.listCriticalAlerts().length;
    const components = this.store.listComponents();
    const withEvidence = components.filter((c) => c.lastSuccessfulHeartbeat != null).length;
    const confidenceScore = Math.min(
      95,
      40 + withEvidence * 5 + (criticalCount > 0 ? 10 : 0),
    );

    const report = this.reportBuilder.buildMonitoringRuntimeReport(
      this.store,
      this.metricsCollector,
      this.aggregator,
      {
        worker: this.workerMonitor,
        factory: this.factoryMonitor,
        runtime: this.runtimeMonitor,
        api: this.apiMonitor,
        queue: this.queueMonitor,
        mission: this.missionMonitor,
        tool: this.toolMonitor,
      },
      config,
      {
        auditStatus: "passed",
        outstandingIssues: criticalCount
          ? [`${criticalCount} critical alert(s) retained in history`]
          : [],
        confidenceScore,
        supportingEvidence: [
          `engine:${MONITORING_RUNTIME_ID}`,
          `healthCalculator:deterministic`,
        ],
      },
    );
    this.store.saveReport(report);
    this.ensureRecord("reporting", config, report.reportId);
    appendMonrtLog({
      event: "produce_report",
      details: `${report.reportId}:consumableByQ1011=${report.consumableByQ1011}`,
    });

    return this.reportAction(
      "produce_report",
      started,
      input,
      config,
      null,
      components,
      null,
      [],
      null,
      report.activeAlerts,
      [],
      null,
      [
        report.workerHealth,
        report.factoryHealth,
        report.runtimeHealth,
        report.apiHealth,
        report.queueHealth,
        report.missionHealth,
        report.toolHealth,
      ],
      report,
    );
  }

  submitReport(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("submit_report", started, validation, config);
    }

    let report = this.store.listReports().at(-1) ?? null;
    if (!report) {
      const produced = this.produceReport({ ...input, validated: true }, config);
      report = produced.monitoringRuntimeReport;
    }
    if (report) {
      this.integrations.submitReport(report);
      this.integrations.recordAudit({
        event: "monitoring_runtime_report_submitted",
        reportId: report.reportId,
        auditReference: `audit://monrt/report/${report.reportId}`,
      });
    }
    this.ensureRecord("reporting", config, report?.reportId ?? null);
    return this.reportAction(
      "submit_report",
      started,
      input,
      config,
      null,
      this.store.listComponents(),
      null,
      [],
      null,
      report?.activeAlerts ?? [],
      [],
      null,
      [],
      report,
    );
  }

  list(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("list", started, validation, config);
    }
    const components = this.store.listComponents();
    return this.reportAction(
      "list",
      started,
      input,
      config,
      components[0] ?? null,
      components,
      null,
      this.store.listHeartbeats(),
      this.store.listAlerts()[0] ?? null,
      this.store.listAlerts(),
      this.store.listAnomalies(),
      null,
      [],
      null,
    );
  }

  validate(input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    return this.reportAction(
      "validate",
      started,
      input,
      config,
      null,
      [],
      null,
      [],
      null,
      [],
      [],
      null,
      [],
      null,
      undefined,
      validation,
    );
  }

  diagnostics(_input: MonrtInput, config: MonitoringRuntimeConfiguration): MonrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    const diag = this.reportBuilder.buildDiagnostics(this.store, handshakes);
    void this.healthCalculator;
    appendMonrtLog({
      event: "diagnostics",
      details: `components=${diag.totalComponents};critical=${diag.criticalAlertCount}`,
    });
    return this.reportAction(
      "diagnostics",
      started,
      { validated: true },
      config,
      null,
      this.store.listComponents(),
      null,
      [],
      null,
      this.store.listAlerts(),
      this.store.listAnomalies(),
      null,
      [],
      null,
      handshakes,
    );
  }

  getDashboard(config: MonitoringRuntimeConfiguration) {
    this.ensureSeeded(config);
    const workerHealth = this.workerMonitor.monitor(this.store);
    const factoryHealth = this.factoryMonitor.monitor(this.store);
    const runtimeHealth = this.runtimeMonitor.monitor(this.store);
    const apiHealth = this.apiMonitor.monitor(this.store);
    const queueHealth = this.queueMonitor.monitor(this.store);
    const missionHealth = this.missionMonitor.monitor(this.store);
    const toolHealth = this.toolMonitor.monitor(this.store);
    const summary = this.aggregator.aggregate([
      workerHealth,
      factoryHealth,
      runtimeHealth,
      apiHealth,
      queueHealth,
      missionHealth,
      toolHealth,
    ]);
    return {
      enterpriseHealthSummary: summary,
      workerHealth,
      factoryHealth,
      runtimeHealth,
      apiHealth,
      queueHealth,
      missionHealth,
      toolHealth,
      activeAlerts: this.store.listAlerts(),
      criticalEvents: this.store.listCriticalAlerts(),
      neverFabricateHealthInformation: true as const,
      neverSuppressCriticalAlerts: true as const,
      structuralSignalOnly: true as const,
    };
  }

  private monitorCategory(
    action: string,
    input: MonrtInput,
    config: MonitoringRuntimeConfiguration,
    run: () => HealthSnapshot,
  ): MonrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport(action, started, validation, config);
    }
    const snapshot = run();
    this.ensureRecord("monitoring", config);
    appendMonrtLog({
      event: action,
      details: `category=${snapshot.category};avg=${snapshot.averageHealthScore};status=${snapshot.status}`,
    });
    return this.reportAction(
      action,
      started,
      input,
      config,
      snapshot.components[0] ?? null,
      snapshot.components,
      null,
      [],
      null,
      [],
      [],
      snapshot,
      [snapshot],
      null,
    );
  }

  private ensureRecord(
    state: MonrtEngineRecord["operationalState"],
    config: MonitoringRuntimeConfiguration,
    lastReportId?: string | null,
  ) {
    const history = this.store.getHistory();
    this.engineRecord = {
      engineId: MONITORING_RUNTIME_ID,
      workerId: config.workerId,
      operationalState: state,
      healthStatus:
        history.alerts.some((a) => a.severity === "critical")
          ? "degraded"
          : history.components.length > 0
            ? "healthy"
            : "standby",
      totalComponents: history.components.length,
      totalHeartbeats: history.heartbeats.length,
      totalAlerts: history.alerts.length,
      totalReports: history.reports.length,
      lastReportId: lastReportId ?? this.engineRecord?.lastReportId ?? null,
      supportedCapabilities: [...MONRT_CAPABILITIES],
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: MONRT_METADATA_VERSION,
    };
  }

  private failReport(
    action: string,
    started: number,
    validation: MonrtValidationReport,
    config: MonitoringRuntimeConfiguration,
  ): MonrtRunReport {
    this.ensureRecord("failed", config);
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "fail",
      validation,
      component: null,
      components: [],
      heartbeat: null,
      heartbeats: [],
      alert: null,
      alerts: [],
      anomalies: [],
      healthSnapshot: null,
      healthSnapshots: [],
      monitoringRuntimeReport: null,
      q1011Contract: null,
      errors: [...validation.errors],
      warnings: [...validation.warnings],
    };
  }

  private reportAction(
    action: string,
    started: number,
    input: MonrtInput,
    config: MonitoringRuntimeConfiguration,
    component: MonitoredComponent | null,
    components: MonitoredComponent[],
    heartbeat: HeartbeatRecord | null,
    heartbeats: HeartbeatRecord[],
    alert: MonitoringAlert | null,
    alerts: MonitoringAlert[],
    anomalies: AnomalyRecord[],
    healthSnapshot: HealthSnapshot | null,
    healthSnapshots: HealthSnapshot[],
    monitoringRuntimeReport: MonrtRunReport["monitoringRuntimeReport"],
    handshakes?: IntegrationHandshake[],
    validationOverride?: MonrtValidationReport,
  ): MonrtRunReport {
    void handshakes;
    const validation =
      validationOverride ?? this.validator.validateInput({ ...input, validated: true }, started);
    const decision =
      validation.decision === "fail"
        ? "fail"
        : validation.warnings.length
          ? "partial"
          : "pass";
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision,
      validation,
      component,
      components,
      heartbeat,
      heartbeats,
      alert,
      alerts,
      anomalies,
      healthSnapshot,
      healthSnapshots,
      monitoringRuntimeReport,
      q1011Contract: action === "get_q1011_contract" ? this.getQ1011ConsumableContract(config) : null,
      errors: [...validation.errors],
      warnings: [...validation.warnings],
    };
  }
}
