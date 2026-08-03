import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildEmpireInnovationEngineConfiguration, type EmpireInnovationEngineConfiguration } from "./configuration.js";
import { EmpireInnovationController } from "./empire-innovation-controller.js";
import { EmpireInnovationManager, type EmpireInnovationDependencies } from "./empire-innovation-manager.js";
import { EMPIRE_INNOVATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type { EmpireInnovationCockpitSnapshot, EmpireInnovationInput, EmpireInnovationState } from "./types.js";
export type { EmpireInnovationDependencies };
export interface EmpireInnovationEngineOptions { configuration?: Partial<EmpireInnovationEngineConfiguration>; }
export class EmpireInnovationEngine {
  private initializedAt: string | null = null;
  private readonly controller: EmpireInnovationController;
  constructor(private readonly bootstrap: EmpireBootstrapContext, dependencies: EmpireInnovationDependencies = {}, options: EmpireInnovationEngineOptions = {}) { this.controller = new EmpireInnovationController(new EmpireInnovationManager(dependencies), buildEmpireInnovationEngineConfiguration(bootstrap.repositoryRoot, options.configuration)); }
  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(EMPIRE_INNOVATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Empire Innovation Engine")) throw new Error(`${EMPIRE_INNOVATION_ENGINE_SYSTEM_PATH} missing — X5-07 system doc required.`);
    this.controller.initialize(); this.initializedAt = new Date().toISOString(); return this.getState();
  }
  getState(): EmpireInnovationState {
    if (!this.initializedAt) throw new Error("Empire Innovation Engine not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration(), engineRecord = this.controller.getManager().getEngineRecord(), latestReport = this.controller.getLatestReport(), count = this.getInnovationRecords().length;
    return { engineVersion: "PILLOW-EIN-001", missionId: "X5-07", status: this.controller.getStatus(), initializedAt: this.initializedAt, configuration, latestReport, engineRecord, health: { status: engineRecord?.healthStatus ?? "standby", healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50, engineEnabled: configuration.enabled, lastOperationAt: latestReport?.runTimestamp ?? null, lastValidationDecision: latestReport?.validation.decision ?? null, totalInnovationRecords: count, notes: ["Structural innovation signals only; records and recommendations never promote into production automatically."] } };
  }
  connectEmpireInnovationEngine(input: Record<string, unknown> = {}) { return this.controller.connect(input); }
  generateNewProductIdeas(input: EmpireInnovationInput = {}) { return this.controller.run("generate_product_ideas", { ...input, innovationCategory: "product" }); }
  generateNewServiceIdeas(input: EmpireInnovationInput = {}) { return this.controller.run("generate_service_ideas", { ...input, innovationCategory: "service" }); }
  generateNewBusinessModels(input: EmpireInnovationInput = {}) { return this.controller.run("generate_business_models", { ...input, innovationCategory: "business_model" }); }
  identifyInnovationOpportunities(input: EmpireInnovationInput = {}) { return this.controller.run("identify_innovation_opportunities", input); }
  combineKnowledgeAcrossCompanies(input: EmpireInnovationInput = {}) { return this.controller.run("combine_knowledge_across_companies", input); }
  detectInnovationTrends(input: EmpireInnovationInput = {}) { return this.controller.run("detect_innovation_trends", input); }
  evaluateInnovationPotential(input: EmpireInnovationInput = {}) { return this.controller.run("evaluate_innovation_potential", input); }
  rankInnovationOpportunities(input: EmpireInnovationInput = {}) { return this.controller.run("rank_innovation_opportunities", input); }
  recommendInnovations(input: EmpireInnovationInput = {}) { return this.controller.run("recommend_innovations", input); }
  trackInnovationOutcomes(input: EmpireInnovationInput = {}) { return this.controller.run("track_innovation_outcomes", input); }
  runDiagnostics() { return this.controller.diagnostics(); }
  getInnovationRecords() { return this.controller.getManager().getInnovationRecords(); } getRecommendations() { return this.controller.getManager().getRecommendations(); } getEngineRecord() { return this.controller.getManager().getEngineRecord(); }
  validateForSupervisorSync() { const state = this.getState(), score = state.latestReport?.validation.decision === "fail" ? 40 : state.latestReport?.validation.decision === "partial" ? 70 : 100; return { valid: state.health.status !== "failed", health: score >= 75 ? "healthy" as const : score >= 50 ? "degraded" as const : "blocked" as const, readinessScore: score, notes: [`Engine status: ${state.status}`, `Innovation records: ${state.health.totalInnovationRecords}`, ...state.health.notes] }; }
  getCockpitSnapshot(): EmpireInnovationCockpitSnapshot { const state = this.getState(), record = state.engineRecord; return { engineStatus: state.status, healthStatus: state.health.status, operationalState: record?.currentOperationalState ?? null, lastDecision: state.latestReport?.validation.decision ?? null, totalInnovationRecords: state.health.totalInnovationRecords, frameworkRegistered: Boolean(record?.frameworkModuleId), dependenciesConnected: Number(Boolean(record?.dependencyPresence.empireIntelligenceFramework)) + Number(Boolean(record?.dependencyPresence.empireMemoryEngine)) + Number(Boolean(record?.dependencyPresence.empireKnowledgeEngine)), recentLogs: [] }; }
}
export function createEmpireInnovationEngine(bootstrap: EmpireBootstrapContext, dependencies: EmpireInnovationDependencies = {}, options?: EmpireInnovationEngineOptions) { return new EmpireInnovationEngine(bootstrap, dependencies, options); }
export function resetEmpireInnovationEngineForTesting() {}
