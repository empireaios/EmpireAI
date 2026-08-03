import type { TopicPlannerWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type TopicPlannerWorkerDependencies,
} from "./integrations.js";
import { PlanBuilder } from "./plan-builder.js";
import { PlanStore } from "./plan-store.js";
import { HealthMonitor, PlanValidator, RecoveryManager } from "./plan-validator.js";
import { appendTpwLog } from "./tpw-logging.js";
import {
  INTEGRATION_TARGETS,
  TPW_CAPABILITIES,
  TPW_METADATA_VERSION,
  TOPIC_PLANNER_WORKER_ID,
} from "./paths.js";
import type {
  IntegrationHandshake,
  OperationalState,
  PlanningContext,
  TopicPlan,
  TopicPlannerWorkerCatalog,
  TopicPlannerWorkerEngineRecord,
  TopicPlannerWorkerInput,
  TopicPlannerWorkerRunReport,
} from "./types.js";

export class PlanManager {
  private engineRecord: TopicPlannerWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: TopicPlannerWorkerCatalog | null = null;
  private readonly store = new PlanStore();
  private readonly builder = new PlanBuilder();
  private readonly validator = new PlanValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: PlanningContext = {};

  bindIntegrations(deps: TopicPlannerWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: TopicPlannerWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedPlans);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
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
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getTopicPlans() {
    return this.store.list();
  }

