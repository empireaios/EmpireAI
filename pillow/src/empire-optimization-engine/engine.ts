import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildEmpireOptimizationEngineConfiguration, type EmpireOptimizationEngineConfiguration } from "./configuration.js";
import { EmpireOptimizationController } from "./empire-optimization-controller.js";
import { EmpireOptimizationManager, type EmpireOptimizationDependencies } from "./empire-optimization-manager.js";
import { EMPIRE_OPTIMIZATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type { EmpireOptimizationCockpitSnapshot, EmpireOptimizationInput, EmpireOptimizationState } from "./types.js";
export type { EmpireOptimizationDependencies };
export interface EmpireOptimizationEngineOptions { configuration?: Partial<EmpireOptimizationEngineConfiguration>; }
export class EmpireOptimizationEngine {
  private initializedAt: string | null = null;
  private readonly controller: EmpireOptimizationController;
  constructor(private readonly bootstrap: EmpireBootstrapContext, dependencies: EmpireOptimizationDependencies = {}, options: EmpireOptimizationEngineOptions = {}) {
    this.controller = new EmpireOptimizationController(new EmpireOptimizationManager(dependencies), buildEmpireOptimizationEngineConfiguration(bootstrap.repositoryRoot, options.configuration));
  }
  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(EMPIRE_OPTIMIZATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Empire Optimization Engine")) throw new Error(`${EMPIRE_OPTIMIZATION_ENGINE_SYSTEM_PATH} missing — X5-04 system doc required.`);
    this.controller.initialize(); this.initializedAt = new Date().toISOString(); return this.getState();
  }
  getState(): EmpireOptimizationState {
    if (!this.initializedAt) throw new Error("Empire Optimization Engine not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration(), engineRecord = this.controller.getManager().getEngineRecord(), latestReport = this.controller.getLatestReport(), count = this.getOptimizationRecords().length;
    return { engineVersion: "PILLOW-EOE-001", missionId: "X5-04", status: this.controller.getStatus(), initializedAt: this.initializedAt, configuration, latestReport, engineRecord, health: { status: engineRecord?.healthStatus ?? "standby", healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50, engineEnabled: configuration.enabled, lastOperationAt: latestReport?.runTimestamp ?? null, lastValidationDecision: latestReport?.validation.decision ?? null, totalOptimizationRecords: count, notes: ["Structural signals and recommendations only; no unapproved optimization action is automatically executed."] } };
  }
  connectEmpireOptimizationEngine(input: Record<string, unknown> = {}) { return this.controller.connect(input); }
  monitorEnterpriseWidePerformance(input: EmpireOptimizationInput = {}) { return this.controller.run("monitor_enterprise_wide_performance", input); }
  analyzeCrossCompanyEfficiency(input: EmpireOptimizationInput = {}) { return this.controller.run("analyze_cross_company_efficiency", input); }
  identifyOptimizationOpportunities(input: EmpireOptimizationInput = {}) { return this.controller.run("identify_optimization_opportunities", input); }
  detectOperationalBottlenecks(input: EmpireOptimizationInput = {}) { return this.controller.run("detect_operational_bottlenecks", input); }
  detectDuplicatedEffort(input: EmpireOptimizationInput = {}) { return this.controller.run("detect_duplicated_effort", input); }
  identifyResourceOptimizationOpportunities(input: EmpireOptimizationInput = {}) { return this.controller.run("identify_resource_optimization_opportunities", input); }
  rankOptimizationPriorities(input: EmpireOptimizationInput = {}) { return this.controller.run("rank_optimization_priorities", input); }
  recommendEnterpriseOptimization(input: EmpireOptimizationInput = {}) { return this.controller.run("recommend_enterprise_optimization", input); }
  trackOptimizationOutcomes(input: EmpireOptimizationInput = {}) { return this.controller.run("track_optimization_outcomes", input); }
  runDiagnostics() { return this.controller.diagnostics(); }
  getOptimizationRecords() { return this.controller.getManager().getOptimizationRecords(); } getRecommendations() { return this.controller.getManager().getRecommendations(); } getEngineRecord() { return this.controller.getManager().getEngineRecord(); }
  validateForSupervisorSync() { const state = this.getState(), score = state.latestReport?.validation.decision === "fail" ? 40 : state.latestReport?.validation.decision === "partial" ? 70 : 100; return { valid: state.health.status !== "failed", health: score >= 75 ? "healthy" as const : score >= 50 ? "degraded" as const : "blocked" as const, readinessScore: score, notes: [`Engine status: ${state.status}`, `Optimization records: ${state.health.totalOptimizationRecords}`, ...state.health.notes] }; }
  getCockpitSnapshot(): EmpireOptimizationCockpitSnapshot { const state = this.getState(), record = state.engineRecord; return { engineStatus: state.status, healthStatus: state.health.status, operationalState: record?.currentOperationalState ?? null, lastDecision: state.latestReport?.validation.decision ?? null, totalOptimizationRecords: state.health.totalOptimizationRecords, frameworkRegistered: Boolean(record?.frameworkModuleId), dependenciesConnected: Number(Boolean(record?.dependencyPresence.empireIntelligenceFramework)) + Number(Boolean(record?.dependencyPresence.empireMemoryEngine)) + Number(Boolean(record?.dependencyPresence.empireKnowledgeEngine)), recentLogs: [] }; }
}
export function createEmpireOptimizationEngine(bootstrap: EmpireBootstrapContext, dependencies: EmpireOptimizationDependencies = {}, options?: EmpireOptimizationEngineOptions) { return new EmpireOptimizationEngine(bootstrap, dependencies, options); }
export function resetEmpireOptimizationEngineForTesting() {}
