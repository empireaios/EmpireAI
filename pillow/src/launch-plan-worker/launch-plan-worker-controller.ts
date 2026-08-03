import type { LaunchPlanWorkerConfiguration } from "./configuration.js";
import type { LaunchPlanWorkerDependencies } from "./integrations.js";
import { PlanManager } from "./plan-manager.js";
import type {
  EngineStatus,
  LaunchPlanWorkerInput,
  LaunchPlanWorkerRunReport,
} from "./types.js";

export class LaunchPlanWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: LaunchPlanWorkerRunReport | null = null;

  constructor(
    private readonly manager: PlanManager,
    private readonly config: LaunchPlanWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: LaunchPlanWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      businessTypes: [...this.config.businessTypes],
      stageCatalog: [...this.config.stageCatalog],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedLaunchPlans: this.config.seedLaunchPlans.map((plan) => ({
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
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  receiveBlueprint(input: LaunchPlanWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveBlueprint(input, this.config));
  }

  identifyStages(input: LaunchPlanWorkerInput = {}) {
    this.status = "planning";
    return this.finish(this.manager.identifyStages(input, this.config));
  }

  defineMilestones(input: LaunchPlanWorkerInput = {}) {
    this.status = "planning";
    return this.finish(this.manager.defineMilestones(input, this.config));
  }

  defineTasks(input: LaunchPlanWorkerInput = {}) {
    this.status = "planning";
    return this.finish(this.manager.defineTasks(input, this.config));
  }

  defineDependencies(input: LaunchPlanWorkerInput = {}) {
    this.status = "planning";
    return this.finish(this.manager.defineDependencies(input, this.config));
  }

  defineCheckpoints(input: LaunchPlanWorkerInput = {}) {
    this.status = "planning";
    return this.finish(this.manager.defineCheckpoints(input, this.config));
  }

  defineBlockers(input: LaunchPlanWorkerInput = {}) {
    this.status = "planning";
    return this.finish(this.manager.defineBlockers(input, this.config));
  }

  produceLaunchPlan(input: LaunchPlanWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceLaunchPlan(input, this.config));
  }

  submitLaunchPlan(input: LaunchPlanWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitLaunchPlan(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: LaunchPlanWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: LaunchPlanWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
