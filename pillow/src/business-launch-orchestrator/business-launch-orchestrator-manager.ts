/** X1-11 — Business Launch Orchestrator Manager. */

import { createHash } from "node:crypto";
import type { CompanyFactoryFrameworkEngine } from "../company-factory-framework/engine.js";
import type { BrandCreationEngine } from "../brand-creation-engine/engine.js";
import type { DomainDigitalAssetPlanner } from "../domain-digital-asset-planner/engine.js";
import type { StoreGenerationEngine } from "../store-generation-engine/engine.js";
import type { PricingStrategyEngine } from "../pricing-strategy-engine/engine.js";
import type { LaunchReadinessValidator } from "../launch-readiness-validator/engine.js";
import { BLO_METADATA_VERSION, BUSINESS_LAUNCH_ORCHESTRATOR_ID } from "./paths.js";
import { appendBloLog } from "./blo-logging.js";
import { LaunchRecordStore } from "./launch-record-store.js";
import { LaunchWorkflowEngine } from "./launch-workflow-engine.js";
import { LaunchDependencyManager } from "./launch-dependency-manager.js";
import { LaunchExecutionEngine } from "./launch-execution-engine.js";
import { LaunchProgressTracker } from "./launch-progress-tracker.js";
import { LaunchRecoveryEngine } from "./launch-recovery-engine.js";
import { LaunchValidator } from "./launch-validator.js";
import { LaunchMetadataGenerator } from "./launch-metadata-generator.js";
import type { BusinessLaunchOrchestratorConfiguration } from "./configuration.js";
import type {
  BusinessLaunchRecord,
  ConnectBusinessLaunchOrchestratorInput,
  LaunchActionInput,
  LaunchOrchestratorEngineRecord,
  LaunchOrchestratorRunReport,
  OrchestrateLaunchInput,
} from "./types.js";

