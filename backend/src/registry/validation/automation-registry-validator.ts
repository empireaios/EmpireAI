/**
 * G5-01 — Automation registry validation (schema, duplicates, dependency chains).
 * Pillow governs registries; Business Automation consumes via RegistryLoader only.
 */

import {
  AUTOMATION_REGISTRY_IDS,
  REG_AUTOMATION_APPROVAL,
  REG_AUTOMATION_EXECUTOR,
  REG_AUTOMATION_MONITOR,
  REG_AUTOMATION_NOTIFICATION,
  REG_AUTOMATION_POLICY,
  REG_AUTOMATION_RECOVERY,
  REG_AUTOMATION_REPORT,
  REG_AUTOMATION_SCHEDULE,
  REG_AUTOMATION_TRIGGER,
  REG_AUTOMATION_WORKFLOW,
  type AutomationRegistryId,
} from "../types/registry-ids.js";
import {
  automationApprovalRowSchema,
  automationExecutorRowSchema,
  automationMonitorRowSchema,
  automationNotificationRowSchema,
  automationPolicyRowSchema,
  automationRecoveryRowSchema,
  automationReportRowSchema,
  automationScheduleRowSchema,
  automationTriggerRowSchema,
  automationWorkflowRowSchema,
  type AutomationRegistryRowBase,
  type AutomationWorkflowRow,
} from "../types/automation-registry-types.js";
import { RegistryValidationError } from "./registry-validator.js";

export class AutomationRegistryValidationError extends RegistryValidationError {
  constructor(message: string) {
    super(message);
    this.name = "AutomationRegistryValidationError";
  }
}

type AutomationRegistryBatch = Record<AutomationRegistryId, AutomationRegistryRowBase[]>;

const SCHEMA_BY_REGISTRY: Record<
  AutomationRegistryId,
  {
    parse: (row: unknown) => AutomationRegistryRowBase;
  }
> = {
  [REG_AUTOMATION_TRIGGER]: { parse: (row) => automationTriggerRowSchema.parse(row) },
  [REG_AUTOMATION_WORKFLOW]: { parse: (row) => automationWorkflowRowSchema.parse(row) },
  [REG_AUTOMATION_SCHEDULE]: { parse: (row) => automationScheduleRowSchema.parse(row) },
  [REG_AUTOMATION_POLICY]: { parse: (row) => automationPolicyRowSchema.parse(row) },
  [REG_AUTOMATION_APPROVAL]: { parse: (row) => automationApprovalRowSchema.parse(row) },
  [REG_AUTOMATION_EXECUTOR]: { parse: (row) => automationExecutorRowSchema.parse(row) },
  [REG_AUTOMATION_RECOVERY]: { parse: (row) => automationRecoveryRowSchema.parse(row) },
  [REG_AUTOMATION_NOTIFICATION]: { parse: (row) => automationNotificationRowSchema.parse(row) },
  [REG_AUTOMATION_REPORT]: { parse: (row) => automationReportRowSchema.parse(row) },
  [REG_AUTOMATION_MONITOR]: { parse: (row) => automationMonitorRowSchema.parse(row) },
};

export function parseAutomationRegistryRow(
  registryId: AutomationRegistryId,
  row: unknown,
): AutomationRegistryRowBase {
  try {
    return SCHEMA_BY_REGISTRY[registryId].parse(row);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new AutomationRegistryValidationError(
      `Malformed ${registryId} row: ${detail}`,
    );
  }
}

export function validateAutomationRegistryRows(
  registryId: AutomationRegistryId,
  rows: unknown[],
): AutomationRegistryRowBase[] {
  const parsed = rows.map((row, index) => {
    try {
      return parseAutomationRegistryRow(registryId, row);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new AutomationRegistryValidationError(
        `${registryId} row ${index}: ${detail}`,
      );
    }
  });

  assertUniqueRowIds(registryId, parsed);
  return parsed;
}

export function assertUniqueRowIds(
  registryId: AutomationRegistryId,
  rows: AutomationRegistryRowBase[],
): void {
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.id)) {
      throw new AutomationRegistryValidationError(
        `Duplicate ${registryId} row id: ${row.id}`,
      );
    }
    seen.add(row.id);
  }
}

function buildGlobalIdIndex(batch: AutomationRegistryBatch): Map<string, AutomationRegistryId> {
  const index = new Map<string, AutomationRegistryId>();
  for (const registryId of AUTOMATION_REGISTRY_IDS) {
    for (const row of batch[registryId]) {
      if (index.has(row.id)) {
        throw new AutomationRegistryValidationError(
          `Duplicate automation registry id across registries: ${row.id}`,
        );
      }
      index.set(row.id, registryId);
    }
  }
  return index;
}

function assertDependencyExists(
  sourceRegistryId: AutomationRegistryId,
  rowId: string,
  dependencyId: string,
  index: Map<string, AutomationRegistryId>,
): void {
  if (!index.has(dependencyId)) {
    throw new AutomationRegistryValidationError(
      `${sourceRegistryId} row ${rowId} depends on unknown id: ${dependencyId}`,
    );
  }
}

function assertWorkflowRef(
  sourceRegistryId: AutomationRegistryId,
  rowId: string,
  workflowRef: { id: string; version: string },
  workflows: AutomationWorkflowRow[],
): void {
  const match = workflows.find(
    (wf) => wf.id === workflowRef.id && wf.version === workflowRef.version,
  );
  if (!match) {
    throw new AutomationRegistryValidationError(
      `${sourceRegistryId} row ${rowId} references unknown workflow ${workflowRef.id}@${workflowRef.version}`,
    );
  }
}

