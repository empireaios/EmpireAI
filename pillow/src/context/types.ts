/** PILLOW-004 — Context Builder types. */

export type ContextTask =
  | "general"
  | "continue_ux"
  | "generate_cursor_mission"
  | "review_executive_audit"
  | "empire_progress"
  | "journey_question"
  | "architecture"
  | "repository_intelligence"
  | "technical_chief"
  | "ux_design"
  | "cursor_bridge"
  | "infrastructure"
  | "commerce_intelligence"
  | "empire_commander"
  | "empire_operating_system"
  | "continuous_evolution"
  | "recovery";

export interface ContextSourceDescriptor {
  id: string;
  path: string;
  description: string;
  maxBytes: number;
}

export interface ContextBuildRequest {
  /** Natural language — used for intent detection when task omitted */
  userMessage?: string;
  /** Explicit task overrides intent detection */
  task?: ContextTask;
}

export interface ContextArtifactSlice {
  id: string;
  path: string;
  content: string;
  byteLength: number;
  truncated: boolean;
}

export interface ContextManifest {
  contextVersion: "PILLOW-004";
  task: ContextTask;
  artifactIds: string[];
  paths: string[];
  sliceCount: number;
  totalBytes: number;
  estimatedTokens: number;
  cached: boolean;
  repositoryFingerprint: string;
  builtAt: string;
  durationMs: number;
}

export interface IntelligenceSnapshot {
  healthScore: number;
  currentMission: string | null;
  journeyPosition: string | null;
  healthIssueCount: number;
}

export interface OperationalContext {
  manifest: ContextManifest;
  slices: ContextArtifactSlice[];
  intelligenceSnapshot: IntelligenceSnapshot;
  /** Present when userMessage supplied — executive reasoning pipeline anchor */
  executiveReasoning?: import("../bootstrap/types.js").ExecutiveReasoningComposition;
  /** Phase 2 deterministic repository Q&A anchor for LLM assembly */
  repositoryKnowledgeAnswer?: string;
  /** Phase 3 Technical Chief engineering analysis anchor */
  technicalChiefBrief?: string;
  /** Phase 4 AI UX Designer brief with A/B/C proposals and Cursor-ready spec */
  uxDesignBrief?: string;
  /** Phase 5 Autonomous Cursor Bridge engineering mission and validation anchor */
  cursorBridgeBrief?: string;
  /** Phase 6 Infrastructure Commander operational visibility anchor */
  infrastructureBrief?: string;
  /** Phase 7 Commerce Intelligence Executive brief with product/supplier/market analysis */
  commerceIntelligenceBrief?: string;
  /** Phase 8 Empire Commander unified cross-domain executive brief */
  empireCommanderBrief?: string;
  /** Phase 9 Empire Operating System business creation and operation brief */
  empireOperatingSystemBrief?: string;
  /** Phase 10 Continuous Empire Evolution improvement and certification brief */
  continuousEvolutionBrief?: string;
  /** Active workspace screen awareness from Executive Companion / CSO */
  screenAwarenessBrief?: string;
}

export interface ContextBuilderOptions {
  /** Enable runtime cache (default true) */
  cacheEnabled?: boolean;
}
