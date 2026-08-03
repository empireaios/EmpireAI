import type { LaunchPlanWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type LaunchPlanWorkerDependencies,
} from "./integrations.js";
import { appendLpwLog } from "./lpw-logging.js";
import {
  INTEGRATION_TARGETS,
  LAUNCH_PLAN_WORKER_ID,
  LPW_CAPABILITIES,
  LPW_METADATA_VERSION,
} from "./paths.js";
import { PlanBuilder } from "./plan-builder.js";
import { PlanStore } from "./plan-store.js";
import { HealthMonitor, PlanValidator, RecoveryManager } from "./plan-validator.js";
import type {
  IntegrationHandshake,
  LaunchPlan,
  LaunchPlanWorkerCatalog,
  LaunchPlanWorkerEngineRecord,
  LaunchPlanWorkerInput,
  LaunchPlanWorkerRunReport,
  OperationalState,
} from "./types.js";

export class PlanManager {
  private engineRecord: LaunchPlanWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: LaunchPlanWorkerCatalog | null = null;
  private readonly store = new PlanStore();
  private readonly builder = new PlanBuilder();
  private readonly validator = new PlanValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingBlueprint: LaunchPlanWorkerInput["businessBlueprint"] = null;

  bindIntegrations(deps: LaunchPlanWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: LaunchPlanWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedLaunchPlans);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getLaunchPlans() {
    return this.store.list();
  }

