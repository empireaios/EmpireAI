import type { SharedRuntimeCoreConfiguration } from "./configuration.js";
import { ExecutionContextManager } from "./execution-context.js";
import { FactoryRegistry } from "./factory-registry.js";
import { HealthMonitor } from "./health-monitor.js";
import {
  SrtcIntegrationCoordinator,
  type SharedRuntimeCoreDependencies,
} from "./integrations.js";
import { appendSrtcLog } from "./srtc-logging.js";
import {
  INTEGRATION_TARGETS,
  SRTC_CAPABILITIES,
  SRTC_METADATA_VERSION,
  SHARED_RUNTIME_CORE_ID,
} from "./paths.js";
import { ReportBuilder } from "./report-builder.js";
import { RoutingEngine } from "./routing-engine.js";
import { RuntimeRegistry } from "./runtime-registry.js";
import { RuntimeStore, nextSrtcId, resetSrtcSequenceForTesting } from "./runtime-store.js";
import { SrtcValidator } from "./runtime-validator.js";
import { WorkerRegistryBridge } from "./worker-registry-bridge.js";
import type {
  ExecutionContext,
  FactoryRegistration,
  Q1002ConsumableContract,
  RoutingRecord,
  SharedRuntimeCoreCatalog,
  SharedRuntimeCoreEngineRecord,
  SrtcRunReport,
  SharedRuntimeReport,
  RuntimeTopology,
  SrtcInput,
  WorkerRegistration,
} from "./types.js";

export class RuntimeManager {
  private engineRecord: SharedRuntimeCoreEngineRecord | null = null;
  private seeded = false;
  private catalog: SharedRuntimeCoreCatalog | null = null;
  private readonly store = new RuntimeStore();
  private readonly factoryRegistry = new FactoryRegistry(this.store);
  private readonly workerBridge = new WorkerRegistryBridge(this.store);
  private readonly runtimeRegistry = new RuntimeRegistry(this.store);
  private readonly executionContext = new ExecutionContextManager(this.store);
  private readonly routingEngine = new RoutingEngine(this.store, this.factoryRegistry);
  private readonly healthMonitor = new HealthMonitor();
  private readonly reportBuilder = new ReportBuilder();
  private readonly validator = new SrtcValidator();
  private readonly integrations = new SrtcIntegrationCoordinator();

  bindIntegrations(deps: SharedRuntimeCoreDependencies | Record<string, unknown> = {}) {
    this.integrations.bind(deps);
    if (deps.workerRegistry) {
      this.workerBridge.bindWorkerRegistry(deps.workerRegistry);
    }
  }

  getIntegrations() {
    return this.integrations.getDependencies();
  }

