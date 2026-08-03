import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildCrossRegionLearningEngineConfiguration, type CrossRegionLearningEngineConfiguration } from "./configuration.js";
import { CrossRegionLearningController } from "./cross-region-learning-controller.js";
import { CrossRegionLearningManager, type CrossRegionLearningDependencies } from "./cross-region-learning-manager.js";
import { CROSS_REGION_LEARNING_ENGINE_SYSTEM_PATH } from "./paths.js";
import type { CrossRegionLearningInput, CrossRegionLearningState, CrlCockpitSnapshot } from "./types.js";
export type { CrossRegionLearningDependencies };
export interface CrossRegionLearningEngineOptions { configuration?: Partial<CrossRegionLearningEngineConfiguration>; }
export class CrossRegionLearningEngine {
  private initializedAt: string | null = null;
  private readonly controller: CrossRegionLearningController;
  private readonly reader: RepositoryReader;
  constructor(private readonly bootstrap: EmpireBootstrapContext, dependencies: CrossRegionLearningDependencies, options: CrossRegionLearningEngineOptions = {}) {
    this.controller = new CrossRegionLearningController(new CrossRegionLearningManager(dependencies), buildCrossRegionLearningEngineConfiguration(bootstrap.repositoryRoot, options.configuration));
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }
  async initialize() { const doc = await this.reader.readText(CROSS_REGION_LEARNING_ENGINE_SYSTEM_PATH); if (!doc?.includes("Cross-Region Learning")) throw new Error(`${CROSS_REGION_LEARNING_ENGINE_SYSTEM_PATH} missing — X4-16 system doc required.`); this.controller.initialize(); this.initializedAt = new Date().toISOString(); return this.getState(); }
  getState(): CrossRegionLearningState {
    if (!this.initializedAt) throw new Error("Cross-Region Learning Engine not initialized. Call initialize() first.");
    const config = this.controller.getConfiguration(), record = this.controller.getManager().getEngineRecord(), latestReport = this.controller.getLatestReport(), count = this.getLearningRecords().length;
    return { engineVersion: "PILLOW-CRL-001", missionId: "X4-16", status: this.controller.getStatus(), initializedAt: this.initializedAt, configuration: config, latestReport, engineRecord: record, health: { status: record?.healthStatus ?? "standby", healthScore: record?.healthStatus === "healthy" ? 100 : record ? 70 : 50, engineEnabled: config.enabled, lastOperationAt: latestReport?.runTimestamp ?? null, lastValidationDecision: latestReport?.validation.decision ?? null, totalLearningRecords: count, notes: ["Structural signals only; unvalidated operational knowledge is never distributed."] } };
  }
  connectCrossRegionLearningEngine(input: Record<string, unknown> = {}) { return this.controller.connect(input); }
  captureRegionalBestPractices(input: CrossRegionLearningInput = {}) { return this.controller.run("capture_regional_best_practices", input); }
  captureOperationalLessons(input: CrossRegionLearningInput = {}) { return this.controller.run("capture_operational_lessons", input); }
  captureSuccessfulGrowthStrategies(input: CrossRegionLearningInput = {}) { return this.controller.run("capture_successful_growth_strategies", input); }
  captureRiskMitigationStrategies(input: CrossRegionLearningInput = {}) { return this.controller.run("capture_risk_mitigation_strategies", input); }
  shareKnowledgeAcrossRegions(input: CrossRegionLearningInput = {}) { return this.controller.run("share_knowledge_across_regions", input); }
  detectReusableOperationalPatterns(input: CrossRegionLearningInput = {}) { return this.controller.run("detect_reusable_operational_patterns", input); }
  detectTransferableBusinessStrategies(input: CrossRegionLearningInput = {}) { return this.controller.run("detect_transferable_business_strategies", input); }
  rankKnowledgeValue(input: CrossRegionLearningInput = {}) { return this.controller.run("rank_knowledge_value", input); }
  recommendLearning(input: CrossRegionLearningInput = {}) { return this.controller.run("recommend_learning", input); }
  runDiagnostics() { return this.controller.diagnostics(); }
  getLearningRecords() { return this.controller.getManager().getLearningRecords(); } getRecommendations() { return this.controller.getManager().getRecommendations(); } getEngineRecord() { return this.controller.getManager().getEngineRecord(); }
  validateForSupervisorSync() { const state = this.getState(), score = state.latestReport?.validation.decision === "fail" ? 40 : state.latestReport?.validation.decision === "partial" ? 70 : 100; return { valid: state.health.status !== "failed", health: score >= 75 ? "healthy" as const : score >= 50 ? "degraded" as const : "blocked" as const, readinessScore: score, notes: [`Engine status: ${state.status}`, `Learning records: ${state.health.totalLearningRecords}`, ...state.health.notes] }; }
  getCockpitSnapshot(): CrlCockpitSnapshot { const state = this.getState(), record = state.engineRecord; return { engineStatus: state.status, healthStatus: state.health.status, operationalState: record?.currentOperationalState ?? null, lastDecision: state.latestReport?.validation.decision ?? null, totalLearningRecords: state.health.totalLearningRecords, frameworkRegistered: Boolean(record?.frameworkModuleId), dependenciesConnected: record?.dependencyPresence.globalExpansionFramework ? 1 : 0, recentLogs: [] }; }
}
export function createCrossRegionLearningEngine(bootstrap: EmpireBootstrapContext, dependencies: CrossRegionLearningDependencies, options?: CrossRegionLearningEngineOptions) { return new CrossRegionLearningEngine(bootstrap, dependencies, options); }
export function resetCrossRegionLearningEngineForTesting() {}
