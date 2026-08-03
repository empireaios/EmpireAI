import type { ApprovalRouterConfiguration } from "./configuration.js";
import { appendArLog } from "./ar-logging.js";
import { ApprovalPolicyClassifier } from "./approval-policy-classifier.js";
import { ApprovalRequestBuilder } from "./approval-request-builder.js";
import {
  ApprovalMetadataGenerator,
  ApprovalValidator,
  HealthMonitor,
  RecoveryManager,
} from "./approval-validator.js";
import {
  AR_CAPABILITIES,
  AR_METADATA_VERSION,
  APPROVAL_ROUTER_ID,
} from "./paths.js";
import type {
  ApprovalRequest,
  ApprovalRouterEngineRecord,
  ApprovalRouterInput,
  ApprovalRouterRunReport,
  ApprovalState,
  ExecutionGateInput,
  ExecutionGateResult,
  OperationalState,
  RecordExternalOutcomeInput,
} from "./types.js";

export class ApprovalRouterManager {
  private engineRecord: ApprovalRouterEngineRecord | null = null;
  private requests: ApprovalRequest[] = [];
  private readonly classifier = new ApprovalPolicyClassifier();
  private readonly builder = new ApprovalRequestBuilder();
  private readonly validator = new ApprovalValidator();
  private readonly metadata = new ApprovalMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getRequests() {
    return this.requests.map((r) => this.clone(r));
  }

  getPendingQueue() {
    return this.getRequests().filter((r) => r.currentStatus === "pending" || r.currentStatus === "escalated");
  }

  getLatestRequest() {
    const requests = this.getRequests();
    return requests[requests.length - 1] ?? null;
  }

  getRequest(approvalId: string) {
    return this.getRequests().find((r) => r.approvalId === approvalId) ?? null;
  }

  connect(_input: Record<string, unknown>, config: ApprovalRouterConfiguration): ApprovalRouterRunReport {
    const started = Date.now();
    this.ensureRecord("connected", config);
    appendArLog({ event: "connect", details: "Approval Router connected; routing-only mode" });
    return this.report("connect", [], null, {
      validationReportId: `ar-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Approval Router is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: AR_METADATA_VERSION,
    }, started);
  }

  evaluateRequest(input: ApprovalRouterInput, config: ApprovalRouterConfiguration): ApprovalRouterRunReport {
    return this.route("evaluate_request", input, config);
  }

  routeRequest(input: ApprovalRouterInput, config: ApprovalRouterConfiguration): ApprovalRouterRunReport {
    return this.route("route_request", input, config);
  }

  generateApprovalRequest(input: ApprovalRouterInput, config: ApprovalRouterConfiguration): ApprovalRouterRunReport {
    return this.route("generate_approval_request", input, config);
  }

  listPendingQueue(config: ApprovalRouterConfiguration): ApprovalRouterRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const pending = this.getPendingQueue();
    appendArLog({ event: "list_pending_queue", details: `pending=${pending.length}` });
    return this.report("list_pending_queue", pending, null, {
      validationReportId: `ar-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Approval Router is disabled"],
      warnings: pending.length > config.pendingQueueLimit ? ["Pending queue exceeds configured limit"] : [],
      durationMs: Date.now() - started,
      metadataVersion: AR_METADATA_VERSION,
    }, started);
  }

