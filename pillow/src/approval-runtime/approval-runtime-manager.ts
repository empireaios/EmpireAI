import type { ApprovalRuntimeConfiguration } from "./configuration.js";
import {
  ApvrtIntegrationCoordinator,
  type ApprovalRuntimeDependencies,
} from "./integrations.js";
import { appendApvrtLog } from "./apvrt-logging.js";
import { ApprovalStore, nextApvrtId } from "./approval-store.js";
import { ApprovalValidator } from "./approval-validator.js";
import { PolicyRegistry } from "./policy-registry.js";
import { RequirementEngine } from "./requirement-engine.js";
import { ApprovalRouter } from "./approval-router.js";
import { MultiStageEngine } from "./multi-stage-engine.js";
import { DelegationEngine } from "./delegation-engine.js";
import { EscalationEngine } from "./escalation-engine.js";
import { TimeoutHandler } from "./timeout-handler.js";
import { DecisionRecorder } from "./decision-recorder.js";
import { ResumeEngine } from "./resume-engine.js";
import { MetricsCollector } from "./metrics-collector.js";
import { GovernanceSummaryBuilder } from "./governance-summary.js";
import { ReportBuilder } from "./report-builder.js";
import {
  APVRT_CAPABILITIES,
  APVRT_METADATA_VERSION,
  APVRT_MISSION_ID,
  APPROVAL_RUNTIME_ID,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  ApprovalPolicy,
  ApprovalRequest,
  ApvrtEngineRecord,
  ApvrtInput,
  ApvrtRunReport,
  ApvrtValidationReport,
  DecisionRecord,
  IntegrationHandshake,
  Q1010ConsumableContract,
} from "./types.js";

const SEED_POLICIES: Array<{
  policyId: string;
  approvalType: ApprovalPolicy["approvalType"];
  policyName: string;
  stages: string[];
  requiresPillow: boolean;
  requiresGrandKing: boolean;
  allowDelegation: boolean;
  allowEscalation: boolean;
  highRisk: boolean;
}> = [
  {
    policyId: "pol-pillow-standard",
    approvalType: "pillow",
    policyName: "Pillow Standard Approval",
    stages: ["pillow"],
    requiresPillow: true,
    requiresGrandKing: false,
    allowDelegation: false,
    allowEscalation: false,
    highRisk: false,
  },
  {
    policyId: "pol-grand-king-restricted",
    approvalType: "grand_king",
    policyName: "Grand King Restricted Approval",
    stages: ["pillow", "grand_king"],
    requiresPillow: true,
    requiresGrandKing: true,
    allowDelegation: false,
    allowEscalation: false,
    highRisk: true,
  },
  {
    policyId: "pol-multi-stage-ops",
    approvalType: "multi_stage",
    policyName: "Multi-Stage Operations Approval",
    stages: ["pillow", "factory_lead", "grand_king"],
    requiresPillow: true,
    requiresGrandKing: true,
    allowDelegation: false,
    allowEscalation: false,
    highRisk: true,
  },
  {
    policyId: "pol-conditional-escalation",
    approvalType: "conditional",
    policyName: "Conditional Escalation Approval",
    stages: ["pillow"],
    requiresPillow: true,
    requiresGrandKing: false,
    allowDelegation: false,
    allowEscalation: true,
    highRisk: false,
  },
  {
    policyId: "pol-delegated-ops",
    approvalType: "delegated",
    policyName: "Delegated Operations Approval",
    stages: ["pillow"],
    requiresPillow: true,
    requiresGrandKing: false,
    allowDelegation: true,
    allowEscalation: false,
    highRisk: false,
  },
];

export class ApprovalRuntimeManager {
  private engineRecord: ApvrtEngineRecord | null = null;
  private seeded = false;
  private readonly store = new ApprovalStore();
  private readonly validator = new ApprovalValidator();
  private readonly policyRegistry = new PolicyRegistry();
  private readonly requirementEngine = new RequirementEngine();
  private readonly approvalRouter = new ApprovalRouter();
  private readonly multiStageEngine = new MultiStageEngine();
  private readonly delegationEngine = new DelegationEngine();
  private readonly escalationEngine = new EscalationEngine();
  private readonly timeoutHandler = new TimeoutHandler();
  private readonly decisionRecorder = new DecisionRecorder();
  private readonly resumeEngine = new ResumeEngine();
  private readonly metricsCollector = new MetricsCollector();
  private readonly governanceSummaryBuilder = new GovernanceSummaryBuilder();
  private readonly reportBuilder = new ReportBuilder();
  private readonly integrations = new ApvrtIntegrationCoordinator();

