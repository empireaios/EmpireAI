import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildEmpireCapitalAllocationConfiguration, type EmpireCapitalAllocationConfiguration } from "./configuration.js";
import { EmpireCapitalAllocationController } from "./empire-capital-allocation-controller.js";
import { EmpireCapitalAllocationManager, type EmpireCapitalAllocationDependencies } from "./empire-capital-allocation-manager.js";
import { EMPIRE_CAPITAL_ALLOCATION_SYSTEM_PATH } from "./paths.js";
import type { EmpireCapitalAllocationCockpitSnapshot, EmpireCapitalAllocationInput, EmpireCapitalAllocationState } from "./types.js";
export type { EmpireCapitalAllocationDependencies };
export interface EmpireCapitalAllocationOptions { configuration?: Partial<EmpireCapitalAllocationConfiguration>; }
export class EmpireCapitalAllocation {
  private initializedAt: string | null = null;
  private readonly controller: EmpireCapitalAllocationController;
  constructor(private readonly bootstrap: EmpireBootstrapContext, dependencies: EmpireCapitalAllocationDependencies = {}, options: EmpireCapitalAllocationOptions = {}) {
    this.controller = new EmpireCapitalAllocationController(new EmpireCapitalAllocationManager(dependencies), buildEmpireCapitalAllocationConfiguration(bootstrap.repositoryRoot, options.configuration));
  }
  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(EMPIRE_CAPITAL_ALLOCATION_SYSTEM_PATH);
    if (!doc?.includes("Empire Capital Allocation")) throw new Error(`${EMPIRE_CAPITAL_ALLOCATION_SYSTEM_PATH} missing — X5-05 system doc required.`);
    this.controller.initialize(); this.initializedAt = new Date().toISOString(); return this.getState();
  }
  getState(): EmpireCapitalAllocationState {
    if (!this.initializedAt) throw new Error("Empire Capital Allocation not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration(), engineRecord = this.controller.getManager().getEngineRecord(), latestReport = this.controller.getLatestReport(), count = this.getCapitalAllocationRecords().length;
    return { engineVersion: "PILLOW-ECA-001", missionId: "X5-05", status: this.controller.getStatus(), initializedAt: this.initializedAt, configuration, latestReport, engineRecord, health: { status: engineRecord?.healthStatus ?? "standby", healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50, engineEnabled: configuration.enabled, lastOperationAt: latestReport?.runTimestamp ?? null, lastValidationDecision: latestReport?.validation.decision ?? null, totalCapitalAllocationRecords: count, notes: ["Structural financial signals and recommendations only; capital transfers are never automatically executed."] } };
  }
  connectEmpireCapitalAllocation(input: Record<string, unknown> = {}) { return this.controller.connect(input); }
  monitorAvailableEnterpriseCapital(input: EmpireCapitalAllocationInput = {}) { return this.controller.run("monitor_available_enterprise_capital", input); }
  monitorCapitalUtilization(input: EmpireCapitalAllocationInput = {}) { return this.controller.run("monitor_capital_utilization", input); }
  evaluateInvestmentOpportunities(input: EmpireCapitalAllocationInput = {}) { return this.controller.run("evaluate_investment_opportunities", input); }
  estimateExpectedReturnOnInvestment(input: EmpireCapitalAllocationInput = {}) { return this.controller.run("estimate_expected_return_on_investment", input); }
  rankCapitalAllocationPriorities(input: EmpireCapitalAllocationInput = {}) { return this.controller.run("rank_capital_allocation_priorities", input); }
  detectUnderperformingInvestments(input: EmpireCapitalAllocationInput = {}) { return this.controller.run("detect_underperforming_investments", input); }
  detectCapitalShortages(input: EmpireCapitalAllocationInput = {}) { return this.controller.run("detect_capital_shortages", input); }
  recommendCapitalReallocation(input: EmpireCapitalAllocationInput = {}) { return this.controller.run("recommend_capital_reallocation", input); }
  trackAllocationOutcomes(input: EmpireCapitalAllocationInput = {}) { return this.controller.run("track_allocation_outcomes", input); }
  runDiagnostics() { return this.controller.diagnostics(); }
  getCapitalAllocationRecords() { return this.controller.getManager().getCapitalAllocationRecords(); } getRecommendations() { return this.controller.getManager().getRecommendations(); } getEngineRecord() { return this.controller.getManager().getEngineRecord(); }
  validateForSupervisorSync() { const state = this.getState(), score = state.latestReport?.validation.decision === "fail" ? 40 : state.latestReport?.validation.decision === "partial" ? 70 : 100; return { valid: state.health.status !== "failed", health: score >= 75 ? "healthy" as const : score >= 50 ? "degraded" as const : "blocked" as const, readinessScore: score, notes: [`Engine status: ${state.status}`, `Capital allocation records: ${state.health.totalCapitalAllocationRecords}`, ...state.health.notes] }; }
  getCockpitSnapshot(): EmpireCapitalAllocationCockpitSnapshot { const state = this.getState(), record = state.engineRecord; return { engineStatus: state.status, healthStatus: state.health.status, operationalState: record?.currentOperationalState ?? null, lastDecision: state.latestReport?.validation.decision ?? null, totalCapitalAllocationRecords: state.health.totalCapitalAllocationRecords, frameworkRegistered: Boolean(record?.frameworkModuleId), dependenciesConnected: Number(Boolean(record?.dependencyPresence.empireIntelligenceFramework)) + Number(Boolean(record?.dependencyPresence.empireMemoryEngine)) + Number(Boolean(record?.dependencyPresence.empireKnowledgeEngine)), recentLogs: [] }; }
}
export function createEmpireCapitalAllocation(bootstrap: EmpireBootstrapContext, dependencies: EmpireCapitalAllocationDependencies = {}, options?: EmpireCapitalAllocationOptions) { return new EmpireCapitalAllocation(bootstrap, dependencies, options); }
export function resetEmpireCapitalAllocationForTesting() {}
