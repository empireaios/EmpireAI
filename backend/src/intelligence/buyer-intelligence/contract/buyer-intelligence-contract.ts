/**
 * Buyer Intelligence module contract — aligned with Brain `IntelligenceModuleContract`
 * patterns but self-contained (no Brain registry wiring in Mission 022).
 */

export const BUYER_INTELLIGENCE_MODULE_ID = "buyer-intelligence" as const;
export type BuyerIntelligenceModuleId = typeof BUYER_INTELLIGENCE_MODULE_ID;

export const BUYER_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type BuyerIntelligenceCapability =
  | "buyer-intelligence.persona.list"
  | "buyer-intelligence.persona.get"
  | "buyer-intelligence.persona.upsert"
  | "buyer-intelligence.intent.list"
  | "buyer-intelligence.intent.detect"
  | "buyer-intelligence.need-category.list"
  | "buyer-intelligence.need-category.classify"
  | "buyer-intelligence.trigger.list"
  | "buyer-intelligence.trigger.evaluate"
  | "buyer-intelligence.segment.list"
  | "buyer-intelligence.segment.resolve"
  | "buyer-intelligence.snapshot";

export const BUYER_INTELLIGENCE_CAPABILITIES: readonly BuyerIntelligenceCapability[] = [
  "buyer-intelligence.persona.list",
  "buyer-intelligence.persona.get",
  "buyer-intelligence.persona.upsert",
  "buyer-intelligence.intent.list",
  "buyer-intelligence.intent.detect",
  "buyer-intelligence.need-category.list",
  "buyer-intelligence.need-category.classify",
  "buyer-intelligence.trigger.list",
  "buyer-intelligence.trigger.evaluate",
  "buyer-intelligence.segment.list",
  "buyer-intelligence.segment.resolve",
  "buyer-intelligence.snapshot",
] as const;

export type BuyerIntelligenceInputSpec = {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  required: boolean;
  description: string;
};

export type BuyerIntelligenceOutputSpec = {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
};

export type BuyerIntelligenceTask = {
  id: string;
  moduleId: BuyerIntelligenceModuleId;
  action: BuyerIntelligenceCapability;
  workspaceId: string;
  input: Record<string, unknown>;
  correlationId: string;
  requestedAt: string;
};

export type BuyerIntelligenceValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type BuyerIntelligenceHealthStatus = "healthy" | "degraded" | "unhealthy";

export type BuyerIntelligenceHealthReport = {
  moduleId: BuyerIntelligenceModuleId;
  status: BuyerIntelligenceHealthStatus;
  message: string;
  checkedAt: string;
  metadata?: Record<string, unknown>;
};

export type BuyerIntelligenceObservation = {
  id: string;
  taskId: string;
  category: "persona" | "intent" | "need" | "trigger" | "segment";
  summary: string;
  signals: Record<string, unknown>;
  observedAt: string;
};

export type BuyerIntelligenceRecommendation = {
  id: string;
  taskId: string;
  title: string;
  recommendation: string;
  confidence: number;
  rationale: string[];
  recommendedAt: string;
};

export type BuyerIntelligenceExecutionResult = {
  taskId: string;
  moduleId: BuyerIntelligenceModuleId;
  status: "completed" | "failed" | "partial";
  observations: BuyerIntelligenceObservation[];
  recommendations: BuyerIntelligenceRecommendation[];
  output?: Record<string, unknown>;
  error?: string;
  confidence: number;
  executedAt: string;
  durationMs?: number;
};

export const BUYER_INTELLIGENCE_REQUIRED_INPUTS: readonly BuyerIntelligenceInputSpec[] = [
  {
    name: "workspaceId",
    type: "string",
    required: true,
    description: "Workspace scope for buyer intelligence entities",
  },
] as const;

export const BUYER_INTELLIGENCE_PRODUCED_OUTPUTS: readonly BuyerIntelligenceOutputSpec[] = [
  {
    name: "personas",
    type: "array",
    description: "Buyer persona records with demographics and psychographics",
  },
  {
    name: "intents",
    type: "array",
    description: "Detected buyer intents with stage and urgency",
  },
  {
    name: "needCategories",
    type: "array",
    description: "Classified buyer needs linked to observation domains",
  },
  {
    name: "purchaseTriggers",
    type: "array",
    description: "Active purchase triggers and evaluated conditions",
  },
  {
    name: "audienceSegments",
    type: "array",
    description: "Resolved audience segments with size estimates",
  },
  {
    name: "snapshot",
    type: "object",
    description: "Aggregated buyer intelligence workspace snapshot",
  },
] as const;

/**
 * Contract interface for the Buyer Intelligence module.
 * Future missions implement this interface and optionally register with Brain.
 */
export interface BuyerIntelligenceModuleContract {
  readonly moduleId: BuyerIntelligenceModuleId;
  readonly moduleName: string;
  readonly moduleVersion: string;
  readonly capabilities: readonly BuyerIntelligenceCapability[];
  readonly requiredInputs: readonly BuyerIntelligenceInputSpec[];
  readonly producedOutputs: readonly BuyerIntelligenceOutputSpec[];

  execute(task: BuyerIntelligenceTask): Promise<BuyerIntelligenceExecutionResult>;
  validate(task: BuyerIntelligenceTask): BuyerIntelligenceValidationResult;
  health(): Promise<BuyerIntelligenceHealthReport> | BuyerIntelligenceHealthReport;
  confidenceScore(task: BuyerIntelligenceTask, result?: BuyerIntelligenceExecutionResult): number;
}

/** Static catalog entry for architecture and planning docs. */
export type BuyerIntelligenceCatalogEntry = {
  moduleId: BuyerIntelligenceModuleId;
  moduleName: string;
  moduleVersion: string;
  status: "foundation" | "active" | "planned";
  description: string;
};

export const BUYER_INTELLIGENCE_CATALOG_ENTRY: BuyerIntelligenceCatalogEntry = {
  moduleId: BUYER_INTELLIGENCE_MODULE_ID,
  moduleName: "Buyer Intelligence",
  moduleVersion: BUYER_INTELLIGENCE_MODULE_VERSION,
  status: "foundation",
  description:
    "Derives buyer personas, intent, needs, triggers, and audience segments from Eye observations — independent upstream context for Product Intelligence",
};
