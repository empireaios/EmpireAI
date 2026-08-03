import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildEmpireKnowledgeEngineConfiguration, type EmpireKnowledgeEngineConfiguration } from "./configuration.js";
import { EmpireKnowledgeController } from "./empire-knowledge-controller.js";
import { EmpireKnowledgeManager, type EmpireKnowledgeDependencies } from "./empire-knowledge-manager.js";
import { EMPIRE_KNOWLEDGE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type { EmpireKnowledgeCockpitSnapshot, EmpireKnowledgeInput, EmpireKnowledgeState } from "./types.js";
export type { EmpireKnowledgeDependencies };
export interface EmpireKnowledgeEngineOptions { configuration?: Partial<EmpireKnowledgeEngineConfiguration>; }
export class EmpireKnowledgeEngine {
  private initializedAt: string | null = null;
  private readonly controller: EmpireKnowledgeController;
  constructor(private readonly bootstrap: EmpireBootstrapContext, dependencies: EmpireKnowledgeDependencies = {}, options: EmpireKnowledgeEngineOptions = {}) {
    this.controller = new EmpireKnowledgeController(new EmpireKnowledgeManager(dependencies), buildEmpireKnowledgeEngineConfiguration(bootstrap.repositoryRoot, options.configuration));
  }
  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(EMPIRE_KNOWLEDGE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Empire Knowledge Engine")) throw new Error(`${EMPIRE_KNOWLEDGE_ENGINE_SYSTEM_PATH} missing — X5-02 system doc required.`);
    this.controller.initialize(); this.initializedAt = new Date().toISOString(); return this.getState();
  }
  getState(): EmpireKnowledgeState {
    if (!this.initializedAt) throw new Error("Empire Knowledge Engine not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration(), engineRecord = this.controller.getManager().getEngineRecord(), latestReport = this.controller.getLatestReport(), count = this.getKnowledgeRecords().length;
    return { engineVersion: "PILLOW-ENK-001", missionId: "X5-02", status: this.controller.getStatus(), initializedAt: this.initializedAt, configuration, latestReport, engineRecord, health: { status: engineRecord?.healthStatus ?? "standby", healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50, engineEnabled: configuration.enabled, lastOperationAt: latestReport?.runTimestamp ?? null, lastValidationDecision: latestReport?.validation.decision ?? null, totalKnowledgeRecords: count, notes: ["Structural signals only; unvalidated enterprise knowledge is never distributed."] } };
  }
  connectEmpireKnowledgeEngine(input: Record<string, unknown> = {}) { return this.controller.connect(input); }
  buildCrossEnterpriseKnowledgeGraph(input: EmpireKnowledgeInput = {}) { return this.controller.run("build_cross_enterprise_knowledge_graph", input); }
  captureKnowledgeFromCompany(input: EmpireKnowledgeInput = {}) { return this.controller.run("capture_knowledge_from_company", input); }
  shareValidatedKnowledgeAcrossCompanies(input: EmpireKnowledgeInput = {}) { return this.controller.run("share_validated_knowledge", input); }
  mapRelationships(input: EmpireKnowledgeInput = {}) { return this.controller.run("map_relationships", input); }
  detectReusableBusinessKnowledge(input: EmpireKnowledgeInput = {}) { return this.controller.run("detect_reusable_business_knowledge", input); }
  detectDuplicatedKnowledge(input: EmpireKnowledgeInput = {}) { return this.controller.run("detect_duplicated_knowledge", input); }
  detectKnowledgeGaps(input: EmpireKnowledgeInput = {}) { return this.controller.run("detect_knowledge_gaps", input); }
  recommendEnterpriseKnowledge(input: EmpireKnowledgeInput = {}) { return this.controller.run("recommend_enterprise_knowledge", input); }
  runDiagnostics() { return this.controller.diagnostics(); }
  getKnowledgeRecords() { return this.controller.getManager().getKnowledgeRecords(); } getRecommendations() { return this.controller.getManager().getRecommendations(); } getEngineRecord() { return this.controller.getManager().getEngineRecord(); }
  validateForSupervisorSync() { const state = this.getState(), score = state.latestReport?.validation.decision === "fail" ? 40 : state.latestReport?.validation.decision === "partial" ? 70 : 100; return { valid: state.health.status !== "failed", health: score >= 75 ? "healthy" as const : score >= 50 ? "degraded" as const : "blocked" as const, readinessScore: score, notes: [`Engine status: ${state.status}`, `Knowledge records: ${state.health.totalKnowledgeRecords}`, ...state.health.notes] }; }
  getCockpitSnapshot(): EmpireKnowledgeCockpitSnapshot { const state = this.getState(), record = state.engineRecord; return { engineStatus: state.status, healthStatus: state.health.status, operationalState: record?.currentOperationalState ?? null, lastDecision: state.latestReport?.validation.decision ?? null, totalKnowledgeRecords: state.health.totalKnowledgeRecords, frameworkRegistered: Boolean(record?.frameworkModuleId), dependenciesConnected: record?.dependencyPresence.empireIntelligenceFramework ? 1 : 0, recentLogs: [] }; }
}
export function createEmpireKnowledgeEngine(bootstrap: EmpireBootstrapContext, dependencies: EmpireKnowledgeDependencies = {}, options?: EmpireKnowledgeEngineOptions) { return new EmpireKnowledgeEngine(bootstrap, dependencies, options); }
export function resetEmpireKnowledgeEngineForTesting() {}
