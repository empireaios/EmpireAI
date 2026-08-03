/** X4-01 — Global Expansion Framework manager. */

import { GlobalModuleRegistry } from "./global-module-registry.js";
import { ExpansionLifecycleManager } from "./expansion-lifecycle-manager.js";
import { GlobalConfigurationManager } from "./global-configuration-manager.js";
import { GlobalValidationEngine } from "./global-validation-engine.js";
import { GlobalMetadataGenerator } from "./global-metadata-generator.js";
import { GlobalEventRateLimitManager } from "./global-event-rate-limit-manager.js";
import { GlobalEventRouter } from "./global-event-router.js";
import { RegionalDataAbstractionLayer } from "./regional-data-abstraction.js";
import { GEF_METADATA_VERSION } from "./paths.js";
import type { GlobalExpansionFrameworkConfiguration } from "./configuration.js";
import type {
  AbstractRegionalDataInput,
  GlobalExpansionFrameworkRecord,
  ExpansionFrameworkRunReport,
  RegisterExpansionModuleInput,
  RouteExpansionEventInput,
  RunExpansionDiagnosticsInput,
} from "./types.js";

export class GlobalExpansionFrameworkManager {
  private readonly registry = new GlobalModuleRegistry();
  private readonly lifecycle = new ExpansionLifecycleManager();
  private readonly configManager = new GlobalConfigurationManager();
  private readonly validationEngine = new GlobalValidationEngine();
  private readonly metadataGenerator = new GlobalMetadataGenerator();
  private readonly rateLimitManager = new GlobalEventRateLimitManager();
  private readonly eventRouter: GlobalEventRouter;
  private readonly dataAbstraction: RegionalDataAbstractionLayer;

  constructor() {
    this.eventRouter = new GlobalEventRouter(
      this.registry,
      this.rateLimitManager,
      this.validationEngine,
    );
    this.dataAbstraction = new RegionalDataAbstractionLayer(this.registry);
  }

  getRegistry() {
    return this.registry;
  }

  getModules(): GlobalExpansionFrameworkRecord[] {
    return this.registry.list();
  }

