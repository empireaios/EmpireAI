import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildGlobalExpansionSimulatorConfiguration, type GlobalExpansionSimulatorConfiguration } from "./configuration.js";
import { GlobalExpansionSimulatorController } from "./global-expansion-simulator-controller.js";
import { GlobalExpansionSimulationManager, type GlobalExpansionSimulatorDependencies } from "./global-expansion-simulation-manager.js";
import { GLOBAL_EXPANSION_SIMULATOR_SYSTEM_PATH } from "./paths.js";
import type { GesCockpitSnapshot, GlobalExpansionSimulationInput, GlobalExpansionSimulatorState } from "./types.js";
export type { GlobalExpansionSimulatorDependencies };
export interface GlobalExpansionSimulatorOptions { configuration?: Partial<GlobalExpansionSimulatorConfiguration>; }
export class GlobalExpansionSimulator {
  private initializedAt: string | null = null;
  private readonly controller: GlobalExpansionSimulatorController;
  private readonly reader: RepositoryReader;
  constructor(private readonly bootstrap: EmpireBootstrapContext, dependencies: GlobalExpansionSimulatorDependencies, options: GlobalExpansionSimulatorOptions = {}) {
    this.controller = new GlobalExpansionSimulatorController(new GlobalExpansionSimulationManager(dependencies), buildGlobalExpansionSimulatorConfiguration(bootstrap.repositoryRoot, options.configuration));
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }
  async initialize() { const doc = await this.reader.readText(GLOBAL_EXPANSION_SIMULATOR_SYSTEM_PATH); if (!doc?.includes("Global Expansion Simulator")) throw new Error(`${GLOBAL_EXPANSION_SIMULATOR_SYSTEM_PATH} missing — X4-17 system doc required.`); this.controller.initialize(); this.initializedAt = new Date().toISOString(); return this.getState(); }
  getState(): GlobalExpansionSimulatorState {
    if (!this.initializedAt) throw new Error("Global Expansion Simulator not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration(), engineRecord = this.controller.getManager().getEngineRecord(), latestReport = this.controller.getLatestReport(), count = this.getSimulationRecords().length;
    return { engineVersion: "PILLOW-GES-001", missionId: "X4-17", status: this.controller.getStatus(), initializedAt: this.initializedAt, configuration, latestReport, engineRecord, health: { status: engineRecord?.healthStatus ?? "standby", healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50, engineEnabled: configuration.enabled, lastOperationAt: latestReport?.runTimestamp ?? null, lastValidationDecision: latestReport?.validation.decision ?? null, totalSimulationRecords: count, notes: ["Structural projections only; simulated actions never execute against production systems."] } };
  }
  connectGlobalExpansionSimulator(input: Record<string, unknown> = {}) { return this.controller.connect(input); }
  simulateCountryExpansion(input: GlobalExpansionSimulationInput = {}) { return this.controller.run("simulate_country_expansion", input); }
  simulateRegionalExpansion(input: GlobalExpansionSimulationInput = {}) { return this.controller.run("simulate_regional_expansion", input); }
  simulateOperationalReadiness(input: GlobalExpansionSimulationInput = {}) { return this.controller.run("simulate_operational_readiness", input); }
  simulateLogisticsPerformance(input: GlobalExpansionSimulationInput = {}) { return this.controller.run("simulate_logistics_performance", input); }
  simulateRegulatoryImpact(input: GlobalExpansionSimulationInput = {}) { return this.controller.run("simulate_regulatory_impact", input); }
  simulateFinancialOutcomes(input: GlobalExpansionSimulationInput = {}) { return this.controller.run("simulate_financial_outcomes", input); }
  simulateMarketDemand(input: GlobalExpansionSimulationInput = {}) { return this.controller.run("simulate_market_demand", input); }
  simulateBusinessRisks(input: GlobalExpansionSimulationInput = {}) { return this.controller.run("simulate_business_risks", input); }
  compareExpansionScenarios(input: GlobalExpansionSimulationInput = {}) { return this.controller.run("compare_expansion_scenarios", input); }
  rankSimulationOutcomes(input: GlobalExpansionSimulationInput = {}) { return this.controller.run("rank_simulation_outcomes", input); }
  recommendExpansion(input: GlobalExpansionSimulationInput = {}) { return this.controller.run("recommend_expansion", input); }
  runDiagnostics() { return this.controller.diagnostics(); }
  getSimulationRecords() { return this.controller.getManager().getSimulationRecords(); } getRecommendations() { return this.controller.getManager().getRecommendations(); } getEngineRecord() { return this.controller.getManager().getEngineRecord(); }
  validateForSupervisorSync() { const state = this.getState(), readinessScore = state.latestReport?.validation.decision === "fail" ? 40 : state.latestReport?.validation.decision === "partial" ? 70 : 100; return { valid: state.health.status !== "failed", health: readinessScore >= 75 ? "healthy" as const : readinessScore >= 50 ? "degraded" as const : "blocked" as const, readinessScore, notes: [`Engine status: ${state.status}`, `Simulation records: ${state.health.totalSimulationRecords}`, ...state.health.notes] }; }
  getCockpitSnapshot(): GesCockpitSnapshot { const state = this.getState(), record = state.engineRecord; return { engineStatus: state.status, healthStatus: state.health.status, operationalState: record?.currentOperationalState ?? null, lastDecision: state.latestReport?.validation.decision ?? null, totalSimulationRecords: state.health.totalSimulationRecords, frameworkRegistered: Boolean(record?.frameworkModuleId), dependenciesConnected: record?.dependencyPresence.globalExpansionFramework ? 1 : 0, recentLogs: [] }; }
}
export function createGlobalExpansionSimulator(bootstrap: EmpireBootstrapContext, dependencies: GlobalExpansionSimulatorDependencies, options?: GlobalExpansionSimulatorOptions) { return new GlobalExpansionSimulator(bootstrap, dependencies, options); }
export function resetGlobalExpansionSimulatorForTesting() {}
