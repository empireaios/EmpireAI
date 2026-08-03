import type { ExecutivePlannerConfiguration } from "./configuration.js";
import { appendEpLog } from "./ep-logging.js";
import { ExecutionPlanBuilder } from "./execution-plan-builder.js";
import { ObjectiveAnalyzer } from "./objective-analyzer.js";
import {
  EP_CAPABILITIES,
  EP_METADATA_VERSION,
  EXECUTIVE_PLANNER_ID,
} from "./paths.js";
import {
  HealthMonitor,
  PlanMetadataGenerator,
  PlanValidator,
  RecoveryManager,
} from "./plan-validator.js";
import type {
  ExecutionPlan,
  ExecutivePlannerEngineRecord,
  ExecutivePlannerInput,
  ExecutivePlannerRunReport,
  OperationalState,
} from "./types.js";

export class ExecutivePlannerManager {
  private engineRecord: ExecutivePlannerEngineRecord | null = null;
  private plans: ExecutionPlan[] = [];
  private readonly analyzer = new ObjectiveAnalyzer();
  private readonly builder = new ExecutionPlanBuilder();
  private readonly validator = new PlanValidator();
  private readonly metadata = new PlanMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getPlans() {
    return this.plans.map((p) => ({
      ...p,
      assumptions: [...p.assumptions],
      constraints: [...p.constraints],
      priorities: [...p.priorities],
      risks: [...p.risks],
      dependencies: [...p.dependencies],
      requiredWorkforceCategories: [...p.requiredWorkforceCategories],
      executionStages: p.executionStages.map((s) => ({ ...s, expectedOutcomes: [...s.expectedOutcomes] })),
      expectedDeliverables: [...p.expectedDeliverables],
      approvalRequirements: p.approvalRequirements.map((a) => ({ ...a })),
      successCriteria: [...p.successCriteria],
    }));
  }

  getLatestPlan() {
    const plans = this.getPlans();
    return plans[plans.length - 1] ?? null;
  }

  connect(_input: Record<string, unknown>, config: ExecutivePlannerConfiguration): ExecutivePlannerRunReport {
    const started = Date.now();
    this.ensureRecord("connected", config);
    appendEpLog({ event: "connect", details: "Executive Planner connected; planning-only mode" });
    return this.report("connect", [], {
      validationReportId: `ep-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Executive Planner is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: EP_METADATA_VERSION,
    }, started);
  }

  submitObjective(input: ExecutivePlannerInput, config: ExecutivePlannerConfiguration): ExecutivePlannerRunReport {
    return this.producePlan("submit_objective", input, config);
  }

  analyzeObjective(input: ExecutivePlannerInput, config: ExecutivePlannerConfiguration): ExecutivePlannerRunReport {
    return this.producePlan("analyze_objective", input, config);
  }

  produceExecutionPlan(input: ExecutivePlannerInput, config: ExecutivePlannerConfiguration): ExecutivePlannerRunReport {
    return this.producePlan("produce_execution_plan", input, config);
  }

  identifyWorkforceCategories(input: ExecutivePlannerInput, config: ExecutivePlannerConfiguration): ExecutivePlannerRunReport {
    return this.producePlan("identify_workforce_categories", input, config);
  }

  validatePlan(input: ExecutivePlannerInput, config: ExecutivePlannerConfiguration): ExecutivePlannerRunReport {
    const latest = this.plans[this.plans.length - 1] ?? null;
    const started = Date.now();
    this.ensureRecord("active", config);
    const validation = this.validator.validatePlan(latest, input.objective ? input : { ...input, objective: latest?.objectiveSummary ?? "" }, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    appendEpLog({ event: "validate_plan", details: `decision=${validation.decision}` });
    return this.report("validate_plan", latest ? [latest] : [], validation, started);
  }

  diagnostics(config: ExecutivePlannerConfiguration): ExecutivePlannerRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const latest = this.plans[this.plans.length - 1] ?? null;
    const validation = latest
      ? this.validator.validatePlan(latest, { objective: latest.objectiveSummary, validated: true }, started)
      : {
          validationReportId: `ep-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Executive Planner is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: EP_METADATA_VERSION,
        };
    appendEpLog({
      event: "health_information",
      details: `plans=${this.plans.length}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report("diagnostics", latest ? [latest] : [], validation, started);
  }

  private producePlan(
    action: ExecutivePlannerRunReport["action"],
    input: ExecutivePlannerInput,
    config: ExecutivePlannerConfiguration,
  ): ExecutivePlannerRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    appendEpLog({ event: "analyze_objective", details: `action=${action}; objectiveLength=${input.objective?.length ?? 0}` });

    const decision = this.validator.decide(input);
    if (decision === "fail" || !config.enabled || !config.planningRulesEnabled) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validatePlan(null, input, started);
      appendEpLog({ event: "validation_failure", details: `action=${action}; errors=${validation.errors.join("|")}` });
      return this.report(action, [], validation, started);
    }

    const analysis = this.analyzer.analyze(input);
    const status = decision === "partial" ? "partial" : "passed";
    const plan = this.builder.build(analysis, config, status);
    this.plans.push(plan);
    this.ensureRecord("active", config);
    const validation = this.validator.validatePlan(plan, input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    appendEpLog({
      event: "produce_execution_plan",
      details: `planId=${plan.planId}; categories=${plan.requiredWorkforceCategories.length}; stages=${plan.executionStages.length}; workersAssigned=false`,
    });
    this.metadata.generate(this.plans.length);
    return this.report(action, [plan], validation, started);
  }

  private ensureRecord(state: OperationalState, config: ExecutivePlannerConfiguration) {
    const decision = this.plans[this.plans.length - 1]?.validationStatus ?? "pending";
    const mapped =
      decision === "passed" ? "passed" : decision === "partial" ? "partial" : decision === "failed" ? "failed" : "pending";
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `ep-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EXECUTIVE_PLANNER_ID,
      engineVersion: "PILLOW-EP-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed" ? "pass" : mapped === "partial" ? "partial" : mapped === "failed" ? "fail" : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...EP_CAPABILITIES],
      totalPlans: this.plans.length,
      metadataVersion: EP_METADATA_VERSION,
    };
  }

  private report(
    action: ExecutivePlannerRunReport["action"],
    plans: ExecutionPlan[],
    validation: ExecutivePlannerRunReport["validation"],
    started: number,
  ): ExecutivePlannerRunReport {
    return {
      plannerRunReportId: `ep-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      plans: plans.map((p) => ({ ...p })),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: EP_METADATA_VERSION,
    };
  }
}
