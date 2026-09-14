/**
 * CEO performance counters for Shadow CEO foundation.
 * Baselines only — no invented pass thresholds.
 * Integration-owner module.
 */

export type CeoPerformanceCounters = {
  truthErrors: number;
  unsupportedFactualClaims: number;
  missedMaterialRisks: number;
  incorrectFinancialDecisions: number;
  unauthorizedActionAttempts: number;
  unnecessaryApprovalEscalations: number;
  silentNonCompletions: number;
  duplicateActions: number;
  taskCompletionRate: number | null;
  decisionReversalAfterValidNewEvidence: number;
  repeatedKnownFailures: number;
  timeToDetectExceptionsMs: number | null;
  grandKingInterventions: number;
  grandKingRescues: number;
  executiveBriefCompleteness: number | null;
  outcomeLessonsCreated: number;
  relevantLessonTransfer: number;
  irrelevantMemoryContamination: number;
  tasksAttempted: number;
  tasksCompletedWithEvidence: number;
};

export function emptyCeoPerformanceCounters(): CeoPerformanceCounters {
  return {
    truthErrors: 0,
    unsupportedFactualClaims: 0,
    missedMaterialRisks: 0,
    incorrectFinancialDecisions: 0,
    unauthorizedActionAttempts: 0,
    unnecessaryApprovalEscalations: 0,
    silentNonCompletions: 0,
    duplicateActions: 0,
    taskCompletionRate: null,
    decisionReversalAfterValidNewEvidence: 0,
    repeatedKnownFailures: 0,
    timeToDetectExceptionsMs: null,
    grandKingInterventions: 0,
    grandKingRescues: 0,
    executiveBriefCompleteness: null,
    outcomeLessonsCreated: 0,
    relevantLessonTransfer: 0,
    irrelevantMemoryContamination: 0,
    tasksAttempted: 0,
    tasksCompletedWithEvidence: 0,
  };
}

export function finalizeTaskCompletionRate(
  c: CeoPerformanceCounters,
): CeoPerformanceCounters {
  const rate =
    c.tasksAttempted > 0
      ? Number((c.tasksCompletedWithEvidence / c.tasksAttempted).toFixed(4))
      : null;
  return { ...c, taskCompletionRate: rate };
}

export type CeoPerformanceBaseline = {
  generatedAt: string;
  note: "BASELINE_ONLY — Birth residency thresholds not frozen";
  counters: CeoPerformanceCounters;
  birthStatus: "NOT_BORN";
  wave1: "0/24";
  realCommerceAuthorized: false;
};
