/**
 * G5-08 — Pillow-governed automation learning store (outcome_history backend).
 * Business Automation does not own EKLS — records are governed references for Pillow → EKLS.
 */

import type { AutomationLearningRecord } from "../contracts/ekls-outcome-types.js";

const learningStore = new Map<string, AutomationLearningRecord>();
const executionIndex = new Map<string, string>();
const workflowIndex = new Map<string, Set<string>>();

export class AutomationOutcomeStore {
  save(record: AutomationLearningRecord): AutomationLearningRecord {
    learningStore.set(record.learningId, record);
    executionIndex.set(record.executionId, record.learningId);

    const workflowSet = workflowIndex.get(record.workflowId) ?? new Set<string>();
    workflowSet.add(record.learningId);
    workflowIndex.set(record.workflowId, workflowSet);

    return record;
  }

  getByLearningId(learningId: string): AutomationLearningRecord | undefined {
    return learningStore.get(learningId);
  }

  getByExecutionId(executionId: string): AutomationLearningRecord | undefined {
    const learningId = executionIndex.get(executionId);
    return learningId ? learningStore.get(learningId) : undefined;
  }

  list(workspaceId?: string, workflowId?: string): AutomationLearningRecord[] {
    return [...learningStore.values()].filter((record) => {
      if (workspaceId && record.workspaceId !== workspaceId) return false;
      if (workflowId && record.workflowId !== workflowId) return false;
      return true;
    });
  }

  findSimilar(record: AutomationLearningRecord, limit = 5): AutomationLearningRecord[] {
    return this.list(record.workspaceId, record.workflowId)
      .filter((candidate) => candidate.learningId !== record.learningId)
      .slice(0, limit);
  }

  resetForTests(): void {
    learningStore.clear();
    executionIndex.clear();
    workflowIndex.clear();
  }
}

let sharedStore: AutomationOutcomeStore | undefined;

export function getAutomationOutcomeStore(): AutomationOutcomeStore {
  if (!sharedStore) {
    sharedStore = new AutomationOutcomeStore();
  }
  return sharedStore;
}

export function resetAutomationOutcomeStoreForTests(): void {
  sharedStore = undefined;
  learningStore.clear();
  executionIndex.clear();
  workflowIndex.clear();
}
