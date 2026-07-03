/**
 * G5-08 — EKLS Outcome Integration learning contract.
 */

export const KNOWLEDGE_LIFECYCLE_STATES = [
  "capture",
  "validate",
  "govern",
  "store",
  "index",
  "version",
  "retrieve",
  "reference",
  "archive",
] as const;

export type KnowledgeLifecycleState = (typeof KNOWLEDGE_LIFECYCLE_STATES)[number];

export type AutomationOutcomeKind = "completed" | "failed" | "cancelled" | "recovered";

export type AutomationLearningRecord = {
  learningId: string;
  workflowId: string;
  workflowVersion?: string;
  executionId: string;
  decisionReference?: string;
  approvalReference?: string;
  workspaceId: string;
  companyId?: string;
  brandId?: string;
  businessEngines: Array<{ stepId: string; executorType: string; executorRef: string; module?: string }>;
  executionTimeline: Array<{ phase: string; label: string; timestamp?: string; detail?: string }>;
  outcome: AutomationOutcomeKind;
  supportingEvidence: Record<string, unknown>;
  performanceMetrics: Record<string, unknown>;
  failureSummary?: string;
  recoverySummary?: string;
  lessonsLearned: string[];
  operationalInsights: string[];
  confidence: number;
  timestamp: string;
  correlationId: string;
  triggerId: string;
  queueId: string;
  lifecycleState: KnowledgeLifecycleState;
  reportHookIds: string[];
  executiveAiRefs: string[];
  pillowGovernance: true;
  eklsObjectType: "outcome";
  version: number;
};

export type ResolvedOutcomePolicy = {
  reportRegistryIds: string[];
  reportHooks: string[];
  monitorRegistryIds: string[];
  policyRegistryId?: string;
  retentionPolicyRef?: string;
};

export type AutomationLearningSearchResult = {
  workspaceId: string;
  totalCount: number;
  records: AutomationLearningRecord[];
  generatedAt: string;
};
