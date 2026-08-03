import type { EmpireIntelligenceFrameworkConfiguration } from "./configuration.js";
import { EmpireIntelligenceModuleRegistry } from "./empire-intelligence-module-registry.js";
import { EmpireIntelligenceLifecycleManager } from "./empire-intelligence-lifecycle-manager.js";
import { EmpireEventRouter } from "./empire-event-router.js";
import { EmpireValidator } from "./empire-validator.js";
import { EmpireMetadataGenerator } from "./empire-metadata-generator.js";
import type { EmpireIntelligenceFrameworkRunReport, RegisterEmpireIntelligenceModuleInput, RouteIntelligenceEventInput } from "./types.js";
export class EmpireIntelligenceFrameworkManager {
  readonly registry = new EmpireIntelligenceModuleRegistry(); readonly lifecycle = new EmpireIntelligenceLifecycleManager();
  readonly validator = new EmpireValidator(); readonly metadata = new EmpireMetadataGenerator();
  readonly eventRouter = new EmpireEventRouter(this.registry);
  register(input: RegisterEmpireIntelligenceModuleInput, config: EmpireIntelligenceFrameworkConfiguration): EmpireIntelligenceFrameworkRunReport {
    const started = Date.now(), validation = this.validator.validateDefinition(input.definition, config);
    if (validation.decision === "fail") return this.metadata.buildRunReport("register_module", [], validation, Date.now()-started);
    if (this.registry.get(input.definition.intelligenceModuleIdentifier) && !input.forceRegister) {
      validation.decision = "fail"; validation.errors.push("Module already registered — use forceRegister to replace");
      return this.metadata.buildRunReport("register_module", [], validation, Date.now()-started);
    }
    if (this.registry.list().length >= config.maxRegisteredModules) {
      validation.decision = "fail"; validation.errors.push("Maximum registered intelligence modules reached");
      return this.metadata.buildRunReport("register_module", [], validation, Date.now()-started);
    }
    const record = this.registry.register(input.definition); validation.frameworkId = record.frameworkId;
    return this.metadata.buildRunReport("register_module", [record], validation, Date.now()-started);
  }
  lifecycleAction(action: "activate"|"suspend"|"shutdown", id: string): EmpireIntelligenceFrameworkRunReport {
    const started = Date.now(), state = action === "activate" ? "active" : action === "suspend" ? "suspended" : "shutdown";
    const record = this.lifecycle.transition(this.registry, id, state);
    const validation = record ? this.validator.validateRecord(record) : this.validator.validateRecord({ frameworkId: "eif-missing" } as never);
    if (!record) { validation.decision = "fail"; validation.errors.push("Intelligence module not found"); }
    return this.metadata.buildRunReport(action, record ? [record] : [], validation, Date.now()-started);
  }
  route(input: RouteIntelligenceEventInput): EmpireIntelligenceFrameworkRunReport {
    const started = Date.now();
    try { this.eventRouter.route(input); const record = this.registry.get(input.intelligenceModuleIdentifier)!;
      return this.metadata.buildRunReport("route_event", [record], this.validator.validateRecord(record), Date.now()-started);
    } catch (error) { const validation = this.validator.validateRecord({ frameworkId: "eif-missing" } as never);
      validation.decision = "fail"; validation.errors.push(error instanceof Error ? error.message : "Event routing failed");
      return this.metadata.buildRunReport("route_event", [], validation, Date.now()-started); }
  }
  diagnostics(id?: string): EmpireIntelligenceFrameworkRunReport {
    const started = Date.now(), records = id
      ? [this.registry.get(id)].filter((record): record is NonNullable<typeof record> => Boolean(record))
      : this.registry.list();
    const validation = records.length ? this.validator.validateRecord(records[0]!) : this.validator.validateRecord({ frameworkId: "eif-missing" } as never);
    if (!records.length) { validation.decision = "fail"; validation.errors.push(id ? "Module not found" : "No intelligence modules registered"); }
    return this.metadata.buildRunReport("diagnostics", records, validation, Date.now()-started);
  }
}
