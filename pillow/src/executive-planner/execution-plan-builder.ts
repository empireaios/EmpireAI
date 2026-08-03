import type { ExecutivePlannerConfiguration } from "./configuration.js";
import type { ObjectiveAnalysis } from "./objective-analyzer.js";
import { EP_METADATA_VERSION } from "./paths.js";
import type {
  ApprovalRequirement,
  ExecutionPlan,
  ExecutionStage,
  ValidationStatus,
  WorkforceCategory,
} from "./types.js";

export class WorkforceCategoryIdentifier {
  identify(categories: WorkforceCategory[], max: number): WorkforceCategory[] {
    return categories.slice(0, Math.max(1, max));
  }
}

export class ExecutionPlanBuilder {
  private readonly categories = new WorkforceCategoryIdentifier();

  build(
    analysis: ObjectiveAnalysis,
    configuration: ExecutivePlannerConfiguration,
    validationStatus: ValidationStatus,
  ): ExecutionPlan {
    const timestamp = new Date().toISOString();
    const planId = `ep-plan-${Date.now()}`;
    const stages = this.buildStages(analysis, configuration.maxStages);
    const workforce = this.categories.identify(
      analysis.workforceCategories,
      configuration.maxWorkforceCategories,
    );
    const approvals = this.buildApprovals(analysis.approvalNeeds, stages);

    return {
      planId,
      timestamp,
      objectiveSummary: analysis.objectiveSummary,
      intent: analysis.intent,
      assumptions: analysis.assumptions,
      constraints: analysis.constraints,
      priorities: analysis.priorities,
      risks: analysis.risks,
      dependencies: analysis.dependencies,
      requiredWorkforceCategories: workforce,
      executionStages: stages,
      expectedDeliverables: this.buildDeliverables(analysis, stages),
      approvalRequirements: approvals,
      successCriteria: analysis.successCriteria,
      validationStatus,
      metadataVersion: EP_METADATA_VERSION,
      planTraceId: `ep-trace-${Date.now()}`,
      neverExecuteWork: true,
      neverAssignWorkers: true,
      neverInvokeTools: true,
      neverApproveActions: true,
      workersAssigned: false,
      workExecuted: false,
      toolsInvoked: false,
      actionsApproved: false,
      preservePlanTraceability: true,
      preserveAuditability: true,
      preservePlanningIntegrity: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  private buildStages(analysis: ObjectiveAnalysis, maxStages: number): ExecutionStage[] {
    const candidates: Array<Omit<ExecutionStage, "stageId" | "stageNumber">> = [
      {
        name: "Objective intake",
        description: "Confirm objective summary, intent, and planning scope",
        expectedOutcomes: ["Confirmed objective summary", "Documented intent"],
      },
      {
        name: "Constraint and risk framing",
        description: "Capture constraints, risks, assumptions, and dependencies",
        expectedOutcomes: analysis.constraints.slice(0, 2),
      },
      {
        name: "Workforce category identification",
        description: "Identify required workforce categories without assigning workers",
        expectedOutcomes: ["Category list prepared for future Q0 orchestration"],
      },
      {
        name: "Execution stage design",
        description: "Define ordered stages and expected deliverables",
        expectedOutcomes: ["Stage sequence published"],
      },
      {
        name: "Approval gate preparation",
        description: "Record approval requirements deferred for executive action",
        expectedOutcomes: analysis.approvalNeeds.slice(0, 2),
      },
      {
        name: "Success criteria lock",
        description: "Lock measurable success criteria for downstream validation",
        expectedOutcomes: analysis.successCriteria.slice(0, 2),
      },
      {
        name: "Plan validation",
        description: "Validate machine-readable plan completeness and Q0-01 boundaries",
        expectedOutcomes: ["Validation status recorded"],
      },
      {
        name: "Handoff readiness",
        description: "Mark plan ready for future AI Workforce orchestration (no assignment yet)",
        expectedOutcomes: ["Plan available for Q0 consumers"],
      },
    ];

    return candidates.slice(0, Math.max(3, Math.min(maxStages, candidates.length))).map((stage, index) => ({
      stageId: `ep-stage-${index + 1}`,
      stageNumber: index + 1,
      ...stage,
    }));
  }

  private buildApprovals(needs: string[], stages: ExecutionStage[]): ApprovalRequirement[] {
    const gate = stages.find((s) => s.name.toLowerCase().includes("approval")) ?? stages[0]!;
    return needs.map((requirement, index) => ({
      approvalId: `ep-approval-${index + 1}`,
      requirement,
      requiredBeforeStage: gate.stageId,
      status: "required" as const,
    }));
  }

  private buildDeliverables(analysis: ObjectiveAnalysis, stages: ExecutionStage[]): string[] {
    return [
      "Machine-readable execution plan (EP-001-v1)",
      `Workforce category roster (${analysis.workforceCategories.length} categories, unassigned)`,
      `Staged execution design (${stages.length} stages)`,
      "Approval requirements register",
      "Success criteria register",
    ];
  }
}
