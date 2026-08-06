import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildEnterpriseExecutiveSituationalAwarenessEngineConfiguration,
  type EnterpriseExecutiveSituationalAwarenessEngineConfiguration,
} from "./configuration.js";
import { EnterpriseExecutiveSituationalAwarenessEngineController } from "./enterprise-executive-situational-awareness-engine-controller.js";
import {
  EnterpriseExecutiveSituationalAwarenessEngineManager,
  resetEesaeSequenceForTesting,
} from "./enterprise-executive-situational-awareness-engine-manager.js";
import { resetEesaeLogsForTesting } from "./eesae-logging.js";
import type { EnterpriseExecutiveSituationalAwarenessEngineDependencies } from "./integrations.js";
import { EESAE_SYSTEM_PATH } from "./paths.js";
import { GateManager } from "./audit-validator.js";
import type {
  AwarenessCycleResult,
  EesaeCockpitSnapshot,
  EesaeInput,
  EnterpriseExecutiveSituationalAwarenessEngineState,
  GrandKingBriefing,
  PersistentAwarenessState,
  SituationalAwarenessReport,
} from "./types.js";
import type { EesaeRunReport } from "./enterprise-executive-situational-awareness-engine-manager.js";

export interface EnterpriseExecutiveSituationalAwarenessEngineOptions {
  configuration?: Partial<EnterpriseExecutiveSituationalAwarenessEngineConfiguration>;
  dependencies?: EnterpriseExecutiveSituationalAwarenessEngineDependencies;
}

/**
 * PILLOW-EESAE-001 — Enterprise Executive Situational Awareness Engine (EESAE-01).
 * Evidence-based executive intelligence: observe, analyse, recommend, escalate — never fabricate metrics or auto-modify production.
 */
export class EnterpriseExecutiveSituationalAwarenessEngine {
  private initializedAt: string | null = null;
  private readonly manager: EnterpriseExecutiveSituationalAwarenessEngineManager;
  private readonly controller: EnterpriseExecutiveSituationalAwarenessEngineController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: EnterpriseExecutiveSituationalAwarenessEngineOptions = {},
  ) {
    this.manager = new EnterpriseExecutiveSituationalAwarenessEngineManager();
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new EnterpriseExecutiveSituationalAwarenessEngineController(
      this.manager,
      buildEnterpriseExecutiveSituationalAwarenessEngineConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(EESAE_SYSTEM_PATH);
    if (!doc?.includes("Enterprise Executive Situational Awareness Engine")) {
      throw new Error(`${EESAE_SYSTEM_PATH} missing — EESAE-01 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: EnterpriseExecutiveSituationalAwarenessEngineDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): EnterpriseExecutiveSituationalAwarenessEngineState {
    if (!this.initializedAt) {
      throw new Error("Enterprise Executive Situational Awareness Engine not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.manager.getLatestReport();
    const latestAwarenessState = this.manager.getLatestAwarenessState();
    return {
      engineVersion: "PILLOW-EESAE-001",
      missionId: "EESAE-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      latestAwarenessState,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: Math.round((latestAwarenessState?.confidenceScore ?? 0.35) * 100),
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        openFindings: engineRecord?.openFindings ?? 0,
        openEscalations: engineRecord?.openEscalations ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastStateId: engineRecord?.lastStateId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "EESAE-01: continuous executive situational awareness — evidence-based only; never fabricate metrics; never silent on critical deterioration; never auto-modify production; never bypass Pillow/Grand King.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  evaluateSystemHealth(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.evaluateSystemHealth(input);
  }

  evaluatePerformanceIntelligence(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.evaluatePerformanceIntelligence(input);
  }

  evaluateBusinessIntelligence(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.evaluateBusinessIntelligence(input);
  }

  evaluateAiWorkforceIntelligence(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.evaluateAiWorkforceIntelligence(input);
  }

  evaluateSelfAwareness(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.evaluateSelfAwareness(input);
  }

  detectDeterioration(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.detectDeterioration(input);
  }

  investigateRootCauses(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.investigateRootCauses(input);
  }

  estimateBusinessImpactAndUrgency(input: EesaeInput = {}): EesaeRunReport {
    const findingId = input.findingId;
    const findings = this.manager.getPersistentAwarenessState()?.openFindings ?? [];
    const finding = findings.find((f) => f.findingId === findingId) ?? findings[0] ?? null;
    const investigation = this.controller.investigateRootCauses({ ...input, findingId: finding?.findingId });
    return investigation;
  }

  generateExecutiveRecommendations(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.generateExecutiveRecommendations(input);
  }

  escalateUnacknowledged(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.escalateUnacknowledged(input);
  }

  acknowledgeFinding(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.acknowledgeFinding(input);
  }

  produceSituationalAwarenessReport(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.produceSituationalAwarenessReport(input);
  }

  produceReport(input: EesaeInput = {}): EesaeRunReport {
    return this.produceSituationalAwarenessReport(input);
  }

  submitReport(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.submitReport(input);
  }

  runAwarenessCycle(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.runAwarenessCycle(input);
  }

  evaluateContinuously(input: EesaeInput = {}): AwarenessCycleResult | null {
    const result = this.runAwarenessCycle(input);
    return result.awarenessCycle ?? null;
  }

  getPersistentAwarenessState(stateId?: string): PersistentAwarenessState | null {
    return this.manager.getPersistentAwarenessState(stateId);
  }

  getBriefingForGrandKing(): GrandKingBriefing | null {
    const result = this.controller.getBriefingForGrandKing();
    return result.briefing ?? null;
  }

  list(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.list(input);
  }

  validate(input: EesaeInput = {}): EesaeRunReport {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  getReports(): SituationalAwarenessReport[] {
    return this.manager.getReports();
  }

  getAwarenessStates(): PersistentAwarenessState[] {
    return this.manager.getAwarenessStates();
  }

  getCatalog() {
    return this.manager.getCatalog(this.controller.getConfiguration());
  }

  getAuditTrail(limit = 100) {
    return this.manager.getAuditTrail(limit);
  }

  getCockpitSnapshot(): EesaeCockpitSnapshot {
    return this.controller.getCockpitSnapshot();
  }

  validateForSupervisorSync() {
    const diagnostics = this.runDiagnostics();
    return {
      missionId: "EESAE-01" as const,
      readinessScore: diagnostics.readinessScore,
      reports: diagnostics.reports,
      awarenessStates: diagnostics.awarenessStates,
      constitutionalDutyActive: true as const,
    };
  }
}

export function createEnterpriseExecutiveSituationalAwarenessEngine(
  bootstrap: EmpireBootstrapContext,
  options?: EnterpriseExecutiveSituationalAwarenessEngineOptions,
) {
  return new EnterpriseExecutiveSituationalAwarenessEngine(bootstrap, options);
}

export function resetEnterpriseExecutiveSituationalAwarenessEngineForTesting() {
  resetEesaeSequenceForTesting();
  resetEesaeLogsForTesting();
  new GateManager().resetForTesting();
}