  bindIntegrations(deps: ApprovalRuntimeDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getDependencies();
  }

  ensureSeeded(config: ApprovalRuntimeConfiguration) {
    if (this.seeded) return;
    this.seeded = true;
    for (const seed of SEED_POLICIES) {
      this.store.savePolicy({
        ...seed,
        timeoutMs: config.defaultTimeoutMs,
        metadataVersion: APVRT_METADATA_VERSION,
        structuralSignalOnly: true,
        fabricated: false,
      });
    }
    this.ensureRecord("active", config);
    appendApvrtLog({
      event: "seed_policies",
      details: `Seeded ${SEED_POLICIES.length} approval policies`,
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

  getQ1010ConsumableContract(config: ApprovalRuntimeConfiguration): Q1010ConsumableContract {
    return this.reportBuilder.buildQ1010ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: ApprovalRuntimeConfiguration): ApvrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    appendApvrtLog({
      event: "connect",
      details: `Approval Runtime connected; integrations=${handshakes.filter((h) => h.available).length}`,
    });
    return this.reportAction(
      "connect",
      started,
      { validated: true },
      config,
      null,
      this.store.listPolicies(),
      null,
      [],
      null,
      [],
      [],
      null,
      handshakes,
    );
  }

  registerPolicy(input: ApvrtInput, config: ApprovalRuntimeConfiguration): ApvrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("register_policy", started, validation, config);
    }
    if (!input.policyId) {
      return this.failReport(
        "register_policy",
        started,
        { ...validation, decision: "fail", errors: [...validation.errors, "policyId required"] },
        config,
      );
    }
    const policy = this.policyRegistry.registerPolicy(this.store, input);
    this.ensureRecord("active", config);
    appendApvrtLog({ event: "register_policy", details: policy.policyId });
    return this.reportAction(
      "register_policy",
      started,
      input,
      config,
      policy,
      [policy],
      null,
      [],
      null,
      [],
      [],
      null,
    );
  }

