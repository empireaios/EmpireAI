import {
  AuditStore,
  nextCycleId,
  nextReportId,
  nextStateId,
  resetEesaeSequenceForTesting,
} from "./audit-store.js";
import { EesaeValidator, GateManager, HealthMonitor, validateBoundaries, validateGovernance } from "./audit-validator.js";
import type { EnterpriseExecutiveSituationalAwarenessEngineConfiguration } from "./configuration.js";
import {
  buildAwarenessState,
  detectDeterioration,
  estimateBusinessImpactAndUrgency,
  evaluateAiWorkforceIntelligence,
  evaluateBusinessIntelligence,
  evaluatePerformanceIntelligence,
  evaluateSelfAwareness,
  evaluateSystemHealth,
  investigateRootCauses,
} from "./evidence-collector.js";
import { appendEesaeLog } from "./eesae-logging.js";
import {
  IntegrationCoordinator,
  verifyIntegrations,
  type EnterpriseExecutiveSituationalAwarenessEngineDependencies,
} from "./integrations.js";
import {
  acknowledgeFinding,
  escalateUnacknowledged,
  generateExecutiveRecommendations,
} from "./recommendation-engine.js";
import {
  buildBriefingText,
  buildCatalog,
  buildExecutiveSummary,
  buildGrandKingBriefing,
  buildReport,
} from "./report-builder.js";
import {
  EESAE_CAPABILITIES,
  EESAE_IDENTITY,
  EESAE_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  AwarenessCycleResult,
  AwarenessFinding,
  DomainSummary,
  EesaeEngineRecord,
  EesaeInput,
  EesaeValidation,
  EscalationRecord,
  ExecutiveRecommendation,
  GrandKingBriefing,
  PersistentAwarenessState,
  RootCauseInvestigation,
  SituationalAwarenessReport,
} from "./types.js";

export { resetEesaeSequenceForTesting };

export type EesaeRunReport = {
  action: string;
  runTimestamp: string;
  durationMs: number;
  decision: "pass" | "partial" | "fail";
  validation: EesaeValidation;
  domainSummary?: DomainSummary;
  findings?: AwarenessFinding[];
  deterioration?: import("./types.js").DeteriorationResult;
  investigation?: RootCauseInvestigation;
  impact?: { businessImpact: string; urgency: AwarenessFinding["urgency"] };
  recommendations?: ExecutiveRecommendation[];
  escalations?: EscalationRecord[];
  report?: SituationalAwarenessReport | null;
  awarenessState?: PersistentAwarenessState | null;
  awarenessCycle?: AwarenessCycleResult | null;
  briefing?: GrandKingBriefing | null;
  briefingText?: string | null;
  errors: string[];
  warnings: string[];
};

export class EnterpriseExecutiveSituationalAwarenessEngineManager {
  private engineRecord: EesaeEngineRecord | null = null;
  private seeded = false;
  private awarenessCycles = 0;
  private readonly store = new AuditStore();
  private readonly validator = new EesaeValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly gateManager = new GateManager();
  private readonly integrations = new IntegrationCoordinator();
  private openFindings: AwarenessFinding[] = [];
  private openEscalations: EscalationRecord[] = [];

  bindIntegrations(deps: EnterpriseExecutiveSituationalAwarenessEngineDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getDependencies();
  }

