import type { LaunchPlanWorkerConfiguration } from "./configuration.js";
import {
  LAUNCH_PLAN_VERSION,
  LAUNCH_PLAN_WORKER_IDENTITY,
  LPW_METADATA_VERSION,
} from "./paths.js";
import type {
  BlockerSpec,
  BusinessBlueprintInput,
  CheckpointSpec,
  IntegrationHandshake,
  LaunchDependency,
  LaunchMilestone,
  LaunchPlan,
  LaunchPlanWorkerCatalog,
  LaunchPlanWorkerInput,
  LaunchStage,
  LaunchTask,
  RequiredWorkforceSpec,
  RollbackCondition,
} from "./types.js";

/** Pure Launch Plan Worker helpers for Q2-07 — planning only. */
export class PlanBuilder {
  buildCatalog(
    config: LaunchPlanWorkerConfiguration,
    plans: LaunchPlan[],
    integrations: IntegrationHandshake[],
  ): LaunchPlanWorkerCatalog {
    return {
      planVersion: LAUNCH_PLAN_VERSION,
      workerId: config.workerId,
      launchPlans: plans.map(clonePlan),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: LPW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverExecuteLaunchTasks: true,
      neverAssignWorkersDirectly: true,
      neverCreateBusinessAssets: true,
      neverConnectExternalAccounts: true,
      neverLaunchBusiness: true,
      neverApproveLaunch: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  build(input: LaunchPlanWorkerInput, config: LaunchPlanWorkerConfiguration): LaunchPlan {
    planSequence += 1;
    const now = new Date().toISOString();
    const blueprint = input.businessBlueprint ?? {};
    const businessType = normalizeType(
      input.businessType || blueprint.businessType || "unknown",
    );
    const missionId =
      input.businessBuildMissionId?.trim() ||
      blueprint.businessBuildMissionId?.trim() ||
      `bbm-${Date.now()}-${planSequence}`;
    const blueprintId =
      input.businessBlueprintId?.trim() ||
      blueprint.blueprintId?.trim() ||
      `blueprint-missing-${planSequence}`;

    const launchStages = this.identifyLaunchStages(blueprint, businessType, config);
    const milestones = this.defineMilestones(launchStages, blueprint);
    const tasks = this.defineTasks(launchStages, blueprint, businessType);
    const dependencies = this.defineDependencies(launchStages, milestones, tasks, blueprint);
    const requiredWorkforce = this.defineWorkforce(blueprint, businessType);
    const requiredTools = this.defineTools(blueprint, businessType);
    const approvalCheckpoints = this.defineApprovalCheckpoints(launchStages, businessType);
    const validationCheckpoints = this.defineValidationCheckpoints(
      launchStages,
      blueprint,
      businessType,
    );
    const launchPrerequisites = this.definePrerequisites(blueprint, businessType);
    const blockers = this.defineBlockers(blueprint, launchStages, launchPrerequisites);
    const rollbackConditions = this.defineRollbackConditions(launchStages, businessType);
    const missingPrerequisites = this.identifyMissingPrerequisites(blueprint, launchPrerequisites);
    const completionCriteria = this.defineCompletionCriteria(milestones, validationCheckpoints);
    const preservedDecisions = unique([
      ...(blueprint.preservedDecisions ?? []),
      blueprint.approvedOpportunityRecommendation
        ? `opportunity_recommendation=${blueprint.approvedOpportunityRecommendation}`
        : "",
      blueprint.overallOpportunityScore != null
        ? `overall_opportunity_score=${blueprint.overallOpportunityScore}`
        : "",
      `business_type=${businessType}`,
    ]);
    const traceabilityRefs = unique([
      `q2-06:business_blueprint:${blueprintId}`,
      ...(blueprint.traceabilityRefs ?? []),
      blueprint.sourceBusinessModelId
        ? `q2-03:business_model:${blueprint.sourceBusinessModelId}`
        : "",
      blueprint.sourceMarketResearchReportId
        ? `q2-04:market_research:${blueprint.sourceMarketResearchReportId}`
        : "",
      blueprint.sourceOpportunityEvaluationId
        ? `q2-05:opportunity_evaluation:${blueprint.sourceOpportunityEvaluationId}`
        : "",
      blueprint.sourceIntentId ? `q2-02:business_intent:${blueprint.sourceIntentId}` : "",
    ]);

    const launchObjective =
      input.launchObjective?.trim() ||
      `Stage the approved blueprint ${blueprintId} from preparation to post-launch validation for ${businessType.replace(/_/g, " ")} without executing the launch.`;

    return {
      launchPlanId:
        input.launchPlanId?.trim() || `lpw-plan-${Date.now()}-${planSequence}`,
      timestamp: now,
      businessBuildMissionId: missionId,
      businessBlueprintId: blueprintId,
      businessType,
      launchObjective,
      launchStages,
      milestones,
      tasks,
      dependencies,
      requiredWorkforce,
      requiredTools,
      approvalCheckpoints,
      validationCheckpoints,
      launchPrerequisites,
      blockers,
      rollbackConditions,
      completionCriteria,
      missingPrerequisites,
      preservedDecisions,
      traceabilityRefs,
      metadataVersion: LPW_METADATA_VERSION,
      planVersion: LAUNCH_PLAN_VERSION,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      missionCoordinationRef: null,
      approvalRouterRef: null,
      workerId: config.workerId || LAUNCH_PLAN_WORKER_IDENTITY.workerId,
      neverExecuteLaunchTasks: true,
      neverAssignWorkersDirectly: true,
      neverCreateBusinessAssets: true,
      neverConnectExternalAccounts: true,
      neverLaunchBusiness: true,
      neverApproveLaunch: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  /**
   * Derive stage set from blueprint content and business type.
   * Stages are selected from the catalog — not a fixed list for every business.
   */
  identifyLaunchStages(
    blueprint: BusinessBlueprintInput,
    businessType: string,
    config: LaunchPlanWorkerConfiguration,
  ): LaunchStage[] {
    const catalog = new Set(config.stageCatalog);
    const selected: Array<{
      key: string;
      name: string;
      description: string;
      derivedFrom: string[];
    }> = [];

    const push = (
      key: string,
      name: string,
      description: string,
      derivedFrom: string[],
    ) => {
      if (!catalog.has(key) && !LAUNCH_FALLBACK_KEYS.has(key)) return;
      if (selected.some((s) => s.key === key)) return;
      selected.push({ key, name, description, derivedFrom });
    };

    push(
      "preparation",
      "Preparation",
      "Confirm blueprint readiness, prerequisites, and planning assumptions",
      ["blueprint_received"],
    );
    push(
      "business_setup",
      "Business Setup",
      `Establish ${businessType.replace(/_/g, " ")} operating foundation from approved architecture`,
      ["businessArchitecture", "businessObjective"],
    );

    if ((blueprint.requiredAssets?.length ?? 0) > 0 || (blueprint.productsServices?.length ?? 0) > 0) {
      push(
        "asset_creation",
        "Asset Creation",
        "Specify asset creation sequence from required assets and products/services",
        ["requiredAssets", "productsServices"],
      );
    }

    if ((blueprint.requiredIntegrations?.length ?? 0) > 0) {
      push(
        "integration",
        "Integration",
        "Plan external integration readiness from blueprint required integrations",
        ["requiredIntegrations"],
      );
    } else if (businessType === "saas" || businessType === "commerce") {
      push(
        "integration",
        "Integration",
        `Plan core ${businessType} platform integrations required for launch readiness`,
        [`business_type:${businessType}`],
      );
    }

    push(
      "testing",
      "Testing",
      "Define validation tests for offer, workflow, and integration readiness",
      ["operationalWorkflow", "milestones"],
    );
    push(
      "approval",
      "Approval",
      "Define Pillow / authority approval checkpoints before any launch action",
      ["approval_gate"],
    );

    if (
      businessType === "commerce" ||
      businessType === "digital_product" ||
      businessType === "saas" ||
      businessType === "media" ||
      businessType === "affiliate"
    ) {
      push(
        "soft_launch",
        "Soft Launch",
        "Limited exposure readiness stage for controlled market entry planning",
        [`business_type:${businessType}`],
      );
    } else if (
      businessType === "local_cleaning" ||
      businessType === "local_services" ||
      businessType === "agency"
    ) {
      push(
        "soft_launch",
        "Pilot Soft Launch",
        "Local/pilot soft-launch readiness for service delivery validation",
        [`business_type:${businessType}`, "targetMarket"],
      );
    }

    push(
      "production_launch",
      "Production Launch",
      "Full production launch readiness gate — plan only, not execution",
      ["completion_gate"],
    );
    push(
      "post_launch_validation",
      "Post-Launch Validation",
      "Define post-launch measurement and rollback observation criteria",
      ["validation_gate"],
    );

    return selected.map((stage, index) => {
      const stageId = `stg-${String(index + 1).padStart(2, "0")}`;
      return {
        stageId,
        stageKey: stage.key,
        name: stage.name,
        description: stage.description,
        sequence: index + 1,
        dependsOnStages: index === 0 ? [] : [`stg-${String(index).padStart(2, "0")}`],
        derivedFrom: stage.derivedFrom,
      };
    });
  }

  defineMilestones(
    stages: LaunchStage[],
    blueprint: BusinessBlueprintInput,
  ): LaunchMilestone[] {
    const milestones: LaunchMilestone[] = [];
    let seq = 0;
    for (const stage of stages) {
      seq += 1;
      const fromBlueprint = (blueprint.milestones ?? []).find((m) =>
        (m.name ?? "").toLowerCase().includes(stage.stageKey.replace(/_/g, " ").slice(0, 6)),
      );
      milestones.push({
        milestoneId: `ms-${String(seq).padStart(2, "0")}`,
        name: `${stage.stageKey}_complete`,
        description:
          fromBlueprint?.description?.trim() ||
          `${stage.name} readiness criteria satisfied for downstream planning`,
        stageId: stage.stageId,
        sequence: seq,
        measurableCriteria: unique([
          ...(fromBlueprint?.successCriteria ?? []),
          `${stage.stageKey}_checklist_complete`,
          `${stage.stageKey}_dependencies_resolved_or_listed`,
        ]),
        dependsOn: stage.dependsOnStages.map(
          (dep) => milestones.find((m) => m.stageId === dep)?.milestoneId ?? dep,
        ),
      });
    }
    return milestones;
  }

  defineTasks(
    stages: LaunchStage[],
    blueprint: BusinessBlueprintInput,
    businessType: string,
  ): LaunchTask[] {
    const tasks: LaunchTask[] = [];
    let seq = 0;
    const workflow = blueprint.operationalWorkflow ?? [];
    for (const stage of stages) {
      const owner =
        stage.stageKey === "integration"
          ? "role-integration-specialist"
          : stage.stageKey === "testing" || stage.stageKey === "post_launch_validation"
            ? "role-analyst-performance"
            : stage.stageKey === "approval"
              ? "role-planner-launch-plan"
              : blueprint.requiredWorkers?.[0]?.workerRole || "role-operations-specialist";

      seq += 1;
      tasks.push({
        taskId: `task-${String(seq).padStart(2, "0")}`,
        name: `plan_${stage.stageKey}`,
        description: `Define executable work package for ${stage.name} (planning only)`,
        stageId: stage.stageId,
        ownerWorkerRole: owner,
        dependsOn: stage.dependsOnStages,
        requiredTools: ["structured_reporting", "launch_plan_composer"],
      });

      if (stage.stageKey === "asset_creation") {
        for (const asset of (blueprint.requiredAssets ?? []).slice(0, 3)) {
          seq += 1;
          tasks.push({
            taskId: `task-${String(seq).padStart(2, "0")}`,
            name: `specify_asset_${slug(asset)}`,
            description: `Specify creation requirements for asset: ${asset}`,
            stageId: stage.stageId,
            ownerWorkerRole: "role-offer-designer",
            dependsOn: [`task-${String(seq - 1).padStart(2, "0")}`],
            requiredTools: ["blueprint_composer"],
          });
        }
      }

      if (stage.stageKey === "integration") {
        for (const integration of (blueprint.requiredIntegrations ?? []).slice(0, 4)) {
          seq += 1;
          tasks.push({
            taskId: `task-${String(seq).padStart(2, "0")}`,
            name: `plan_integration_${slug(integration)}`,
            description: `Plan integration readiness for ${integration}`,
            stageId: stage.stageId,
            ownerWorkerRole: "role-integration-specialist",
            dependsOn: [tasks.filter((t) => t.stageId === stage.stageId)[0]?.taskId ?? stage.stageId],
            requiredTools: [slug(integration), "structured_reporting"],
          });
        }
      }

      if (stage.stageKey === "business_setup" && workflow.length) {
        seq += 1;
        tasks.push({
          taskId: `task-${String(seq).padStart(2, "0")}`,
          name: "map_operational_workflow",
          description: `Map ${workflow.length} blueprint workflow steps into ${businessType} setup plan`,
          stageId: stage.stageId,
          ownerWorkerRole: "role-operations-specialist",
          dependsOn: [tasks.filter((t) => t.stageId === stage.stageId)[0]?.taskId ?? stage.stageId],
          requiredTools: ["ops_runbook"],
        });
      }
    }
    return tasks;
  }

  defineDependencies(
    stages: LaunchStage[],
    milestones: LaunchMilestone[],
    tasks: LaunchTask[],
    blueprint: BusinessBlueprintInput,
  ): LaunchDependency[] {
    const deps: LaunchDependency[] = [];
    let seq = 0;
    for (const stage of stages) {
      for (const from of stage.dependsOnStages) {
        seq += 1;
        deps.push({
          dependencyId: `dep-${seq}`,
          description: `Stage ${from} must complete before ${stage.stageId}`,
          from,
          to: stage.stageId,
          kind: "stage",
        });
      }
    }
    for (const task of tasks) {
      for (const from of task.dependsOn) {
        seq += 1;
        deps.push({
          dependencyId: `dep-${seq}`,
          description: `Task/stage ${from} precedes ${task.taskId}`,
          from,
          to: task.taskId,
          kind: from.startsWith("task-") ? "task" : "stage",
        });
      }
    }
    for (const milestone of milestones) {
      seq += 1;
      deps.push({
        dependencyId: `dep-${seq}`,
        description: `Milestone ${milestone.milestoneId} depends on stage ${milestone.stageId}`,
        from: milestone.stageId,
        to: milestone.milestoneId,
        kind: "milestone",
      });
    }
    for (const external of blueprint.dependencies ?? []) {
      seq += 1;
      deps.push({
        dependencyId: `dep-${seq}`,
        description: external.description?.trim() || "Blueprint external dependency",
        from: external.dependencyId || "blueprint_dependency",
        to: external.blocks?.[0] || milestones[0]?.milestoneId || "ms-01",
        kind: "external",
      });
    }
    return deps;
  }

  defineWorkforce(
    blueprint: BusinessBlueprintInput,
    businessType: string,
  ): RequiredWorkforceSpec[] {
    const fromBlueprint = (blueprint.requiredWorkers ?? []).map((w) => ({
      workerRole: w.workerRole?.trim() || "role-operations-specialist",
      workforceCategory: categorize(w.workerRole || "operations"),
      purpose: w.purpose?.trim() || "Support launch-plan readiness",
      skills: [...(w.skills ?? [])],
      priority: (w.priority as RequiredWorkforceSpec["priority"]) || "medium",
    }));
    const baseline: RequiredWorkforceSpec[] = [
      {
        workerRole: "role-planner-launch-plan",
        workforceCategory: "planning",
        purpose: "Maintain launch plan integrity and checkpoint readiness",
        skills: ["skill-launch-planning", "skill-dependency-mapping"],
        priority: "critical",
      },
      {
        workerRole: "role-operations-specialist",
        workforceCategory: "operations",
        purpose: "Prepare operational readiness against blueprint workflow",
        skills: ["skill-ops-process"],
        priority: "critical",
      },
    ];
    if (businessType === "commerce" || businessType === "digital_product") {
      baseline.push({
        workerRole: "role-fulfillment-specialist",
        workforceCategory: "fulfillment",
        purpose: "Plan fulfillment readiness",
        skills: ["skill-fulfillment"],
        priority: "high",
      });
    }
    return dedupeWorkforce([...baseline, ...fromBlueprint]);
  }

  defineTools(blueprint: BusinessBlueprintInput, businessType: string): string[] {
    return unique([
      "launch_plan_composer",
      "structured_reporting",
      "evidence_ledger",
      ...(blueprint.requiredIntegrations ?? []).map((i) => slug(i)),
      businessType === "saas" ? "billing" : "",
      businessType === "commerce" ? "payments" : "",
      "mission_coordination_interface",
      "approval_router_interface",
    ]);
  }

  defineApprovalCheckpoints(
    stages: LaunchStage[],
    businessType: string,
  ): CheckpointSpec[] {
    const approvalStage =
      stages.find((s) => s.stageKey === "approval") ?? stages[stages.length - 2];
    const production =
      stages.find((s) => s.stageKey === "production_launch") ?? stages[stages.length - 1];
    return [
      {
        checkpointId: "apr-01",
        name: "pre_soft_launch_approval",
        stageId: approvalStage?.stageId ?? "stg-approval",
        description: "Pillow approval required before soft/pilot launch readiness proceeds",
        authority: "pillow",
        requiredEvidence: [
          "launch_plan_complete",
          "validation_checkpoints_planned",
          `business_type=${businessType}`,
        ],
      },
      {
        checkpointId: "apr-02",
        name: "production_launch_approval",
        stageId: production?.stageId ?? "stg-production",
        description:
          "Authority approval checkpoint for production launch readiness — LPW does not approve",
        authority: "pillow",
        requiredEvidence: [
          "soft_launch_criteria_defined",
          "rollback_conditions_defined",
          "blockers_resolved_or_accepted",
        ],
      },
    ];
  }

  defineValidationCheckpoints(
    stages: LaunchStage[],
    blueprint: BusinessBlueprintInput,
    businessType: string,
  ): CheckpointSpec[] {
    const testing = stages.find((s) => s.stageKey === "testing");
    const post = stages.find((s) => s.stageKey === "post_launch_validation");
    return [
      {
        checkpointId: "val-01",
        name: "pre_launch_validation",
        stageId: testing?.stageId ?? "stg-testing",
        description: "Validate offer, workflow, and integration readiness plans",
        authority: "system",
        requiredEvidence: unique([
          "workflow_mapped",
          "integrations_listed",
          ...(blueprint.productsServices ?? []).slice(0, 2).map((p) => `offer:${p}`),
          `type_validation_${businessType}`,
        ]),
      },
      {
        checkpointId: "val-02",
        name: "post_launch_validation",
        stageId: post?.stageId ?? "stg-post",
        description: "Validate post-launch observation and rollback monitoring criteria",
        authority: "factory_lead",
        requiredEvidence: [
          "completion_criteria_defined",
          "rollback_triggers_defined",
          "reporting_path_ready",
        ],
      },
    ];
  }

  definePrerequisites(
    blueprint: BusinessBlueprintInput,
    businessType: string,
  ): string[] {
    return unique([
      "approved_business_blueprint",
      blueprint.blueprintId ? `blueprint_id=${blueprint.blueprintId}` : "",
      "opportunity_evaluation_proceed_or_approved",
      ...(blueprint.requiredIntegrations ?? []).map((i) => `integration_ready_plan:${i}`),
      ...(blueprint.requiredAssets ?? []).slice(0, 4).map((a) => `asset_spec:${a}`),
      ...(blueprint.requiredWorkers ?? []).map(
        (w) => `workforce_role_available_plan:${w.workerRole}`,
      ),
      `operating_model_defined:${blueprint.businessArchitecture?.operatingModel ?? businessType}`,
    ]);
  }

  defineBlockers(
    blueprint: BusinessBlueprintInput,
    stages: LaunchStage[],
    prerequisites: string[],
  ): BlockerSpec[] {
    const blockers: BlockerSpec[] = [];
    let seq = 0;
    const push = (
      description: string,
      severity: BlockerSpec["severity"],
      blocks: string[],
      resolutionHint: string,
    ) => {
      seq += 1;
      blockers.push({
        blockerId: `blk-${seq}`,
        description,
        severity,
        blocks,
        resolutionHint,
      });
    };

    if (!blueprint.blueprintId) {
      push(
        "Business Blueprint ID missing",
        "high",
        [stages[0]?.stageId ?? "stg-01"],
        "Receive approved Business Blueprint with stable blueprintId",
      );
    }
    if (!(blueprint.requiredIntegrations?.length)) {
      push(
        "No required integrations specified on blueprint",
        "moderate",
        [stages.find((s) => s.stageKey === "integration")?.stageId ?? "stg-integration"],
        "Confirm integration list from blueprint or business-type defaults",
      );
    }
    for (const dep of blueprint.dependencies ?? []) {
      push(
        dep.description?.trim() || "Unresolved blueprint dependency",
        "moderate",
        dep.blocks?.length ? [...dep.blocks] : [stages[0]?.stageId ?? "stg-01"],
        "Resolve or explicitly accept dependency before production launch checkpoint",
      );
    }
    if (prerequisites.some((p) => p.startsWith("workforce_role_available_plan:"))) {
      push(
        "Workforce role availability must be planned before assignment (LPW does not assign)",
        "moderate",
        [stages.find((s) => s.stageKey === "business_setup")?.stageId ?? "stg-02"],
        "Hand off required workforce to Worker Assignment Engine downstream",
      );
    }
    return blockers;
  }

  defineRollbackConditions(
    stages: LaunchStage[],
    businessType: string,
  ): RollbackCondition[] {
    const soft = stages.find((s) => s.stageKey === "soft_launch");
    const production = stages.find((s) => s.stageKey === "production_launch");
    const testing = stages.find((s) => s.stageKey === "testing");
    return [
      {
        conditionId: "rb-01",
        description: "Pause if pre-launch validation evidence is incomplete",
        trigger: "validation_checkpoint_val-01_failed",
        action: "pause",
        targetStageId: testing?.stageId ?? null,
      },
      {
        conditionId: "rb-02",
        description: "Rollback soft-launch readiness if critical blockers remain open",
        trigger: "open_high_severity_blocker",
        action: "rollback",
        targetStageId: soft?.stageId ?? testing?.stageId ?? null,
      },
      {
        conditionId: "rb-03",
        description: `Escalate production launch readiness issues for ${businessType} to Pillow`,
        trigger: "production_launch_approval_denied_or_blocked",
        action: "escalate",
        targetStageId: production?.stageId ?? null,
      },
    ];
  }

  identifyMissingPrerequisites(
    blueprint: BusinessBlueprintInput,
    prerequisites: string[],
  ): string[] {
    const missing: string[] = [];
    if (!blueprint.blueprintId) missing.push("business_blueprint_id");
    if (!blueprint.businessObjective?.trim()) missing.push("business_objective");
    if (!(blueprint.productsServices?.length)) missing.push("products_services");
    if (!(blueprint.requiredWorkers?.length)) missing.push("required_workers");
    if (!(blueprint.operationalWorkflow?.length)) missing.push("operational_workflow");
    if (!(blueprint.milestones?.length)) missing.push("blueprint_milestones");
    for (const prerequisite of prerequisites) {
      if (prerequisite.startsWith("integration_ready_plan:") && !blueprint.requiredIntegrations?.length) {
        missing.push(prerequisite);
      }
    }
    return unique(missing);
  }

  defineCompletionCriteria(
    milestones: LaunchMilestone[],
    validations: CheckpointSpec[],
  ): string[] {
    return unique([
      "all_launch_stages_planned",
      "all_milestones_have_measurable_criteria",
      "approval_checkpoints_defined",
      "validation_checkpoints_defined",
      "rollback_conditions_defined",
      ...milestones.slice(-2).map((m) => `milestone_ready:${m.milestoneId}`),
      ...validations.map((v) => `validation_planned:${v.checkpointId}`),
    ]);
  }
}

const LAUNCH_FALLBACK_KEYS = new Set([
  "preparation",
  "business_setup",
  "asset_creation",
  "integration",
  "testing",
  "approval",
  "soft_launch",
  "production_launch",
  "post_launch_validation",
]);

let planSequence = 0;

export function resetPlanSequenceForTesting() {
  planSequence = 0;
}

function normalizeType(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function slug(value: string): string {
  return (
    value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "item"
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function categorize(role: string): string {
  const value = role.toLowerCase();
  if (value.includes("integration")) return "integrations";
  if (value.includes("fulfillment")) return "fulfillment";
  if (value.includes("growth") || value.includes("acquisition")) return "growth";
  if (value.includes("analyst") || value.includes("performance")) return "analytics";
  if (value.includes("planner") || value.includes("architect")) return "planning";
  if (value.includes("support")) return "support";
  return "operations";
}

function dedupeWorkforce(workers: RequiredWorkforceSpec[]): RequiredWorkforceSpec[] {
  const map = new Map<string, RequiredWorkforceSpec>();
  for (const worker of workers) {
    const existing = map.get(worker.workerRole);
    if (!existing) {
      map.set(worker.workerRole, {
        ...worker,
        skills: unique(worker.skills),
      });
    } else {
      map.set(worker.workerRole, {
        ...existing,
        skills: unique([...existing.skills, ...worker.skills]),
        priority:
          priorityRank(worker.priority) < priorityRank(existing.priority)
            ? worker.priority
            : existing.priority,
      });
    }
  }
  return [...map.values()];
}

function priorityRank(priority: string): number {
  return priority === "critical" ? 0 : priority === "high" ? 1 : 2;
}

function clonePlan(plan: LaunchPlan): LaunchPlan {
  return {
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
  };
}