  determineRequirements(input: ApvrtInput, config: ApprovalRuntimeConfiguration): ApvrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("determine_requirements", started, validation, config);
    }
    const result = this.requirementEngine.determineApprovalRequirements(this.store, input);
    appendApvrtLog({
      event: "determine_requirements",
      details: `stages=${result.stages.join(">")}`,
    });
    return this.reportAction(
      "determine_requirements",
      started,
      input,
      config,
      result.policy,
      result.policy ? [result.policy] : [],
      null,
      [],
      null,
      [],
      result.stages,
      null,
    );
  }

  submitApprovalRequest(input: ApvrtInput, config: ApprovalRuntimeConfiguration): ApvrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    const validation = this.validator.validateSubmit(input, started);
    if (validation.decision === "fail") {
      return this.failReport("submit_approval_request", started, validation, config);
    }

    if (config.requirePillowCommandConfirmation && input.pillowConfirmed !== true) {
      return this.failReport(
        "submit_approval_request",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "Pillow confirmation required for submitApprovalRequest"],
        },
        config,
      );
    }

    const requirements = this.requirementEngine.determineApprovalRequirements(this.store, input);
    let policy = requirements.policy;
    if (!policy && input.policyId) {
      policy = this.store.getPolicy(input.policyId);
    }
    if (!policy) {
      const fallbackId =
        requirements.approvalType === "grand_king"
          ? "pol-grand-king-restricted"
          : requirements.approvalType === "multi_stage"
            ? "pol-multi-stage-ops"
            : "pol-pillow-standard";
      policy = this.store.getPolicy(fallbackId);
    }
    if (!policy) {
      return this.failReport(
        "submit_approval_request",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "Unable to resolve approval policy"],
        },
        config,
      );
    }

    if (policy.highRisk || policy.requiresGrandKing) {
      if (input.autoApproveRestricted === true) {
        return this.failReport(
          "submit_approval_request",
          started,
          {
            ...validation,
            decision: "fail",
            errors: [
              ...validation.errors,
              "Never auto-approve restricted/grand_king actions",
            ],
          },
          config,
        );
      }
    }

    const approvalId = input.approvalId ?? nextApvrtId("apvrt-apr");
    const requestId = input.requestId ?? nextApvrtId("apvrt-req");
    const now = new Date().toISOString();
    const provisional: ApprovalRequest = {
      approvalId,
      requestId,
      missionId: input.missionId ?? APVRT_MISSION_ID,
      factory: input.factory ?? config.factory,
      worker: input.worker ?? config.workerId,
      approvalType: policy.approvalType,
      approvalPolicy: policy.policyId,
      requestedApprover: input.requestedApprover ?? "pillow",
      currentApprover: "pillow",
      currentStatus: "pending",
      decisionHistory: [],
      timestampHistory: [now],
      escalationHistory: [],
      auditReference: input.auditReference ?? `audit://apvrt/request/${approvalId}`,
      stageIndex: 0,
      maxStages: policy.stages.length,
      resumeToken: null,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: APVRT_METADATA_VERSION,
    };

    const routed = this.approvalRouter.initialRoute(policy, provisional);
    const request: ApprovalRequest = {
      ...provisional,
      currentApprover: routed.currentApprover,
      currentStatus: routed.currentStatus,
      stageIndex: routed.stageIndex,
    };
    this.store.saveRequest(request);

    this.ensureRecord("routing", config);
    appendApvrtLog({
      event: "submit_approval_request",
      details: `${request.approvalId}:${request.currentStatus}:${request.currentApprover}`,
    });

    return this.reportAction(
      "submit_approval_request",
      started,
      input,
      config,
      policy,
      [policy],
      request,
      [request],
      null,
      [],
      policy.stages,
      null,
    );
  }

  routeApproval(input: ApvrtInput, config: ApprovalRuntimeConfiguration): ApvrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail" || !input.approvalId) {
      return this.failReport(
        "route_approval",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [
            ...validation.errors,
            ...(input.approvalId ? [] : ["approvalId required for routeApproval"]),
          ],
        },
        config,
      );
    }

    const existing = this.store.getRequest(input.approvalId);
    if (!existing) {
      return this.failReport(
        "route_approval",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, `Unknown approvalId ${input.approvalId}`],
        },
        config,
      );
    }

    const policy = this.store.getPolicy(existing.approvalPolicy);
    if (!policy) {
      return this.failReport(
        "route_approval",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, `Unknown policy ${existing.approvalPolicy}`],
        },
        config,
      );
    }

    const routed = this.approvalRouter.route(existing, policy);
    const request =
      this.store.updateRequest(existing.approvalId, {
        currentApprover: routed.currentApprover,
        currentStatus: routed.currentStatus,
        stageIndex: routed.stageIndex,
        timestampHistory: [...existing.timestampHistory, new Date().toISOString()],
      }) ?? existing;

    this.ensureRecord("routing", config);
    appendApvrtLog({
      event: "route_approval",
      details: `${request.approvalId}:${request.currentApprover}`,
    });

    return this.reportAction(
      "route_approval",
      started,
      input,
      config,
      policy,
      [policy],
      request,
      [request],
      null,
      [],
      policy.stages,
      null,
    );
  }

  decide(input: ApvrtInput, config: ApprovalRuntimeConfiguration): ApvrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    const validation = this.validator.validateDecide(input, started);
    if (validation.decision === "fail") {
      return this.failReport("decide", started, validation, config);
    }

    const existing = this.store.getRequest(input.approvalId!);
    if (!existing) {
      return this.failReport(
        "decide",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, `Unknown approvalId ${input.approvalId}`],
        },
        config,
      );
    }

    const policy = this.store.getPolicy(existing.approvalPolicy);
    if (!policy) {
      return this.failReport(
        "decide",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, `Unknown policy ${existing.approvalPolicy}`],
        },
        config,
      );
    }

    if (input.simulateTimeout === true) {
      const timed = this.timeoutHandler.applyTimeout(this.store, existing, input);
      const decisionRecord = this.decisionRecorder.record(
        this.store,
        timed ?? existing,
        "timeout",
        input,
        policy.stages[existing.stageIndex] ?? "pillow",
      );
      const request = this.store.getRequest(existing.approvalId);
      return this.reportAction(
        "decide",
        started,
        input,
        config,
        policy,
        [policy],
        request,
        request ? [request] : [],
        decisionRecord,
        [decisionRecord],
        policy.stages,
        null,
      );
    }

    const decision = input.decision!;
    const stage = policy.stages[existing.stageIndex] ?? existing.currentApprover;

    // Enforce Pillow / Grand King stage identity — never fabricate or auto-approve
    if (decision === "approve") {
      const approver = input.approver ?? existing.currentApprover;
      if (stage === "grand_king" || existing.currentStatus === "awaiting_grand_king") {
        if (approver !== "grand_king") {
          return this.failReport(
            "decide",
            started,
            {
              ...validation,
              decision: "fail",
              errors: [
                ...validation.errors,
                "Grand King stage requires approver=grand_king — never auto-approve",
              ],
            },
            config,
          );
        }
      }
      if (
        (stage === "pillow" || existing.currentStatus === "awaiting_pillow") &&
        existing.currentApprover === "pillow" &&
        approver !== "pillow"
      ) {
        return this.failReport(
          "decide",
          started,
          {
            ...validation,
            decision: "fail",
            errors: [...validation.errors, "Pillow stage requires approver=pillow"],
          },
          config,
        );
      }
      if (
        existing.currentStatus === "delegated" &&
        input.approver &&
        input.approver !== existing.currentApprover
      ) {
        return this.failReport(
          "decide",
          started,
          {
            ...validation,
            decision: "fail",
            errors: [
              ...validation.errors,
              `Delegated stage requires approver=${existing.currentApprover}`,
            ],
          },
          config,
        );
      }
    }

    let decisionRecord: DecisionRecord;
    let request: ApprovalRequest | null = existing;

    if (decision === "approve") {
      decisionRecord = this.decisionRecorder.record(this.store, existing, "approve", input, stage);
      const refreshed = this.store.getRequest(existing.approvalId) ?? existing;
      request = this.multiStageEngine.applyApprove(this.store, refreshed, policy);
    } else if (decision === "reject") {
      decisionRecord = this.decisionRecorder.record(this.store, existing, "reject", input, stage);
      const refreshed = this.store.getRequest(existing.approvalId) ?? existing;
      request = this.multiStageEngine.applyReject(this.store, refreshed);
    } else if (decision === "escalate") {
      const result = this.escalationEngine.escalate(this.store, existing, policy, input);
      if (!result.request) {
        return this.failReport(
          "decide",
          started,
          {
            ...validation,
            decision: "fail",
            errors: [...validation.errors, result.error ?? "Escalation denied"],
          },
          config,
        );
      }
      decisionRecord = this.decisionRecorder.record(
        this.store,
        result.request,
        "escalate",
        input,
        stage,
      );
      request = this.store.getRequest(existing.approvalId);
    } else if (decision === "delegate") {
      const result = this.delegationEngine.delegate(this.store, existing, policy, input);
      if (!result.request) {
        return this.failReport(
          "decide",
          started,
          {
            ...validation,
            decision: "fail",
            errors: [...validation.errors, result.error ?? "Delegation denied"],
          },
          config,
        );
      }
      decisionRecord = this.decisionRecorder.record(
        this.store,
        result.request,
        "delegate",
        input,
        stage,
      );
      request = this.store.getRequest(existing.approvalId);
    } else {
      return this.failReport(
        "decide",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, `Unsupported decision ${decision}`],
        },
        config,
      );
    }

    this.ensureRecord("deciding", config);
    appendApvrtLog({
      event: "decide",
      details: `${existing.approvalId}:${decision}:${request?.currentStatus ?? "unknown"}`,
    });

    return this.reportAction(
      "decide",
      started,
      input,
      config,
      policy,
      [policy],
      request,
      request ? [request] : [],
      decisionRecord,
      decisionRecord ? [decisionRecord] : [],
      policy.stages,
      null,
    );
  }

  resumeExecution(input: ApvrtInput, config: ApprovalRuntimeConfiguration): ApvrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail" || !input.approvalId) {
      return this.failReport(
        "resume_execution",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [
            ...validation.errors,
            ...(input.approvalId ? [] : ["approvalId required for resumeExecution"]),
          ],
        },
        config,
      );
    }

    const existing = this.store.getRequest(input.approvalId);
    if (!existing) {
      return this.failReport(
        "resume_execution",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, `Unknown approvalId ${input.approvalId}`],
        },
        config,
      );
    }

    const result = this.resumeEngine.resume(this.store, existing);
    if (!result.request) {
      return this.failReport(
        "resume_execution",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, result.error ?? "Resume blocked"],
        },
        config,
      );
    }

    this.ensureRecord("resuming", config);
    appendApvrtLog({
      event: "resume_execution",
      details: `${result.request.approvalId}:resumed`,
    });

    const policy = this.store.getPolicy(result.request.approvalPolicy);
    return this.reportAction(
      "resume_execution",
      started,
      input,
      config,
      policy,
      policy ? [policy] : [],
      result.request,
      [result.request],
      null,
      [],
      policy?.stages ?? [],
      result.resumeToken,
    );
  }

  produceReport(input: ApvrtInput, config: ApprovalRuntimeConfiguration): ApvrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("produce_report", started, validation, config);
    }
    const metrics = this.metricsCollector.collect(this.store);
    const report = this.reportBuilder.buildApprovalRuntimeReport(
      this.store,
      this.metricsCollector,
      this.governanceSummaryBuilder,
      config,
      {
        auditStatus: "passed",
        outstandingIssues: [],
        confidenceScore: Math.min(
          95,
          70 + metrics.totalPolicies * 2 + metrics.totalRequests + metrics.totalDecisions,
        ),
        supportingEvidence: ["approval-runtime operational evidence"],
      },
    );
    this.store.saveReport(report);
    this.ensureRecord("reporting", config);
    return {
      action: "produce_report",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "pass",
      validation,
      policy: null,
      policies: [],
      request: null,
      requests: [],
      decisionRecord: null,
      decisions: [],
      approvalRuntimeReport: report,
      q1010Contract: null,
      requiredStages: [],
      resumeToken: null,
      errors: [],
      warnings: [],
    };
  }

  submitReport(input: ApvrtInput, config: ApprovalRuntimeConfiguration): ApvrtRunReport {
    const produced = this.produceReport(input, config);
    if (produced.decision === "fail" || !produced.approvalRuntimeReport) {
      return produced;
    }
    this.integrations.submitReport(produced.approvalRuntimeReport);
    this.integrations.recordAudit({
      event: "approval_runtime_report_submitted",
      reportId: produced.approvalRuntimeReport.reportId,
    });
    return { ...produced, action: "submit_report" };
  }

  list(_input: ApvrtInput, config: ApprovalRuntimeConfiguration): ApvrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const policies = this.store.listPolicies();
    const requests = this.store.listRequests();
    const decisions = this.store.listDecisions();
    return this.reportAction(
      "list",
      started,
      _input,
      config,
      policies[0] ?? null,
      policies,
      requests[0] ?? null,
      requests,
      decisions[0] ?? null,
      decisions,
      [],
      null,
    );
  }

  validate(input: ApvrtInput, config: ApprovalRuntimeConfiguration): ApvrtRunReport {
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
      policy: null,
      policies: [],
      request: null,
      requests: [],
      decisionRecord: null,
      decisions: [],
      approvalRuntimeReport: null,
      q1010Contract: null,
      requiredStages: [],
      resumeToken: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  diagnostics(_input: ApvrtInput, config: ApprovalRuntimeConfiguration): ApvrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(config.integrationTargets);
    this.reportBuilder.buildDiagnostics(this.store, handshakes);
    return this.reportAction(
      "diagnostics",
      started,
      _input,
      config,
      null,
      [],
      null,
      [],
      null,
      [],
      [],
      null,
      handshakes,
    );
  }

  private ensureRecord(
    state: ApvrtEngineRecord["operationalState"],
    config: ApprovalRuntimeConfiguration,
  ) {
    const lastReport = this.store.listReports().at(-1);
    const policies = this.store.listPolicies();
    this.engineRecord = {
      engineId: APPROVAL_RUNTIME_ID,
      workerId: config.workerId,
      operationalState: state,
      healthStatus: policies.length > 0 ? "healthy" : "standby",
      totalPolicies: policies.length,
      totalRequests: this.store.listRequests().length,
      totalDecisions: this.store.listDecisions().length,
      totalReports: this.store.listReports().length,
      lastReportId: lastReport?.reportId ?? null,
      supportedCapabilities: [...APVRT_CAPABILITIES],
      integrationTargets: [...config.integrationTargets] as ApvrtEngineRecord["integrationTargets"],
      metadataVersion: APVRT_METADATA_VERSION,
    };
  }

  private reportAction(
    action: string,
    started: number,
    input: ApvrtInput,
    _config: ApprovalRuntimeConfiguration,
    policy: ApprovalPolicy | null,
    policies: ApprovalPolicy[],
    request: ApprovalRequest | null,
    requests: ApprovalRequest[],
    decisionRecord: DecisionRecord | null,
    decisions: DecisionRecord[],
    requiredStages: string[],
    resumeToken: string | null,
    handshakes: IntegrationHandshake[] = [],
  ): ApvrtRunReport {
    const validation = this.validator.validateInput(input, started);
    const decision = validation.decision === "fail" ? "fail" : "pass";
    if (handshakes.length) {
      appendApvrtLog({ event: action, details: `integrations=${handshakes.length}` });
    }
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision,
      validation,
      policy,
      policies,
      request,
      requests,
      decisionRecord,
      decisions,
      approvalRuntimeReport: null,
      q1010Contract: null,
      requiredStages,
      resumeToken,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  private failReport(
    action: string,
    started: number,
    validation: ApvrtValidationReport,
    _config: ApprovalRuntimeConfiguration,
  ): ApvrtRunReport {
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "fail",
      validation,
      policy: null,
      policies: [],
      request: null,
      requests: [],
      decisionRecord: null,
      decisions: [],
      approvalRuntimeReport: null,
      q1010Contract: null,
      requiredStages: [],
      resumeToken: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }
}
