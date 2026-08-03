import type { ExecutiveCommandCenterConfiguration } from "./configuration.js";
import { appendPeccLog } from "./pecc-logging.js";
import { ExecutiveCommandRegistry } from "./executive-command-registry.js";
import { ExecutiveCommandRouter } from "./executive-command-router.js";
import { ExecutiveCommandStore } from "./executive-command-store.js";
import {
  ExecutiveCommandCenterMetadataGenerator,
  ExecutiveCommandValidator,
  HealthMonitor,
  RecoveryManager,
} from "./executive-command-validator.js";
import {
  EXECUTIVE_COMMAND_CENTER_ID,
  PECC_CAPABILITIES,
  PECC_METADATA_VERSION,
} from "./paths.js";
import type {
  ApprovalView,
  BusinessStateView,
  ExecutiveCommandCenterEngineRecord,
  ExecutiveCommandCenterInput,
  ExecutiveCommandCenterRunReport,
  ExecutiveCommandRecord,
  ExecutiveReportView,
  MemoryView,
  OperationalState,
  RegisteredMission,
  RegisteredTool,
  RegisteredWorker,
  RoutedService,
} from "./types.js";

export class ExecutiveCommandCenterCore {
  private engineRecord: ExecutiveCommandCenterEngineRecord | null = null;
  private seeded = false;
  private readonly store = new ExecutiveCommandStore();
  private readonly registry = new ExecutiveCommandRegistry();
  private readonly router = new ExecutiveCommandRouter();
  private readonly validator = new ExecutiveCommandValidator();
  private readonly metadata = new ExecutiveCommandCenterMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: ExecutiveCommandCenterConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedCommands);
    this.registry.seed(config);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getRecords() {
    return this.store.list();
  }

  getLatestRecord() {
    const records = this.getRecords();
    return records[records.length - 1] ?? null;
  }

  connect(
    _input: Record<string, unknown>,
    config: ExecutiveCommandCenterConfiguration,
  ): ExecutiveCommandCenterRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendPeccLog({
      event: "connect",
      details: "Executive Command Center connected; coordinate/route-only mode",
    });
    return this.report(
      "connect",
      [],
      null,
      emptyViews(),
      {
        validationReportId: `pecc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Executive Command Center is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: PECC_METADATA_VERSION,
      },
      started,
    );
  }

  submitCommand(input: ExecutiveCommandCenterInput, config: ExecutiveCommandCenterConfiguration) {
    return this.runRouted("submit_command", input, config, true);
  }

  queryBusinessState(input: ExecutiveCommandCenterInput, config: ExecutiveCommandCenterConfiguration) {
    return this.accessService("query_business_state", "business_state", "executive_query", input, config);
  }

  accessWorkers(input: ExecutiveCommandCenterInput, config: ExecutiveCommandCenterConfiguration) {
    return this.accessService("access_workers", "workers", "executive_monitoring", input, config);
  }

  accessTools(input: ExecutiveCommandCenterInput, config: ExecutiveCommandCenterConfiguration) {
    return this.accessService("access_tools", "tools", "executive_routing", input, config);
  }

  accessMissions(input: ExecutiveCommandCenterInput, config: ExecutiveCommandCenterConfiguration) {
    return this.accessService("access_missions", "missions", "executive_planning", input, config);
  }

  accessApprovals(input: ExecutiveCommandCenterInput, config: ExecutiveCommandCenterConfiguration) {
    return this.accessService("access_approvals", "approvals", "executive_approval", input, config);
  }

  accessExecutionMemory(
    input: ExecutiveCommandCenterInput,
    config: ExecutiveCommandCenterConfiguration,
  ) {
    return this.accessService(
      "access_execution_memory",
      "execution_memory",
      "executive_inspection",
      input,
      config,
    );
  }

  accessDecisionMemory(
    input: ExecutiveCommandCenterInput,
    config: ExecutiveCommandCenterConfiguration,
  ) {
    return this.accessService(
      "access_decision_memory",
      "decision_memory",
      "executive_review",
      input,
      config,
    );
  }

  accessExecutiveReports(
    input: ExecutiveCommandCenterInput,
    config: ExecutiveCommandCenterConfiguration,
  ) {
    return this.accessService(
      "access_executive_reports",
      "executive_reports",
      "executive_reporting",
      input,
      config,
    );
  }

  list(config: ExecutiveCommandCenterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const validation = this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report("list", records, null, emptyViews(), validation, started);
  }

  validate(input: ExecutiveCommandCenterInput, config: ExecutiveCommandCenterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const validation = this.validator.validateRecords(records, { ...input, validated: input.validated ?? true }, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report("validate", records, null, emptyViews(), validation, started);
  }

  diagnostics(config: ExecutiveCommandCenterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const counts = this.registry.counts();
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Executive Command Center is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendPeccLog({
      event: "diagnostics",
      details: `commands=${this.store.count()} workers=${counts.workers} tools=${counts.tools}`,
    });
    return this.report("diagnostics", this.store.list(), null, {
      workers: this.registry.listWorkers(),
      tools: this.registry.listTools(null, true),
      missions: this.registry.listMissions(),
      businessStates: this.registry.listBusinessStates(),
      approvals: this.registry.listApprovals(),
      executionMemory: this.registry.listExecutionMemory(),
      decisionMemory: this.registry.listDecisionMemory(),
      executiveReports: this.registry.listExecutiveReports(),
    }, validation, started);
  }

  private runRouted(
    action: ExecutiveCommandCenterRunReport["action"],
    input: ExecutiveCommandCenterInput,
    config: ExecutiveCommandCenterConfiguration,
    requireRequest: boolean,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.routingRulesEnabled) {
      const validation = this.validator.finalize(
        "fail",
        [!config.enabled ? "Executive Command Center is disabled" : "Routing rules are disabled"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], null, emptyViews(), validation, started);
    }

    if (this.validator.decide(input) === "fail" && this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, requireRequest);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], null, emptyViews(), validation, started);
    }

    const capability = this.router.resolveCapability(input, config);
    const service = this.router.resolveService(input, capability, config);
    const views = this.collectViews(service, input);
    const knownCapability = this.router.isKnownCapability(String(capability), config);
    const knownService = this.router.isKnownService(String(service), config);

    const status =
      this.validator.decide(input) === "fail"
        ? "rejected"
        : knownService && knownCapability
          ? "completed"
          : "routed";

    const result = summarizeResult(service, views, capability);
    const record = this.store.buildRecord({
      input,
      requestedCapability: capability,
      routedService: service,
      currentStatus: status,
      result,
      relatedWorkers: views.workers.map((w) => w.workerId),
      relatedTools: views.tools.map((t) => t.toolId),
      payloadSummary: result,
      validationStatus:
        status === "rejected" ? "failed" : status === "completed" ? "passed" : "partial",
    });

    const validation = this.validator.validateRecords(
      [record],
      { ...input, validated: input.validated ?? true },
      started,
      requireRequest,
    );
    if (!knownCapability) validation.warnings.push(`Unknown command type routed: ${capability}`);
    if (!knownService) validation.warnings.push(`Unknown routed service: ${service}`);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendPeccLog({
      event: action,
      details: `capability=${capability} service=${service} status=${status}`,
    });
    this.metadata.generate(this.store.count(), this.registry.counts().workers);
    return this.report(action, [record], service, views, validation, started);
  }

  private accessService(
    action: ExecutiveCommandCenterRunReport["action"],
    service: RoutedService,
    capability: string,
    input: ExecutiveCommandCenterInput,
    config: ExecutiveCommandCenterConfiguration,
  ) {
    return this.runRouted(
      action,
      {
        ...input,
        routedService: service,
        requestedCapability: input.requestedCapability ?? capability,
        executiveRequest:
          input.executiveRequest ??
          `Access ${service} through Executive Command Center`,
      },
      config,
      false,
    );
  }

  private collectViews(service: RoutedService | string, input: ExecutiveCommandCenterInput) {
    const views = emptyViews();
    switch (service) {
      case "workers":
        views.workers = this.registry.listWorkers(input.workerId ?? input.query);
        break;
      case "tools":
        views.tools = this.registry.listTools(input.toolId ?? input.query, true);
        break;
      case "missions":
        views.missions = this.registry.listMissions(input.relatedMission ?? input.query);
        break;
      case "business_state":
        views.businessStates = this.registry.listBusinessStates(
          input.relatedBusiness ?? input.query,
        );
        break;
      case "approvals":
        views.approvals = this.registry.listApprovals(input.query);
        break;
      case "execution_memory":
        views.executionMemory = this.registry.listExecutionMemory(input.query);
        break;
      case "decision_memory":
        views.decisionMemory = this.registry.listDecisionMemory(input.query);
        break;
      case "executive_reports":
        views.executiveReports = this.registry.listExecutiveReports(input.reportId ?? input.query);
        break;
      default:
        views.businessStates = this.registry.listBusinessStates(input.relatedBusiness);
        break;
    }
    return views;
  }

  private hasBoundary(input: ExecutiveCommandCenterInput) {
    return (
      input.executeWorkerLogic === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.replaceWorkers === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: ExecutiveCommandCenterConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
  ) {
    const counts = this.registry.counts();
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `pecc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EXECUTIVE_COMMAND_CENTER_ID,
      engineVersion: "PILLOW-PECC-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...PECC_CAPABILITIES],
      totalCommandRecords: this.store.count(),
      registeredWorkerCount: counts.workers,
      registeredToolCount: counts.tools,
      metadataVersion: PECC_METADATA_VERSION,
    };
  }

  private report(
    action: ExecutiveCommandCenterRunReport["action"],
    records: ExecutiveCommandRecord[],
    routedService: RoutedService | string | null,
    views: {
      workers: RegisteredWorker[];
      tools: RegisteredTool[];
      missions: RegisteredMission[];
      businessStates: BusinessStateView[];
      approvals: ApprovalView[];
      executionMemory: MemoryView[];
      decisionMemory: MemoryView[];
      executiveReports: ExecutiveReportView[];
    },
    validation: ExecutiveCommandCenterRunReport["validation"],
    started: number,
  ): ExecutiveCommandCenterRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      commandRunReportId: `pecc-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      records,
      routedService,
      workers: views.workers,
      tools: views.tools,
      missions: views.missions,
      businessStates: views.businessStates,
      approvals: views.approvals,
      executionMemory: views.executionMemory,
      decisionMemory: views.decisionMemory,
      executiveReports: views.executiveReports,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PECC_METADATA_VERSION,
    };
  }
}

function emptyViews() {
  return {
    workers: [] as RegisteredWorker[],
    tools: [] as RegisteredTool[],
    missions: [] as RegisteredMission[],
    businessStates: [] as BusinessStateView[],
    approvals: [] as ApprovalView[],
    executionMemory: [] as MemoryView[],
    decisionMemory: [] as MemoryView[],
    executiveReports: [] as ExecutiveReportView[],
  };
}

function summarizeResult(
  service: RoutedService | string,
  views: ReturnType<typeof emptyViews>,
  capability: string,
): string {
  const counts: Record<string, number> = {
    workers: views.workers.length,
    tools: views.tools.length,
    missions: views.missions.length,
    business_state: views.businessStates.length,
    approvals: views.approvals.length,
    execution_memory: views.executionMemory.length,
    decision_memory: views.decisionMemory.length,
    executive_reports: views.executiveReports.length,
  };
  const count = counts[String(service)] ?? 0;
  return `Routed ${capability} to ${service}; returned ${count} structural item(s); worker logic not executed`;
}