  listRequests(config: ApprovalRouterConfiguration): ApprovalRouterRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const requests = this.getRequests();
    return this.report("list_requests", requests, null, {
      validationReportId: `ar-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Approval Router is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: AR_METADATA_VERSION,
    }, started);
  }

  recordExternalOutcome(
    input: RecordExternalOutcomeInput,
    config: ApprovalRouterConfiguration,
  ): ApprovalRouterRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const idx = this.requests.findIndex((r) => r.approvalId === input.approvalId);
    const existing = idx >= 0 ? this.requests[idx]! : null;
    const validation = this.validator.validateOutcome(existing, input, started);
    if (validation.decision === "fail" || !config.enabled || !config.routingRulesEnabled) {
      if (validation.decision === "fail") this.recovery.recordFailure();
      appendArLog({
        event: "validation_failure",
        details: `record_external_outcome; errors=${validation.errors.join("|")}`,
      });
      return this.report("record_external_outcome", existing ? [existing] : [], null, validation, started);
    }

    const updated = this.clone(existing!);
    updated.currentStatus = input.status;
    updated.approvalHistory = [
      ...updated.approvalHistory,
      this.builder.historyEntry(
        input.status,
        "external_authority",
        input.authority,
        input.note?.trim() || `External outcome recorded by ${input.authority}`,
      ),
    ];
    updated.executionAllowed = input.status === "approved";
    updated.executionBlockedReason =
      input.status === "approved"
        ? null
        : `Execution blocked — external status is ${input.status}`;
    updated.requestApprovedByRouter = false;
    updated.requestExecutedByRouter = false;
    this.requests[idx] = updated;
    this.ensureRecord("active", config);
    this.recovery.reset();
    appendArLog({
      event: "record_external_outcome",
      details: `approvalId=${updated.approvalId}; status=${updated.currentStatus}; authority=${input.authority}; approvedByRouter=false`,
    });
    this.metadata.generate(this.requests.length, this.pendingCount());
    return this.report("record_external_outcome", [updated], null, validation, started);
  }

  checkExecutionGate(input: ExecutionGateInput, config: ApprovalRouterConfiguration): ApprovalRouterRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const decision = this.validator.decideGate(input);
    if (decision === "fail" || this.hasBoundary(input) || !config.enabled) {
      const validation = {
        validationReportId: `ar-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        errors: [
          ...(input.executeRequest === true ? ["Approval Router must never execute requests"] : []),
          ...(input.approveRequest === true ? ["Approval Router must never approve requests"] : []),
          ...(input.assignWorkers === true ? ["Approval Router must never assign workers"] : []),
          ...(input.overridePillow === true ? ["Approval Router must never override Pillow"] : []),
          ...(input.overrideGrandKing === true ? ["Approval Router must never override Grand King"] : []),
          ...(!input.approvalId?.trim() && !input.requestId?.trim()
            ? ["approvalId or requestId is required"]
            : []),
          ...(input.validated === false ? ["Gate check requires validated=true"] : []),
          ...(!config.enabled ? ["Approval Router is disabled"] : []),
        ],
        warnings: [] as string[],
        durationMs: Date.now() - started,
        metadataVersion: AR_METADATA_VERSION,
      };
      this.recovery.recordFailure();
      const gate = this.gate(null, false, validation.errors[0] ?? "Gate check failed");
      return this.report("check_execution_gate", [], gate, validation, started);
    }

    const found =
      (input.approvalId
        ? this.requests.find((r) => r.approvalId === input.approvalId)
        : undefined) ??
      (input.requestId ? this.requests.find((r) => r.requestId === input.requestId) : undefined) ??
      null;

    if (!found) {
      const validation = {
        validationReportId: `ar-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        errors: ["Approval request not found for execution gate"],
        warnings: [] as string[],
        durationMs: Date.now() - started,
        metadataVersion: AR_METADATA_VERSION,
      };
      const gate = this.gate(null, false, "Approval request not found");
      return this.report("check_execution_gate", [], gate, validation, started);
    }

    const allowed = found.executionAllowed && found.currentStatus === "approved";
    const blockReason = allowed
      ? null
      : found.executionBlockedReason ??
        `Execution blocked — status=${found.currentStatus}; level=${found.approvalLevel}`;
    const gate = this.gate(found, allowed, blockReason);
    const validation = {
      validationReportId: `ar-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: "pass" as const,
      errors: [] as string[],
      warnings: allowed ? [] : ["Execution is currently blocked by approval gate"],
      durationMs: Date.now() - started,
      metadataVersion: AR_METADATA_VERSION,
    };
    appendArLog({
      event: "check_execution_gate",
      details: `approvalId=${found.approvalId}; allowed=${allowed}; status=${found.currentStatus}`,
    });
    return this.report("check_execution_gate", [found], gate, validation, started);
  }

