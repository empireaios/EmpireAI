/** PILLOW-004 — Context Builder types. */

export type ContextTask =
  | "general"
  | "continue_ux"
  | "generate_cursor_mission"
  | "review_executive_audit"
  | "empire_progress"
  | "journey_question"
  | "architecture"
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
}

export interface ContextBuilderOptions {
  /** Enable runtime cache (default true) */
  cacheEnabled?: boolean;
}
