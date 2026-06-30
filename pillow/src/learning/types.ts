/** Executive Learning Engine — Pillow Layer 2 (pre-go-live). */

import type { ExecutiveReasoningComposition } from "../bootstrap/types.js";

/** Category A — permanent executive principle (GK approval required). */
export type ExecutiveLearningCategory = "A" | "B" | "C" | "D";

export type ExecutiveLearningStatus =
  | "pending_confirmation"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "archived"
  | "merged"
  | "expired";

export type ReasoningArea =
  | "decision_principles"
  | "priorities"
  | "leadership_style"
  | "business_philosophy"
  | "engineering_philosophy"
  | "commercial_philosophy"
  | "risk_tolerance"
  | "recurring_preferences";

export type LearningSource =
  | "conversation"
  | "pattern_detection"
  | "manual"
  | "merged";

export interface LearningObservation {
  observation: string;
  evidence: string[];
  reasoningArea: ReasoningArea;
}

export interface ExtractedLearningCandidate {
  title: string;
  description: string;
  category: ExecutiveLearningCategory;
  reasoningAreas: ReasoningArea[];
  observation: LearningObservation;
  confidence: number;
  impactSummary: string;
  requiresGrandKingApproval: boolean;
}

export interface PendingExecutiveLearning {
  learningId: string;
  workspaceId: string;
  title: string;
  description: string;
  category: ExecutiveLearningCategory;
  status: ExecutiveLearningStatus;
  observation: string;
  evidence: string[];
  confidence: number;
  reasoningAreas: ReasoningArea[];
  impactSummary: string;
  source: LearningSource;
  sessionId: string | null;
  requestId: string | null;
  discoveredAt: string;
  updatedAt: string;
  expiresAt: string | null;
  requiresGrandKingApproval: boolean;
}

export interface ExecutiveKnowledgeEntry {
  learningId: string;
  workspaceId: string;
  title: string;
  category: ExecutiveLearningCategory;
  description: string;
  source: LearningSource;
  confidence: number;
  discoveredAt: string;
  approvedAt: string;
  approvedBy: string;
  status: "approved" | "archived" | "superseded";
  supersededBy: string | null;
  reasoningAreas: ReasoningArea[];
  affectedReasoningAreas: ReasoningArea[];
}

export interface ConversationLearningInput {
  workspaceId: string;
  sessionId: string;
  requestId: string;
  userMessage: string;
  assistantMessage: string;
  executiveReasoning: ExecutiveReasoningComposition;
  conversationTurnCount: number;
}

export interface LearningPipelineResult {
  candidates: ExtractedLearningCandidate[];
  sessionContext: ExtractedLearningCandidate[];
  pipelineStages: string[];
}

export interface ExecutiveLearningReasoningBundle {
  currentObjective: string | null;
  executiveConstitutionSummary: string;
  approvedExecutiveKnowledge: ExecutiveKnowledgeEntry[];
  projectWorkingKnowledge: ExecutiveKnowledgeEntry[];
  sessionContext: PendingExecutiveLearning[];
  executivePerspectives: string[];
  loadedAt: string;
}

export interface LearningReviewStats {
  newLearnings: number;
  pendingConfirmation: number;
  rejected: number;
  approved: number;
  archived: number;
  expired: number;
}
