/** X3-01 — Autonomous Scaling Framework manager. */

import { ScalingModuleRegistry } from "./scaling-module-registry.js";
import { ScalingLifecycleManager } from "./scaling-lifecycle-manager.js";
import { ScalingConfigurationManager } from "./scaling-configuration-manager.js";
import { ScalingValidationEngine } from "./scaling-validation-engine.js";
import { ScalingMetadataGenerator } from "./scaling-metadata-generator.js";
import { ScalingEventRateLimitManager } from "./scaling-event-rate-limit-manager.js";
import { ScalingEventRouter } from "./scaling-event-router.js";
import { ScalingDataAbstractionLayer } from "./scaling-data-abstraction.js";
import { ASF_METADATA_VERSION } from "./paths.js";
import type { AutonomousScalingFrameworkConfiguration } from "./configuration.js";
import type {
  AbstractScalingDataInput,
  AutonomousScalingFrameworkRecord,
  ScalingFrameworkRunReport,
  RegisterScalingModuleInput,
  RouteScalingEventInput,
  RunScalingDiagnosticsInput,
} from "./types.js";

export class AutonomousScalingFrameworkManager {
  private readonly registry = new ScalingModuleRegistry();
  private readonly lifecycle = new ScalingLifecycleManager();
  private readonly configManager = new ScalingConfigurationManager();
  private readonly validationEngine = new ScalingValidationEngine();
  private readonly metadataGenerator = new ScalingMetadataGenerator();
  private readonly rateLimitManager = new ScalingEventRateLimitManager();
  private readonly eventRouter: ScalingEventRouter;
  private readonly dataAbstraction: ScalingDataAbstractionLayer;

  constructor() {
    this.eventRouter = new ScalingEventRouter(
      this.registry,
      this.rateLimitManager,
      this.validationEngine,
    );
    this.dataAbstraction = new ScalingDataAbstractionLayer(this.registry);
  }

  getRegistry() {
    return this.registry;
  }

  getModules(): AutonomousScalingFrameworkRecord[] {
    return this.registry.list();
  }

  registerScalingModule(
    input: RegisterScalingModuleInput,
    config: AutonomousScalingFrameworkConfiguration,
  ): ScalingFrameworkRunReport {
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

    if (this.registry.get(merged.scalingModuleIdentifier) && !input.forceRegister) {
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
      validation.errors.push("Maximum registered scaling modules reached");
      return this.metadataGenerator.buildRunReport({
        action: "register_module",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const record = this.registry.register(merged);
    this.lifecycle.initialize(this.registry, merged.scalingModuleIdentifier);
    const recordValidation = this.validationEngine.validateRecord(record, config);
    validation.scalingFrameworkId = record.scalingFrameworkId;
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

  activateScalingModule(
    scalingModuleIdentifier: string,
    config: AutonomousScalingFrameworkConfiguration,
  ): ScalingFrameworkRunReport {
    const started = Date.now();
    const recordBefore = this.registry.get(scalingModuleIdentifier);
    if (!recordBefore) {
      const validation = {
        validationReportId: `asf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        scalingFrameworkId: null,
        errors: ["Scaling module not found"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: ASF_METADATA_VERSION,
      };
      return this.metadataGenerator.buildRunReport({
        action: "activate",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    this.lifecycle.initialize(this.registry, scalingModuleIdentifier);
    const result = this.lifecycle.activate(this.registry, scalingModuleIdentifier);
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

  suspendScalingModule(
    scalingModuleIdentifier: string,
    config: AutonomousScalingFrameworkConfiguration,
  ): ScalingFrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.suspend(this.registry, scalingModuleIdentifier);
    const validation = this.validationEngine.validateRecord(
      result.record ?? ({ scalingFrameworkId: "asf-missing" } as AutonomousScalingFrameworkRecord),
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

  shutdownScalingModule(
    scalingModuleIdentifier: string,
    config: AutonomousScalingFrameworkConfiguration,
  ): ScalingFrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.shutdown(this.registry, scalingModuleIdentifier);
    const validation = this.validationEngine.validateRecord(
      result.record ?? ({ scalingFrameworkId: "asf-missing" } as AutonomousScalingFrameworkRecord),
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

  routeScalingEvent(
    input: RouteScalingEventInput,
    config: AutonomousScalingFrameworkConfiguration,
  ): ScalingFrameworkRunReport {
    const started = Date.now();
    try {
      const routed = this.eventRouter.routeEvent(input, config);
      const record = this.registry.get(input.scalingModuleIdentifier);
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
        validationReportId: `asf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        scalingFrameworkId: null,
        errors: [error instanceof Error ? error.message : "Event routing failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: ASF_METADATA_VERSION,
      };
      return this.metadataGenerator.buildRunReport({
        action: "route_event",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  abstractScalingData(
    input: AbstractScalingDataInput,
    config: AutonomousScalingFrameworkConfiguration,
  ): ScalingFrameworkRunReport {
    const started = Date.now();
    try {
      this.dataAbstraction.abstractData(input, config);
      const record = this.registry.get(input.scalingModuleIdentifier);
      const validation = this.validationEngine.validateRecord(record!, config);
      return this.metadataGenerator.buildRunReport({
        action: "abstract_data",
        records: record ? [record] : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = {
        validationReportId: `asf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        scalingFrameworkId: null,
        errors: [error instanceof Error ? error.message : "Data abstraction failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: ASF_METADATA_VERSION,
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
    input: RunScalingDiagnosticsInput,
    config: AutonomousScalingFrameworkConfiguration,
  ): ScalingFrameworkRunReport {
    const started = Date.now();
    const modules = input.scalingModuleIdentifier
      ? [this.registry.get(input.scalingModuleIdentifier)].filter(Boolean)
      : this.registry.list();

    const records = modules as AutonomousScalingFrameworkRecord[];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const record of records) {
      if (record.healthStatus === "failed") {
        warnings.push(`${record.scalingModuleIdentifier}: health failed`);
      }
      if (record.operationalState === "registered") {
        warnings.push(`${record.scalingModuleIdentifier}: not initialized`);
      }
    }

    if (records.length === 0) {
      errors.push(
        input.scalingModuleIdentifier ? "Module not found" : "No scaling modules registered",
      );
    }

    const validation = {
      validationReportId: `asf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: (errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass") as
        | "pass"
        | "partial"
        | "fail",
      scalingFrameworkId: records[0]?.scalingFrameworkId ?? null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ASF_METADATA_VERSION,
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