  validateApprovals(config: ApprovalRouterConfiguration): ApprovalRouterRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const latest = this.requests[this.requests.length - 1] ?? null;
    const validation = latest
      ? this.validator.validateRequest(
          latest,
          {
            requestedAction: latest.requestedAction,
            requestSummary: latest.requestSummary,
            validated: true,
          },
          started,
        )
      : {
          validationReportId: `ar-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Approval Router is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: AR_METADATA_VERSION,
        };
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    return this.report("validate_approvals", latest ? [latest] : [], null, validation, started);
  }

  diagnostics(config: ApprovalRouterConfiguration): ApprovalRouterRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const pending = this.pendingCount();
    appendArLog({
      event: "health_information",
      details: `requests=${this.requests.length}; pending=${pending}; health=${this.healthMonitor.status("pass", config.enabled)}`,
    });
    return this.report(
      "diagnostics",
      this.getPendingQueue().slice(0, 20),
      null,
      {
        validationReportId: `ar-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Approval Router is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: AR_METADATA_VERSION,
      },
      started,
    );
  }

  private route(
    action: ApprovalRouterRunReport["action"],
    input: ApprovalRouterInput,
    config: ApprovalRouterConfiguration,
  ): ApprovalRouterRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    appendArLog({
      event: "receive_execution_request",
      details: `action=${action}; requestedActionLength=${input.requestedAction?.length ?? 0}`,
    });

    const decision = this.validator.decide(input);
    if (decision === "fail" || !config.enabled || !config.routingRulesEnabled) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRequest(null, input, started);
      appendArLog({ event: "validation_failure", details: `action=${action}; errors=${validation.errors.join("|")}` });
      return this.report(action, [], null, validation, started);
    }

    const classification = this.classifier.classify(input, config);
    const status = decision === "partial" ? "partial" : "passed";
    const request = this.builder.build(input, classification, status);
    if (this.pendingCount() >= config.pendingQueueLimit && request.currentStatus === "pending") {
      const validation = {
        validationReportId: `ar-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        errors: ["Pending approval queue limit reached"],
        warnings: [] as string[],
        durationMs: Date.now() - started,
        metadataVersion: AR_METADATA_VERSION,
      };
      this.recovery.recordFailure();
      return this.report(action, [], null, validation, started);
    }

    this.requests.push(request);
    this.ensureRecord("active", config);
    const validation = this.validator.validateRequest(request, input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    appendArLog({
      event: "generate_approval_request",
      details: `approvalId=${request.approvalId}; level=${request.approvalLevel}; status=${request.currentStatus}; executionAllowed=${request.executionAllowed}`,
    });
    this.metadata.generate(this.requests.length, this.pendingCount());
    return this.report(action, [request], null, validation, started);
  }

  private pendingCount() {
    return this.requests.filter((r) => r.currentStatus === "pending" || r.currentStatus === "escalated").length;
  }

  private hasBoundary(input: {
    approveRequest?: boolean;
    executeRequest?: boolean;
    assignWorkers?: boolean;
    overridePillow?: boolean;
    overrideGrandKing?: boolean;
  }) {
    return (
      input.approveRequest === true ||
      input.executeRequest === true ||
      input.assignWorkers === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private gate(
    request: ApprovalRequest | null,
    allowed: boolean,
    blockReason: string | null,
  ): ExecutionGateResult {
    return {
      gateId: `ar-gate-${Date.now()}`,
      timestamp: new Date().toISOString(),
      approvalId: request?.approvalId ?? null,
      requestId: request?.requestId ?? null,
      executionAllowed: allowed,
      blocked: !allowed,
      blockReason,
      approvalLevel: request?.approvalLevel ?? null,
      currentStatus: (request?.currentStatus ?? null) as ApprovalState | null,
      metadataVersion: AR_METADATA_VERSION,
    };
  }

  private ensureRecord(state: OperationalState, config: ApprovalRouterConfiguration) {
    const latest = this.requests[this.requests.length - 1]?.validationStatus ?? "pending";
    const mapped =
      latest === "passed" ? "passed" : latest === "partial" ? "partial" : latest === "failed" ? "failed" : "pending";
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `ar-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: APPROVAL_ROUTER_ID,
      engineVersion: "PILLOW-AR-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed" ? "pass" : mapped === "partial" ? "partial" : mapped === "failed" ? "fail" : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...AR_CAPABILITIES],
      totalRequests: this.requests.length,
      pendingCount: this.pendingCount(),
      metadataVersion: AR_METADATA_VERSION,
    };
  }

  private report(
    action: ApprovalRouterRunReport["action"],
    requests: ApprovalRequest[],
    gate: ExecutionGateResult | null,
    validation: ApprovalRouterRunReport["validation"],
    started: number,
  ): ApprovalRouterRunReport {
    return {
      approvalRunReportId: `ar-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      requests: requests.map((r) => this.clone(r)),
      gate,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: AR_METADATA_VERSION,
    };
  }

  private clone(request: ApprovalRequest): ApprovalRequest {
    return {
      ...request,
      riskAssessment: [...request.riskAssessment],
      expectedImpact: [...request.expectedImpact],
      approvalHistory: request.approvalHistory.map((h) => ({ ...h })),
    };
  }
}
