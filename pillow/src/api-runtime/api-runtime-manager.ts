import type { ApiRuntimeConfiguration } from "./configuration.js";
import { ApirtIntegrationCoordinator, type ApiRuntimeDependencies } from "./integrations.js";
import { appendApirtLog } from "./apirt-logging.js";
import { ApiStore, nextApirtId } from "./api-store.js";
import { ApiValidator } from "./api-validator.js";
import { AuthManager } from "./auth-manager.js";
import { CircuitBreaker } from "./circuit-breaker.js";
import { ConnectionManager } from "./connection-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { MetricsCollector } from "./metrics-collector.js";
import { PermissionGate } from "./permission-gate.js";
import { ProviderRegistry } from "./provider-registry.js";
import { RateLimiter } from "./rate-limiter.js";
import { ReportBuilder } from "./report-builder.js";
import { RetryPolicyEngine } from "./retry-policy.js";
import { ApiRouter } from "./router.js";
import {
  API_RUNTIME_ID,
  APIRT_CAPABILITIES,
  APIRT_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  ApiConnection,
  ApiProviderRegistration,
  ApiRequestTrace,
  ApirtEngineRecord,
  ApirtInput,
  ApirtRunReport,
  ApirtValidationReport,
  IntegrationHandshake,
  Q1007ConsumableContract,
  ServiceType,
} from "./types.js";

const SEED_PROVIDERS: Array<{
  apiId: string;
  provider: string;
  serviceType: ServiceType;
  endpoint: string;
  authMethod: ApiProviderRegistration["authMethod"];
  credentialReference: string;
}> = [
  {
    apiId: "api-supplier-01",
    provider: "supplier-structural",
    serviceType: "supplier",
    endpoint: "https://structural.local/supplier/v1",
    authMethod: "api_key",
    credentialReference: "cred://vault/supplier/api-supplier-01",
  },
  {
    apiId: "api-marketplace-01",
    provider: "marketplace-structural",
    serviceType: "marketplace",
    endpoint: "https://structural.local/marketplace/v1",
    authMethod: "oauth",
    credentialReference: "cred://vault/marketplace/api-marketplace-01",
  },
  {
    apiId: "api-ai-01",
    provider: "ai-model-structural",
    serviceType: "ai_model",
    endpoint: "https://structural.local/ai/v1",
    authMethod: "bearer_token",
    credentialReference: "cred://vault/ai/api-ai-01",
  },
  {
    apiId: "api-payment-01",
    provider: "payment-structural",
    serviceType: "payment",
    endpoint: "https://structural.local/payment/v1",
    authMethod: "api_key",
    credentialReference: "cred://vault/payment/api-payment-01",
  },
  {
    apiId: "api-comms-01",
    provider: "communication-structural",
    serviceType: "communication",
    endpoint: "https://structural.local/comms/v1",
    authMethod: "basic",
    credentialReference: "cred://vault/comms/api-comms-01",
  },
  {
    apiId: "api-internal-01",
    provider: "internal-service-structural",
    serviceType: "internal_service",
    endpoint: "https://structural.local/internal/v1",
    authMethod: "none",
    credentialReference: "cred://vault/internal/api-internal-01",
  },
];

export class ApiRuntimeManager {
  private engineRecord: ApirtEngineRecord | null = null;
  private seeded = false;
  private readonly store = new ApiStore();
  private readonly validator = new ApiValidator();
  private readonly providerRegistry = new ProviderRegistry();
  private readonly connectionManager = new ConnectionManager();
  private readonly authManager = new AuthManager();
  private readonly permissionGate = new PermissionGate();
  private readonly router = new ApiRouter();
  private readonly retryPolicy = new RetryPolicyEngine();
  private readonly rateLimiter = new RateLimiter();
  private readonly circuitBreaker = new CircuitBreaker();
  private readonly healthMonitor = new HealthMonitor();
  private readonly metricsCollector = new MetricsCollector();
  private readonly reportBuilder = new ReportBuilder();
  private readonly integrations = new ApirtIntegrationCoordinator();

  bindIntegrations(deps: ApiRuntimeDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getDependencies();
  }

  resetTransientStateForTesting() {
    this.rateLimiter.resetForTesting();
    this.circuitBreaker.resetForTesting();
  }

