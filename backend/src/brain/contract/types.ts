import type { HealthStatus } from "../../guardian/types.js";
import type { TaskPriority } from "../types.js";
import type { IntelligenceCapability } from "./capabilities.js";
import type { IntelligenceModuleId } from "./module-ids.js";

/**
 * Contract-layer task dispatched to an intelligence module.
 *
 * Distinct from {@link BrainTaskPayload} in `brain/types.ts`, which represents
 * orchestrator queue/worker tasks (`agent.run`, `workflow.run`, etc.).
 * IntelligenceBrainTask is the standardized input shape for AI employee modules.
 */
export type IntelligenceBrainTask = {
  id: string;
  moduleId: IntelligenceModuleId;
  action: IntelligenceCapability | string;
  workspaceId: string;
  companyId?: string;
  input: Record<string, unknown>;
  correlationId: string;
  requestedAt: string;
  priority?: TaskPriority;
};

/** Structured decision emitted by an intelligence module after execution. */
export type BrainDecision = {
  id: string;
  taskId: string;
  moduleId: IntelligenceModuleId;
  action: string;
  outcome: "approved" | "rejected" | "deferred" | "requires_review";
  rationale: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  decidedAt: string;
};

/** Observable signal or finding produced during module execution. */
export type BrainObservation = {
  id: string;
  taskId: string;
  moduleId: IntelligenceModuleId;
  category: string;
  summary: string;
  signals: Record<string, unknown>;
  observedAt: string;
};

/** Actionable recommendation surfaced by an intelligence module. */
export type BrainRecommendation = {
  id: string;
  taskId: string;
  moduleId: IntelligenceModuleId;
  title: string;
  recommendation: string;
  priority: TaskPriority;
  confidence: number;
  rationale: string[];
  metadata?: Record<string, unknown>;
  recommendedAt: string;
};

/** Unified result envelope returned by `IntelligenceModuleContract.execute()`. */
export type BrainExecutionResult = {
  taskId: string;
  moduleId: IntelligenceModuleId;
  status: "completed" | "failed" | "partial";
  decisions: BrainDecision[];
  observations: BrainObservation[];
  recommendations: BrainRecommendation[];
  output?: Record<string, unknown>;
  error?: string;
  confidence: number;
  executedAt: string;
  durationMs?: number;
};

export type ModuleInputSpec = {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  required: boolean;
  description: string;
};

export type ModuleOutputSpec = {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
};

export type ModuleValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type ModuleHealthReport = {
  moduleId: IntelligenceModuleId;
  status: HealthStatus;
  message: string;
  checkedAt: string;
  metadata?: Record<string, unknown>;
};