export type BusinessLaunchOrchestratorDependencies = {
  companyFactoryFramework: CompanyFactoryFrameworkEngine | null;
  brandCreationEngine: BrandCreationEngine | null;
  domainDigitalAssetPlanner: DomainDigitalAssetPlanner | null;
  storeGenerationEngine: StoreGenerationEngine | null;
  pricingStrategyEngine: PricingStrategyEngine | null;
  launchReadinessValidator: LaunchReadinessValidator | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class BusinessLaunchOrchestratorManager {
  private engineRecord: LaunchOrchestratorEngineRecord | null = null;
  private readonly store = new LaunchRecordStore();
  private readonly workflow = new LaunchWorkflowEngine();
  private readonly dependencies = new LaunchDependencyManager();
  private readonly execution = new LaunchExecutionEngine();
  private readonly progress = new LaunchProgressTracker();
  private readonly launchRecovery = new LaunchRecoveryEngine();
  private readonly validator = new LaunchValidator();
  private readonly metadataGenerator = new LaunchMetadataGenerator();
  private launchRecoveryAttempts = 0;

  constructor(private readonly deps: BusinessLaunchOrchestratorDependencies) {}

  getEngineRecord(): LaunchOrchestratorEngineRecord | null {
    return this.engineRecord;
  }

  getLaunchRecords(): BusinessLaunchRecord[] {
    return this.store.list();
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.launchRecoveryAttempts = 0;
    this.store.resetForTesting();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): LaunchOrchestratorEngineRecord["dependencyPresence"] {
    return {
      companyFactoryFramework: this.deps.companyFactoryFramework
        ? this.probe(() => this.deps.companyFactoryFramework!.getState())
        : false,
      brandCreationEngine: this.deps.brandCreationEngine
        ? this.probe(() => this.deps.brandCreationEngine!.getState())
        : false,
      domainDigitalAssetPlanner: this.deps.domainDigitalAssetPlanner
        ? this.probe(() => this.deps.domainDigitalAssetPlanner!.getState())
        : false,
      storeGenerationEngine: this.deps.storeGenerationEngine
        ? this.probe(() => this.deps.storeGenerationEngine!.getState())
        : false,
      pricingStrategyEngine: this.deps.pricingStrategyEngine
        ? this.probe(() => this.deps.pricingStrategyEngine!.getState())
        : false,
      launchReadinessValidator: this.deps.launchReadinessValidator
        ? this.probe(() => this.deps.launchReadinessValidator!.getState())
        : false,
    };
  }

  private requireConnected(): LaunchOrchestratorEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Business Launch Orchestrator not connected — call connectBusinessLaunchOrchestrator first",
      );
    }
    return this.engineRecord;
  }

  private resolveContext(input: OrchestrateLaunchInput | LaunchActionInput): {
    companyReference: string;
    readinessReference: string;
    brandReference: string;
    digitalAssetPlanReference: string;
    storefrontReference: string;
    pricingReference: string;
    readinessCertified: boolean;
    industry: string;
    dependencySnapshot: ReturnType<LaunchDependencyManager["resolve"]>;
  } {
    const industry = input.industry?.trim() || "general-structural";

    const readiness = safe(() => {
      const records = this.deps.launchReadinessValidator?.getReadinessRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);
    const brand = safe(() => {
      const records = this.deps.brandCreationEngine?.getBrandRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);
    const plan = safe(() => {
      const records = this.deps.domainDigitalAssetPlanner?.getPlanRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);
    const store = safe(() => {
      const records = this.deps.storeGenerationEngine?.getStorefrontRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);
    const pricing = safe(() => {
      const records = this.deps.pricingStrategyEngine?.getPricingRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);

    const readinessCertified = Boolean(
      readiness?.launchCertified && readiness.validationStatus !== "failed",
    );
    const readinessReference =
      input.readinessReference?.trim() ||
      readiness?.launchReadinessId ||
      `structural://readiness/${industry}`;
    const brandReference =
      input.brandReference?.trim() || brand?.brandId || `structural://brand/${industry}`;
    const digitalAssetPlanReference =
      input.digitalAssetPlanReference?.trim() ||
      plan?.digitalAssetPlanId ||
      `structural://domain-plan/${industry}`;
    const storefrontReference =
      input.storefrontReference?.trim() ||
      store?.storefrontId ||
      `structural://storefront/${industry}`;
    const pricingReference =
      input.pricingReference?.trim() ||
      pricing?.pricingRecordId ||
      `structural://pricing/${industry}`;
    const companyReference =
      input.companyReference?.trim() ||
      readiness?.companyReference ||
      store?.companyReference ||
      brand?.companyName ||
      `structural://company/${industry}`;

    const dependencySnapshot = this.dependencies.resolve({
      readinessCertified,
      hasBrand: Boolean(brand) || Boolean(input.brandReference),
      hasDigitalPlan: Boolean(plan) || Boolean(input.digitalAssetPlanReference),
      hasStorefront: Boolean(store) || Boolean(input.storefrontReference),
      hasPricing: Boolean(pricing) || Boolean(input.pricingReference),
    });

    return {
      companyReference,
      readinessReference,
      brandReference,
      digitalAssetPlanReference,
      storefrontReference,
      pricingReference,
      readinessCertified,
      industry,
      dependencySnapshot,
    };
  }

  registerWithFramework(
    config: BusinessLaunchOrchestratorConfiguration,
  ): { frameworkModuleId: string | null; validation: LaunchOrchestratorRunReport["validation"] } {
    if (!this.deps.companyFactoryFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.companyFactoryFramework.registerCompanyModule({
      definition: {
        companyModuleIdentifier: BUSINESS_LAUNCH_ORCHESTRATOR_ID,
        moduleVersion: BLO_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X1-11",
        authenticationMethod: "none",
        credentialRef: "vault://business-launch-orchestrator",
        apiEndpointConfig: {
          baseUrl: "internal://business-launch-orchestrator",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["launch.orchestrated", "launch.recovered", "launch.failed"],
          maxEventsPerMinute: 60,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: true,
          requestsPerMinute: 60,
          burstLimit: 10,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "company_module_registration",
          "company_module_activation",
          "company_event_routing",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.companyFactoryFramework.activateCompanyModule(BUSINESS_LAUNCH_ORCHESTRATOR_ID);
    }

    appendBloLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Business Launch Orchestrator with Company Factory Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `blo-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: BLO_METADATA_VERSION,
      },
    };
  }

  connectBusinessLaunchOrchestrator(
    _input: ConnectBusinessLaunchOrchestratorInput,
    config: BusinessLaunchOrchestratorConfiguration,
  ): LaunchOrchestratorRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: frameworkReg.validation.decision === "fail" ? "failed" : "active",
      validationStatus:
        frameworkReg.validation.decision === "fail"
          ? "failed"
          : frameworkReg.validation.decision === "partial"
            ? "partial"
            : "passed",
      dependencyPresence: deps,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (frameworkReg.validation.warnings.length > 0) {
      validation.warnings.push(...frameworkReg.validation.warnings);
      if (validation.decision === "pass") validation.decision = "partial";
    }

    appendBloLog({
      event: "engine_connect",
      level: "info",
      details: `Business Launch Orchestrator connected · deps=${Object.values(deps).filter(Boolean).length}/6`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      launchRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  orchestrateLaunch(
    input: OrchestrateLaunchInput,
    config: BusinessLaunchOrchestratorConfiguration,
  ): LaunchOrchestratorRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const ctx = this.resolveContext(input);
    const validation = this.validator.validateOrchestrateInput(
      input,
      config,
      ctx.readinessCertified,
    );
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "orchestrate_launch",
        engineRecord: engine,
        launchRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.store.list().length >= config.maxLaunchesPerCycle) {
      return this.metadataGenerator.buildRunReport({
        action: "orchestrate_launch",
        engineRecord: engine,
        launchRecords: [],
        validation: {
          validationReportId: `blo-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [`Max launches per cycle reached (${config.maxLaunchesPerCycle})`],
          warnings: [],
          durationMs: 0,
          metadataVersion: BLO_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const fingerprint = createHash("sha256")
      .update(
        `${ctx.companyReference}|${ctx.readinessReference}|${ctx.storefrontReference}|${ctx.pricingReference}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);
    if (this.store.hasFingerprint(fingerprint)) {
      return this.metadataGenerator.buildRunReport({
        action: "orchestrate_launch",
        engineRecord: engine,
        launchRecords: [],
        validation: {
          validationReportId: `blo-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Duplicate launch orchestration detected — blocked"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: BLO_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    let stage = this.workflow.initialStage();
    const depsOk =
      !config.dependencyRulesEnabled || ctx.dependencySnapshot.allSatisfied;

    if (config.launchWorkflowRulesEnabled && depsOk) {
      // Advance through workflow stages structurally (no external I/O).
      while (stage !== "completed" && stage !== "failed") {
        const next = this.workflow.nextStage(stage);
        stage = this.execution.advanceStage(stage, next, true);
        if (stage === next && next === "completed") break;
        if (stage === "go_live") {
          stage = "completed";
          break;
        }
      }
    }

    const launchProgress = this.workflow.stageProgress(stage);
    const launchStatus = this.execution.deriveStatus({
      stage,
      dependencies: ctx.dependencySnapshot,
      failed: !depsOk && !ctx.readinessCertified,
    });
    const recoveryStatus =
      launchStatus === "blocked" || launchStatus === "failed" ? "pending" : "not_required";
    const launchWorkflowReference = this.workflow.createWorkflowReference(
      ctx.companyReference.replace(/[^a-z0-9]+/gi, "-").toLowerCase(),
    );

    const record = this.store.create({
      companyReference: ctx.companyReference,
      launchWorkflowReference,
      readinessReference: ctx.readinessReference,
      brandReference: ctx.brandReference,
      digitalAssetPlanReference: ctx.digitalAssetPlanReference,
      storefrontReference: ctx.storefrontReference,
      pricingReference: ctx.pricingReference,
      currentLaunchStage: stage,
      launchProgress,
      launchStatus,
      recoveryStatus,
      dependencySummary: ctx.dependencySnapshot.summary,
      launchReportSummary: "pending",
      validationStatus: "pending",
    });
    record.launchReportSummary = this.metadataGenerator.buildLaunchReport(record);
    record.launchedWithoutReadinessValidation = false;
    record.structuralSignalOnly = true;
    record.fabricatedLaunchFacts = false;

    const recordValidation = this.validator.validateLaunchRecord(record);
    record.validationStatus =
      recordValidation.decision === "fail"
        ? "failed"
        : recordValidation.decision === "partial"
          ? "partial"
          : "passed";
    this.store.persist(record);

    appendBloLog({
      event: "launch_execution",
      level: "info",
      details: `Launch orchestrated · id=${record.launchId} · stage=${record.currentLaunchStage}`,
    });
    appendBloLog({
      event: "workflow_progress",
      level: "info",
      details: this.progress.track(
        record.currentLaunchStage,
        record.launchProgress,
        record.launchStatus,
      ),
    });
    appendBloLog({
      event: "dependency_resolution",
      level: "info",
      details: record.dependencySummary,
    });

    return this.metadataGenerator.buildRunReport({
      action: "orchestrate_launch",
      engineRecord: engine,
      launchRecords: [record],
      validation: recordValidation,
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(launchId?: string): BusinessLaunchRecord {
    if (launchId) {
      const found = this.store.get(launchId);
      if (!found) throw new Error(`Launch record not found: ${launchId}`);
      return found;
    }
    const all = this.store.list();
    if (all.length === 0) throw new Error("No launch records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: LaunchActionInput,
    config: BusinessLaunchOrchestratorConfiguration,
  ): BusinessLaunchRecord {
    try {
      return this.requireRecord(input.launchId);
    } catch {
      const created = this.orchestrateLaunch(
        {
          companyReference: input.companyReference,
          readinessReference: input.readinessReference,
          brandReference: input.brandReference,
          digitalAssetPlanReference: input.digitalAssetPlanReference,
          storefrontReference: input.storefrontReference,
          pricingReference: input.pricingReference,
          industry: input.industry,
          validated: true,
        },
        config,
      );
      return created.launchRecords[0]!;
    }
  }

  private actionPass(
    action: LaunchOrchestratorRunReport["action"],
    transform: (
      record: BusinessLaunchRecord,
      ctx: ReturnType<BusinessLaunchOrchestratorManager["resolveContext"]>,
      config: BusinessLaunchOrchestratorConfiguration,
    ) => BusinessLaunchRecord,
    input: LaunchActionInput,
    config: BusinessLaunchOrchestratorConfiguration,
    event: string,
  ): LaunchOrchestratorRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const ctx = this.resolveContext(input);
    let record = this.ensureRecord(input, config);
    record = transform(record, ctx, config);
    record.launchedWithoutReadinessValidation = false;
    record.structuralSignalOnly = true;
    record.fabricatedLaunchFacts = false;
    record.launchReportSummary = this.metadataGenerator.buildLaunchReport(record);
    this.store.persist(record);

    appendBloLog({
      event,
      level: "info",
      details: `${action} · id=${record.launchId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      launchRecords: [record],
      validation: this.validator.validateLaunchRecord(record),
      durationMs: Date.now() - started,
    });
  }

  executeLaunchWorkflow(
    input: LaunchActionInput,
    config: BusinessLaunchOrchestratorConfiguration,
  ): LaunchOrchestratorRunReport {
    if (!config.launchWorkflowRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "execute_launch_workflow",
        engineRecord: engine,
        launchRecords: [],
        validation: {
          validationReportId: `blo-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Launch workflow rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: BLO_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "execute_launch_workflow",
      (r, ctx) => {
        const next = this.workflow.nextStage(r.currentLaunchStage);
        const stage = this.execution.advanceStage(
          r.currentLaunchStage,
          next,
          ctx.dependencySnapshot.allSatisfied,
        );
        const progress = this.workflow.stageProgress(stage);
        const status = this.execution.deriveStatus({
          stage,
          dependencies: ctx.dependencySnapshot,
        });
        return {
          ...r,
          currentLaunchStage: stage,
          launchProgress: progress,
          launchStatus: status,
        };
      },
      input,
      config,
      "workflow_progress",
    );
  }

  manageLaunchStages(
    input: LaunchActionInput,
    config: BusinessLaunchOrchestratorConfiguration,
  ): LaunchOrchestratorRunReport {
    if (!config.launchWorkflowRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "manage_launch_stages",
        engineRecord: engine,
        launchRecords: [],
        validation: {
          validationReportId: `blo-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Launch workflow rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: BLO_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "manage_launch_stages",
      (r, ctx) => {
        const next = this.workflow.nextStage(r.currentLaunchStage);
        const stage = this.execution.advanceStage(
          r.currentLaunchStage,
          next,
          ctx.dependencySnapshot.allSatisfied,
        );
        return {
          ...r,
          currentLaunchStage: stage,
          launchProgress: this.workflow.stageProgress(stage),
          launchStatus: this.execution.deriveStatus({
            stage,
            dependencies: ctx.dependencySnapshot,
          }),
        };
      },
      input,
      config,
      "workflow_progress",
    );
  }

  coordinateDependencies(
    input: LaunchActionInput,
    config: BusinessLaunchOrchestratorConfiguration,
  ): LaunchOrchestratorRunReport {
    if (!config.dependencyRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "coordinate_dependencies",
        engineRecord: engine,
        launchRecords: [],
        validation: {
          validationReportId: `blo-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Dependency rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: BLO_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "coordinate_dependencies",
      (r, ctx) => ({
        ...r,
        dependencySummary: ctx.dependencySnapshot.summary,
        launchStatus: this.execution.deriveStatus({
          stage: r.currentLaunchStage,
          dependencies: ctx.dependencySnapshot,
        }),
      }),
      input,
      config,
      "dependency_resolution",
    );
  }

  trackLaunchProgress(
    input: LaunchActionInput,
    config: BusinessLaunchOrchestratorConfiguration,
  ): LaunchOrchestratorRunReport {
    return this.actionPass(
      "track_launch_progress",
      (r) => ({
        ...r,
        launchProgress: this.workflow.stageProgress(r.currentLaunchStage),
        launchReportSummary: this.progress.track(
          r.currentLaunchStage,
          this.workflow.stageProgress(r.currentLaunchStage),
          r.launchStatus,
        ),
      }),
      input,
      config,
      "workflow_progress",
    );
  }

  detectLaunchFailures(
    input: LaunchActionInput,
    config: BusinessLaunchOrchestratorConfiguration,
  ): LaunchOrchestratorRunReport {
    return this.actionPass(
      "detect_launch_failures",
      (r) => {
        const failure = this.progress.detectFailure(
          r.launchStatus,
          r.launchProgress,
          r.dependencySummary,
        );
        if (failure !== "none") {
          return {
            ...r,
            launchStatus: "failed",
            currentLaunchStage: "failed",
            recoveryStatus: "pending",
            launchReportSummary: `failure=${failure}`,
          };
        }
        return r;
      },
      input,
      config,
      "launch_failures",
    );
  }

  coordinateLaunchRecovery(
    input: LaunchActionInput,
    config: BusinessLaunchOrchestratorConfiguration,
  ): LaunchOrchestratorRunReport {
    if (!config.recoveryRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "coordinate_launch_recovery",
        engineRecord: engine,
        launchRecords: [],
        validation: {
          validationReportId: `blo-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Recovery rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: BLO_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "coordinate_launch_recovery",
      (r) => {
        const result = this.launchRecovery.coordinate({
          status: r.launchStatus,
          stage: r.currentLaunchStage,
          recoveryEnabled: config.recoveryRulesEnabled,
          attempts: this.launchRecoveryAttempts,
          maxAttempts: config.maxRetryAttempts,
        });
        if (result.recoveryStatus === "recovered") {
          this.launchRecoveryAttempts += 1;
        }
        return {
          ...r,
          recoveryStatus: result.recoveryStatus,
          launchStatus: result.launchStatus,
          currentLaunchStage: result.currentLaunchStage,
          launchProgress: this.workflow.stageProgress(result.currentLaunchStage),
          launchReportSummary: result.note,
        };
      },
      input,
      config,
      "recovery_execution",
    );
  }

  generateLaunchReport(
    input: LaunchActionInput,
    config: BusinessLaunchOrchestratorConfiguration,
  ): LaunchOrchestratorRunReport {
    return this.actionPass(
      "generate_launch_report",
      (r) => ({
        ...r,
        launchReportSummary: this.metadataGenerator.buildLaunchReport(r),
      }),
      input,
      config,
      "launch_execution",
    );
  }
}
