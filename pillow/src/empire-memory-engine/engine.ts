import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildEmpireMemoryEngineConfiguration, type EmpireMemoryEngineConfiguration } from "./configuration.js";
import { EmpireMemoryController } from "./empire-memory-controller.js";
import { EmpireMemoryManager, type EmpireMemoryDependencies } from "./empire-memory-manager.js";
import { EMPIRE_MEMORY_ENGINE_SYSTEM_PATH } from "./paths.js";
import type { EmpireMemoryCockpitSnapshot, EmpireMemoryInput, EmpireMemoryState } from "./types.js";
export type { EmpireMemoryDependencies };
export interface EmpireMemoryEngineOptions { configuration?: Partial<EmpireMemoryEngineConfiguration>; }
export class EmpireMemoryEngine {
  private initializedAt: string | null = null;
  private readonly controller: EmpireMemoryController;
  constructor(private readonly bootstrap: EmpireBootstrapContext, dependencies: EmpireMemoryDependencies = {}, options: EmpireMemoryEngineOptions = {}) {
    this.controller = new EmpireMemoryController(new EmpireMemoryManager(dependencies), buildEmpireMemoryEngineConfiguration(bootstrap.repositoryRoot, options.configuration));
  }
  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(EMPIRE_MEMORY_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Empire Memory Engine")) throw new Error(`${EMPIRE_MEMORY_ENGINE_SYSTEM_PATH} missing — X5-03 system doc required.`);
    this.controller.initialize(); this.initializedAt = new Date().toISOString(); return this.getState();
  }
  getState(): EmpireMemoryState {
    if (!this.initializedAt) throw new Error("Empire Memory Engine not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration(), engineRecord = this.controller.getManager().getEngineRecord(), latestReport = this.controller.getLatestReport(), count = this.getMemoryRecords().length;
    return { engineVersion: "PILLOW-EME-001", missionId: "X5-03", status: this.controller.getStatus(), initializedAt: this.initializedAt, configuration, latestReport, engineRecord, health: { status: engineRecord?.healthStatus ?? "standby", healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50, engineEnabled: configuration.enabled, lastOperationAt: latestReport?.runTimestamp ?? null, lastValidationDecision: latestReport?.validation.decision ?? null, totalMemoryRecords: count, notes: ["Structural signals only; validated historical records require explicit alteration authorization."] } };
  }
  connectEmpireMemoryEngine(input: Record<string, unknown> = {}) { return this.controller.connect(input); }
  persistLongTermOrganizationalMemory(input: EmpireMemoryInput = {}) { return this.controller.run("persist_long_term_organizational_memory", input); }
  recordStrategicDecision(input: EmpireMemoryInput = {}) { return this.controller.run("record_strategic_decision", input); }
  recordOperationalDecision(input: EmpireMemoryInput = {}) { return this.controller.run("record_operational_decision", input); }
  recordBusinessOutcome(input: EmpireMemoryInput = {}) { return this.controller.run("record_business_outcome", input); }
  recordLessonLearned(input: EmpireMemoryInput = {}) { return this.controller.run("record_lesson_learned", input); }
  recordHistoricalEvent(input: EmpireMemoryInput = {}) { return this.controller.run("record_historical_event", input); }
  recordEnterpriseMilestone(input: EmpireMemoryInput = {}) { return this.controller.run("record_enterprise_milestone", input); }
  detectDuplicateMemory(input: EmpireMemoryInput = {}) { return this.controller.run("detect_duplicate_memory", input); }
  detectMemoryConflicts(input: EmpireMemoryInput = {}) { return this.controller.run("detect_memory_conflicts", input); }
  recommendOrganizationalMemory(input: EmpireMemoryInput = {}) { return this.controller.run("recommend_organizational_memory", input); }
  runDiagnostics() { return this.controller.diagnostics(); }
  getMemoryRecords() { return this.controller.getManager().getMemoryRecords(); } getRecommendations() { return this.controller.getManager().getRecommendations(); } getEngineRecord() { return this.controller.getManager().getEngineRecord(); }
  validateForSupervisorSync() { const state = this.getState(), score = state.latestReport?.validation.decision === "fail" ? 40 : state.latestReport?.validation.decision === "partial" ? 70 : 100; return { valid: state.health.status !== "failed", health: score >= 75 ? "healthy" as const : score >= 50 ? "degraded" as const : "blocked" as const, readinessScore: score, notes: [`Engine status: ${state.status}`, `Memory records: ${state.health.totalMemoryRecords}`, ...state.health.notes] }; }
  getCockpitSnapshot(): EmpireMemoryCockpitSnapshot { const state = this.getState(), record = state.engineRecord; return { engineStatus: state.status, healthStatus: state.health.status, operationalState: record?.currentOperationalState ?? null, lastDecision: state.latestReport?.validation.decision ?? null, totalMemoryRecords: state.health.totalMemoryRecords, frameworkRegistered: Boolean(record?.frameworkModuleId), dependenciesConnected: Number(Boolean(record?.dependencyPresence.empireIntelligenceFramework)) + Number(Boolean(record?.dependencyPresence.empireKnowledgeEngine)), recentLogs: [] }; }
}
export function createEmpireMemoryEngine(bootstrap: EmpireBootstrapContext, dependencies: EmpireMemoryDependencies = {}, options?: EmpireMemoryEngineOptions) { return new EmpireMemoryEngine(bootstrap, dependencies, options); }
export function resetEmpireMemoryEngineForTesting() {}
