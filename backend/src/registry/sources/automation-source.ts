/**
 * G5-01 — Automation registry source adapter (EA-004 sole seed importer).
 */

import {
  AUTOMATION_APPROVAL_SEED_ROWS,
  AUTOMATION_EXECUTOR_SEED_ROWS,
  AUTOMATION_MONITOR_SEED_ROWS,
  AUTOMATION_NOTIFICATION_SEED_ROWS,
  AUTOMATION_POLICY_SEED_ROWS,
  AUTOMATION_RECOVERY_SEED_ROWS,
  AUTOMATION_REPORT_SEED_ROWS,
  AUTOMATION_SCHEDULE_SEED_ROWS,
  AUTOMATION_TRIGGER_SEED_ROWS,
  AUTOMATION_WORKFLOW_SEED_ROWS,
} from "../../orchestration/business-automation/data/automation-registry-seed.js";
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
  AUTOMATION_REGISTRY_VERSION,
  type AutomationRegistryRowBase,
} from "../types/automation-registry-types.js";
import type { RegistryQuery } from "../types/registry-types.js";
import {
  validateAutomationRegistryBatch,
  validateAutomationRegistryRows,
} from "../validation/automation-registry-validator.js";

export { AUTOMATION_REGISTRY_VERSION };

type AutomationRegistryBatch = Record<AutomationRegistryId, AutomationRegistryRowBase[]>;

let validatedBatch: AutomationRegistryBatch | undefined;

function buildSeedBatch(): AutomationRegistryBatch {
  return {
    [REG_AUTOMATION_TRIGGER]: AUTOMATION_TRIGGER_SEED_ROWS,
    [REG_AUTOMATION_WORKFLOW]: AUTOMATION_WORKFLOW_SEED_ROWS,
    [REG_AUTOMATION_SCHEDULE]: AUTOMATION_SCHEDULE_SEED_ROWS,
    [REG_AUTOMATION_POLICY]: AUTOMATION_POLICY_SEED_ROWS,
    [REG_AUTOMATION_APPROVAL]: AUTOMATION_APPROVAL_SEED_ROWS,
    [REG_AUTOMATION_EXECUTOR]: AUTOMATION_EXECUTOR_SEED_ROWS,
    [REG_AUTOMATION_RECOVERY]: AUTOMATION_RECOVERY_SEED_ROWS,
    [REG_AUTOMATION_NOTIFICATION]: AUTOMATION_NOTIFICATION_SEED_ROWS,
    [REG_AUTOMATION_REPORT]: AUTOMATION_REPORT_SEED_ROWS,
    [REG_AUTOMATION_MONITOR]: AUTOMATION_MONITOR_SEED_ROWS,
  };
}

export function getValidatedAutomationRegistryBatch(): AutomationRegistryBatch {
  if (!validatedBatch) {
    const batch = buildSeedBatch();
    validateAutomationRegistryBatch(batch);
    validatedBatch = batch;
  }
  return validatedBatch;
}

export function resetAutomationRegistryBatchForTests(): void {
  validatedBatch = undefined;
}

function filterRows(
  rows: AutomationRegistryRowBase[],
  query?: RegistryQuery,
): AutomationRegistryRowBase[] {
  if (!query?.registryRowId) {
    return rows;
  }
  return rows.filter((row) => row.id === query.registryRowId);
}

export function loadAutomationRegistryRows(
  registryId: AutomationRegistryId,
  query?: RegistryQuery,
): AutomationRegistryRowBase[] {
  const batch = getValidatedAutomationRegistryBatch();
  const rows = batch[registryId];
  validateAutomationRegistryRows(registryId, rows);
  return filterRows(rows, query);
}

export function listAutomationRegistryCatalog(): Array<{
  registryId: AutomationRegistryId;
  rowCount: number;
  rowIds: string[];
}> {
  const batch = getValidatedAutomationRegistryBatch();
  return AUTOMATION_REGISTRY_IDS.map((registryId) => ({
    registryId,
    rowCount: batch[registryId].length,
    rowIds: batch[registryId].map((row) => row.id),
  }));
}
