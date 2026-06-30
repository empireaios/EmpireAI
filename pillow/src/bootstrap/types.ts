/** PILLOW-002 — Bootstrap artifact categories and load results. */

export type ArtifactCategory =
  | "constitution"
  | "repository_governance"
  | "backlog_release"
  | "journey"
  | "project_state"
  | "decision_register"
  | "soul"
  | "implementation_contract"
  | "component_contract"
  | "doctrine"
  | "executive_audit"
  | "ux_enhancement"
  | "architecture"
  | "real_owner";

export type ArtifactRequirement = "mandatory" | "optional";

export interface ArtifactDescriptor {
  id: string;
  category: ArtifactCategory;
  requirement: ArtifactRequirement;
  /** Path relative to repository root */
  relativePath: string;
  /** When satisfied by another artifact (e.g. GC contract inside UX contract) */
  satisfiedBy?: string;
  description: string;
}

export interface LoadedArtifact {
  descriptor: ArtifactDescriptor;
  present: boolean;
  absolutePath: string;
  sizeBytes: number;
  modifiedAt: string | null;
  /** First ~2KB for metadata extraction; not full file for large docs */
  excerpt: string | null;
}

export interface BootstrapFailure {
  code:
    | "MANDATORY_ARTIFACT_MISSING"
    | "REPOSITORY_ROOT_INVALID"
    | "EXECUTIVE_SELF_ASSESSMENT_FAILED";
  message: string;
  missingMandatory: string[];
  recommendations: string[];
  selfAssessment?: ExecutiveSelfAssessment;
}

export interface RepositoryHealth {
  mandatoryPresent: number;
  mandatoryTotal: number;
  optionalPresent: number;
  optionalTotal: number;
  healthy: boolean;
}

export interface KnownBacklog {
  activeRelease: string | null;
  closedReleases: string[];
}

export interface KnownActiveWork {
  pillowProgram: string;
  currentMission: string | null;
  nextMissions: string[];
}

export interface RealOwnerSummary {
  missionId: string;
  hint: string;
  source: "journey" | "runtime_module";
}

export interface ExecutiveAuditSummary {
  id: string;
  relativePath: string;
  modifiedAt: string | null;
}

export interface EnhancementSummary {
  source: "ux_enhancement_register" | "journey_fallback";
  items: Array<{ id: string; label: string }>;
}

export interface ExecutiveSelfAssessmentCriterion {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface ExecutiveSelfAssessment {
  assessedAt: string;
  coherent: boolean;
  criteria: ExecutiveSelfAssessmentCriterion[];
  failures: string[];
}

/** Who Pillow is — reconstructed from Soul and constitution. */
export interface ExecutiveIdentity {
  narrative: string;
  pillowRole: string;
  empirePurpose: string;
  refreshedAt: string;
}

/** Where the Empire is going — refreshed from authoritative repository state. */
export interface ExecutiveDirection {
  supremeDirective: string;
  currentObjective: string;
  currentStrategicPriority: string;
  currentBlockers: string[];
  explicitlyDeferredWork: string[];
  currentEmpirePhase: string;
  pendingGrandKingDecisions: string[];
  refreshedAt: string;
  sourceArtifacts: string[];
}

/** Active conversation — ephemeral session state (not permanent memory). */
export interface ExecutiveContext {
  sessionId: string | null;
  turnCount: number;
  lastUserMessage: string | null;
  conversationSummary: string | null;
  updatedAt: string;
}

/** Internal reasoning cycle composition per executive turn. */
export interface ExecutiveReasoningComposition {
  composedAt: string;
  pipeline: Array<
    "executive_briefing" | "current_conversation" | "executive_reasoning" | "response"
  >;
  briefingAnchor: string;
  identity: ExecutiveIdentity;
  direction: ExecutiveDirection;
  executiveContext: ExecutiveContext;
  currentConversation: string;
  executiveReasoningNotes: string[];
}

/** Continuous strategic anchor — Identity + Direction + knowledge summary. */
export interface ExecutiveBriefing {
  generatedAt: string;
  refreshedAt: string;
  identity: ExecutiveIdentity;
  direction: ExecutiveDirection;
  executiveKnowledgeSummary: string;
  operationalReadiness: string;
  narrative: string;
  /** Legacy flat fields — mirror direction for backward compatibility */
  supremeDirective: string;
  currentObjective: string;
  currentPriority: string;
  pendingGrandKingDecisions: string[];
  deferredImprovementsAwareness: string;
}

export interface ReconstructionState {
  phase:
    | "discovering"
    | "validating"
    | "resolving_dependencies"
    | "reconstructing"
    | "executive_self_assessment"
    | "verifying_completeness"
    | "executive_ready";
  sourcesDiscovered: number;
  sourcesLoaded: number;
  completenessVerified: boolean;
  executiveReady: boolean;
  selfAssessmentPassed: boolean;
  executiveBriefingGenerated: boolean;
  categoryRulesApplied: number;
  mandatoryCategoriesRequired: number;
  mandatoryCategoriesPresent: number;
  optionalCategoriesRequired: number;
}

/** Runtime Empire context — foundation for all Pillow reasoning (PILLOW-002). */
export interface EmpireBootstrapContext {
  bootstrapVersion: "PILLOW-002";
  status: "ready";
  /** Repository reconstruction reached Executive Ready — reasoning may begin. */
  executiveReady: true;
  reconstruction: ReconstructionState;
  completedAt: string;
  durationMs: number;
  repositoryRoot: string;
  repositoryVersion: string | null;
  journeyPosition: string | null;
  currentMission: string | null;
  repositoryHealth: RepositoryHealth;
  knownOwners: LoadedArtifact[];
  knownContracts: LoadedArtifact[];
  knownDoctrines: LoadedArtifact[];
  knownDecisions: {
    registerPath: string;
    adrCount: number;
  };
  knownExecutiveAudits: ExecutiveAuditSummary[];
  knownEnhancements: EnhancementSummary;
  knownArchitecture: {
    pillowContractPath: string;
    pillowDoctrinePaths: string[];
  };
  knownBacklog: KnownBacklog;
  knownActiveWork: KnownActiveWork;
  realOwners: RealOwnerSummary[];
  artifacts: LoadedArtifact[];
  executiveSelfAssessment: ExecutiveSelfAssessment;
  executiveBriefing: ExecutiveBriefing;
}

export interface BootstrapFailureResult {
  bootstrapVersion: "PILLOW-002";
  status: "failure";
  completedAt: string;
  durationMs: number;
  repositoryRoot: string;
  failure: BootstrapFailure;
  artifacts: LoadedArtifact[];
  reconstruction?: ReconstructionState;
}

export type BootstrapResult = EmpireBootstrapContext | BootstrapFailureResult;

export function isBootstrapReady(
  result: BootstrapResult,
): result is EmpireBootstrapContext {
  return result.status === "ready";
}
