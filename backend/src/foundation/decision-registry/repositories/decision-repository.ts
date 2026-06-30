import type { DecisionLifecycleRecord, EmpireDecision } from "../models/empire-decision.js";

export interface DecisionRepository {
  saveDecision(decision: EmpireDecision): EmpireDecision;
  getDecisionById(decisionId: string): EmpireDecision | null;
  listDecisions(workspaceId: string, status?: string, category?: string): EmpireDecision[];

  appendLifecycle(record: DecisionLifecycleRecord): DecisionLifecycleRecord;
  listLifecycle(decisionId: string, limit?: number): DecisionLifecycleRecord[];
  listWorkspaceLifecycle(workspaceId: string, limit?: number): DecisionLifecycleRecord[];
}
