import type { ExecutionStatus } from "../../autonomous-investigation-execution/models/investigation-execution.js";
import type {
  InvestigationLearningRecord,
  InvestigationLearningRecordCreateInput,
} from "../models/investigation-learning-record.js";

export type LearningRepositoryQuery = {
  workspaceId: string;
  productId?: string;
  executionId?: string;
  executionStatus?: ExecutionStatus;
  limit?: number;
  offset?: number;
};

/** Persists investigation learning records. */
export interface LearningRepository {
  save(
    workspaceId: string,
    input: InvestigationLearningRecordCreateInput,
  ): Promise<InvestigationLearningRecord>;
  getById(
    workspaceId: string,
    recordId: string,
  ): Promise<InvestigationLearningRecord | null>;
  getByExecution(
    workspaceId: string,
    executionId: string,
  ): Promise<InvestigationLearningRecord | null>;
  list(query: LearningRepositoryQuery): Promise<InvestigationLearningRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
}