  ensureSeeded(config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
    this.seeded = true;
    this.ensureRecord("connected", config);
    appendEesaeLog({ event: "seed", details: "EESAE awareness store seeded" });
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

  getAwarenessStates() {
    return this.store.listAwarenessStates();
  }

  getLatestReport() {
    return this.store.getLatestReport();
  }

  getLatestAwarenessState() {
    return this.store.getLatestAwarenessState();
  }

  getPersistentAwarenessState(stateId?: string) {
    if (stateId) return this.store.getAwarenessState(stateId);
    return this.store.getLatestAwarenessState();
  }

  getCatalog(config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration) {
    return buildCatalog(
      config.workerId,
      this.store.listReports(),
      this.store.listAwarenessStates(),
      this.integrations.getHandshakes(),
      this.openFindings.filter((f) => !f.acknowledged).length,
    );
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  connect(_input: Record<string, unknown>, config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendEesaeLog({
      event: "connect",
      details: `EESAE connected; integrations=${handshakes.filter((h) => h.status === "bound").length}`,
    });
    return handshakes;
  }

  evaluateSystemHealth(input: EesaeInput, config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration): EesaeRunReport {
    return this.evaluateDomain("evaluate_system_health", input, config, () =>
      evaluateSystemHealth(this.integrations.getDependencies(), input),
    );
  }

  evaluatePerformanceIntelligence(
    input: EesaeInput,
    config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration,
  ): EesaeRunReport {
    const started = Date.now();
    const validation = this.guardInput(input, started, config);
    if (validation.decision === "failed") return this.failReport("evaluate_performance_intelligence", started, validation);

    const result = evaluatePerformanceIntelligence(this.integrations.getDependencies(), input);
    this.mergeFindings(result.findings);
    this.ensureRecord("active", config);
    return this.passReport("evaluate_performance_intelligence", started, validation, {
      domainSummary: result.summary,
      findings: result.findings,
    });
  }

  evaluateBusinessIntelligence(
    input: EesaeInput,
    config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration,
  ): EesaeRunReport {
    return this.evaluateDomain("evaluate_business_intelligence", input, config, () =>
      evaluateBusinessIntelligence(this.integrations.getDependencies()),
    );
  }

  evaluateAiWorkforceIntelligence(
    input: EesaeInput,
    config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration,
  ): EesaeRunReport {
    const started = Date.now();
    const validation = this.guardInput(input, started, config);
    if (validation.decision === "failed") return this.failReport("evaluate_ai_workforce_intelligence", started, validation);

    const result = evaluateAiWorkforceIntelligence(this.integrations.getDependencies());
    this.mergeFindings(result.findings);
    this.ensureRecord("active", config);
    return this.passReport("evaluate_ai_workforce_intelligence", started, validation, {
      domainSummary: result.summary,
      findings: result.findings,
    });
  }

  evaluateSelfAwareness(
    input: EesaeInput,
    config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration,
  ): EesaeRunReport {
    return this.evaluateDomain("evaluate_self_awareness", input, config, () =>
      evaluateSelfAwareness(this.integrations.getDependencies()),
    );
  }

  detectDeterioration(input: EesaeInput, config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration): EesaeRunReport {
    const started = Date.now();
    const validation = this.guardInput(input, started, config);
    if (validation.decision === "failed") return this.failReport("detect_deterioration", started, validation);

    const current = this.store.getLatestAwarenessState();
    if (!current) {
      return this.failReport("detect_deterioration", started, {
        ...validation,
        decision: "failed",
        errors: [...validation.errors, "No awareness state — run awareness cycle first"],
      });
    }

    const prior = this.store.getPriorAwarenessState();
    const deterioration = detectDeterioration(prior, current);
    if (input.silentSuppressCritical === true) {
      return this.failReport("detect_deterioration", started, {
        ...validation,
        decision: "failed",
        errors: [...validation.errors, "silentSuppressCritical forbidden — critical deterioration must not be silenced"],
      });
    }
    if (deterioration.deteriorationDetected && deterioration.criticalDeltas.length > 0) {
      appendEesaeLog({
        event: "deterioration_detected",
        details: deterioration.criticalDeltas.join("; "),
      });
    }
    this.ensureRecord("active", config);
    return this.passReport("detect_deterioration", started, validation, { deterioration });
  }

  investigateRootCauses(input: EesaeInput, config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration): EesaeRunReport {
    const started = Date.now();
    const validation = this.guardInput(input, started, config);
    if (validation.decision === "failed") return this.failReport("investigate_root_causes", started, validation);

    const finding =
      this.openFindings.find((f) => f.findingId === input.findingId) ??
      this.openFindings.find((f) => f.severity === "critical") ??
      this.openFindings[0] ??
      null;
    const investigation = investigateRootCauses(finding);
    const impact = finding ? estimateBusinessImpactAndUrgency(finding) : undefined;
    this.ensureRecord("active", config);
    return this.passReport("investigate_root_causes", started, validation, { investigation, impact });
  }

  generateExecutiveRecommendations(
    input: EesaeInput,
    config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration,
  ): EesaeRunReport {
    const started = Date.now();
    const validation = this.guardInput(input, started, config);
    if (validation.decision === "failed") return this.failReport("generate_executive_recommendations", started, validation);

    const recommendations = generateExecutiveRecommendations(this.openFindings.filter((f) => !f.acknowledged));
    this.ensureRecord("active", config);
    return this.passReport("generate_executive_recommendations", started, validation, { recommendations });
  }

  escalateUnacknowledged(input: EesaeInput, config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration): EesaeRunReport {
    const started = Date.now();
    const validation = this.guardInput(input, started, config);
    if (validation.decision === "failed") return this.failReport("escalate_unacknowledged", started, validation);

    const { findings, escalations } = escalateUnacknowledged(this.openFindings);
    this.openFindings = findings;
    this.openEscalations = [...this.openEscalations, ...escalations];
    this.ensureRecord("active", config);
    appendEesaeLog({
      event: "escalate_unacknowledged",
      details: `escalations=${escalations.length}`,
    });
    return this.passReport("escalate_unacknowledged", started, validation, {
      findings,
      escalations,
    });
  }

  acknowledgeFinding(input: EesaeInput, config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration): EesaeRunReport {
    const started = Date.now();
    const validation = this.guardInput(input, started, config);
    if (validation.decision === "failed") return this.failReport("acknowledge_finding", started, validation);
    if (!input.findingId) {
      return this.failReport("acknowledge_finding", started, {
        ...validation,
        decision: "failed",
        errors: [...validation.errors, "findingId required"],
      });
    }

    const result = acknowledgeFinding(
      this.openFindings,
      this.openEscalations,
      input.findingId,
      input.acknowledgedBy ?? "grand_king",
    );
    this.openFindings = result.findings;
    this.openEscalations = result.escalations;
    this.ensureRecord("active", config);
    appendEesaeLog({ event: "acknowledge_finding", details: input.findingId });
    return this.passReport("acknowledge_finding", started, validation, {
      findings: result.findings,
      escalations: result.escalations,
    });
  }

  produceSituationalAwarenessReport(
    input: EesaeInput,
    config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration,
  ): EesaeRunReport {
    const started = Date.now();
    const validation = this.guardInput(input, started, config);
    if (validation.decision === "failed") return this.failReport("produce_situational_awareness_report", started, validation);

    const deps = this.integrations.getDependencies();
    const systemHealth = evaluateSystemHealth(deps, input);
    const performance = evaluatePerformanceIntelligence(deps, input);
    const business = evaluateBusinessIntelligence(deps);
    const workforce = evaluateAiWorkforceIntelligence(deps);
    const selfAwareness = evaluateSelfAwareness(deps);
    this.mergeFindings([...performance.findings, ...workforce.findings]);

    const stateId = nextStateId();
    const recommendations = generateExecutiveRecommendations(this.openFindings.filter((f) => !f.acknowledged));
    const { findings: escalatedFindings, escalations } = escalateUnacknowledged(this.openFindings);
    this.openFindings = escalatedFindings;
    this.openEscalations = [...this.openEscalations, ...escalations];

    const awarenessState = buildAwarenessState({
      stateId,
      systemHealth,
      performance: performance.summary,
      business,
      workforce: workforce.summary,
      selfAwareness,
      findings: this.openFindings,
      escalations: this.openEscalations,
      recommendations,
    });
    this.store.saveAwarenessState(awarenessState);

    const prior = this.store.getPriorAwarenessState();
    const deterioration = detectDeterioration(prior, awarenessState);
    const briefingText = buildBriefingText(awarenessState, deterioration.deteriorationDetected);
    const digitalSoulAligned = Boolean(this.integrations.getDigitalSoulHandle());

    const report = buildReport({
      reportId: input.reportId ?? nextReportId(),
      workerId: config.workerId,
      executiveSummary: buildExecutiveSummary(awarenessState, deterioration.deteriorationDetected),
      domainSummaries: [systemHealth, performance.summary, business, workforce.summary, selfAwareness],
      deteriorationDetected: deterioration.deteriorationDetected,
      findings: this.openFindings,
      recommendations,
      briefingForGrandKing: briefingText,
      confidenceScore: awarenessState.confidenceScore,
      digitalSoulAligned,
      boundaryValidation: validateBoundaries(),
      governanceValidation: validateGovernance({
        pillowOrchestrationRuntime: deps.pillowOrchestrationRuntime,
        auditRuntime: deps.auditRuntime,
        digitalSoulRuntime: this.integrations.getDigitalSoulHandle(),
      }),
      validation,
      historyRefs: this.store.getAuditTrail(20),
    });
    this.store.saveReport(report);
    this.ensureRecord("active", config, report.reportId, awarenessState.stateId, report.confidenceScore);
    appendEesaeLog({ event: "produce_report", details: report.reportId });

    return this.passReport("produce_situational_awareness_report", started, validation, {
      report,
      awarenessState,
      deterioration,
      briefingText,
    });
  }

  submitReport(input: EesaeInput, config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration): EesaeRunReport {
    const started = Date.now();
    const validation = this.guardInput(input, started, config);
    if (validation.decision === "failed") return this.failReport("submit_report", started, validation);

    let report = this.store.getLatestReport();
    if (!report) {
      const produced = this.produceSituationalAwarenessReport(input, config);
      if (produced.decision === "fail") return produced;
      report = produced.report ?? null;
    }
    const errt = this.integrations.getDependencies().executiveReportingRuntime;
    if (config.executiveReportingEnabled && errt && report) {
      errt.submitWorkerReport({
        workerId: config.workerId,
        missionId: "EESAE-01",
        reportId: report.reportId,
        report,
      });
      const audit = this.integrations.getDependencies().auditRuntime;
      audit?.recordAuditEvent?.({
        event: "eesae_report_submitted",
        reportId: report.reportId,
      });
    }
    return this.passReport("submit_report", started, validation, { report });
  }

  runAwarenessCycle(input: EesaeInput, config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration): EesaeRunReport {
    const started = Date.now();
    const validation = this.guardInput(input, started, config);
    if (validation.decision === "failed") return this.failReport("run_awareness_cycle", started, validation);

    const deps = this.integrations.getDependencies();
    const systemHealth = evaluateSystemHealth(deps, input);
    const performance = evaluatePerformanceIntelligence(deps, input);
    const business = evaluateBusinessIntelligence(deps);
    const workforce = evaluateAiWorkforceIntelligence(deps);
    const selfAwareness = evaluateSelfAwareness(deps);
    this.mergeFindings([...performance.findings, ...workforce.findings]);

    const recommendations = generateExecutiveRecommendations(this.openFindings.filter((f) => !f.acknowledged));
    const { findings, escalations } = escalateUnacknowledged(this.openFindings);
    this.openFindings = findings;
    this.openEscalations = [...this.openEscalations, ...escalations];

    const stateId = nextStateId();
    const awarenessState = buildAwarenessState({
      stateId,
      systemHealth,
      performance: performance.summary,
      business,
      workforce: workforce.summary,
      selfAwareness,
      findings: this.openFindings,
      escalations: this.openEscalations,
      recommendations,
    });
    this.store.saveAwarenessState(awarenessState);

    const prior = this.store.getPriorAwarenessState();
    const deterioration = detectDeterioration(prior, awarenessState);
    const produced = this.produceSituationalAwarenessReport({ ...input, validated: true }, config);
    const report = produced.report ?? null;

    this.awarenessCycles += 1;
    const cycle: AwarenessCycleResult = {
      cycleId: nextCycleId(),
      timestamp: new Date().toISOString(),
      awarenessState,
      deterioration,
      report,
      escalations,
    };
    this.ensureRecord("active", config, report?.reportId ?? null, awarenessState.stateId, awarenessState.confidenceScore);
    appendEesaeLog({ event: "awareness_cycle", details: cycle.cycleId });
    return this.passReport("run_awareness_cycle", started, validation, {
      awarenessCycle: cycle,
      awarenessState,
      deterioration,
      report,
      findings: this.openFindings,
      escalations: this.openEscalations,
      recommendations,
    });
  }

  getBriefingForGrandKing(config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration): EesaeRunReport {
    const started = Date.now();
    const validation = this.validator.validateInput({ validated: true }, started);
    const state = this.store.getLatestAwarenessState();
    if (!state) {
      return this.failReport("get_briefing_for_grand_king", started, {
        ...validation,
        decision: "failed",
        errors: ["No awareness state available"],
      });
    }
    const briefing = buildGrandKingBriefing(state, this.openFindings);
    const briefingText = buildBriefingText(state, state.openFindings.some((f) => f.severity === "critical" && !f.acknowledged));
    return this.passReport("get_briefing_for_grand_king", started, validation, { briefing, briefingText });
  }

  list(_input: EesaeInput, config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration): EesaeRunReport {
    const started = Date.now();
    const validation = this.validator.validateInput({ validated: true }, started);
    this.ensureSeeded(config);
    return this.passReport("list", started, validation, {
      findings: this.openFindings,
      escalations: this.openEscalations,
    });
  }

  validate(input: EesaeInput): EesaeValidation {
    return this.validator.validateInput(input);
  }

  diagnostics(config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration) {
    this.ensureSeeded(config);
    const deps = this.integrations.getDependencies();
    const latest = this.store.getLatestAwarenessState();
    return {
      missionId: "EESAE-01" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      awarenessStates: this.store.awarenessStateCount(),
      openFindings: this.openFindings.filter((f) => !f.acknowledged).length,
      openEscalations: this.openEscalations.filter((e) => !e.acknowledged).length,
      failureCount: this.gateManager.failureCount(),
      readinessScore: latest ? latest.confidenceScore : 0.35,
      integrations: verifyIntegrations(deps),
      locks: config,
      constitutionalDutyActive: true as const,
    };
  }

  recordConstitutionalDutyActivation() {
    const ds = this.integrations.getDigitalSoulHandle();
    ds?.recordExecutiveDecision?.({
      decisionType: "eesae_constitutional_duty_activation",
      missionId: "EESAE-01",
      summary: "Continuous executive situational awareness duty activated",
      constitutionalDutyActive: true,
    });
  }

  private evaluateDomain(
    action: string,
    input: EesaeInput,
    config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration,
    run: () => DomainSummary,
  ): EesaeRunReport {
    const started = Date.now();
    const validation = this.guardInput(input, started, config);
    if (validation.decision === "failed") return this.failReport(action, started, validation);
    const domainSummary = run();
    this.ensureRecord("active", config);
    return this.passReport(action, started, validation, { domainSummary });
  }

  private guardInput(
    input: EesaeInput,
    started: number,
    config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration,
  ): EesaeValidation {
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "failed") {
      this.gateManager.recordFailure();
      this.ensureRecord("failed", config);
    }
    return validation;
  }

  private mergeFindings(findings: AwarenessFinding[]) {
    for (const finding of findings) {
      const existing = this.openFindings.find((f) => f.findingId === finding.findingId);
      if (!existing) this.openFindings.push({ ...finding });
    }
  }

  private ensureRecord(
    state: EesaeEngineRecord["status"],
    config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration,
    lastReportId: string | null = this.engineRecord?.lastReportId ?? null,
    lastStateId: string | null = this.engineRecord?.lastStateId ?? null,
    lastConfidenceScore: number | null = this.engineRecord?.lastConfidenceScore ?? null,
  ) {
    const healthStatus = this.healthMonitor.evaluate(lastConfidenceScore ?? 0.35, "passed");
    this.engineRecord = {
      engineVersion: "PILLOW-EESAE-001",
      missionId: "EESAE-01",
      workerId: config.workerId,
      status: state,
      healthStatus,
      supportedCapabilities: [...EESAE_CAPABILITIES],
      integrationTargets: [...INTEGRATION_TARGETS],
      totalReports: this.store.reportCount(),
      totalAwarenessCycles: this.awarenessCycles,
      openFindings: this.openFindings.filter((f) => !f.acknowledged).length,
      openEscalations: this.openEscalations.filter((e) => !e.acknowledged).length,
      lastReportId,
      lastStateId,
      lastConfidenceScore,
      connectedAt: this.engineRecord?.connectedAt ?? new Date().toISOString(),
      constitutionalDutyActive: true,
    };
  }

  private failReport(action: string, started: number, validation: EesaeValidation): EesaeRunReport {
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "fail",
      validation,
      errors: [...validation.errors],
      warnings: [...validation.warnings],
    };
  }

  private passReport(
    action: string,
    started: number,
    validation: EesaeValidation,
    payload: Partial<EesaeRunReport> = {},
  ): EesaeRunReport {
    const decision =
      validation.decision === "failed" ? "fail" : validation.warnings.length ? "partial" : "pass";
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision,
      validation,
      errors: [...validation.errors],
      warnings: [...validation.warnings],
      ...payload,
    };
  }
}
