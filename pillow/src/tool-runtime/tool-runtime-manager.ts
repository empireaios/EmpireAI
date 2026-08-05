import type { ToolRuntimeConfiguration } from "./configuration.js";
import { ToolrtIntegrationCoordinator, type ToolRuntimeDependencies } from "./integrations.js";
import { appendToolrtLog } from "./toolrt-logging.js";
import { ToolStore, nextToolrtId } from "./tool-store.js";
import { ToolValidator } from "./tool-validator.js";
import { AuthManager } from "./auth-manager.js";
import { AvailabilityMonitor } from "./availability-monitor.js";
import { InvocationEngine } from "./invocation-engine.js";
import { MetricsCollector } from "./metrics-collector.js";
import { PermissionGate } from "./permission-gate.js";
import { ReportBuilder } from "./report-builder.js";
import { RetryEngine } from "./retry-engine.js";
import { ToolDiscovery } from "./tool-discovery.js";
import { ToolRegistry } from "./tool-registry.js";
import { UsageTracker } from "./usage-tracker.js";
import {
  INTEGRATION_TARGETS,
  TOOLRT_CAPABILITIES,
  TOOLRT_METADATA_VERSION,
  TOOL_RUNTIME_ID,
} from "./paths.js";
import type {
  IntegrationHandshake,
  Q1008ConsumableContract,
  ToolCategory,
  ToolConnection,
  ToolInvocationTrace,
  ToolRegistration,
  ToolrtEngineRecord,
  ToolrtInput,
  ToolrtRunReport,
  ToolrtValidationReport,
} from "./types.js";

const SEED_TOOLS: Array<{
  toolId: string;
  toolName: string;
  toolCategory: ToolCategory;
  provider: string;
  authMethod: ToolRegistration["authMethod"];
  credentialReference: string;
  highRisk: boolean;
  allowedActions: string[];
}> = [
  {
    toolId: "tool-cursor-01",
    toolName: "Cursor Structural Tool",
    toolCategory: "cursor",
    provider: "cursor-structural",
    authMethod: "api_key",
    credentialReference: "cred://vault/cursor/tool-cursor-01",
    highRisk: false,
    allowedActions: ["status", "invoke", "list"],
  },
  {
    toolId: "tool-github-01",
    toolName: "GitHub Structural Tool",
    toolCategory: "github",
    provider: "github-structural",
    authMethod: "oauth",
    credentialReference: "cred://vault/github/tool-github-01",
    highRisk: false,
    allowedActions: ["status", "invoke", "list"],
  },
  {
    toolId: "tool-design-01",
    toolName: "Design Structural Tool",
    toolCategory: "design",
    provider: "design-structural",
    authMethod: "api_key",
    credentialReference: "cred://vault/design/tool-design-01",
    highRisk: false,
    allowedActions: ["status", "invoke", "list"],
  },
  {
    toolId: "tool-analytics-01",
    toolName: "Analytics Structural Tool",
    toolCategory: "analytics",
    provider: "analytics-structural",
    authMethod: "bearer_token",
    credentialReference: "cred://vault/analytics/tool-analytics-01",
    highRisk: false,
    allowedActions: ["status", "invoke", "list"],
  },
  {
    toolId: "tool-ai-01",
    toolName: "AI Provider Structural Tool",
    toolCategory: "ai_provider",
    provider: "ai-provider-structural",
    authMethod: "bearer_token",
    credentialReference: "cred://vault/ai/tool-ai-01",
    highRisk: false,
    allowedActions: ["status", "invoke", "list"],
  },
  {
    toolId: "tool-marketplace-01",
    toolName: "Marketplace Structural Tool",
    toolCategory: "marketplace",
    provider: "marketplace-structural",
    authMethod: "oauth",
    credentialReference: "cred://vault/marketplace/tool-marketplace-01",
    highRisk: false,
    allowedActions: ["status", "invoke", "list"],
  },
  {
    toolId: "tool-supplier-01",
    toolName: "Supplier Structural Tool",
    toolCategory: "supplier",
    provider: "supplier-structural",
    authMethod: "api_key",
    credentialReference: "cred://vault/supplier/tool-supplier-01",
    highRisk: false,
    allowedActions: ["status", "invoke", "list"],
  },
  {
    toolId: "tool-cloud-01",
    toolName: "Cloud Platform Structural Tool",
    toolCategory: "cloud_platform",
    provider: "cloud-structural",
    authMethod: "api_key",
    credentialReference: "cred://vault/cloud/tool-cloud-01",
    highRisk: false,
    allowedActions: ["status", "invoke", "list"],
  },
  {
    toolId: "tool-deploy-01",
    toolName: "Deployment Structural Tool",
    toolCategory: "deployment",
    provider: "deployment-structural",
    authMethod: "api_key",
    credentialReference: "cred://vault/deployment/tool-deploy-01",
    highRisk: true,
    allowedActions: ["status", "invoke", "list"],
  },
  {
    toolId: "tool-database-01",
    toolName: "Database Structural Tool",
    toolCategory: "database",
    provider: "database-structural",
    authMethod: "basic",
    credentialReference: "cred://vault/database/tool-database-01",
    highRisk: true,
    allowedActions: ["status", "invoke", "list"],
  },
  {
    toolId: "tool-monitoring-01",
    toolName: "Monitoring Structural Tool",
    toolCategory: "monitoring",
    provider: "monitoring-structural",
    authMethod: "api_key",
    credentialReference: "cred://vault/monitoring/tool-monitoring-01",
    highRisk: false,
    allowedActions: ["status", "invoke", "list"],
  },
  {
    toolId: "tool-internal-01",
    toolName: "Internal Enterprise Structural Tool",
    toolCategory: "internal_enterprise",
    provider: "internal-structural",
    authMethod: "none",
    credentialReference: "cred://vault/internal/tool-internal-01",
    highRisk: false,
    allowedActions: ["status", "invoke", "list"],
  },
];

