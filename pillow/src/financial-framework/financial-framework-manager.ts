/** R3-01 — Financial Framework manager. */

import { FinancialModuleRegistry } from "./financial-module-registry.js";
import { FinancialLifecycleManager } from "./financial-lifecycle-manager.js";
import { FinancialConfigurationManager } from "./financial-configuration-manager.js";
import { FinancialCredentialAdapter } from "./financial-credential-adapter.js";
import { FinancialValidationEngine } from "./financial-validation-engine.js";
import { FinancialMetadataGenerator } from "./financial-metadata-generator.js";
import { FinancialRateLimitManager } from "./financial-rate-limit-manager.js";
import { FinancialEventRouter } from "./financial-event-router.js";
import { FinancialDataAbstractionLayer } from "./financial-data-abstraction.js";
import { FINANCIAL_METADATA_VERSION } from "./paths.js";
import type { FinancialFrameworkConfiguration } from "./configuration.js";
import type {
  AbstractFinancialDataInput,
  FrameworkRunReport,
  RegisterFinancialModuleInput,
  RouteFinancialEventInput,
  RunDiagnosticsInput,
  FinancialFrameworkRecord,
} from "./types.js";

export class FinancialFrameworkManager {
  private readonly registry = new FinancialModuleRegistry();
  private readonly lifecycle = new FinancialLifecycleManager();
  private readonly configManager = new FinancialConfigurationManager();
  private readonly credentialAdapter = new FinancialCredentialAdapter();
  private readonly validationEngine = new FinancialValidationEngine();
  private readonly metadataGenerator = new FinancialMetadataGenerator();
  private readonly rateLimitManager = new FinancialRateLimitManager();
  private readonly eventRouter: FinancialEventRouter;
  private readonly dataAbstraction: FinancialDataAbstractionLayer;

  constructor() {
    this.eventRouter = new FinancialEventRouter(
      this.registry,
      this.rateLimitManager,
      this.validationEngine,
    );
    this.dataAbstraction = new FinancialDataAbstractionLayer(this.registry);
  }

  getRegistry() {
    return this.registry;
  }

  getModules(): FinancialFrameworkRecord[] {
    return this.registry.list();
  }

  registerFinancialModule(
    input: RegisterFinancialModuleInput,
    config: FinancialFrameworkConfiguration,
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

    if (this.registry.get(merged.financialModuleIdentifier) && !input.forceRegister) {
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
      validation.errors.push("Maximum registered financial modules reached");
      return this.metadataGenerator.buildRunReport({
        action: "register",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const record = this.registry.register(merged);
    this.lifecycle.initialize(this.registry, merged.financialModuleIdentifier);
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

  activateFinancialModule(
    financialModuleIdentifier: string,
    config: FinancialFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const recordBefore = this.registry.get(financialModuleIdentifier);
    if (!recordBefore) {
      const validation = {
        validationReportId: `ff-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        frameworkId: null,
        errors: ["Financial module not found"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: FINANCIAL_METADATA_VERSION,
      };
      return this.metadataGenerator.buildRunReport({
        action: "activate",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    this.lifecycle.initialize(this.registry, financialModuleIdentifier);
    const result = this.lifecycle.activate(this.registry, financialModuleIdentifier);
    const record = result.record;
    const validation = this.validationEngine.validateRecord(record!, config);
    if (!result.ok) {
      validation.decision = "fail";
      validation.errors.push(result.error ?? "Activation failed");
    } else if (record) {
      const cred = this.credentialAdapter.validateCredentials(
        {
          financialModuleIdentifier,
          method: record.authenticationMethod,
          credentialRef: record.credentialRefPresent
            ? `vault://${financialModuleIdentifier}`
            : null,
        },
        config,
      );
      if (!cred.validated && record.authenticationMethod !== "none") {
        validation.decision = "fail";
        validation.errors.push("Credential validation failed during activation");
        this.lifecycle.transition(this.registry, financialModuleIdentifier, "failed");
      }
    }

    return this.metadataGenerator.buildRunReport({
      action: "activate",
      records: record ? [record] : [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  suspendFinancialModule(
    financialModuleIdentifier: string,
    config: FinancialFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.suspend(this.registry, financialModuleIdentifier);
    const validation = this.validationEngine.validateRecord(
      result.record ?? ({ frameworkId: "" } as FinancialFrameworkRecord),
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

  shutdownFinancialModule(
    financialModuleIdentifier: string,
    config: FinancialFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.shutdown(this.registry, financialModuleIdentifier);
    const validation = this.validationEngine.validateRecord(
      result.record ?? ({ frameworkId: "" } as FinancialFrameworkRecord),
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

  routeFinancialEvent(
    input: RouteFinancialEventInput,
    config: FinancialFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    try {
      const routed = this.eventRouter.routeEvent(input, config);
      const record = this.registry.get(input.financialModuleIdentifier);
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
        validationReportId: `ff-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        frameworkId: null,
        errors: [error instanceof Error ? error.message : "Event routing failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: FINANCIAL_METADATA_VERSION,
      };
      return this.metadataGenerator.buildRunReport({
        action: "route_event",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  abstractFinancialData(
    input: AbstractFinancialDataInput,
    config: FinancialFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    try {
      this.dataAbstraction.abstractData(input, config);
      const record = this.registry.get(input.financialModuleIdentifier);
      const validation = this.validationEngine.validateRecord(record!, config);
      return this.metadataGenerator.buildRunReport({
        action: "abstract_data",
        records: record ? [record] : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = {
        validationReportId: `ff-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        frameworkId: null,
        errors: [error instanceof Error ? error.message : "Data abstraction failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: FINANCIAL_METADATA_VERSION,
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
    config: FinancialFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const modules = input.financialModuleIdentifier
      ? [this.registry.get(input.financialModuleIdentifier)].filter(Boolean)
      : this.registry.list();

    const records = modules as FinancialFrameworkRecord[];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const record of records) {
      if (record.healthStatus === "failed") {
        warnings.push(`${record.financialModuleIdentifier}: health failed`);
      }
      if (record.operationalState === "registered") {
        warnings.push(`${record.financialModuleIdentifier}: not initialized`);
      }
    }

    if (records.length === 0) {
      errors.push(input.financialModuleIdentifier ? "Module not found" : "No modules registered");
    }

    const validation = {
      validationReportId: `ff-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: (errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass") as
        | "pass"
        | "partial"
        | "fail",
      frameworkId: records[0]?.frameworkId ?? null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FINANCIAL_METADATA_VERSION,
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