  getLatestLaunchPlanId() {
    return this.store.getLatestPlanId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: LaunchPlanWorkerConfiguration,
  ): LaunchPlanWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendLpwLog({
      event: "connect",
      details: `Launch Plan Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `lpw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Launch Plan Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: LPW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveBlueprint(input: LaunchPlanWorkerInput, config: LaunchPlanWorkerConfiguration) {
    this.pendingBlueprint = input.businessBlueprint ?? this.pendingBlueprint;
    return this.runPlan("receive_blueprint", input, config);
  }

  identifyStages(input: LaunchPlanWorkerInput, config: LaunchPlanWorkerConfiguration) {
    return this.runPlan("identify_stages", input, config);
  }

  defineMilestones(input: LaunchPlanWorkerInput, config: LaunchPlanWorkerConfiguration) {
    return this.runPlan("define_milestones", input, config);
  }

  defineTasks(input: LaunchPlanWorkerInput, config: LaunchPlanWorkerConfiguration) {
    return this.runPlan("define_tasks", input, config);
  }

  defineDependencies(input: LaunchPlanWorkerInput, config: LaunchPlanWorkerConfiguration) {
    return this.runPlan("define_dependencies", input, config);
  }

  defineCheckpoints(input: LaunchPlanWorkerInput, config: LaunchPlanWorkerConfiguration) {
    return this.runPlan("define_checkpoints", input, config);
  }

  defineBlockers(input: LaunchPlanWorkerInput, config: LaunchPlanWorkerConfiguration) {
    return this.runPlan("define_blockers", input, config);
  }

  produceLaunchPlan(input: LaunchPlanWorkerInput, config: LaunchPlanWorkerConfiguration) {
    return this.runPlan("produce_launch_plan", input, config);
  }

  submitLaunchPlan(input: LaunchPlanWorkerInput, config: LaunchPlanWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_launch_plan", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_launch_plan",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let plan =
      (input.launchPlanId ? this.store.get(input.launchPlanId) : null) ??
      this.store.list().at(-1) ??
      null;
    if (!plan) {
      const generated = this.runPlan("produce_launch_plan", input, config);
      plan = generated.latestLaunchPlan;
      if (!plan || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitLaunchPlan(plan);
    if (submission.submitted && submission.executiveReportId) {
      plan =
        this.store.markSubmitted(plan.launchPlanId, {
          executiveReportId: submission.executiveReportId,
          missionCoordinationRef: submission.missionCoordinationRef,
          approvalRouterRef: submission.approvalRouterRef,
        }) ?? plan;
    } else {
      const withRefs: LaunchPlan = {
        ...plan,
        missionCoordinationRef:
          submission.missionCoordinationRef ?? plan.missionCoordinationRef,
        approvalRouterRef: submission.approvalRouterRef ?? plan.approvalRouterRef,
      };
      plan = this.store.saveCanonical(withRefs, "submit_launch_plan_partial");
    }

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validatePlans(
      plan ? [plan] : null,
      { ...input, validated: input.validated ?? true },
      started,
      { requireApprovedBlueprint: false },
    );
    if (!submission.submitted) {
      validation.warnings.push(submission.details);
    }
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      plan,
    );
    appendLpwLog({
      event: "submit_launch_plan",
      details: `plan=${plan?.launchPlanId ?? "none"} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_launch_plan",
      this.getCatalog(),
      plan ? [plan] : [],
      plan,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: LaunchPlanWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const plans = this.store.list();
    const latest = plans[plans.length - 1] ?? null;
    const validation = this.validator.validatePlans(
      plans.length ? plans : null,
      { validated: true },
      started,
      { requireApprovedBlueprint: false },
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), plans, latest, validation, started);
  }

  validate(input: LaunchPlanWorkerInput, config: LaunchPlanWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const plans = this.store.list();
    const latest = plans[plans.length - 1] ?? null;
    const validation = this.validator.validatePlans(
      plans.length ? plans : null,
      { ...input, validated: input.validated ?? true },
      started,
      { requireApprovedBlueprint: false },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("validate", this.getCatalog(), plans, latest, validation, started);
  }

  diagnostics(config: LaunchPlanWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Launch Plan Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendLpwLog({ event: "diagnostics", details: `plans=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runPlan(
    action: LaunchPlanWorkerRunReport["action"],
    input: LaunchPlanWorkerInput,
    config: LaunchPlanWorkerConfiguration,
  ): LaunchPlanWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.planningRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Launch Plan Worker is disabled"
          : "Planning rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const merged: LaunchPlanWorkerInput = {
      ...input,
      businessBlueprint: input.businessBlueprint ?? this.pendingBlueprint,
    };
    if (merged.businessBlueprint) this.pendingBlueprint = merged.businessBlueprint;

    if (!merged.businessBlueprint) {
      return this.disabled(
        action,
        config,
        "Launch planning requires an approved Business Blueprint from Q2-06",
      );
    }

    if (config.requireApprovedBlueprint && merged.blueprintApproved === false) {
      return this.disabled(
        action,
        config,
        "Launch Plan Worker requires an approved Business Blueprint (blueprintApproved must not be false)",
      );
    }

    if (
      !merged.businessBlueprint.blueprintId &&
      !merged.businessBlueprintId &&
      action !== "receive_blueprint"
    ) {
      /* still allow planning with partial blueprint fields, builder synthesizes id */
    }

    const plan = this.builder.build(merged, config);
    this.store.saveCanonical(plan, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validatePlans(
      [plan],
      { ...merged, validated: merged.validated ?? true },
      started,
      { requireApprovedBlueprint: config.requireApprovedBlueprint },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      plan,
    );
    appendLpwLog({
      event: action,
      details: `plan=${plan.launchPlanId} stages=${plan.launchStages.length} tasks=${plan.tasks.length}`,
    });
    return this.report(action, this.getCatalog(), [plan], plan, validation, started);
  }

  private boundaryFail(
    action: LaunchPlanWorkerRunReport["action"],
    input: LaunchPlanWorkerInput,
    config: LaunchPlanWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validatePlans(null, input, started, {
      requireApprovedBlueprint: false,
    });
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: LaunchPlanWorkerRunReport["action"],
    config: LaunchPlanWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: LaunchPlanWorkerInput) {
    return (
      input.executeLaunchTasks === true ||
      input.assignWorkersDirectly === true ||
      input.createBusinessAssets === true ||
      input.connectExternalAccounts === true ||
      input.launchBusiness === true ||
      input.approveLaunch === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ208OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: LaunchPlanWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: LaunchPlan | null = null,
  ) {
    const plan = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `lpw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: LAUNCH_PLAN_WORKER_ID,
      engineVersion: "PILLOW-LPW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...LPW_CAPABILITIES],
      totalLaunchPlans: this.store.count(),
      lastBusinessType: plan?.businessType ?? null,
      lastLaunchPlanId: plan?.launchPlanId ?? this.store.getLatestPlanId(),
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: LPW_METADATA_VERSION,
    };
  }

  private report(
    action: LaunchPlanWorkerRunReport["action"],
    catalog: LaunchPlanWorkerCatalog | null,
    launchPlans: LaunchPlan[],
    latestLaunchPlan: LaunchPlan | null,
    validation: LaunchPlanWorkerRunReport["validation"],
    started: number,
  ): LaunchPlanWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      launchPlanRunReportId: `lpw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      launchPlans,
      latestLaunchPlan,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: LPW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: LaunchPlanWorkerCatalog): LaunchPlanWorkerCatalog {
  return {
    ...catalog,
    launchPlans: catalog.launchPlans.map((plan) => ({
      ...plan,
      launchStages: plan.launchStages.map((s) => ({
        ...s,
        dependsOnStages: [...s.dependsOnStages],
        derivedFrom: [...s.derivedFrom],
      })),
      milestones: plan.milestones.map((m) => ({
        ...m,
        measurableCriteria: [...m.measurableCriteria],
        dependsOn: [...m.dependsOn],
      })),
      tasks: plan.tasks.map((t) => ({
        ...t,
        dependsOn: [...t.dependsOn],
        requiredTools: [...t.requiredTools],
      })),
      dependencies: plan.dependencies.map((d) => ({ ...d })),
      requiredWorkforce: plan.requiredWorkforce.map((w) => ({
        ...w,
        skills: [...w.skills],
      })),
      requiredTools: [...plan.requiredTools],
      approvalCheckpoints: plan.approvalCheckpoints.map((c) => ({
        ...c,
        requiredEvidence: [...c.requiredEvidence],
      })),
      validationCheckpoints: plan.validationCheckpoints.map((c) => ({
        ...c,
        requiredEvidence: [...c.requiredEvidence],
      })),
      launchPrerequisites: [...plan.launchPrerequisites],
      blockers: plan.blockers.map((b) => ({ ...b, blocks: [...b.blocks] })),
      rollbackConditions: plan.rollbackConditions.map((r) => ({ ...r })),
      completionCriteria: [...plan.completionCriteria],
      missingPrerequisites: [...plan.missingPrerequisites],
      preservedDecisions: [...plan.preservedDecisions],
      traceabilityRefs: [...plan.traceabilityRefs],
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
