/** R5-01 — Marketing Framework manager. */

import { MarketingModuleRegistry } from "./marketing-module-registry.js";
import { MarketingLifecycleManager } from "./marketing-lifecycle-manager.js";
import { MarketingConfigurationManager } from "./marketing-configuration-manager.js";
import { MarketingCredentialAdapter } from "./marketing-credential-adapter.js";
import { MarketingValidationEngine } from "./marketing-validation-engine.js";
import { MarketingMetadataGenerator } from "./marketing-metadata-generator.js";
import { MarketingRateLimitManager } from "./marketing-rate-limit-manager.js";
import { MarketingEventRouter } from "./marketing-event-router.js";
import { MarketingDataAbstractionLayer } from "./marketing-data-abstraction.js";
import { MARKETING_METADATA_VERSION } from "./paths.js";
import type { MarketingFrameworkConfiguration } from "./configuration.js";
import type {
  AbstractMarketingDataInput,
  FrameworkRunReport,
  RegisterMarketingModuleInput,
  RouteMarketingEventInput,
  RunDiagnosticsInput,
  MarketingFrameworkRecord,
} from "./types.js";

export class MarketingFrameworkManager {
  private readonly registry = new MarketingModuleRegistry();
  private readonly lifecycle = new MarketingLifecycleManager();
  private readonly configManager = new MarketingConfigurationManager();
  private readonly credentialAdapter = new MarketingCredentialAdapter();
  private readonly validationEngine = new MarketingValidationEngine();
  private readonly metadataGenerator = new MarketingMetadataGenerator();
  private readonly rateLimitManager = new MarketingRateLimitManager();
  private readonly eventRouter: MarketingEventRouter;
  private readonly dataAbstraction: MarketingDataAbstractionLayer;

  constructor() {
    this.eventRouter = new MarketingEventRouter(
      this.registry,
      this.rateLimitManager,
      this.validationEngine,
    );
    this.dataAbstraction = new MarketingDataAbstractionLayer(this.registry);
  }

  getRegistry() {
    return this.registry;
  }

  getModules(): MarketingFrameworkRecord[] {
    return this.registry.list();
  }

  registerMarketingModule(
    input: RegisterMarketingModuleInput,
    config: MarketingFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const merged = this.configManager.mergeDefaults(input.definition, config);
    const validation = this.validationEngine.validateRegistration(merged, config);

    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "register",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.registry.get(merged.marketingModuleIdentifier) && !input.forceRegister) {
      validation.decision = "fail";
      validation.errors.push("Module already registered — use forceRegister to replace");
      return this.metadataGenerator.buildRunReport({
        action: "register",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.registry.list().length >= config.maxRegisteredModules) {
      validation.decision = "fail";
      validation.errors.push("Maximum registered marketing modules reached");
      return this.metadataGenerator.buildRunReport({
        action: "register",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const record = this.registry.register(merged);
    this.lifecycle.initialize(this.registry, merged.marketingModuleIdentifier);
    const recordValidation = this.validationEngine.validateRecord(record, config);
    validation.frameworkId = record.frameworkId;
    if (recordValidation.decision === "fail") {
      validation.decision = "fail";
      validation.errors.push(...recordValidation.errors);
    }

    return this.metadataGenerator.buildRunReport({
      action: "register",
      records: [record],
      validation,
      durationMs: Date.now() - started,
    });
  }

  activateMarketingModule(
    marketingModuleIdentifier: string,
    config: MarketingFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const recordBefore = this.registry.get(marketingModuleIdentifier);
    if (!recordBefore) {
      const validation = {
        validationReportId: `mfw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        frameworkId: null,
        errors: ["Marketing module not found"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: MARKETING_METADATA_VERSION,
      };
      return this.metadataGenerator.buildRunReport({
        action: "activate",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    this.lifecycle.initialize(this.registry, marketingModuleIdentifier);
    const result = this.lifecycle.activate(this.registry, marketingModuleIdentifier);
    const record = result.record;
    const validation = this.validationEngine.validateRecord(record!, config);
    if (!result.ok) {
      validation.decision = "fail";
      validation.errors.push(result.error ?? "Activation failed");
    } else if (record) {
      const cred = this.credentialAdapter.validateCredentials(
        {
          marketingModuleIdentifier,
          method: record.authenticationMethod,
          credentialRef: record.credentialRefPresent
            ? `vault://${marketingModuleIdentifier}`
            : null,
        },
        config,
      );
      if (!cred.validated && record.authenticationMethod !== "none") {
        validation.decision = "fail";
        validation.errors.push("Credential validation failed during activation");
        this.lifecycle.transition(this.registry, marketingModuleIdentifier, "failed");
      }
    }

    return this.metadataGenerator.buildRunReport({
      action: "activate",
      records: record ? [record] : [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  suspendMarketingModule(
    marketingModuleIdentifier: string,
    config: MarketingFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.suspend(this.registry, marketingModuleIdentifier);
    const validation = this.validationEngine.validateRecord(
      result.record ?? ({ frameworkId: "" } as MarketingFrameworkRecord),
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

  shutdownMarketingModule(
    marketingModuleIdentifier: string,
    config: MarketingFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.shutdown(this.registry, marketingModuleIdentifier);
    const validation = this.validationEngine.validateRecord(
      result.record ?? ({ frameworkId: "" } as MarketingFrameworkRecord),
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

  routeMarketingEvent(
    input: RouteMarketingEventInput,
    config: MarketingFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    try {
      const routed = this.eventRouter.routeEvent(input, config);
      const record = this.registry.get(input.marketingModuleIdentifier);
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
        validationReportId: `mfw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        frameworkId: null,
        errors: [error instanceof Error ? error.message : "Event routing failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: MARKETING_METADATA_VERSION,
      };
      return this.metadataGenerator.buildRunReport({
        action: "route_event",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  abstractMarketingData(
    input: AbstractMarketingDataInput,
    config: MarketingFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    try {
      this.dataAbstraction.abstractData(input, config);
      const record = this.registry.get(input.marketingModuleIdentifier);
      const validation = this.validationEngine.validateRecord(record!, config);
      return this.metadataGenerator.buildRunReport({
        action: "abstract_data",
        records: record ? [record] : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = {
        validationReportId: `mfw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        frameworkId: null,
        errors: [error instanceof Error ? error.message : "Data abstraction failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: MARKETING_METADATA_VERSION,
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
    input: RunDiagnosticsInput,
    config: MarketingFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const modules = input.marketingModuleIdentifier
      ? [this.registry.get(input.marketingModuleIdentifier)].filter(Boolean)
      : this.registry.list();

    const records = modules as MarketingFrameworkRecord[];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const record of records) {
      if (record.healthStatus === "failed") {
        warnings.push(`${record.marketingModuleIdentifier}: health failed`);
      }
      if (record.operationalState === "registered") {
        warnings.push(`${record.marketingModuleIdentifier}: not initialized`);
      }
    }

    if (records.length === 0) {
      errors.push(input.marketingModuleIdentifier ? "Module not found" : "No modules registered");
    }

    const validation = {
      validationReportId: `mfw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: (errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass") as
        | "pass"
        | "partial"
        | "fail",
      frameworkId: records[0]?.frameworkId ?? null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MARKETING_METADATA_VERSION,
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
