import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildEmpireIntelligenceFrameworkConfiguration, type EmpireIntelligenceFrameworkConfiguration } from "./configuration.js";
import { EMPIRE_INTELLIGENCE_FRAMEWORK_SYSTEM_PATH } from "./paths.js";
import { appendEifLog, getEifLogs, resetEifLogsForTesting } from "./eif-logging.js";
import { EmpireIntelligenceFrameworkManager } from "./empire-intelligence-framework-manager.js";
import { EmpireIntelligenceAbstractionLayer } from "./empire-intelligence-abstraction-layer.js";
import { HealthMonitor } from "./health-monitor.js";
import type { EmpireIntelligenceCockpitSnapshot, EmpireIntelligenceFrameworkRunReport, EmpireIntelligenceFrameworkState, RegisterEmpireIntelligenceModuleInput, RouteIntelligenceEventInput } from "./types.js";
export class EmpireIntelligenceFrameworkEngine {
  private initializedAt: string|null = null; private readonly manager = new EmpireIntelligenceFrameworkManager();
  private readonly abstraction = new EmpireIntelligenceAbstractionLayer(); private readonly healthMonitor = new HealthMonitor();
  private latestReport: EmpireIntelligenceFrameworkRunReport|null = null; private config: EmpireIntelligenceFrameworkConfiguration;
  constructor(private bootstrap: EmpireBootstrapContext, options: {configuration?: Partial<EmpireIntelligenceFrameworkConfiguration>} = {}) {
    this.config = buildEmpireIntelligenceFrameworkConfiguration(bootstrap.repositoryRoot, options.configuration);
  }
  async initialize(): Promise<EmpireIntelligenceFrameworkState> {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(EMPIRE_INTELLIGENCE_FRAMEWORK_SYSTEM_PATH);
    if (!doc?.includes("Empire Intelligence Framework")) throw new Error(`${EMPIRE_INTELLIGENCE_FRAMEWORK_SYSTEM_PATH} missing — X5-01 system doc required.`);
    this.initializedAt = new Date().toISOString(); appendEifLog({event:"EMPIRE_INTELLIGENCE_FRAMEWORK_ready",level:"info",details:"X5-01 framework initialized"});
    return this.getState();
  }
  private requireInitialized() { if (!this.initializedAt) throw new Error("Empire Intelligence Framework not initialized. Call initialize() first."); }
  getState(): EmpireIntelligenceFrameworkState { this.requireInitialized(); const modules = this.manager.registry.list(); return {
    engineVersion:"PILLOW-EIF-001", missionId:"X5-01", status:"active", initializedAt:this.initializedAt!,
    configuration:this.config, latestReport:this.latestReport, registeredModules:modules, health:this.healthMonitor.buildReport(this.config, modules) }; }
  registerEmpireIntelligenceModule(input: RegisterEmpireIntelligenceModuleInput) { return this.save(this.manager.register(input, this.config)); }
  manageEnterpriseIntelligenceLifecycle(id: string, action: "start"|"stop"|"suspend"|"status" = "status") {
    if (action === "status") return this.manager.diagnostics(id);
    return this.save(this.manager.lifecycleAction(action === "start" ? "activate" : action === "stop" ? "shutdown" : "suspend", id));
  }
  provideStandardizedIntelligenceInterfaces() { return this.abstraction.describeInterfaces(); }
  getAbstractionLayer() { return this.abstraction; }
  routeIntelligenceEvents(input: RouteIntelligenceEventInput) { return this.save(this.manager.route(input)); }
  manageEnterpriseIntelligenceMetadata() { return this.manager.registry.list().map((r) => ({ frameworkId:r.frameworkId, metadataVersion:r.metadataVersion, timestamp:r.timestamp })); }
  coordinateIntelligenceAcrossCompanies() { return { coordinated:true, structuralSignalsOnly:true, registeredModules:this.manager.registry.list().length }; }
  validateFramework() { return this.save(this.manager.diagnostics()); }
  validateModuleRegistration(input: RegisterEmpireIntelligenceModuleInput) { return this.manager.validator.validateDefinition(input.definition, this.config); }
  runDiagnostics(id?: string) { return this.save(this.manager.diagnostics(id)); }
  connectEmpireIntelligenceFramework() { return { connected:true, frameworkId:"empire-intelligence-framework", structuralSignalsOnly:true }; }
  getFrameworkRecords() { return this.manager.registry.list(); } getEngineRecord() { return this.getState(); }
  getCockpitSnapshot(): EmpireIntelligenceCockpitSnapshot { const state=this.getState(); return { engineStatus:state.status, healthStatus:state.health.status,
    registeredModules:state.registeredModules.length, activeModules:state.health.activeModules, lastDecision:this.latestReport?.validation.decision??null,
    recentLogs:getEifLogs(8,this.config).map((l)=>`${l.event}: ${l.details}`) }; }
  validateForSupervisorSync() { const s=this.getState(); return {valid:s.health.status!=="failed",health:s.health.status==="healthy"?"healthy":"degraded" as "healthy"|"degraded"|"blocked",readinessScore:s.health.healthScore,notes:s.health.notes}; }
  private save(report: EmpireIntelligenceFrameworkRunReport) { this.latestReport=report; appendEifLog({event:report.action,level:report.validation.decision==="fail"?"error":"info",details:`${report.validation.decision} structural operation`}); return report; }
}
export function createEmpireIntelligenceFrameworkEngine(bootstrap: EmpireBootstrapContext, options?: {configuration?: Partial<EmpireIntelligenceFrameworkConfiguration>}) { return new EmpireIntelligenceFrameworkEngine(bootstrap, options); }
export function resetEmpireIntelligenceFrameworkForTesting() { resetEifLogsForTesting(); }
