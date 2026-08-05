import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildRepositoryIntelligenceEngineConfiguration,
  type RepositoryIntelligenceEngineConfiguration,
} from "./configuration.js";
import type { RepositoryIntelligenceEngineDependencies } from "./integrations.js";
import {
  RepositoryIntelligenceEngineManager,
  resetRepositoryIntelligenceEngineManagerSequencesForTesting,
} from "./repository-intelligence-engine-manager.js";
import { RepositoryIntelligenceEngineController } from "./repository-intelligence-engine-controller.js";
import { resetRiengLogsForTesting } from "./rieng-logging.js";
import { REPOSITORY_INTELLIGENCE_ENGINE_SYSTEM_PATH } from "./paths.js";
import { resetRiengSequenceForTesting } from "./audit-store.js";
import type {
  RepositoryIntelligenceEngineCockpitSnapshot,
  RepositoryIntelligenceEngineState,
  RiengInput,
} from "./types.js";

export interface RepositoryIntelligenceEngineOptions {
  configuration?: Partial<RepositoryIntelligenceEngineConfiguration>;
  dependencies?: RepositoryIntelligenceEngineDependencies;
}

/**
 * Authoritative Q13-02 Repository Intelligence Engine — read-only repository analysis.
 * Consumes getQ1302ConsumableContract from implementationSpecificationEngine (ISENG, Q13-01).
 * Optionally observes getQ1301ConsumableContract from aiInnovationFactory.
 * Exposes Q1303ConsumableContract for Q13-03 without implementing Q13-03+.
 */
export class RepositoryIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly manager: RepositoryIntelligenceEngineManager;
  private readonly controller: RepositoryIntelligenceEngineController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: RepositoryIntelligenceEngineOptions = {},
  ) {
    this.manager = new RepositoryIntelligenceEngineManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new RepositoryIntelligenceEngineController(
      this.manager,
      buildRepositoryIntelligenceEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      REPOSITORY_INTELLIGENCE_ENGINE_SYSTEM_PATH,
    );
    if (!doc?.includes("Repository Intelligence Engine")) {
      throw new Error(`${REPOSITORY_INTELLIGENCE_ENGINE_SYSTEM_PATH} missing — Q13-02 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: RepositoryIntelligenceEngineDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): RepositoryIntelligenceEngineState {
    if (!this.initializedAt) {
      throw new Error("Repository Intelligence Engine not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-RIENG-001",
      missionId: "Q13-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: Math.round((latestReport?.confidenceScore ?? 0) * 100) || 0,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        lastRepositoryFingerprint: engineRecord?.lastRepositoryFingerprint ?? null,
        notes: [
          "Repository Intelligence Engine: read-only analysis; never modifies analyzed files; never certifies Q13-01.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  discoverRepositoryStructure() {
    return this.controller.discoverRepositoryStructure();
  }

  analyzeModulesAndServices() {
    return this.controller.analyzeModulesAndServices();
  }

  buildDependencyGraph() {
    return this.controller.buildDependencyGraph();
  }

  detectImplementationRelationships() {
    return this.controller.detectImplementationRelationships();
  }

  discoverArchitecturalBoundaries() {
    return this.controller.discoverArchitecturalBoundaries();
  }

  detectExistingImplementations() {
    return this.controller.detectExistingImplementations();
  }

  identifyReusableComponents() {
    return this.controller.identifyReusableComponents();
  }

  detectConflictsAndDuplicates() {
    return this.controller.detectConflictsAndDuplicates();
  }

  analyzeRepository() {
    return this.controller.analyzeRepository();
  }

  produceRepositoryIntelligenceReport(input: RiengInput = {}) {
    return this.controller.produceRepositoryIntelligenceReport(input);
  }

  async produceReport(input: RiengInput = {}) {
    return this.produceRepositoryIntelligenceReport(input);
  }

  submitReport(input: RiengInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.manager.getReports();
  }

  getCatalog() {
    return this.manager.getCatalog();
  }

  getAuditTrail(limit = 100) {
    return this.manager.getAuditTrail(limit);
  }

  getRepositoryKnowledgeHistory(limit = 100) {
    return this.manager.getRepositoryKnowledgeHistory(limit);
  }

  getQ1303ConsumableContract() {
    return this.controller.getQ1303ConsumableContract();
  }

  validate(input: RiengInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  getCockpitSnapshot(): RepositoryIntelligenceEngineCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q13-02",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastRepositoryFingerprint: state.health.lastRepositoryFingerprint,
      workerId: state.configuration.workerId,
      neverModifyAnalyzedFiles: true,
      neverImplementQ1303OrLater: true,
      neverCertifyQ1301: true,
    };
  }

  validateForSupervisorSync() {
    const diagnostics = this.runDiagnostics();
    return {
      missionId: "Q13-02" as const,
      readinessScore: diagnostics.readinessScore,
      q1302PrerequisitePresent: diagnostics.q1302PrerequisitePresent,
      q1301MissionPresent: diagnostics.q1301MissionPresent,
      reports: diagnostics.reports,
    };
  }
}

export function createRepositoryIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  options?: RepositoryIntelligenceEngineOptions,
) {
  return new RepositoryIntelligenceEngine(bootstrap, options);
}

export function resetRepositoryIntelligenceEngineForTesting() {
  resetRiengSequenceForTesting();
  resetRiengLogsForTesting();
  resetRepositoryIntelligenceEngineManagerSequencesForTesting();
}