function assertAcyclicWorkflowSteps(workflow: AutomationWorkflowRow): void {
  const stepIds = new Set(workflow.steps.map((step) => step.stepId));
  for (const step of workflow.steps) {
    for (const dep of step.dependsOn ?? []) {
      if (!stepIds.has(dep)) {
        throw new AutomationRegistryValidationError(
          `${REG_AUTOMATION_WORKFLOW} row ${workflow.id} step ${step.stepId} depends on unknown step: ${dep}`,
        );
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (stepId: string): void => {
    if (visited.has(stepId)) {
      return;
    }
    if (visiting.has(stepId)) {
      throw new AutomationRegistryValidationError(
        `${REG_AUTOMATION_WORKFLOW} row ${workflow.id} contains cyclic dependsOn chain at step: ${stepId}`,
      );
    }
    visiting.add(stepId);
    const step = workflow.steps.find((candidate) => candidate.stepId === stepId);
    for (const dep of step?.dependsOn ?? []) {
      visit(dep);
    }
    visiting.delete(stepId);
    visited.add(stepId);
  };

  for (const step of workflow.steps) {
    visit(step.stepId);
  }
}

function assertWorkflowPublishRules(workflow: AutomationWorkflowRow): void {
  const stepIds = new Set(workflow.steps.map((step) => step.stepId));
  for (const step of workflow.steps) {
    if (step.rollbackStepId && !stepIds.has(step.rollbackStepId)) {
      throw new AutomationRegistryValidationError(
        `${REG_AUTOMATION_WORKFLOW} row ${workflow.id} step ${step.stepId} rollbackStepId ${step.rollbackStepId} is not defined in workflow steps`,
      );
    }
    if (step.irreversible && !step.rollbackStepId) {
      throw new AutomationRegistryValidationError(
        `${REG_AUTOMATION_WORKFLOW} row ${workflow.id} irreversible step ${step.stepId} requires rollbackStepId at validation`,
      );
    }
  }
}

export function validateAutomationRegistryBatch(batch: AutomationRegistryBatch): void {
  for (const registryId of AUTOMATION_REGISTRY_IDS) {
    validateAutomationRegistryRows(registryId, batch[registryId]);
  }

  const index = buildGlobalIdIndex(batch);
  const workflows = batch[REG_AUTOMATION_WORKFLOW] as AutomationWorkflowRow[];

  for (const registryId of AUTOMATION_REGISTRY_IDS) {
    for (const row of batch[registryId]) {
      for (const dependencyId of row.dependencies) {
        assertDependencyExists(registryId, row.id, dependencyId, index);
      }
    }
  }

  for (const workflow of workflows) {
    assertAcyclicWorkflowSteps(workflow);
    assertWorkflowPublishRules(workflow);
  }

  for (const row of batch[REG_AUTOMATION_TRIGGER]) {
    const trigger = automationTriggerRowSchema.parse(row);
    assertWorkflowRef(REG_AUTOMATION_TRIGGER, trigger.id, trigger.workflowRef, workflows);
    if (trigger.policyRef) {
      assertDependencyExists(REG_AUTOMATION_TRIGGER, trigger.id, trigger.policyRef, index);
    }
    if (trigger.approvalRef) {
      assertDependencyExists(REG_AUTOMATION_TRIGGER, trigger.id, trigger.approvalRef, index);
    }
  }

  for (const row of batch[REG_AUTOMATION_SCHEDULE]) {
    const schedule = automationScheduleRowSchema.parse(row);
    assertWorkflowRef(REG_AUTOMATION_SCHEDULE, schedule.id, schedule.workflowRef, workflows);
    if (schedule.policyRef) {
      assertDependencyExists(REG_AUTOMATION_SCHEDULE, schedule.id, schedule.policyRef, index);
    }
  }

  for (const row of batch[REG_AUTOMATION_RECOVERY]) {
    const recovery = automationRecoveryRowSchema.parse(row);
    if (recovery.workflowRef) {
      assertWorkflowRef(REG_AUTOMATION_RECOVERY, recovery.id, recovery.workflowRef, workflows);
    }
    for (const forwardStepId of Object.keys(recovery.rollbackMap)) {
      const compensatingStepId = recovery.rollbackMap[forwardStepId] ?? "";
      if (!forwardStepId.trim() || !compensatingStepId.trim()) {
        throw new AutomationRegistryValidationError(
          `${REG_AUTOMATION_RECOVERY} row ${recovery.id} has invalid rollbackMap entry`,
        );
      }
    }
  }

  for (const row of batch[REG_AUTOMATION_POLICY]) {
    const policy = automationPolicyRowSchema.parse(row);
    for (const notificationRef of policy.notificationRefs ?? []) {
      assertDependencyExists(REG_AUTOMATION_POLICY, policy.id, notificationRef, index);
    }
  }

  for (const row of batch[REG_AUTOMATION_MONITOR]) {
    const monitor = automationMonitorRowSchema.parse(row);
    for (const slaBinding of monitor.slaBindings) {
      assertDependencyExists(REG_AUTOMATION_MONITOR, monitor.id, slaBinding, index);
    }
    if (monitor.policyRef) {
      assertDependencyExists(REG_AUTOMATION_MONITOR, monitor.id, monitor.policyRef, index);
    }
  }
}