  ensureSeeded(config: SharedRuntimeCoreConfiguration) {
    if (this.seeded) return;
    this.store.seedFactories(config.defaultFactories);
    this.store.seedWorkers(config.seedWorkers);
    this.runtimeRegistry.bootstrapServices();
    this.catalog = this.buildCatalog(config);
    this.seeded = true;
    this.ensureRecord("connected", config);
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

  getCatalog() {
    return this.catalog
      ? {
          ...this.catalog,
          factories: this.catalog.factories.map((f) => ({ ...f })),
          workers: this.catalog.workers.map((w) => ({ ...w })),
          services: this.catalog.services.map((s) => ({ ...s })),
          integrationHandshakes: this.catalog.integrationHandshakes.map((h) => ({
            ...h,
            notes: [...h.notes],
          })),
        }
      : null;
  }

  getReports() {
    return this.store.listReports();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getQ1002ConsumableContract(config: SharedRuntimeCoreConfiguration): Q1002ConsumableContract {
    return this.reportBuilder.buildQ1002ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: SharedRuntimeCoreConfiguration): SrtcRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const deps = this.integrations.getDependencies();
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.buildCatalog(config, handshakes);
    this.ensureRecord("connected", config);
    appendSrtcLog({
      event: "connect",
      details: `Shared Runtime Core connected; factories=${this.store.listFactories().length}`,
    });
    return this.reportAction(
      "connect",
      started,
      { validated: true },
      config,
      null,
      null,
      null,
      handshakes,
    );
  }

  registerDefaultFactories(config: SharedRuntimeCoreConfiguration, input: SrtcInput = {}): SrtcRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("register_default_factories", started, validation, config);
    }
    const registered = this.factoryRegistry.registerMany(config.defaultFactories);
    this.ensureRecord("active", config);
    appendSrtcLog({ event: "register_default_factories", details: `count=${registered.length}` });
    return this.reportAction("register_default_factories", started, input, config);
  }

  registerFactory(input: SrtcInput, config: SharedRuntimeCoreConfiguration): SrtcRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    const errors: string[] = [...validation.errors];
    for (const factory of input.factoryDescriptors ?? []) {
      this.validator.validateRegistrationFabricated(factory.fabricated, factory.factoryKey, errors);
    }
    if (errors.length) {
      return this.failReport("register_factory", started, { ...validation, decision: "fail", errors }, config);
    }
    for (const factory of input.factoryDescriptors ?? []) {
      this.factoryRegistry.register(factory);
    }
    this.ensureRecord("active", config);
    return this.reportAction("register_factory", started, input, config);
  }

  registerWorker(input: SrtcInput, config: SharedRuntimeCoreConfiguration): SrtcRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    const errors: string[] = [...validation.errors];
    for (const worker of input.workerDescriptors ?? []) {
      this.validator.validateRegistrationFabricated(worker.fabricated, worker.workerId, errors);
    }
    if (errors.length) {
      return this.failReport("register_worker", started, { ...validation, decision: "fail", errors }, config);
    }
    const descriptors = input.workerDescriptors ?? [];
    if (descriptors.length === 0) {
      const discovered = this.workerBridge.discoverFromInjectedRegistry();
      this.workerBridge.registerMany(discovered);
      this.workerBridge.registerMany(config.seedWorkers);
    } else {
      this.workerBridge.registerMany(descriptors);
    }
    this.ensureRecord("active", config);
    return this.reportAction("register_worker", started, input, config);
  }

  createExecutionContext(input: SrtcInput, config: SharedRuntimeCoreConfiguration): SrtcRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("create_execution_context", started, validation, config);
    }
    const factoryKeys = this.store.listFactories().map((f) => f.factoryKey);
    const workerIds = this.store.listWorkers().map((w) => w.workerId);
    const context = this.executionContext.create(factoryKeys, workerIds);
    return this.reportAction("create_execution_context", started, input, config, null, context);
  }

  routeRequest(input: SrtcInput, config: SharedRuntimeCoreConfiguration): SrtcRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("route_request", started, validation, config);
    }
    const route = this.routingEngine.routeRequest(
      input.sourceFactory ?? "unknown",
      input.targetFactory ?? "unknown",
      input.service ?? "",
    );
    return this.reportAction("route_request", started, input, config, route);
  }

  resolveDependencies(_input: SrtcInput, config: SharedRuntimeCoreConfiguration): SrtcRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const deps = this.integrations.getDependencies();
    const dependencyStatus = this.runtimeRegistry.resolveDependencies(deps);
    appendSrtcLog({
      event: "resolve_dependencies",
      details: `resolved=${dependencyStatus.length}`,
    });
    return this.reportAction(
      "resolve_dependencies",
      started,
      { validated: true },
      config,
      null,
      null,
      null,
      this.runtimeRegistry.buildIntegrationHandshakes(deps),
    );
  }

  collectDiagnostics(_input: SrtcInput, config: SharedRuntimeCoreConfiguration): SrtcRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const deps = this.integrations.getDependencies();
    const handshakes = this.runtimeRegistry.buildIntegrationHandshakes(deps);
    return this.reportAction("collect_diagnostics", started, { validated: true }, config, null, null, null, handshakes);
  }

  produceSharedRuntimeReport(input: SrtcInput, config: SharedRuntimeCoreConfiguration): SrtcRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("produce_shared_runtime_report", started, validation, config);
    }
    const deps = this.integrations.getDependencies();
    const handshakes = this.runtimeRegistry.buildIntegrationHandshakes(deps);
    const dependencyStatus = this.runtimeRegistry.resolveDependencies(deps);
    const health = this.healthMonitor.evaluate(this.store, handshakes, dependencyStatus);
    const latestRoute = this.store.listRoutes().at(-1);
    const routingStatus = latestRoute ? String(latestRoute.routingStatus) : "pending";
    const outstandingIssues = dependencyStatus
      .filter((d) => d.status === "unavailable")
      .map((d) => `${d.target} unavailable`);
    const report = this.reportBuilder.buildSharedRuntimeReport(this.store, config, {
      dependencyStatus,
      handshakes,
      healthStatus: health.healthStatus,
      routingStatus,
      activeRuntimeState: this.engineRecord?.operationalState ?? "connected",
      auditStatus: outstandingIssues.length ? "partial" : "passed",
      outstandingIssues,
      confidenceScore: health.healthScore,
      supportingEvidence: [
        "docs/governance/EMPIREAI_SHARED_RUNTIME_CORE_SYSTEM.md",
        "config/shared-runtime-core.config.json",
        ...this.store.getAuditTrail().slice(-5),
      ],
    });
    this.store.saveReport(report);
    this.ensureRecord("active", config, report.reportId);
    return this.reportAction(
      "produce_shared_runtime_report",
      started,
      input,
      config,
      null,
      null,
      report,
      handshakes,
    );
  }

  submitReport(input: SrtcInput, config: SharedRuntimeCoreConfiguration): SrtcRunReport {
    const started = Date.now();
    const produced = this.produceSharedRuntimeReport(input, config);
    if (produced.decision === "fail") return produced;
    const submission = this.integrations.submitReport(produced.sharedRuntimeReport);
    appendSrtcLog({ event: "submit_report", details: JSON.stringify(submission).slice(0, 120) });
    return produced;
  }

  list(_input: SrtcInput, config: SharedRuntimeCoreConfiguration): SrtcRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    return this.reportAction("list", started, { validated: true }, config);
  }

  validate(input: SrtcInput, config: SharedRuntimeCoreConfiguration): SrtcRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    return {
      action: "validate",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: validation.decision,
      validation,
      sharedRuntimeReport: null,
      routingRecord: null,
      executionContext: null,
      topology: this.getTopology(config),
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  diagnostics(_input: SrtcInput, config: SharedRuntimeCoreConfiguration): SrtcRunReport {
    return this.collectDiagnostics({}, config);
  }

  getTopology(config: SharedRuntimeCoreConfiguration): RuntimeTopology {
    this.ensureSeeded(config);
    const deps = this.integrations.getDependencies();
    const dependencyStatus = this.runtimeRegistry.resolveDependencies(deps);
    return this.reportBuilder.buildTopology(this.store, dependencyStatus);
  }

  private buildCatalog(
    config: SharedRuntimeCoreConfiguration,
    handshakes = this.runtimeRegistry.buildIntegrationHandshakes(this.integrations.getDependencies()),
  ): SharedRuntimeCoreCatalog {
    return {
      catalogId: nextSrtcId("srtc-catalog"),
      timestamp: new Date().toISOString(),
      factories: this.store.listFactories(),
      workers: this.store.listWorkers(),
      services: this.store.listServices(),
      integrationHandshakes: handshakes,
      metadataVersion: SRTC_METADATA_VERSION,
    };
  }

  private ensureRecord(
    operationalState: SharedRuntimeCoreEngineRecord["operationalState"],
    config: SharedRuntimeCoreConfiguration,
    lastReportId: string | null = null,
  ) {
    const deps = this.integrations.getDependencies();
    const dependencyStatus = this.runtimeRegistry.resolveDependencies(deps);
    const handshakes = this.runtimeRegistry.buildIntegrationHandshakes(deps);
    const health = this.healthMonitor.evaluate(this.store, handshakes, dependencyStatus);
    this.engineRecord = {
      engineId: SHARED_RUNTIME_CORE_ID,
      workerId: config.workerId,
      operationalState,
      healthStatus: health.healthStatus,
      totalFactories: this.store.listFactories().length,
      totalWorkers: this.store.listWorkers().length,
      totalServices: this.store.listServices().length,
      totalRoutes: this.store.listRoutes().length,
      lastReportId: lastReportId ?? this.engineRecord?.lastReportId ?? null,
      supportedCapabilities: [...SRTC_CAPABILITIES],
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: SRTC_METADATA_VERSION,
    };
  }

  private reportAction(
    action: string,
    started: number,
    input: SrtcInput,
    config: SharedRuntimeCoreConfiguration,
    routingRecord: RoutingRecord | null = null,
    executionContext: ExecutionContext | null = null,
    sharedRuntimeReport: SharedRuntimeReport | null = null,
    handshakes = this.runtimeRegistry.buildIntegrationHandshakes(this.integrations.getDependencies()),
  ): SrtcRunReport {
    const validation = this.validator.validateInput(input, started);
    const deps = this.integrations.getDependencies();
    const dependencyStatus = this.runtimeRegistry.resolveDependencies(deps);
    const health = this.healthMonitor.evaluate(this.store, handshakes, dependencyStatus);
    this.ensureRecord("active", config, sharedRuntimeReport?.reportId ?? this.engineRecord?.lastReportId ?? null);
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: validation.decision,
      validation,
      sharedRuntimeReport,
      routingRecord,
      executionContext,
      topology: this.reportBuilder.buildTopology(this.store, dependencyStatus),
      errors: validation.errors,
      warnings: validation.warnings.length
        ? validation.warnings
        : health.healthStatus !== "healthy"
          ? health.notes
          : [],
    };
  }

  private failReport(
    action: string,
    started: number,
    validation: SrtcRunReport["validation"],
    config: SharedRuntimeCoreConfiguration,
  ): SrtcRunReport {
    this.ensureRecord("failed", config);
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "fail",
      validation,
      sharedRuntimeReport: null,
      routingRecord: null,
      executionContext: null,
      topology: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }
}

export { resetSrtcSequenceForTesting };