  ensureSeeded(config: ApiRuntimeConfiguration) {
    if (this.seeded) return;
    this.seeded = true;
    for (const seed of SEED_PROVIDERS) {
      this.providerRegistry.registerProvider(
        this.store,
        {
          apiId: seed.apiId,
          provider: seed.provider,
          serviceType: seed.serviceType,
          endpoint: seed.endpoint,
          authMethod: seed.authMethod,
          credentialReference: seed.credentialReference,
          apiVersion: "v1",
          validated: true,
          pillowConfirmed: true,
          grandKingApproved: true,
        },
        config,
      );
      this.store.updateProvider(seed.apiId, { healthStatus: "standby", connectionStatus: "disconnected" });
    }
    this.ensureRecord("active", config);
    appendApirtLog({
      event: "seed_providers",
      details: `Seeded ${SEED_PROVIDERS.length} structural providers with cred:// references only`,
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

  getQ1007ConsumableContract(config: ApiRuntimeConfiguration): Q1007ConsumableContract {
    return this.reportBuilder.buildQ1007ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: ApiRuntimeConfiguration): ApirtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    appendApirtLog({
      event: "connect",
      details: `API Runtime connected; integrations=${handshakes.filter((h) => h.available).length}`,
    });
    return this.reportAction("connect", started, { validated: true }, config, null, null, null, [], handshakes);
  }

  registerProvider(input: ApirtInput, config: ApiRuntimeConfiguration): ApirtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateRegister(input, started);
    if (validation.decision === "fail") {
      return this.failReport("register_provider", started, validation, config);
    }
    const provider = this.providerRegistry.registerProvider(this.store, input, config);
    this.ensureRecord("active", config);
    appendApirtLog({ event: "register_provider", details: provider.apiId });
    return this.reportAction("register_provider", started, input, config, provider, null, null);
  }

  manageConnection(input: ApirtInput, config: ApiRuntimeConfiguration): ApirtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("manage_connection", started, validation, config);
    }

    let connection: ApiConnection | null = null;
    if (input.connectionId) {
      connection = this.connectionManager.closeConnection(this.store, input);
    } else if (input.apiId) {
      connection = this.connectionManager.openConnection(this.store, input);
    }