  registerExpansionModule(
    input: RegisterExpansionModuleInput,
    config: GlobalExpansionFrameworkConfiguration,
  ): ExpansionFrameworkRunReport {
    const started = Date.now();
    const merged = this.configManager.mergeDefaults(input.definition, config);
    const validation = this.validationEngine.validateRegistration(merged, config);

    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "register_module",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.registry.get(merged.expansionModuleIdentifier) && !input.forceRegister) {
      validation.decision = "fail";
      validation.errors.push("Module already registered — use forceRegister to replace");
      return this.metadataGenerator.buildRunReport({
        action: "register_module",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.registry.list().length >= config.maxRegisteredModules) {
      validation.decision = "fail";
      validation.errors.push("Maximum registered expansion modules reached");
      return this.metadataGenerator.buildRunReport({
        action: "register_module",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const record = this.registry.register(merged);
    this.lifecycle.initialize(this.registry, merged.expansionModuleIdentifier);
    const recordValidation = this.validationEngine.validateRecord(record, config);
    validation.expansionFrameworkId = record.expansionFrameworkId;
    if (recordValidation.decision === "fail") {
      validation.decision = "fail";
      validation.errors.push(...recordValidation.errors);
    }

    return this.metadataGenerator.buildRunReport({
      action: "register_module",
      records: [record],
      validation,
      durationMs: Date.now() - started,
    });
  }

  activateExpansionModule(
    expansionModuleIdentifier: string,
    config: GlobalExpansionFrameworkConfiguration,
  ): ExpansionFrameworkRunReport {
    const started = Date.now();
    const recordBefore = this.registry.get(expansionModuleIdentifier);
    if (!recordBefore) {
      const validation = {
        validationReportId: `gef-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        expansionFrameworkId: null,
        errors: ["Scaling module not found"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: GEF_METADATA_VERSION,
      };
      return this.metadataGenerator.buildRunReport({
        action: "activate",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    this.lifecycle.initialize(this.registry, expansionModuleIdentifier);
    const result = this.lifecycle.activate(this.registry, expansionModuleIdentifier);
    const record = result.record;
    const validation = this.validationEngine.validateRecord(record!, config);
    if (!result.ok) {
      validation.decision = "fail";
      validation.errors.push(result.error ?? "Activation failed");
    }

    return this.metadataGenerator.buildRunReport({
      action: "activate",
      records: record ? [record] : [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  suspendExpansionModule(
    expansionModuleIdentifier: string,
    config: GlobalExpansionFrameworkConfiguration,
  ): ExpansionFrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.suspend(this.registry, expansionModuleIdentifier);
    const validation = this.validationEngine.validateRecord(
      result.record ?? ({ expansionFrameworkId: "gef-missing" } as GlobalExpansionFrameworkRecord),
      config,
    );
    if (!result.ok) {
      validation.decision = "fail";
      validation.errors.push(result.error ?? "Suspend failed");
    }
    return this.metadataGenerator.buildRunReport({
      action: "suspend",
      records: result.record ? [result.record] : [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  shutdownExpansionModule(
    expansionModuleIdentifier: string,
    config: GlobalExpansionFrameworkConfiguration,
  ): ExpansionFrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.shutdown(this.registry, expansionModuleIdentifier);
    const validation = this.validationEngine.validateRecord(
      result.record ?? ({ expansionFrameworkId: "gef-missing" } as GlobalExpansionFrameworkRecord),
      config,
    );
    if (!result.ok) {
      validation.decision = "fail";
      validation.errors.push(result.error ?? "Shutdown failed");
    }
    return this.metadataGenerator.buildRunReport({
      action: "shutdown",
      records: result.record ? [result.record] : [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  routeExpansionEvent(
    input: RouteExpansionEventInput,
    config: GlobalExpansionFrameworkConfiguration,
  ): ExpansionFrameworkRunReport {
    const started = Date.now();
    try {
      const routed = this.eventRouter.routeEvent(input, config);
      const record = this.registry.get(input.expansionModuleIdentifier);
      const validation = this.validationEngine.validateRecord(record!, config);
      if (routed.rateLimited) validation.warnings.push("Event was rate limited");
      return this.metadataGenerator.buildRunReport({
        action: "route_event",
        records: record ? [record] : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = {
        validationReportId: `gef-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        expansionFrameworkId: null,
        errors: [error instanceof Error ? error.message : "Event routing failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: GEF_METADATA_VERSION,
      };
      return this.metadataGenerator.buildRunReport({
        action: "route_event",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  abstractRegionalData(
    input: AbstractRegionalDataInput,
    config: GlobalExpansionFrameworkConfiguration,
  ): ExpansionFrameworkRunReport {
    const started = Date.now();
    try {
      this.dataAbstraction.abstractData(input, config);
      const record = this.registry.get(input.expansionModuleIdentifier);
      const validation = this.validationEngine.validateRecord(record!, config);
      return this.metadataGenerator.buildRunReport({
        action: "abstract_data",
        records: record ? [record] : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = {
        validationReportId: `gef-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        expansionFrameworkId: null,
        errors: [error instanceof Error ? error.message : "Data abstraction failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: GEF_METADATA_VERSION,
      };
      return this.metadataGenerator.buildRunReport({
        action: "abstract_data",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  runDiagnostics(
    input: RunExpansionDiagnosticsInput,
    config: GlobalExpansionFrameworkConfiguration,
  ): ExpansionFrameworkRunReport {
    const started = Date.now();
    const modules = input.expansionModuleIdentifier
      ? [this.registry.get(input.expansionModuleIdentifier)].filter(Boolean)
      : this.registry.list();

    const records = modules as GlobalExpansionFrameworkRecord[];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const record of records) {
      if (record.healthStatus === "failed") {
        warnings.push(`${record.expansionModuleIdentifier}: health failed`);
      }
      if (record.operationalState === "registered") {
        warnings.push(`${record.expansionModuleIdentifier}: not initialized`);
      }
    }

    if (records.length === 0) {
      errors.push(
        input.expansionModuleIdentifier ? "Module not found" : "No expansion modules registered",
      );
    }

    const validation = {
      validationReportId: `gef-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: (errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass") as
        | "pass"
        | "partial"
        | "fail",
      expansionFrameworkId: records[0]?.expansionFrameworkId ?? null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GEF_METADATA_VERSION,
    };

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      records,
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.registry.resetForTesting();
    this.rateLimitManager.resetForTesting();
  }
}