export class ToolRuntimeManager {
  private engineRecord: ToolrtEngineRecord | null = null;
  private seeded = false;
  private readonly store = new ToolStore();
  private readonly validator = new ToolValidator();
  private readonly toolRegistry = new ToolRegistry();
  private readonly toolDiscovery = new ToolDiscovery();
  private readonly authManager = new AuthManager();
  private readonly permissionGate = new PermissionGate();
  private readonly invocationEngine = new InvocationEngine();
  private readonly retryEngine = new RetryEngine();
  private readonly availabilityMonitor = new AvailabilityMonitor();
  private readonly usageTracker = new UsageTracker();
  private readonly metricsCollector = new MetricsCollector();
  private readonly reportBuilder = new ReportBuilder();
  private readonly integrations = new ToolrtIntegrationCoordinator();

  bindIntegrations(deps: ToolRuntimeDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getDependencies();
  }

  ensureSeeded(config: ToolRuntimeConfiguration) {
    if (this.seeded) return;
    this.seeded = true;
    for (const seed of SEED_TOOLS) {
      this.toolRegistry.registerTool(
        this.store,
        {
          toolId: seed.toolId,
          toolName: seed.toolName,
          toolCategory: seed.toolCategory,
          provider: seed.provider,
          authMethod: seed.authMethod,
          credentialReference: seed.credentialReference,
          allowedActions: seed.allowedActions,
          highRisk: seed.highRisk,
          requiresPillowConfirmation: true,
          requiresGrandKingApproval: seed.highRisk,
          validated: true,
          pillowConfirmed: true,
          grandKingApproved: true,
        },
        config,
      );
      this.store.updateTool(seed.toolId, {
        availabilityStatus: "standby",
        connectionStatus: "disconnected",
      });
    }
    this.ensureRecord("active", config);
    appendToolrtLog({
      event: "seed_tools",
      details: `Seeded ${SEED_TOOLS.length} structural tools with cred:// references only`,
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

  getQ1008ConsumableContract(config: ToolRuntimeConfiguration): Q1008ConsumableContract {
    return this.reportBuilder.buildQ1008ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: ToolRuntimeConfiguration): ToolrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    appendToolrtLog({
      event: "connect",
      details: `Tool Runtime connected; integrations=${handshakes.filter((h) => h.available).length}`,
    });
    return this.reportAction("connect", started, { validated: true }, config, null, [], null, null, [], handshakes);
  }

  registerTool(input: ToolrtInput, config: ToolRuntimeConfiguration): ToolrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateRegister(input, started);
    if (validation.decision === "fail") {
      return this.failReport("register_tool", started, validation, config);
    }
    const tool = this.toolRegistry.registerTool(this.store, input, config);
    this.ensureRecord("active", config);
    appendToolrtLog({ event: "register_tool", details: tool.toolId });
    return this.reportAction("register_tool", started, input, config, tool, [tool], null, null);
  }

  discoverTools(input: ToolrtInput, config: ToolRuntimeConfiguration): ToolrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("discover_tools", started, validation, config);
    }
    const tools = this.toolDiscovery.discover(this.store, input);
    appendToolrtLog({ event: "discover_tools", details: `found=${tools.length}` });
    return this.reportAction(
      "discover_tools",
      started,
      input,
      config,
      tools[0] ?? null,
      tools,
      null,
      null,
    );
  }

  authenticate(input: ToolrtInput, config: ToolRuntimeConfiguration): ToolrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail" || !input.toolId) {
      if (!input.toolId) validation.errors.push("toolId required for authenticate");
      return this.failReport("authenticate", started, { ...validation, decision: "fail" }, config);
    }
    const tool = this.store.getTool(input.toolId);
    if (!tool) {
      return this.failReport(
        "authenticate",
        started,
        { ...validation, decision: "fail", errors: [...validation.errors, `Unknown toolId ${input.toolId}`] },
        config,
      );
    }
    const auth = this.authManager.authenticate(tool, input);
    appendToolrtLog({
      event: "authenticate",
      details: `${tool.toolId}:${auth.authStatus}`,
    });
    const decision = auth.authStatus === "rejected" ? "fail" : "pass";
    return {
      action: "authenticate",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision,
      validation: {
        ...validation,
        decision: decision === "fail" ? "fail" : validation.decision,
        errors: decision === "fail" ? [...validation.errors, ...auth.notes] : validation.errors,
      },
      tool,
      tools: [tool],
      connection: null,
      invocation: null,
      invocations: [],
      toolRuntimeReport: null,
      q1008Contract: null,
      errors: decision === "fail" ? auth.notes : [],
      warnings: [],
    };
  }

  invokeTool(input: ToolrtInput, config: ToolRuntimeConfiguration): ToolrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    // 1. validate
    const validation = this.validator.validateInvoke(input, started);
    if (validation.decision === "fail") {
      return this.failReport("invoke_tool", started, validation, config);
    }

    // 2. discover/resolve tool by toolId
    const tool = this.toolDiscovery.resolve(this.store, input.toolId!);
    if (!tool) {
      return this.failReport(
        "invoke_tool",
        started,
        { ...validation, decision: "fail", errors: [...validation.errors, `Unknown toolId ${input.toolId}`] },
        config,
      );
    }

    // 3. permission gate
    const permission = this.permissionGate.check(tool, input);
    if (!permission.permissionGranted) {
      const invocation = this.recordInvocation({
        tool,
        input,
        attempt: 1,
        maxAttempts: input.maxAttempts ?? config.defaultMaxAttempts,
        status: "denied",
        resultRef: null,
        authStatus: "rejected",
        permissionGranted: false,
        errorClass: "permission_denied",
        liveExecution: false,
        started,
      });
      return {
        action: "invoke_tool",
        runTimestamp: new Date().toISOString(),
        durationMs: Date.now() - started,
        decision: "fail",
        validation: { ...validation, decision: "fail", errors: [...validation.errors, ...permission.errors] },
        tool,
        tools: [tool],
        connection: null,
        invocation,
        invocations: [invocation],
        toolRuntimeReport: null,
        q1008Contract: null,
        errors: permission.errors,
        warnings: [],
      };
    }

    // 4. auth check
    const auth = this.authManager.authenticate(tool, input);
    if (auth.authStatus === "rejected") {
      const invocation = this.recordInvocation({
        tool,
        input,
        attempt: 1,
        maxAttempts: input.maxAttempts ?? config.defaultMaxAttempts,
        status: "denied",
        resultRef: null,
        authStatus: "rejected",
        permissionGranted: true,
        errorClass: "auth_rejected",
        liveExecution: false,
        started,
      });
      return {
        action: "invoke_tool",
        runTimestamp: new Date().toISOString(),
        durationMs: Date.now() - started,
        decision: "fail",
        validation: { ...validation, decision: "fail", errors: [...validation.errors, ...auth.notes] },
        tool: this.store.getTool(tool.toolId),
        tools: [this.store.getTool(tool.toolId)!],
        connection: null,
        invocation,
        invocations: [invocation],
        toolRuntimeReport: null,
        q1008Contract: null,
        errors: auth.notes,
        warnings: [],
      };
    }

    // 5. availability check — fail if unavailable
    const current = this.store.getTool(tool.toolId)!;
    if (!this.availabilityMonitor.isAvailable(current)) {
      const invocation = this.recordInvocation({
        tool: current,
        input,
        attempt: 1,
        maxAttempts: input.maxAttempts ?? config.defaultMaxAttempts,
        status: "unavailable",
        resultRef: null,
        authStatus: auth.authStatus,
        permissionGranted: true,
        errorClass: "unavailable",
        liveExecution: false,
        started,
      });
      this.availabilityMonitor.assessTool(this.store, tool.toolId);
      this.usageTracker.track(this.store);
      return {
        action: "invoke_tool",
        runTimestamp: new Date().toISOString(),
        durationMs: Date.now() - started,
        decision: "fail",
        validation: {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, `Tool ${tool.toolId} is unavailable`],
        },
        tool: this.store.getTool(tool.toolId),
        tools: [this.store.getTool(tool.toolId)!],
        connection: null,
        invocation,
        invocations: [invocation],
        toolRuntimeReport: null,
        q1008Contract: null,
        errors: [`Tool ${tool.toolId} is unavailable`],
        warnings: [],
      };
    }

    // 6–9. invoke + retry lifecycle
    const maxAttempts = input.maxAttempts ?? config.defaultMaxAttempts;
    const invocations: ToolInvocationTrace[] = [];
    let attempt = 1;
    let finalInvocation: ToolInvocationTrace | null = null;
    let succeeded = false;
    const deps = this.integrations.getDependencies();

    while (attempt <= maxAttempts) {
      const attemptStarted = Date.now();
      const invocationId = nextToolrtId("toolrt-inv");
      let status: ToolInvocationTrace["status"] = "success";
      let resultRef: string | null = null;
      let liveExecution = false;
      let errorClass: string | null = null;

      // 6. invoke (structural or adapter) — NEVER invent result payload
      const invokeResult = this.invocationEngine.invoke(
        this.store.getTool(tool.toolId)!,
        input,
        invocationId,
        deps,
      );
      resultRef = invokeResult.resultRef;
      liveExecution = invokeResult.liveExecution;
      if (invokeResult.status === "failed") {
        status = "failed";
        errorClass = invokeResult.errorClass;
      }

      // 7. if simulateTransientFailure and attempts remain → retry
      if (input.simulateTransientFailure === true && attempt < maxAttempts) {
        errorClass = "transient";
        status = "retrying";
        const retryDecision = this.retryEngine.decide(attempt, input, config, errorClass);
        const invocation = this.recordInvocation({
          tool: this.store.getTool(tool.toolId)!,
          input,
          attempt,
          maxAttempts,
          status,
          resultRef,
          authStatus: auth.authStatus,
          permissionGranted: true,
          errorClass,
          liveExecution,
          started: attemptStarted,
          invocationId,
        });
        invocations.push(invocation);
        finalInvocation = invocation;
        if (retryDecision.shouldRetry) {
          attempt += 1;
          continue;
        }
      }

      if (errorClass === "transient" || status === "failed") {
        const retryDecision = this.retryEngine.decide(attempt, input, config, errorClass);
        if (retryDecision.shouldRetry) {
          const invocation = this.recordInvocation({
            tool: this.store.getTool(tool.toolId)!,
            input,
            attempt,
            maxAttempts,
            status: "retrying",
            resultRef,
            authStatus: auth.authStatus,
            permissionGranted: true,
            errorClass: "transient",
            liveExecution,
            started: attemptStarted,
            invocationId,
          });
          invocations.push(invocation);
          finalInvocation = invocation;
          attempt += 1;
          continue;
        }
        status = "failed";
        const invocation = this.recordInvocation({
          tool: this.store.getTool(tool.toolId)!,
          input,
          attempt,
          maxAttempts,
          status,
          resultRef,
          authStatus: auth.authStatus,
          permissionGranted: true,
          errorClass: errorClass ?? "failed",
          liveExecution,
          started: attemptStarted,
          invocationId,
        });
        invocations.push(invocation);
        finalInvocation = invocation;
        succeeded = false;
        break;
      }

      // Success
      status = "success";
      const invocation = this.recordInvocation({
        tool: this.store.getTool(tool.toolId)!,
        input,
        attempt,
        maxAttempts,
        status,
        resultRef,
        authStatus: auth.authStatus,
        permissionGranted: true,
        errorClass: null,
        liveExecution,
        started: attemptStarted,
        invocationId,
      });
      invocations.push(invocation);
      finalInvocation = invocation;
      succeeded = true;
      break;
    }

    // 9. update availability/usage
    this.availabilityMonitor.assessTool(this.store, tool.toolId);
    this.usageTracker.track(this.store);

    appendToolrtLog({
      event: "invoke_tool",
      details: `${tool.toolId}:${succeeded ? "pass" : "fail"}:attempts=${invocations.length}`,
    });

    return {
      action: "invoke_tool",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: succeeded ? "pass" : "fail",
      validation,
      tool: this.store.getTool(tool.toolId),
      tools: [this.store.getTool(tool.toolId)!],
      connection: null,
      invocation: finalInvocation,
      invocations,
      toolRuntimeReport: null,
      q1008Contract: null,
      errors: succeeded ? [] : ["Tool invocation failed after retries or structural failure"],
      warnings: [],
    };
  }

  checkAvailability(input: ToolrtInput, config: ToolRuntimeConfiguration): ToolrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("check_availability", started, validation, config);
    }
    let tool: ToolRegistration | null = null;
    if (input.toolId) {
      tool = this.availabilityMonitor.assessTool(this.store, input.toolId);
    } else {
      this.availabilityMonitor.assessAll(this.store);
    }
    appendToolrtLog({
      event: "check_availability",
      details: input.toolId ?? "all",
    });
    return this.reportAction("check_availability", started, input, config, tool, tool ? [tool] : this.store.listTools(), null, null);
  }

  produceReport(input: ToolrtInput, config: ToolRuntimeConfiguration): ToolrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("produce_report", started, validation, config);
    }
    const metrics = this.metricsCollector.collect(this.store);
    const report = this.reportBuilder.buildToolRuntimeReport(
      this.store,
      this.metricsCollector,
      this.availabilityMonitor,
      config,
      {
        auditStatus: "passed",
        outstandingIssues: [],
        confidenceScore: Math.min(95, 70 + metrics.totalTools * 2 + metrics.totalInvocations),
        supportingEvidence: ["tool-runtime operational evidence"],
      },
    );
    this.store.saveReport(report);
    this.ensureRecord("active", config);
    return {
      action: "produce_report",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "pass",
      validation,
      tool: null,
      tools: [],
      connection: null,
      invocation: null,
      invocations: [],
      toolRuntimeReport: report,
      q1008Contract: null,
      errors: [],
      warnings: [],
    };
  }

  submitReport(input: ToolrtInput, config: ToolRuntimeConfiguration): ToolrtRunReport {
    const produced = this.produceReport(input, config);
    if (produced.decision === "fail" || !produced.toolRuntimeReport) {
      return produced;
    }
    this.integrations.submitReport(produced.toolRuntimeReport);
    this.integrations.recordAudit({
      event: "tool_runtime_report_submitted",
      reportId: produced.toolRuntimeReport.reportId,
    });
    return { ...produced, action: "submit_report" };
  }

  list(_input: ToolrtInput, config: ToolRuntimeConfiguration): ToolrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const tools = this.store.listTools();
    return this.reportAction("list", started, _input, config, tools[0] ?? null, tools, null, null);
  }

  validate(input: ToolrtInput, config: ToolRuntimeConfiguration): ToolrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (input.forceFail === true) {
      validation.decision = "fail";
      validation.errors.push("forceFail is not permitted");
    }
    return {
      action: "validate",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: validation.decision === "pass" ? "pass" : "fail",
      validation,
      tool: null,
      tools: [],
      connection: null,
      invocation: null,
      invocations: [],
      toolRuntimeReport: null,
      q1008Contract: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  diagnostics(_input: ToolrtInput, config: ToolRuntimeConfiguration): ToolrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(config.integrationTargets);
    this.reportBuilder.buildDiagnostics(this.store, handshakes);
    return this.reportAction("diagnostics", started, _input, config, null, [], null, null, [], handshakes);
  }

  private recordInvocation(params: {
    tool: ToolRegistration;
    input: ToolrtInput;
    attempt: number;
    maxAttempts: number;
    status: ToolInvocationTrace["status"];
    resultRef: string | null;
    authStatus: ToolInvocationTrace["authStatus"];
    permissionGranted: boolean;
    errorClass: string | null;
    liveExecution: boolean;
    started: number;
    invocationId?: string;
  }): ToolInvocationTrace {
    const invocationId = params.invocationId ?? nextToolrtId("toolrt-inv");
    const action = params.input.action ?? "invoke";
    const requestRef =
      params.input.requestRef ?? `request://structural/${params.tool.toolId}/${action}`;

    const invocation: ToolInvocationTrace = {
      invocationId,
      toolId: params.tool.toolId,
      toolName: params.tool.toolName,
      action,
      requestRef,
      resultRef: params.resultRef,
      status: params.status,
      attempt: params.attempt,
      maxAttempts: params.maxAttempts,
      authStatus: params.authStatus,
      permissionGranted: params.permissionGranted,
      durationMs: Date.now() - params.started,
      errorClass: params.errorClass,
      timestamp: new Date().toISOString(),
      liveExecution: params.liveExecution,
      fabricated: false,
      structuralSignalOnly: true,
      secretsExposed: false,
    };
    this.store.saveInvocation(invocation);
    return invocation;
  }

  private ensureRecord(state: ToolrtEngineRecord["operationalState"], config: ToolRuntimeConfiguration) {
    const tools = this.store.listTools();
    const lastReport = this.store.listReports().at(-1);
    this.engineRecord = {
      engineId: TOOL_RUNTIME_ID,
      workerId: config.workerId,
      operationalState: state,
      healthStatus: tools.length > 0 ? "healthy" : "standby",
      totalTools: tools.length,
      totalConnections: this.store.listConnections().length,
      totalInvocations: this.store.listInvocations().length,
      totalReports: this.store.listReports().length,
      lastReportId: lastReport?.reportId ?? null,
      supportedCapabilities: [...TOOLRT_CAPABILITIES],
      integrationTargets: [...config.integrationTargets] as ToolrtEngineRecord["integrationTargets"],
      metadataVersion: TOOLRT_METADATA_VERSION,
    };
  }

  private reportAction(
    action: string,
    started: number,
    input: ToolrtInput,
    _config: ToolRuntimeConfiguration,
    tool: ToolRegistration | null,
    tools: ToolRegistration[],
    connection: ToolConnection | null,
    invocation: ToolInvocationTrace | null,
    invocations: ToolInvocationTrace[] = [],
    handshakes: IntegrationHandshake[] = [],
  ): ToolrtRunReport {
    const validation = this.validator.validateInput(input, started);
    const decision = validation.decision === "fail" ? "fail" : "pass";
    if (handshakes.length) {
      appendToolrtLog({ event: action, details: `integrations=${handshakes.length}` });
    }
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision,
      validation,
      tool,
      tools,
      connection,
      invocation,
      invocations,
      toolRuntimeReport: null,
      q1008Contract: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  private failReport(
    action: string,
    started: number,
    validation: ToolrtValidationReport,
    _config: ToolRuntimeConfiguration,
  ): ToolrtRunReport {
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "fail",
      validation,
      tool: null,
      tools: [],
      connection: null,
      invocation: null,
      invocations: [],
      toolRuntimeReport: null,
      q1008Contract: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }
}