    if (!connection) {
      return this.failReport(
        "manage_connection",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "apiId required to open or connectionId required to close"],
        },
        config,
      );
    }

    appendApirtLog({
      event: "manage_connection",
      details: `${connection.connectionId}:${connection.status}`,
    });
    return this.reportAction("manage_connection", started, input, config, null, connection, null);
  }

  authenticate(input: ApirtInput, config: ApiRuntimeConfiguration): ApirtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail" || !input.apiId) {
      if (!input.apiId) validation.errors.push("apiId required for authenticate");
      return this.failReport("authenticate", started, { ...validation, decision: "fail" }, config);
    }
    const provider = this.store.getProvider(input.apiId);
    if (!provider) {
      return this.failReport(
        "authenticate",
        started,
        { ...validation, decision: "fail", errors: [...validation.errors, `Unknown apiId ${input.apiId}`] },
        config,
      );
    }
    const auth = this.authManager.authenticate(provider, input);
    appendApirtLog({
      event: "authenticate",
      details: `${provider.apiId}:${auth.authStatus}`,
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
      provider,
      connection: null,
      trace: null,
      traces: [],
      apiRuntimeReport: null,
      q1007Contract: null,
      errors: decision === "fail" ? auth.notes : [],
      warnings: [],
    };
  }

  routeRequest(input: ApirtInput, config: ApiRuntimeConfiguration): ApirtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateRoute(input, started);
    if (validation.decision === "fail") {
      return this.failReport("route_request", started, validation, config);
    }

    const provider = this.store.getProvider(input.apiId!);
    if (!provider) {
      return this.failReport(
        "route_request",
        started,
        { ...validation, decision: "fail", errors: [...validation.errors, `Unknown apiId ${input.apiId}`] },
        config,
      );
    }

    // 2. permission gate
    const permission = this.permissionGate.check(provider, input);
    if (!permission.permissionGranted) {
      const trace = this.recordTrace({
        provider,
        input,
        attempt: 1,
        maxAttempts: provider.retryPolicy.maxRetries + 1,
        statusCode: 403,
        responseRef: null,
        rateLimited: false,
        circuitOpen: false,
        authStatus: "rejected",
        permissionGranted: false,
        errorClass: "permission_denied",
        liveCallExecuted: false,
        started,
      });
      return {
        action: "route_request",
        runTimestamp: new Date().toISOString(),
        durationMs: Date.now() - started,
        decision: "fail",
        validation: { ...validation, decision: "fail", errors: [...validation.errors, ...permission.errors] },
        provider,
        connection: null,
        trace,
        traces: [trace],
        apiRuntimeReport: null,
        q1007Contract: null,
        errors: permission.errors,
        warnings: [],
      };
    }

    // 3. auth check
    const auth = this.authManager.authenticate(provider, input);
    if (auth.authStatus === "rejected") {
      const trace = this.recordTrace({
        provider,
        input,
        attempt: 1,
        maxAttempts: provider.retryPolicy.maxRetries + 1,
        statusCode: 401,
        responseRef: null,
        rateLimited: false,
        circuitOpen: false,
        authStatus: "rejected",
        permissionGranted: true,
        errorClass: "auth_rejected",
        liveCallExecuted: false,
        started,
      });
      return {
        action: "route_request",
        runTimestamp: new Date().toISOString(),
        durationMs: Date.now() - started,
        decision: "fail",
        validation: { ...validation, decision: "fail", errors: [...validation.errors, ...auth.notes] },
        provider: this.store.getProvider(provider.apiId),
        connection: null,
        trace,
        traces: [trace],
        apiRuntimeReport: null,
        q1007Contract: null,
        errors: auth.notes,
        warnings: [],
      };
    }

    // 4. rate limit check
    const rate = this.rateLimiter.check(this.store, provider.apiId, config);
    if (!rate.allowed) {
      const trace = this.recordTrace({
        provider: this.store.getProvider(provider.apiId)!,
        input,
        attempt: 1,
        maxAttempts: provider.retryPolicy.maxRetries + 1,
        statusCode: 429,
        responseRef: null,
        rateLimited: true,
        circuitOpen: false,
        authStatus: auth.authStatus,
        permissionGranted: true,
        errorClass: "rate_limited",
        liveCallExecuted: false,
        started,
      });
      return {
        action: "route_request",
        runTimestamp: new Date().toISOString(),
        durationMs: Date.now() - started,
        decision: "fail",
        validation: {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "Rate limit exceeded"],
        },
        provider: this.store.getProvider(provider.apiId),
        connection: null,
        trace,
        traces: [trace],
        apiRuntimeReport: null,
        q1007Contract: null,
        errors: ["Rate limit exceeded"],
        warnings: [],
      };
    }

    // 5. circuit breaker check
    const circuit = this.circuitBreaker.check(this.store, provider.apiId);
    if (!circuit.allowed) {
      const trace = this.recordTrace({
        provider: this.store.getProvider(provider.apiId)!,
        input,
        attempt: 1,
        maxAttempts: provider.retryPolicy.maxRetries + 1,
        statusCode: 503,
        responseRef: null,
        rateLimited: false,
        circuitOpen: true,
        authStatus: auth.authStatus,
        permissionGranted: true,
        errorClass: "circuit_open",
        liveCallExecuted: false,
        started,
      });
      return {
        action: "route_request",
        runTimestamp: new Date().toISOString(),
        durationMs: Date.now() - started,
        decision: "fail",
        validation: {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "Circuit breaker open"],
        },
        provider: this.store.getProvider(provider.apiId),
        connection: null,
        trace,
        traces: [trace],
        apiRuntimeReport: null,
        q1007Contract: null,
        errors: ["Circuit breaker open"],
        warnings: [],
      };
    }

    // 6–9. route + retry lifecycle
    const route = this.router.route(provider, input);
    const maxAttempts = provider.retryPolicy.maxRetries + 1;
    const traces: ApiRequestTrace[] = [];
    let attempt = 1;
    let finalTrace: ApiRequestTrace | null = null;
    let succeeded = false;

    while (attempt <= maxAttempts) {
      const attemptStarted = Date.now();
      const requestId = nextApirtId("apirt-req");
      let statusCode: number | null = 200;
      let responseRef: string | null = `response://structural/${requestId}`;
      let liveCallExecuted = false;
      let errorClass: string | null = null;

      const transportResult = this.integrations.executeTransport({
        apiId: route.apiId,
        provider: route.provider,
        endpoint: route.endpoint,
        method: route.method,
        path: route.path,
        requestRef: route.requestRef,
        credentialReference: provider.credentialReference,
      });

      if (transportResult) {
        statusCode = transportResult.statusCode;
        responseRef = transportResult.responseRef;
        liveCallExecuted = true;
        if (statusCode >= 400) {
          errorClass = this.retryPolicy.isTransientStatus(statusCode, provider)
            ? "transient"
            : `http_${statusCode}`;
        }
      } else {
        // Structural routing only — NEVER invent response payload bodies
        liveCallExecuted = false;
        statusCode = 200;
        responseRef = `response://structural/${requestId}`;
      }

      if (input.simulateTransientFailure === true && attempt < maxAttempts) {
        errorClass = "transient";
        statusCode = 503;
        if (!transportResult) {
          responseRef = `response://structural/${requestId}`;
        }
      }

      const trace = this.recordTrace({
        provider: this.store.getProvider(provider.apiId)!,
        input: { ...input, method: route.method, path: route.path, requestRef: route.requestRef },
        attempt,
        maxAttempts,
        statusCode,
        responseRef,
        rateLimited: false,
        circuitOpen: false,
        authStatus: auth.authStatus,
        permissionGranted: true,
        errorClass,
        liveCallExecuted,
        started: attemptStarted,
        requestId,
      });
      traces.push(trace);
      finalTrace = trace;

      if (errorClass === "transient" || (statusCode != null && statusCode >= 500)) {
        const decision = this.retryPolicy.decide(provider, attempt, input, errorClass);
        if (decision.shouldRetry) {
          attempt += 1;
          continue;
        }
        // Exhausted
        this.store.updateProvider(provider.apiId, {
          lastFailedRequest: trace.timestamp,
        });
        this.circuitBreaker.recordFailure(this.store, provider.apiId, config);
        succeeded = false;
        break;
      }

      // Success
      this.store.updateProvider(provider.apiId, {
        lastSuccessfulRequest: trace.timestamp,
        healthStatus: "healthy",
      });
      this.circuitBreaker.recordSuccess(this.store, provider.apiId);
      succeeded = true;
      break;
    }

    this.healthMonitor.assessProvider(this.store, provider.apiId);
    appendApirtLog({
      event: "route_request",
      details: `${provider.apiId}:${succeeded ? "pass" : "fail"}:attempts=${traces.length}`,
    });

    return {
      action: "route_request",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: succeeded ? "pass" : "fail",
      validation,
      provider: this.store.getProvider(provider.apiId),
      connection: null,
      trace: finalTrace,
      traces,
      apiRuntimeReport: null,
      q1007Contract: null,
      errors: succeeded ? [] : ["Request failed after retries or structural failure"],
      warnings: [],
    };
  }

  checkHealth(input: ApirtInput, config: ApiRuntimeConfiguration): ApirtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("check_health", started, validation, config);
    }
    if (input.apiId) {
      this.healthMonitor.assessProvider(this.store, input.apiId);
    } else {
      this.healthMonitor.assessAll(this.store);
    }
    const provider = input.apiId ? this.store.getProvider(input.apiId) : null;
    appendApirtLog({
      event: "check_health",
      details: input.apiId ?? "all",
    });
    return this.reportAction("check_health", started, input, config, provider, null, null);
  }

  produceReport(input: ApirtInput, config: ApiRuntimeConfiguration): ApirtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("produce_report", started, validation, config);
    }
    const metrics = this.metricsCollector.collect(this.store);
    const report = this.reportBuilder.buildApiRuntimeReport(
      this.store,
      this.metricsCollector,
      this.healthMonitor,
      config,
      {
        auditStatus: "passed",
        outstandingIssues: [],
        confidenceScore: Math.min(95, 70 + metrics.totalProviders * 2 + metrics.totalTraces),
        supportingEvidence: ["api-runtime operational evidence"],
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
      provider: null,
      connection: null,
      trace: null,
      traces: [],
      apiRuntimeReport: report,
      q1007Contract: null,
      errors: [],
      warnings: [],
    };
  }

  submitReport(input: ApirtInput, config: ApiRuntimeConfiguration): ApirtRunReport {
    const produced = this.produceReport(input, config);
    if (produced.decision === "fail" || !produced.apiRuntimeReport) {
      return produced;
    }
    this.integrations.submitReport(produced.apiRuntimeReport);
    this.integrations.recordAudit({
      event: "api_runtime_report_submitted",
      reportId: produced.apiRuntimeReport.reportId,
    });
    return { ...produced, action: "submit_report" };
  }

  list(_input: ApirtInput, config: ApiRuntimeConfiguration): ApirtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    return this.reportAction("list", started, _input, config, null, null, null);
  }

  validate(input: ApirtInput, config: ApiRuntimeConfiguration): ApirtRunReport {
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
      provider: null,
      connection: null,
      trace: null,
      traces: [],
      apiRuntimeReport: null,
      q1007Contract: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  diagnostics(_input: ApirtInput, config: ApiRuntimeConfiguration): ApirtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(config.integrationTargets);
    this.reportBuilder.buildDiagnostics(this.store, handshakes);
    return this.reportAction("diagnostics", started, _input, config, null, null, null, [], handshakes);
  }

  private recordTrace(params: {
    provider: ApiProviderRegistration;
    input: ApirtInput;
    attempt: number;
    maxAttempts: number;
    statusCode: number | null;
    responseRef: string | null;
    rateLimited: boolean;
    circuitOpen: boolean;
    authStatus: ApiRequestTrace["authStatus"];
    permissionGranted: boolean;
    errorClass: string | null;
    liveCallExecuted: boolean;
    started: number;
    requestId?: string;
  }): ApiRequestTrace {
    const requestId = params.requestId ?? nextApirtId("apirt-req");
    const method = (params.input.method ?? "GET").toUpperCase();
    const path = params.input.path ?? "/";
    const requestRef =
      params.input.requestRef ?? `request://structural/${params.provider.apiId}/${method}${path}`;

    const responseRef =
      params.responseRef ??
      (params.liveCallExecuted ? null : `response://structural/${requestId}`);

    const trace: ApiRequestTrace = {
      requestId,
      apiId: params.provider.apiId,
      provider: params.provider.provider,
      method,
      path,
      requestRef,
      responseRef,
      statusCode: params.statusCode,
      attempt: params.attempt,
      maxAttempts: params.maxAttempts,
      rateLimited: params.rateLimited,
      circuitOpen: params.circuitOpen,
      authStatus: params.authStatus,
      permissionGranted: params.permissionGranted,
      durationMs: Date.now() - params.started,
      errorClass: params.errorClass,
      timestamp: new Date().toISOString(),
      liveCallExecuted: params.liveCallExecuted,
      fabricated: false,
      structuralSignalOnly: true,
      secretsExposed: false,
    };
    this.store.saveTrace(trace);
    return trace;
  }

  private ensureRecord(state: ApirtEngineRecord["operationalState"], config: ApiRuntimeConfiguration) {
    const providers = this.store.listProviders();
    const lastReport = this.store.listReports().at(-1);
    this.engineRecord = {
      engineId: API_RUNTIME_ID,
      workerId: config.workerId,
      operationalState: state,
      healthStatus: providers.length > 0 ? "healthy" : "standby",
      totalProviders: providers.length,
      totalConnections: this.store.listConnections().length,
      totalTraces: this.store.listTraces().length,
      totalReports: this.store.listReports().length,
      lastReportId: lastReport?.reportId ?? null,
      supportedCapabilities: [...APIRT_CAPABILITIES],
      integrationTargets: [...config.integrationTargets] as ApirtEngineRecord["integrationTargets"],
      metadataVersion: APIRT_METADATA_VERSION,
    };
  }

  private reportAction(
    action: string,
    started: number,
    input: ApirtInput,
    _config: ApiRuntimeConfiguration,
    provider: ApiProviderRegistration | null,
    connection: ApiConnection | null,
    trace: ApiRequestTrace | null,
    traces: ApiRequestTrace[] = [],
    handshakes: IntegrationHandshake[] = [],
  ): ApirtRunReport {
    const validation = this.validator.validateInput(input, started);
    const decision = validation.decision === "fail" ? "fail" : "pass";
    if (handshakes.length) {
      appendApirtLog({ event: action, details: `integrations=${handshakes.length}` });
    }
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision,
      validation,
      provider,
      connection,
      trace,
      traces,
      apiRuntimeReport: null,
      q1007Contract: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  private failReport(
    action: string,
    started: number,
    validation: ApirtValidationReport,
    _config: ApiRuntimeConfiguration,
  ): ApirtRunReport {
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "fail",
      validation,
      provider: null,
      connection: null,
      trace: null,
      traces: [],
      apiRuntimeReport: null,
      q1007Contract: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }
}
