import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildEmpireOpportunityEngineConfiguration, type EmpireOpportunityEngineConfiguration } from "./configuration.js";
import { EmpireOpportunityController } from "./empire-opportunity-controller.js";
import { EmpireOpportunityManager, type EmpireOpportunityDependencies } from "./empire-opportunity-manager.js";
import { EMPIRE_OPPORTUNITY_ENGINE_SYSTEM_PATH } from "./paths.js";
import type { EmpireOpportunityCockpitSnapshot, EmpireOpportunityInput, EmpireOpportunityState } from "./types.js";
export type { EmpireOpportunityDependencies };
export interface EmpireOpportunityEngineOptions { configuration?: Partial<EmpireOpportunityEngineConfiguration>; }
export class EmpireOpportunityEngine {
  private initializedAt: string | null = null;
  private readonly controller: EmpireOpportunityController;
  constructor(private readonly bootstrap: EmpireBootstrapContext, dependencies: EmpireOpportunityDependencies = {}, options: EmpireOpportunityEngineOptions = {}) { this.controller = new EmpireOpportunityController(new EmpireOpportunityManager(dependencies), buildEmpireOpportunityEngineConfiguration(bootstrap.repositoryRoot, options.configuration)); }
  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(EMPIRE_OPPORTUNITY_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Empire Opportunity Engine")) throw new Error(`${EMPIRE_OPPORTUNITY_ENGINE_SYSTEM_PATH} missing — X5-06 system doc required.`);
    this.controller.initialize(); this.initializedAt = new Date().toISOString(); return this.getState();
  }
  getState(): EmpireOpportunityState {
    if (!this.initializedAt) throw new Error("Empire Opportunity Engine not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration(), engineRecord = this.controller.getManager().getEngineRecord(), latestReport = this.controller.getLatestReport(), count = this.getOpportunityRecords().length;
    return { engineVersion: "PILLOW-EOP-001", missionId: "X5-06", status: this.controller.getStatus(), initializedAt: this.initializedAt, configuration, latestReport, engineRecord, health: { status: engineRecord?.healthStatus ?? "standby", healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50, engineEnabled: configuration.enabled, lastOperationAt: latestReport?.runTimestamp ?? null, lastValidationDecision: latestReport?.validation.decision ?? null, totalOpportunityRecords: count, notes: ["Structural opportunity signals only; unvalidated intelligence can never produce recommendations."] } };
  }
  connectEmpireOpportunityEngine(input: Record<string, unknown> = {}) { return this.controller.connect(input); }
  discoverBusinessOpportunitiesContinuously(input: EmpireOpportunityInput = {}) { return this.controller.run("discover_business_opportunities_continuously", input); }
  discoverBusinessOpportunities(input: EmpireOpportunityInput = {}) { return this.discoverBusinessOpportunitiesContinuously(input); }
  monitorEmergingIndustries(input: EmpireOpportunityInput = {}) { return this.controller.run("monitor_emerging_industries", input); }
  monitorMarketShifts(input: EmpireOpportunityInput = {}) { return this.controller.run("monitor_market_shifts", input); }
  monitorCustomerDemand(input: EmpireOpportunityInput = {}) { return this.controller.run("monitor_customer_demand", input); }
  monitorTechnologicalDevelopments(input: EmpireOpportunityInput = {}) { return this.controller.run("monitor_technological_developments", input); }
  monitorCompetitiveLandscapes(input: EmpireOpportunityInput = {}) { return this.controller.run("monitor_competitive_landscapes", input); }
  detectProfitableBusinessOpportunities(input: EmpireOpportunityInput = {}) { return this.controller.run("detect_profitable_business_opportunities", input); }
  rankOpportunityPotential(input: EmpireOpportunityInput = {}) { return this.controller.run("rank_opportunity_potential", input); }
  recommendStrategicOpportunities(input: EmpireOpportunityInput = {}) { return this.controller.run("recommend_strategic_opportunities", input); }
  trackOpportunityOutcomes(input: EmpireOpportunityInput = {}) { return this.controller.run("track_opportunity_outcomes", input); }
  runDiagnostics() { return this.controller.diagnostics(); }
  getOpportunityRecords() { return this.controller.getManager().getOpportunityRecords(); } getRecommendations() { return this.controller.getManager().getRecommendations(); } getEngineRecord() { return this.controller.getManager().getEngineRecord(); }
  validateForSupervisorSync() { const state = this.getState(), score = state.latestReport?.validation.decision === "fail" ? 40 : state.latestReport?.validation.decision === "partial" ? 70 : 100; return { valid: state.health.status !== "failed", health: score >= 75 ? "healthy" as const : score >= 50 ? "degraded" as const : "blocked" as const, readinessScore: score, notes: [`Engine status: ${state.status}`, `Opportunity records: ${state.health.totalOpportunityRecords}`, ...state.health.notes] }; }
  getCockpitSnapshot(): EmpireOpportunityCockpitSnapshot { const state = this.getState(), record = state.engineRecord; return { engineStatus: state.status, healthStatus: state.health.status, operationalState: record?.currentOperationalState ?? null, lastDecision: state.latestReport?.validation.decision ?? null, totalOpportunityRecords: state.health.totalOpportunityRecords, frameworkRegistered: Boolean(record?.frameworkModuleId), dependenciesConnected: Number(Boolean(record?.dependencyPresence.empireIntelligenceFramework)) + Number(Boolean(record?.dependencyPresence.empireMemoryEngine)) + Number(Boolean(record?.dependencyPresence.empireKnowledgeEngine)), recentLogs: [] }; }
}
export function createEmpireOpportunityEngine(bootstrap: EmpireBootstrapContext, dependencies: EmpireOpportunityDependencies = {}, options?: EmpireOpportunityEngineOptions) { return new EmpireOpportunityEngine(bootstrap, dependencies, options); }
export function resetEmpireOpportunityEngineForTesting() {}