  getLatestTopicPlanId() {
    return this.store.getLatestTopicPlanId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getContext() {
    return { ...this.context };
  }

  connect(
    _input: Record<string, unknown>,
    config: TopicPlannerWorkerConfiguration,
  ): TopicPlannerWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendTpwLog({
      event: "connect",
      details: `Topic Planner Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `tpw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Topic Planner Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: TPW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveEditorialStrategy(
    input: TopicPlannerWorkerInput,
    config: TopicPlannerWorkerConfiguration,
  ) {
    return this.runStage("receive_editorial_strategy", input, config, false);
  }

  receiveTrendResearchReports(
    input: TopicPlannerWorkerInput,
    config: TopicPlannerWorkerConfiguration,
  ) {
    return this.runStage("receive_trend_research_reports", input, config, false);
  }

  analyseChannelObjectives(input: TopicPlannerWorkerInput, config: TopicPlannerWorkerConfiguration) {
    return this.runStage("analyse_channel_objectives", input, config, false);
  }

  prioritizeContentOpportunities(
    input: TopicPlannerWorkerInput,
    config: TopicPlannerWorkerConfiguration,
  ) {
    return this.runStage("prioritize_content_opportunities", input, config, false);
  }

  selectDailyPublishingTopics(
    input: TopicPlannerWorkerInput,
    config: TopicPlannerWorkerConfiguration,
  ) {
    return this.runPlanning("select_daily_publishing_topics", input, config);
  }

  balanceEvergreenAndTrending(
    input: TopicPlannerWorkerInput,
    config: TopicPlannerWorkerConfiguration,
  ) {
    return this.runPlanning("balance_evergreen_and_trending", input, config);
  }

  preventDuplicateTopics(input: TopicPlannerWorkerInput, config: TopicPlannerWorkerConfiguration) {
    return this.runPlanning("prevent_duplicate_topics", input, config);
  }

  maintainPublishingCadence(
    input: TopicPlannerWorkerInput,
    config: TopicPlannerWorkerConfiguration,
  ) {
    return this.runPlanning("maintain_publishing_cadence", input, config);
  }

  rankTopicsByStrategicPriority(
    input: TopicPlannerWorkerInput,
    config: TopicPlannerWorkerConfiguration,
  ) {
    return this.runPlanning("rank_topics_by_strategic_priority", input, config);
  }

  produceTopicPlan(input: TopicPlannerWorkerInput, config: TopicPlannerWorkerConfiguration) {
    return this.runPlanning("produce_topic_plan", input, config);
  }

  submitPlan(input: TopicPlannerWorkerInput, config: TopicPlannerWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_plan", input, config, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_plan", config, "Executive reporting submission is disabled");
    }
    let plans = this.store.list();
    if (input.topicPlanId) {
      const one = this.store.get(input.topicPlanId);
      plans = one ? [one] : [];
    }
    if (!plans.length) {
      const generated = this.runPlanning("produce_topic_plan", input, config);
      plans = generated.topicPlans;
      if (!plans.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitPlan(plans);
    if (submission.submitted && submission.executiveReportId) {
      plans = plans.map(
        (p) => this.store.markSubmitted(p.topicPlanId, submission.executiveReportId!) ?? p,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = plans[plans.length - 1] ?? null;
    const validation = this.validator.validatePlans(
      plans.length ? plans : null,
      { ...input, validated: input.validated ?? true, pillowGovernanceConfirmed: input.pillowGovernanceConfirmed ?? true },
      started,
    );
    if (!submission.submitted) validation.warnings.push(submission.details);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    appendTpwLog({
      event: "submit_plan",
      details: `plans=${plans.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_plan",
      this.getCatalog(),
      plans,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: TopicPlannerWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const plans = this.store.list();
    const latest = plans[plans.length - 1] ?? null;
    const validation = this.validator.validatePlans(
      plans.length ? plans : null,
      { validated: true, pillowGovernanceConfirmed: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), plans, latest, validation, started);
  }

  validate(input: TopicPlannerWorkerInput, config: TopicPlannerWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const plans = this.store.list();
    const latest = plans[plans.length - 1] ?? null;
    const validation = this.validator.validatePlans(
      plans.length ? plans : null,
      { ...input, validated: input.validated ?? true, pillowGovernanceConfirmed: input.pillowGovernanceConfirmed ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("validate", this.getCatalog(), plans, latest, validation, started);
  }

  diagnostics(config: TopicPlannerWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Topic Planner Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendTpwLog({
      event: "diagnostics",
      details: `topicPlans=${this.store.count()}`,
    });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runStage(
    action: TopicPlannerWorkerRunReport["action"],
    input: TopicPlannerWorkerInput,
    config: TopicPlannerWorkerConfiguration,
    requirePlan: boolean,
  ): TopicPlannerWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.planningRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Topic Planner Worker is disabled" : "Planning rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromUpstreamWorkers(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const validation = this.validator.validatePlans(
      requirePlan ? this.store.list() : null,
      { ...enriched, validated: enriched.validated ?? true, pillowGovernanceConfirmed: enriched.pillowGovernanceConfirmed ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendTpwLog({
      event: action,
      details: `editorial=${Boolean(this.context.editorialStrategy)} trends=${this.context.trendReports?.length ?? 0}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runPlanning(
    action: TopicPlannerWorkerRunReport["action"],
    input: TopicPlannerWorkerInput,
    config: TopicPlannerWorkerConfiguration,
  ): TopicPlannerWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.planningRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Topic Planner Worker is disabled" : "Planning rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromUpstreamWorkers({
      ...input,
      pillowGovernanceConfirmed: input.pillowGovernanceConfirmed ?? true,
    });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canProducePlan(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    if (!enriched.channelId?.trim()) {
      return this.disabled(action, config, "Topic planning requires channelId");
    }
    const plan = this.builder.buildPlan(enriched, config, this.context, this.store);
    this.store.save(plan, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validatePlans(
      [plan],
      { ...enriched, validated: enriched.validated ?? true, pillowGovernanceConfirmed: enriched.pillowGovernanceConfirmed ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      plan,
    );
    appendTpwLog({
      event: action,
      details: `plan=${plan.topicPlanId} topics=${plan.selectedTopics.length} cadence=${plan.cadenceStatus}`,
    });
    return this.report(action, this.getCatalog(), [plan], plan, validation, started);
  }

  private boundaryFail(
    action: TopicPlannerWorkerRunReport["action"],
    input: TopicPlannerWorkerInput,
    config: TopicPlannerWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validatePlans(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: TopicPlannerWorkerRunReport["action"],
    config: TopicPlannerWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: TopicPlannerWorkerInput) {
    return (
      input.writeScripts === true ||
      input.generateVisuals === true ||
      input.produceVideos === true ||
      input.publishContent === true ||
      input.bypassPillowGovernance === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ405OrLater === true ||
      input.requireGrandKingDailyPrompt === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: TopicPlannerWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: TopicPlan | null = null,
  ) {
    const plan = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `tpw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: TOPIC_PLANNER_WORKER_ID,
      engineVersion: "PILLOW-TPW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...TPW_CAPABILITIES],
      totalTopicPlans: this.store.count(),
      lastTopicPlanId: plan?.topicPlanId ?? this.store.getLatestTopicPlanId(),
      lastTopicPriority: plan?.topicPriority ?? null,
      lastCadenceStatus: plan?.cadenceStatus ?? null,
      lastConfidenceScore: plan?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: TPW_METADATA_VERSION,
    };
  }

  private report(
    action: TopicPlannerWorkerRunReport["action"],
    catalog: TopicPlannerWorkerCatalog | null,
    topicPlans: TopicPlan[],
    latestTopicPlan: TopicPlan | null,
    validation: TopicPlannerWorkerRunReport["validation"],
    started: number,
  ): TopicPlannerWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      topicRunReportId: `tpw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      topicPlans,
      latestTopicPlan,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: TPW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: TopicPlannerWorkerCatalog): TopicPlannerWorkerCatalog {
  return {
    ...catalog,
    topicPlans: catalog.topicPlans.map((plan) => ({
      ...plan,
      selectedTopics: plan.selectedTopics.map((t) => ({ ...t })),
      rankedTopics: plan.rankedTopics.map((t) => ({ ...t })),
      trendReportIds: [...plan.trendReportIds],
      traceabilityRefs: [...plan.traceabilityRefs],
      preservedDecisions: plan.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
