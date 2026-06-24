import type { ExecutionResult } from "../../autonomous-investigation-execution/models/execution-result.js";
import type { InvestigationExecution } from "../../autonomous-investigation-execution/models/investigation-execution.js";
import type { InvestigationExecutionTask } from "../../autonomous-investigation-execution/models/investigation-execution-task.js";
import type { InvestigationLearningRecord } from "../models/investigation-learning-record.js";
import type { LearningRepository } from "../repositories/learning-repository.js";
import {
  scoreInvestigationLearning,
  type InvestigationLearningAnalysisInput,
  type InvestigationLearningForecastInput,
  type InvestigationLearningOpportunityInput,
} from "../scoring/learning-scoring.js";

export type InvestigationLearningInput = {
  execution: InvestigationExecution;
  tasks: InvestigationExecutionTask[];
  results: ExecutionResult[];
  opportunity?: InvestigationLearningOpportunityInput | null;
  forecast?: InvestigationLearningForecastInput | null;
};

/** Converts completed investigations into reusable intelligence. */
export class InvestigationLearningEngine {
  constructor(private readonly repository: LearningRepository) {}

  async recordOutcome(
    workspaceId: string,
    input: InvestigationLearningInput,
  ): Promise<InvestigationLearningRecord> {
    const historicalRecords = await this.repository.list({
      workspaceId,
      productId: input.execution.productId,
    });

    const filteredHistory = historicalRecords.filter(
      (record) => record.executionId !== input.execution.executionId,
    );

    const breakdown = scoreInvestigationLearning({
      ...input,
      historicalRecords: filteredHistory,
    });

    return this.repository.save(workspaceId, breakdown);
  }

  analyze(input: InvestigationLearningAnalysisInput) {
    return scoreInvestigationLearning(input);
  }
}

export const defaultInvestigationLearningEngine = {
  analyze: scoreInvestigationLearning,
};
