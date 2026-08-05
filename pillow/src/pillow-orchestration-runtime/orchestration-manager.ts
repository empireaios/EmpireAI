import type { PillowOrchestrationRuntimeConfiguration } from "./configuration.js";
import { CommandDispatcher } from "./command-dispatcher.js";
import { ExecutionContextManager } from "./execution-context-manager.js";
import { FailureEscalationInterface } from "./failure-escalation.js";
import {
  PorIntegrationCoordinator,
  type PillowOrchestrationRuntimeDependencies,
} from "./integrations.js";
import { appendPorLog } from "./por-logging.js";
import { PermissionValidator } from "./permission-validator.js";
import {
  INTEGRATION_TARGETS,
  PILLOW_ORCHESTRATION_RUNTIME_ID,
  POR_CAPABILITIES,
  POR_METADATA_VERSION,
} from "./paths.js";
import { ReportBuilder } from "./report-builder.js";
import { OrchestrationStore, nextPorId, resetPorSequenceForTesting } from "./orchestration-store.js";
import { OrchestrationValidator } from "./orchestration-validator.js";
import { RuntimeSessionManager } from "./session-manager.js";
import type {
  IntegrationHandshake,
  OrchestrationReport,
  PorEngineRecord,
  PorInput,
  PorRunReport,
  Q1003ConsumableContract,
} from "./types.js";

export class OrchestrationManager {
  private engineRecord: PorEngineRecord | null = null;
  private seeded = false;
  private readonly store = new OrchestrationStore();
  private readonly validator = new OrchestrationValidator();
  private readonly permissionValidator = new PermissionValidator();
  private readonly commandDispatcher = new CommandDispatcher();
  private readonly sessionManager = new RuntimeSessionManager();
  private readonly executionContextManager = new ExecutionContextManager();
  private readonly failureEscalation = new FailureEscalationInterface();
  private readonly reportBuilder = new ReportBuilder();
  private readonly integrations = new PorIntegrationCoordinator();

  bindIntegrations(deps: PillowOrchestrationRuntimeDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getDependencies();
  }

  ensureSeeded(_config: PillowOrchestrationRuntimeConfiguration) {
    if (this.seeded) return;
    this.seeded = true;
    this.ensureRecord("connected", _config);
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

  getQ1003ConsumableContract(config: PillowOrchestrationRuntimeConfiguration): Q1003ConsumableContract {
    return this.reportBuilder.buildQ1003ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: PillowOrchestrationRuntimeConfiguration): PorRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendPorLog({
      event: "connect",
      details: `Pillow Orchestration Runtime connected; integrations=${handshakes.filter((h) => h.available).length}`,
    });
    return this.reportAction("connect", started, { validated: true }, config, null, handshakes);
  }

