import type { EmpireBootstrapContext } from "../bootstrap/types.js";

import { RepositoryReader } from "../bootstrap/repository-reader.js";

import {

  buildAiInnovationFactoryConfiguration,

  type AiInnovationFactoryConfiguration,

} from "./configuration.js";

import type { AiInnovationFactoryDependencies } from "./integrations.js";

import {

  AiInnovationFactoryManager,

  resetAiInnovationFactoryManagerSequencesForTesting,

} from "./ai-innovation-factory-manager.js";

import { AiInnovationFactoryController } from "./ai-innovation-factory-controller.js";

import { resetAifrtLogsForTesting } from "./aifrt-logging.js";

import { AI_INNOVATION_FACTORY_SYSTEM_PATH } from "./paths.js";

import { resetAifrtSequenceForTesting } from "./audit-store.js";

import type {

  AifrtInput,

  AiInnovationFactoryCockpitSnapshot,

  AiInnovationFactoryState,

} from "./types.js";



export interface AiInnovationFactoryOptions {

  configuration?: Partial<AiInnovationFactoryConfiguration>;

  dependencies?: AiInnovationFactoryDependencies;

}



/**

 * Authoritative Q12-01 AI Innovation Factory — governed innovation research/recommend only.

 * Consumes Q1201ConsumableContract from injected qSeriesCompletion; optionally observes

 * GKAGT Q1201 for approval context. Exposes Q1301ConsumableContract for Q13-01 without

 * implementing Q13-01.

 *

 * NEVER fabricates research evidence, NEVER auto-deploys, NEVER bypasses governance,

 * NEVER overrides GK/Pillow, NEVER claims Q Series complete when incomplete.

 */

export class AiInnovationFactory {

  private initializedAt: string | null = null;

  private readonly manager: AiInnovationFactoryManager;

  private readonly controller: AiInnovationFactoryController;



  constructor(

    private readonly bootstrap: EmpireBootstrapContext,

    options: AiInnovationFactoryOptions = {},

  ) {

    this.manager = new AiInnovationFactoryManager();

    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);

    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);

    this.controller = new AiInnovationFactoryController(

      this.manager,

      buildAiInnovationFactoryConfiguration(bootstrap.repositoryRoot, options.configuration),

    );

  }



  async initialize() {

    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(

      AI_INNOVATION_FACTORY_SYSTEM_PATH,

    );

    if (!doc?.includes("AI Innovation Factory")) {

      throw new Error(`${AI_INNOVATION_FACTORY_SYSTEM_PATH} missing — Q12-01 system doc required.`);

    }

    this.controller.initialize();

    this.initializedAt = new Date().toISOString();

    return this.getState();

  }



  bindIntegrations(deps: AiInnovationFactoryDependencies = {}) {

    this.controller.bindIntegrations(deps);

    return this;

  }



  getState(): AiInnovationFactoryState {

    if (!this.initializedAt) {

      throw new Error("AI Innovation Factory not initialized. Call initialize() first.");

    }

    const configuration = this.controller.getConfiguration();

    const engineRecord = this.manager.getEngineRecord();

    const latestReport = this.controller.getLatestReport();

    return {

      engineVersion: "PILLOW-AIFRT-001",

      missionId: "Q12-01",

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

        lastSeriesCompleteActivation: engineRecord?.lastSeriesCompleteActivation ?? null,

        notes: [

          "AI Innovation Factory: research/recommend only; seriesCompleteActivation=true only when QSCPT complete; never auto-deploy.",

        ],

      },

    };

  }



  connect(_input: Record<string, unknown> = {}) {

    return this.controller.connect();

  }



  verifySeriesCompletePrerequisite() {

    return this.controller.verifySeriesCompletePrerequisite();

  }



  researchEmergingTechnologies() {

    return this.controller.researchEmergingTechnologies();

  }



  trackModelsAndApis() {

    return this.controller.trackModelsAndApis();

  }



  discoverBusinessOpportunities() {

    return this.controller.discoverBusinessOpportunities();

  }



  evaluateArchitecturalImprovements() {

    return this.controller.evaluateArchitecturalImprovements();

  }



  analyseOperationalImprovements() {

    return this.controller.analyseOperationalImprovements();

  }



  prioritiseInnovationProposals(proposals: import("./types.js").InnovationProposal[]) {

    return this.controller.prioritiseInnovationProposals(proposals);

  }



  generateImplementationRecommendations(proposals: import("./types.js").InnovationProposal[]) {

    return this.controller.generateImplementationRecommendations(proposals);

  }



  produceAiInnovationReport(input: AifrtInput = {}) {

    return this.controller.produceAiInnovationReport(input);

  }



  researchInnovations(input: AifrtInput = {}) {

    return this.controller.researchInnovations(input);

  }



  async produceReport(input: AifrtInput = {}) {

    return this.produceAiInnovationReport(input);

  }



  submitReport(input: AifrtInput = {}) {

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



  getQ1301ConsumableContract() {

    return this.controller.getQ1301ConsumableContract();

  }



  getInnovationHistory(limit = 100) {

    return this.controller.getInnovationHistory(limit);

  }



  validate(input: AifrtInput = {}) {

    return this.controller.validate(input);

  }



  diagnostics() {

    return this.controller.diagnostics();

  }



  runDiagnostics() {

    return this.diagnostics();

  }



  getIntegrations() {

    return this.manager.getIntegrations();

  }



  validateForSupervisorSync() {

    const state = this.getState();

    const score =

      state.latestReport?.validation.decision === "fail"

        ? 40

        : state.latestReport?.validation.decision === "partial"

          ? 70

          : Math.round((state.health.lastConfidenceScore ?? 0) * 100) || 50;

    return {

      valid: state.health.status !== "failed",

      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),

      readinessScore: score,

      notes: [

        `Engine status: ${state.status}`,

        `Innovation reports: ${state.health.totalReports}`,

        `Series complete activation: ${state.health.lastSeriesCompleteActivation ?? "none"}`,

        ...state.health.notes,

      ],

    };

  }



  getCockpitSnapshot(): AiInnovationFactoryCockpitSnapshot {

    const state = this.getState();

    return {

      missionId: "Q12-01",

      status: state.status,

      healthStatus: state.health.status,

      totalReports: state.health.totalReports,

      latestReportId: state.health.lastReportId,

      lastSeriesCompleteActivation: state.health.lastSeriesCompleteActivation,

      workerId: state.configuration.workerId,

      neverFabricateResearchEvidence: true,

      neverAutoDeployInnovations: true,

      neverBypassGovernance: true,

      neverImplementQ1301OrLater: true,

    };

  }

}



export function createAiInnovationFactory(

  bootstrap: EmpireBootstrapContext,

  options?: AiInnovationFactoryOptions,

) {

  return new AiInnovationFactory(bootstrap, options);

}



export function resetAiInnovationFactoryForTesting() {

  resetAifrtLogsForTesting();

  resetAifrtSequenceForTesting();

  resetAiInnovationFactoryManagerSequencesForTesting();

}


