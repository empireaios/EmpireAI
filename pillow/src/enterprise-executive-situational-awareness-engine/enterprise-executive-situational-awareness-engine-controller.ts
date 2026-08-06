import type { EnterpriseExecutiveSituationalAwarenessEngineConfiguration } from "./configuration.js";
import {
  EnterpriseExecutiveSituationalAwarenessEngineManager,
  type EesaeRunReport,
} from "./enterprise-executive-situational-awareness-engine-manager.js";
import type { EnterpriseExecutiveSituationalAwarenessEngineDependencies } from "./integrations.js";
import type {
  EesaeCockpitSnapshot,
  EesaeInput,
  EngineStatus,
  IntegrationHandshake,
} from "./types.js";

export class EnterpriseExecutiveSituationalAwarenessEngineController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: EnterpriseExecutiveSituationalAwarenessEngineManager,
    private readonly config: EnterpriseExecutiveSituationalAwarenessEngineConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.manager.recordConstitutionalDutyActivation();
    this.status = "standby";
  }

  bindIntegrations(deps: EnterpriseExecutiveSituationalAwarenessEngineDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
    };
  }

  connect(input: Record<string, unknown> = {}): IntegrationHandshake[] {
    this.status = "connecting";
    const handshakes = this.manager.connect(input, this.config);
    this.status = "connected";
    return handshakes;
  }

  evaluateSystemHealth(input: EesaeInput = {}): EesaeRunReport {
    this.status = "evaluating";
    return this.finish(this.manager.evaluateSystemHealth(input, this.config));
  }

  evaluatePerformanceIntelligence(input: EesaeInput = {}): EesaeRunReport {
    this.status = "evaluating";
    return this.finish(this.manager.evaluatePerformanceIntelligence(input, this.config));
  }

  evaluateBusinessIntelligence(input: EesaeInput = {}): EesaeRunReport {
    this.status = "evaluating";
    return this.finish(this.manager.evaluateBusinessIntelligence(input, this.config));
  }

  evaluateAiWorkforceIntelligence(input: EesaeInput = {}): EesaeRunReport {
    this.status = "evaluating";
    return this.finish(this.manager.evaluateAiWorkforceIntelligence(input, this.config));
  }

  evaluateSelfAwareness(input: EesaeInput = {}): EesaeRunReport {
    this.status = "evaluating";
    return this.finish(this.manager.evaluateSelfAwareness(input, this.config));
  }

  detectDeterioration(input: EesaeInput = {}): EesaeRunReport {
    this.status = "evaluating";
    return this.finish(this.manager.detectDeterioration(input, this.config));
  }

  investigateRootCauses(input: EesaeInput = {}): EesaeRunReport {
    this.status = "investigating";
    return this.finish(this.manager.investigateRootCauses(input, this.config));
  }

  generateExecutiveRecommendations(input: EesaeInput = {}): EesaeRunReport {
    this.status = "active";
    return this.finish(this.manager.generateExecutiveRecommendations(input, this.config));
  }

  escalateUnacknowledged(input: EesaeInput = {}): EesaeRunReport {
    this.status = "escalating";
    return this.finish(this.manager.escalateUnacknowledged(input, this.config));
  }

  acknowledgeFinding(input: EesaeInput = {}): EesaeRunReport {
    this.status = "active";
    return this.finish(this.manager.acknowledgeFinding(input, this.config));
  }

  produceSituationalAwarenessReport(input: EesaeInput = {}): EesaeRunReport {
    this.status = "reporting";
    return this.finish(this.manager.produceSituationalAwarenessReport(input, this.config));
  }

  submitReport(input: EesaeInput = {}): EesaeRunReport {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  runAwarenessCycle(input: EesaeInput = {}): EesaeRunReport {
    this.status = "evaluating";
    return this.finish(this.manager.runAwarenessCycle(input, this.config));
  }

  getBriefingForGrandKing(): EesaeRunReport {
    this.status = "active";
    return this.finish(this.manager.getBriefingForGrandKing(this.config));
  }

  list(input: EesaeInput = {}): EesaeRunReport {
    this.status = "active";
    return this.finish(this.manager.list(input, this.config));
  }

  validate(input: EesaeInput = {}): EesaeRunReport {
    this.status = "validating";
    const validation = this.manager.validate(input);
    const report: EesaeRunReport = {
      action: "validate",
      runTimestamp: new Date().toISOString(),
      durationMs: validation.durationMs,
      decision: validation.decision === "failed" ? "fail" : validation.warnings.length ? "partial" : "pass",
      validation,
      errors: [...validation.errors],
      warnings: [...validation.warnings],
    };
    return this.finish(report);
  }

  runDiagnostics() {
    this.status = "active";
    return this.manager.diagnostics(this.config);
  }

  getCockpitSnapshot(): EesaeCockpitSnapshot {
    const record = this.manager.getEngineRecord();
    const latest = this.manager.getLatestReport();
    const latestState = this.manager.getLatestAwarenessState();
    return {
      missionId: "EESAE-01",
      status: this.status,
      healthStatus: record?.healthStatus ?? "standby",
      totalReports: record?.totalReports ?? 0,
      openFindings: record?.openFindings ?? 0,
      openEscalations: record?.openEscalations ?? 0,
      latestReportId: latest?.reportId ?? record?.lastReportId ?? null,
      lastStateId: latestState?.stateId ?? record?.lastStateId ?? null,
      workerId: this.config.workerId,
      briefingPreview: latest?.briefingForGrandKing?.slice(0, 200) ?? null,
      neverFabricateMetrics: true,
      neverSilentDeterioration: true,
      neverAutoModifyProduction: true,
      neverBypassGovernance: true,
      constitutionalDutyActive: true,
    };
  }

  private finish(report: EesaeRunReport): EesaeRunReport {
    if (report.decision === "fail") this.status = "failed";
    else if (this.status === "connecting") this.status = "connected";
    else if (
      this.status === "evaluating" ||
      this.status === "investigating" ||
      this.status === "escalating" ||
      this.status === "reporting" ||
      this.status === "validating"
    ) {
      this.status = "active";
    }
    return report;
  }
}
