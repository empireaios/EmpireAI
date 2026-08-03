import type { GlobalExpansionFrameworkEngine } from "../global-expansion-framework/engine.js";
import type { GlobalExpansionSimulatorConfiguration } from "./configuration.js";
import { GES_CAPABILITIES, GES_METADATA_VERSION, GLOBAL_EXPANSION_SIMULATOR_ID } from "./paths.js";
import type { GesRunReport, GlobalExpansionSimulationInput, GlobalExpansionSimulatorRecord, SimulationRecommendation, SimulationRecord, SimulationValidationReport } from "./types.js";

export type GlobalExpansionSimulatorDependencies = { globalExpansionFramework?: GlobalExpansionFrameworkEngine | null };
export class GlobalExpansionSimulationManager {
  private engineRecord: GlobalExpansionSimulatorRecord | null = null;
  private records: SimulationRecord[] = [];
  private recommendations: SimulationRecommendation[] = [];
  constructor(private readonly dependencies: GlobalExpansionSimulatorDependencies = {}) {}
  getEngineRecord() { return this.engineRecord ? { ...this.engineRecord } : null; }
  getSimulationRecords() { return this.records.map((record) => ({ ...record })); }
  getRecommendations() { return this.recommendations.map((record) => ({ ...record })); }
  private validation(decision: SimulationValidationReport["decision"], errors: string[] = [], warnings: string[] = []): SimulationValidationReport {
    return { validationReportId: `ges-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision, errors, warnings, durationMs: 0, metadataVersion: GES_METADATA_VERSION };
  }
  private report(action: string, simulationRecords: SimulationRecord[], validation: SimulationValidationReport): GesRunReport {
    return { simulationRunReportId: `ges-run-${Date.now()}`, runTimestamp: new Date().toISOString(), action, engineRecord: this.engineRecord!, simulationRecords, recommendations: this.recommendations, validation, durationMs: 0, metadataVersion: GES_METADATA_VERSION };
  }
  connect(_input: Record<string, unknown>, config: GlobalExpansionSimulatorConfiguration): GesRunReport {
    const gef = this.dependencies.globalExpansionFramework;
    let frameworkModuleId: string | null = null;
    if (gef) {
      const registration = gef.registerExpansionModule({ definition: { expansionModuleIdentifier: GLOBAL_EXPANSION_SIMULATOR_ID, moduleVersion: GES_METADATA_VERSION, moduleType: "integration", integrationMissionId: "X4-17", eventRoutingConfig: { enabled: true, topics: ["expansion.simulation.projected"], maxEventsPerMinute: 60, windowMs: 60000 }, retryConfig: { enabled: true, maxAttempts: config.maxRetryAttempts, delayMs: config.retryDelayMs, backoffMultiplier: 2 }, supportedCapabilities: ["global_expansion_module_registration", "regional_data_abstraction", "global_expansion_validation", "diagnostics"] }, forceRegister: true });
      frameworkModuleId = registration.records[0]?.expansionFrameworkId ?? null;
      if (registration.validation.decision !== "fail") gef.activateExpansionModule(GLOBAL_EXPANSION_SIMULATOR_ID);
    }
    this.engineRecord = { engineRecordId: `ges-eng-${Date.now()}`, timestamp: new Date().toISOString(), engineId: GLOBAL_EXPANSION_SIMULATOR_ID, engineVersion: "PILLOW-GES-001", currentOperationalState: "connected", healthStatus: gef ? "healthy" : "degraded", validationStatus: gef ? "passed" : "partial", supportedCapabilities: [...GES_CAPABILITIES], frameworkModuleId, dependencyPresence: { globalExpansionFramework: Boolean(gef) }, metadataVersion: GES_METADATA_VERSION };
    return this.report("connect", [], this.validation(gef ? "pass" : "partial", [], gef ? [] : ["globalExpansionFramework unavailable"]));
  }
  run(action: string, input: GlobalExpansionSimulationInput, config: GlobalExpansionSimulatorConfiguration): GesRunReport {
    if (!this.engineRecord) throw new Error("Global Expansion Simulator not connected — call connectGlobalExpansionSimulator first");
    const validated = input.validated === true;
    const targetCountry = (input.targetCountry || "GLOBAL").toUpperCase(), targetRegion = (input.targetRegion || "GLOBAL").toUpperCase();
    const validation = this.validation(validated ? "pass" : "partial", [], validated ? [] : ["Projection is a structural simulation only; not executable intelligence"]);
    const readinessProjection = Math.max(0, Math.min(100, input.readinessHint ?? (validated ? 80 : 50)));
    const financialProjection = Math.max(0, Math.min(100, input.financialHint ?? (validated ? 75 : 45)));
    const riskProjection = Math.max(0, Math.min(100, input.riskHint ?? (validated ? 25 : 50)));
    const record: SimulationRecord = { simulationId: `ges-${Date.now()}-${targetCountry}`, timestamp: new Date().toISOString(), companyReference: input.companyReference ?? "enterprise", targetCountry, targetRegion, expansionScenario: input.expansionScenario ?? action, readinessProjection, financialProjection, riskProjection, recommendationSummary: validated ? `Evaluate projected ${action} for ${targetCountry}; no production action is authorized.` : `Unvalidated projection for ${targetCountry}; optimization and execution blocked.`, validationStatus: validated ? "passed" : "partial", metadataVersion: GES_METADATA_VERSION, structuralSignalOnly: true, neverExecuteSimulatedActionsAgainstProductionSystems: true, preserveSimulationTraceability: true, unvalidatedClaim: "none", simulationTraceId: `ges-trace-${Date.now()}` };
    this.records.push(record); this.engineRecord.currentOperationalState = "active"; this.engineRecord.timestamp = record.timestamp;
    if (action === "recommend_expansion" || action === "rank_simulation_outcomes" || action === "compare_expansion_scenarios") this.recommendations = this.records.filter((r) => r.validationStatus === "passed").map((r) => ({ recommendationId: `ges-rec-${r.simulationId}`, timestamp: new Date().toISOString(), targetCountry: r.targetCountry, targetRegion: r.targetRegion, recommendationSummary: r.recommendationSummary, outcomeScore: Math.round((r.readinessProjection + r.financialProjection + (100 - r.riskProjection)) / 3), structuralSignalOnly: true, neverExecuteSimulatedActionsAgainstProductionSystems: true, unvalidatedClaim: "none" }));
    return this.report(action, [record], validation);
  }
  diagnostics(config: GlobalExpansionSimulatorConfiguration) { return this.engineRecord ? this.report("diagnostics", this.records, this.validation(config.enabled ? "pass" : "fail", config.enabled ? [] : ["Engine disabled"])) : this.connect({}, config); }
}
