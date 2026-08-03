import type { ChannelRecommendationWorkerConfiguration } from "./configuration.js";
import { RecommendationBuilder } from "./recommendation-builder.js";
import { RecommendationStore } from "./recommendation-store.js";
import {
  HealthMonitor,
  RecommendationValidator,
  RecoveryManager,
} from "./recommendation-validator.js";
import {
  IntegrationCoordinator,
  type ChannelRecommendationWorkerDependencies,
} from "./integrations.js";
import {
  CHANNEL_RECOMMENDATION_WORKER_ID,
  CRW_CAPABILITIES,
  CRW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import { appendCrwLog } from "./crw-logging.js";
import type {
  ChannelRecommendationReport,
  ChannelRecommendationWorkerCatalog,
  ChannelRecommendationWorkerEngineRecord,
  ChannelRecommendationWorkerInput,
  ChannelRecommendationWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
  RecommendationContext,
} from "./types.js";

export class RecommendationManager {
  private engineRecord: ChannelRecommendationWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: ChannelRecommendationWorkerCatalog | null = null;
  private readonly store = new RecommendationStore();
  private readonly builder = new RecommendationBuilder();
  private readonly validator = new RecommendationValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: RecommendationContext = {};

  bindIntegrations(deps: ChannelRecommendationWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ChannelRecommendationWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedRecommendationReports);
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

  getRecommendationReports() {
    return this.store.list();
  }

  getLatestRecommendationId() {
    return this.store.getLatestRecommendationId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: ChannelRecommendationWorkerConfiguration,
  ): ChannelRecommendationWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendCrwLog({
      event: "connect",
      details: `Channel Recommendation Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `crw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Channel Recommendation Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: CRW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveTrendResearch(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ) {
    return this.runReceive("receive_trend_research", input, config, {
      receivedTrend: true,
    });
  }

  receiveMediaAnalytics(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ) {
    return this.runReceive("receive_media_analytics", input, config, {
      receivedAnalytics: true,
    });
  }

  receiveMediaLearningOutputs(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ) {
    return this.runReceive("receive_media_learning_outputs", input, config, {
      receivedLearning: true,
    });
  }

  analyseAudiencePotential(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ) {
    return this.runAnalyze("analyse_audience_potential", input, config, "audience");
  }

  analyseRevenuePotential(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ) {
    return this.runAnalyze("analyse_revenue_potential", input, config, "revenue");
  }

  analyseProductionFeasibility(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ) {
    return this.runAnalyze("analyse_production_feasibility", input, config, "feasibility");
  }

  analyseCompetition(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ) {
    return this.runAnalyze("analyse_competition", input, config, "competition");
  }

  analyseStrategicFit(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ) {
    return this.runAnalyze("analyse_strategic_fit", input, config, "strategic");
  }

  analyseExpectedContentSustainability(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ) {
    return this.runAnalyze(
      "analyse_expected_content_sustainability",
      input,
      config,
      "sustainability",
    );
  }

  rankChannelOpportunities(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ) {
    return this.runAnalyze("rank_channel_opportunities", input, config, "rank");
  }

  recommendProceedMonitorOrReject(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ) {
    return this.runAnalyze(
      "recommend_proceed_monitor_or_reject",
      input,
      config,
      "recommend",
    );
  }

  produceChannelRecommendationReport(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ) {
    return this.runFull("produce_channel_recommendation_report", input, config);
  }

  submitReport(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_report",
        config,
        "Executive reporting submission is disabled",
      );
    }
    let reports = this.store.list();
    if (input.recommendationId) {
      const one = this.store.get(input.recommendationId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFull(
        "produce_channel_recommendation_report",
        input,
        config,
      );
      reports = generated.recommendationReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) =>
          this.store.markSubmitted(r.recommendationId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateRecommendationReports(
      reports.length ? reports : null,
      { ...input, validated: input.validated ?? true },
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
    appendCrwLog({
      event: "submit_report",
      details: `recommendationReports=${reports.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      reports,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: ChannelRecommendationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateRecommendationReports(
      reports.length ? reports : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), reports, latest, validation, started);
  }

  validate(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateRecommendationReports(
      reports.length ? reports : null,
      { ...input, validated: input.validated ?? true },
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
    return this.report("validate", this.getCatalog(), reports, latest, validation, started);
  }

  diagnostics(config: ChannelRecommendationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Channel Recommendation Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendCrwLog({
      event: "diagnostics",
      details: `recommendationReports=${this.store.count()}`,
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

  private runReceive(
    action: ChannelRecommendationWorkerRunReport["action"],
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
    flags: Partial<
      Pick<RecommendationContext, "receivedTrend" | "receivedAnalytics" | "receivedLearning">
    >,
  ): ChannelRecommendationWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.recommendationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Channel Recommendation Worker is disabled"
          : "Recommendation rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    this.context = { ...this.context, ...flags };
    const validation = this.validator.validateRecommendationReports(
      null,
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendCrwLog({
      event: action,
      details: `channel=${this.context.proposedChannelName ?? "pending"} trend=${this.context.trendSignals?.length ?? 0} analytics=${this.context.analyticsSignals?.length ?? 0} learning=${this.context.learningSignals?.length ?? 0}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runAnalyze(
    action: ChannelRecommendationWorkerRunReport["action"],
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
    mode:
      | "audience"
      | "revenue"
      | "feasibility"
      | "competition"
      | "strategic"
      | "sustainability"
      | "rank"
      | "recommend",
  ): ChannelRecommendationWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.recommendationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Channel Recommendation Worker is disabled"
          : "Recommendation rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    const enriched = this.integrations.enrichInput({
      ...input,
      validated: input.validated ?? true,
    });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readinessGate = this.builder.canRecommend(this.context);
    if (!readinessGate.ready) {
      const validation = this.validator.finalize(
        "fail",
        [readinessGate.reason ?? "Not ready"],
        [],
        started,
      );
      this.recovery.recordFailure();
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const seq = Date.now();
    if (mode === "audience") {
      this.context = {
        ...this.context,
        audiencePotential: this.builder.analyseAudiencePotential(this.context, seq),
      };
    }
    if (mode === "revenue") {
      this.context = {
        ...this.context,
        revenuePotential: this.builder.analyseRevenuePotential(this.context, seq),
      };
    }
    if (mode === "feasibility") {
      this.context = {
        ...this.context,
        productionFeasibility: this.builder.analyseProductionFeasibility(this.context, seq),
      };
    }
    if (mode === "competition") {
      this.context = {
        ...this.context,
        competitionAssessment: this.builder.analyseCompetition(this.context, seq),
      };
    }
    if (mode === "strategic") {
      this.context = {
        ...this.context,
        strategicFit: this.builder.analyseStrategicFit(this.context, seq),
      };
    }
    if (mode === "sustainability") {
      this.context = {
        ...this.context,
        contentSustainability: this.builder.analyseExpectedContentSustainability(
          this.context,
          seq,
        ),
      };
    }
    if (mode === "recommend" || mode === "rank") {
      const dims = this.builder.scoreAllDimensions(this.context, seq);
      this.context = {
        ...this.context,
        audiencePotential: dims.audience,
        revenuePotential: dims.revenue,
        productionFeasibility: dims.feasibility,
        competitionAssessment: dims.competition,
        strategicFit: dims.strategic,
        contentSustainability: dims.sustainability,
      };
      const risk = this.builder.buildRiskAssessment(
        dims.audience,
        dims.revenue,
        dims.feasibility,
        dims.competition,
        dims.strategic,
        dims.sustainability,
      );
      const overall = this.builder.computeOverallScore({
        audience: dims.audience,
        revenue: dims.revenue,
        feasibility: dims.feasibility,
        competition: dims.competition,
        strategic: dims.strategic,
        sustainability: dims.sustainability,
      });
      const decision = this.builder.recommendProceedMonitorOrReject(overall, risk, config);
      this.context = { ...this.context, recommendation: decision };
    }

    const report = this.builder.buildRecommendationReport(enriched, config, this.context);
    if (mode === "rank") {
      this.context = {
        ...this.context,
        rankingPosition: report.rankingPosition,
        rankedOpportunities: report.rankedOpportunities,
      };
    }
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateRecommendationReports(
      [report],
      enriched,
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendCrwLog({
      event: action,
      details: `recommendationId=${report.recommendationId} mode=${mode}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private runFull(
    action: ChannelRecommendationWorkerRunReport["action"],
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
  ): ChannelRecommendationWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.recommendationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Channel Recommendation Worker is disabled"
          : "Recommendation rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    const enriched = this.integrations.enrichInput({
      ...input,
      validated: input.validated ?? true,
    });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readinessGate = this.builder.canRecommend(this.context);
    if (!readinessGate.ready) {
      const validation = this.validator.finalize(
        "fail",
        [readinessGate.reason ?? "Not ready"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const report = this.builder.buildRecommendationReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateRecommendationReports(
      [report],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendCrwLog({
      event: action,
      details: `recommendationId=${report.recommendationId} channel=${report.proposedChannel.channelName} decision=${report.recommendation} score=${report.overallScore}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: ChannelRecommendationWorkerRunReport["action"],
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateRecommendationReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: ChannelRecommendationWorkerRunReport["action"],
    config: ChannelRecommendationWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: ChannelRecommendationWorkerInput) {
    return (
      input.createChannels === true ||
      input.configurePlatformAccounts === true ||
      input.publishContent === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ418OrLater === true ||
      input.createChannelsAutomatically === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: ChannelRecommendationWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: ChannelRecommendationReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `crw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: CHANNEL_RECOMMENDATION_WORKER_ID,
      engineVersion: "PILLOW-CRW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...CRW_CAPABILITIES],
      totalRecommendationReports: this.store.count(),
      lastRecommendationId:
        report?.recommendationId ?? this.store.getLatestRecommendationId(),
      lastProposedChannelName: report?.proposedChannel.channelName ?? null,
      lastOverallScore: report?.overallScore ?? null,
      lastRecommendation: report?.recommendation ?? null,
      lastNeverCreateChannelsAutomatically:
        report?.neverCreateChannelsAutomatically ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: CRW_METADATA_VERSION,
    };
  }

  private report(
    action: ChannelRecommendationWorkerRunReport["action"],
    catalog: ChannelRecommendationWorkerCatalog | null,
    recommendationReports: ChannelRecommendationReport[],
    latestRecommendationReport: ChannelRecommendationReport | null,
    validation: ChannelRecommendationWorkerRunReport["validation"],
    started: number,
  ): ChannelRecommendationWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      recommendationRunReportId: `crw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      recommendationReports,
      latestRecommendationReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: CRW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: ChannelRecommendationWorkerCatalog,
): ChannelRecommendationWorkerCatalog {
  return {
    ...catalog,
    recommendationReports: catalog.recommendationReports.map((r) => ({
      ...r,
      proposedChannel: { ...r.proposedChannel },
      targetAudience: {
        ...r.targetAudience,
        audienceSegments: [...r.targetAudience.audienceSegments],
        geographyHints: [...r.targetAudience.geographyHints],
      },
      audiencePotential: {
        ...r.audiencePotential,
        evidenceRefs: [...r.audiencePotential.evidenceRefs],
      },
      revenuePotential: {
        ...r.revenuePotential,
        evidenceRefs: [...r.revenuePotential.evidenceRefs],
      },
      productionFeasibility: {
        ...r.productionFeasibility,
        evidenceRefs: [...r.productionFeasibility.evidenceRefs],
      },
      competitionAssessment: {
        ...r.competitionAssessment,
        evidenceRefs: [...r.competitionAssessment.evidenceRefs],
      },
      strategicFit: {
        ...r.strategicFit,
        evidenceRefs: [...r.strategicFit.evidenceRefs],
      },
      contentSustainability: {
        ...r.contentSustainability,
        evidenceRefs: [...r.contentSustainability.evidenceRefs],
      },
      riskAssessment: {
        ...r.riskAssessment,
        factors: [...r.riskAssessment.factors],
      },
      supportingEvidence: r.supportingEvidence.map((e) => ({ ...e })),
      rankedOpportunities: (r.rankedOpportunities ?? []).map((o) => ({ ...o })),
      sourceTraceabilityRefs: [...r.sourceTraceabilityRefs],
      preservedDecisions: r.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
    recommendationDecisions: [...catalog.recommendationDecisions],
  };
}