  createSession(input: PorInput, config: PillowOrchestrationRuntimeConfiguration): PorRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("create_session", started, validation, config);
    }
    const permission = this.permissionValidator.validate(input, config);
    if (!permission.permitted) {
      return this.failReport(
        "create_session",
        started,
        { ...validation, decision: "fail", errors: [...validation.errors, ...permission.reasons] },
        config,
      );
    }
    const ctx = this.executionContextManager.propagate(
      this.store,
      this.integrations,
      input.sessionId ?? nextPorId("por-session"),
      input.requestId ?? nextPorId("por-req"),
      input,
    );
    const session = this.sessionManager.createSession(this.store, input, ctx.contextId);
    this.ensureRecord("active", config);
    return this.reportAction("create_session", started, input, config, session);
  }

  invokeWorker(input: PorInput, config: PillowOrchestrationRuntimeConfiguration): PorRunReport {
    return this.invokeKind("invoke_worker", input, config, (sessionId, requestId) =>
      this.commandDispatcher.dispatch(this.store, this.integrations, sessionId, requestId, input, config),
    );
  }

  invokeTool(input: PorInput, config: PillowOrchestrationRuntimeConfiguration): PorRunReport {
    return this.invokeKind("invoke_tool", input, config, (sessionId, requestId) =>
      this.commandDispatcher.dispatch(this.store, this.integrations, sessionId, requestId, input, config),
    );
  }

  invokeWorkflow(input: PorInput, config: PillowOrchestrationRuntimeConfiguration): PorRunReport {
    return this.invokeKind("invoke_workflow", input, config, (sessionId, requestId) =>
      this.commandDispatcher.dispatch(this.store, this.integrations, sessionId, requestId, input, config),
    );
  }

  routeApproval(input: PorInput, config: PillowOrchestrationRuntimeConfiguration): PorRunReport {
    return this.invokeKind("route_approval", input, config, (sessionId, requestId) =>
      this.commandDispatcher.dispatch(this.store, this.integrations, sessionId, requestId, input, config),
    );
  }

  retrieveReport(input: PorInput, config: PillowOrchestrationRuntimeConfiguration): PorRunReport {
    return this.invokeKind("retrieve_report", input, config, (sessionId, requestId) =>
      this.commandDispatcher.dispatch(this.store, this.integrations, sessionId, requestId, input, config),
    );
  }

  orchestrateCrossFactory(input: PorInput, config: PillowOrchestrationRuntimeConfiguration): PorRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("orchestrate_cross_factory", started, validation, config);
    }
    const permission = this.permissionValidator.validate(input, config, { kind: "cross_factory" });
    if (!permission.permitted) {
      return this.failReport(
        "orchestrate_cross_factory",
        started,
        { ...validation, decision: "fail", errors: [...validation.errors, ...permission.reasons] },
        config,
      );
    }

    const sessionId = input.sessionId ?? nextPorId("por-session");
    const requestId = input.requestId ?? nextPorId("por-req");
    const route = input.crossFactoryRoute;
    const deps = this.integrations.getDependencies();
    const srtc = deps.sharedRuntimeCore;
    let crossFactoryStatus = "structural_recorded";

    if (route && srtc?.routeRequest) {
      const routeResult = srtc.routeRequest({
        sourceFactory: route.sourceFactory,
        targetFactory: route.targetFactory,
        service: route.service,
        validated: true,
        pillowCommandConfirmed: input.pillowConfirmed,
        grandKingApproved: input.grandKingApproved,
      }) as { routingRecord?: { routingStatus?: string }; decision?: string } | null;
      if (routeResult?.routingRecord?.routingStatus === "routed" || routeResult?.decision === "pass") {
        crossFactoryStatus = "succeeded";
      }
    }

    this.store.appendEvent({
      entryId: nextPorId("por-event"),
      timestamp: new Date().toISOString(),
      kind: "cross_factory",
      label: "cross_factory_orchestration",
      status: crossFactoryStatus,
      notes: route
        ? [`${route.sourceFactory} → ${route.targetFactory}:${route.service}`]
        : ["No crossFactoryRoute provided"],
    });

    appendPorLog({ event: "orchestrate_cross_factory", details: crossFactoryStatus });
    this.ensureRecord("active", config);
    return this.reportAction("orchestrate_cross_factory", started, input, config);
  }

  produceOrchestrationReport(input: PorInput, config: PillowOrchestrationRuntimeConfiguration): PorRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("produce_orchestration_report", started, validation, config);
    }

    const sessionId = input.sessionId ?? nextPorId("por-session");
    const requestId = input.requestId ?? nextPorId("por-req");
    const handshakes = this.integrations.connect(config.integrationTargets);
    const orchestrationReport = this.reportBuilder.buildOrchestrationReport(this.store, config, {
      sessionId,
      requestId,
      runtimeState: "active",
      handshakes,
      auditStatus: handshakes.some((h) => h.available) ? "partial" : "not_audited",
      outstandingIssues: handshakes.filter((h) => !h.available).map((h) => `${h.target} unavailable`),
      confidenceScore: this.computeConfidence(handshakes),
      supportingEvidence: [
        "Pillow Orchestration Runtime structural orchestration records",
        `Services: ${config.orchestrationServices.length}`,
      ],
    });
    this.store.saveReport(orchestrationReport);
    this.ensureRecord("active", config, orchestrationReport.reportId);
    appendPorLog({ event: "produce_orchestration_report", details: orchestrationReport.reportId });

    return {
      action: "produce_orchestration_report",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "pass",
      validation,
      orchestrationReport,
      session: this.store.getSession(sessionId),
      invocationResults: this.store.listResults(),
      approvalActions: this.store.listApprovalActions(),
      executionTimeline: this.store.listEvents(),
      errors: [],
      warnings: [],
    };
  }

  submitReport(input: PorInput, config: PillowOrchestrationRuntimeConfiguration): PorRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const latest = this.store.getLatestReport();
    if (latest) {
      this.integrations.submitReport(latest);
      this.integrations.recordAudit({ reportId: latest.reportId, action: "submit_orchestration_report" });
    }
    return this.reportAction("submit_report", started, input, config, null, [], latest);
  }

  list(_input: PorInput, config: PillowOrchestrationRuntimeConfiguration): PorRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    return this.reportAction("list", started, { validated: true }, config);
  }

  validate(input: PorInput, config: PillowOrchestrationRuntimeConfiguration): PorRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("validate", started, validation, config);
    }
    return this.reportAction("validate", started, input, config);
  }

  diagnostics(_input: PorInput, config: PillowOrchestrationRuntimeConfiguration): PorRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(config.integrationTargets);
    this.reportBuilder.buildDiagnostics(this.store, handshakes);
    return this.reportAction("diagnostics", started, { validated: true }, config, null, handshakes);
  }

  private invokeKind(
    action: string,
    input: PorInput,
    config: PillowOrchestrationRuntimeConfiguration,
    dispatch: (sessionId: string, requestId: string) => ReturnType<CommandDispatcher["dispatch"]>,
  ): PorRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport(action, started, validation, config);
    }
    const permission = this.permissionValidator.validate(input, config, {
      highRisk: input.highRisk,
      kind: action,
    });
    if (!permission.permitted) {
      return this.failReport(
        action,
        started,
        { ...validation, decision: "fail", errors: [...validation.errors, ...permission.reasons] },
        config,
      );
    }

    const sessionId = input.sessionId ?? nextPorId("por-session");
    const requestId = input.requestId ?? nextPorId("por-req");
    if (!this.store.getSession(sessionId)) {
      this.sessionManager.createSession(this.store, { ...input, sessionId, requestId });
    }
    this.executionContextManager.propagate(this.store, this.integrations, sessionId, requestId, input);
    const outcome = dispatch(sessionId, requestId);
    this.ensureRecord("active", config);

    const allResults = [
      ...outcome.workerResults,
      ...outcome.toolResults,
      ...outcome.workflowResults,
      ...outcome.reportResults,
    ];
    const hasBlocked = allResults.some((r) => r.status === "blocked") ||
      outcome.approvalActions.some((a) => a.status === "blocked");

    if (hasBlocked) {
      this.failureEscalation.escalate(this.integrations, `${action}_blocked`, "warning");
    }

    appendPorLog({ event: action, details: `results=${allResults.length}` });
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: hasBlocked ? "fail" : "pass",
      validation,
      orchestrationReport: null,
      session: this.store.getSession(sessionId),
      invocationResults: allResults,
      approvalActions: outcome.approvalActions,
      executionTimeline: this.store.listEvents(),
      errors: hasBlocked ? ["One or more invocations blocked"] : [],
      warnings: [],
    };
  }

  private computeConfidence(handshakes: IntegrationHandshake[]) {
    const available = handshakes.filter((h) => h.available).length;
    const ratio = handshakes.length ? available / handshakes.length : 0.5;
    return Math.round(50 + ratio * 40);
  }

  private ensureRecord(
    state: PorEngineRecord["operationalState"],
    config: PillowOrchestrationRuntimeConfiguration,
    lastReportId: string | null = null,
  ) {
    const history = this.store.getHistory();
    this.engineRecord = {
      engineId: PILLOW_ORCHESTRATION_RUNTIME_ID,
      workerId: config.workerId,
      operationalState: state,
      healthStatus: state === "failed" ? "failed" : state === "active" ? "healthy" : "standby",
      totalSessions: history.sessions.length,
      totalInvocations: history.results.length,
      totalReports: history.reports.length,
      lastReportId: lastReportId ?? this.engineRecord?.lastReportId ?? null,
      supportedCapabilities: [...POR_CAPABILITIES],
      integrationTargets: config.integrationTargets as PorEngineRecord["integrationTargets"],
      metadataVersion: POR_METADATA_VERSION,
    };
  }

  private reportAction(
    action: string,
    started: number,
    input: PorInput,
    config: PillowOrchestrationRuntimeConfiguration,
    session: PorRunReport["session"] = null,
    handshakes: IntegrationHandshake[] = [],
    orchestrationReport: OrchestrationReport | null = null,
  ): PorRunReport {
    const validation = this.validator.validateInput(input, started);
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: validation.decision === "fail" ? "fail" : "pass",
      validation,
      orchestrationReport: orchestrationReport ?? this.store.getLatestReport() ?? null,
      session,
      invocationResults: this.store.listResults(),
      approvalActions: this.store.listApprovalActions(),
      executionTimeline: this.store.listEvents(),
      errors: validation.errors,
      warnings: validation.warnings.length
        ? validation.warnings
        : handshakes.filter((h) => !h.available).map((h) => `${h.target} unavailable`),
    };
  }

  private failReport(
    action: string,
    started: number,
    validation: PorRunReport["validation"],
    _config: PillowOrchestrationRuntimeConfiguration,
  ): PorRunReport {
    this.ensureRecord("failed", _config);
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "fail",
      validation,
      orchestrationReport: null,
      session: null,
      invocationResults: [],
      approvalActions: [],
      executionTimeline: [],
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }
}

export { resetPorSequenceForTesting };
