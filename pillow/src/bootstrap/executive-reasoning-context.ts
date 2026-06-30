import { RepositoryReader } from "./repository-reader.js";
import type { ExecutiveAssessmentInput } from "./executive-self-assessment.js";
import { gatherExecutiveAssessmentInput } from "./executive-self-assessment.js";
import {
  buildExecutiveBriefingDocument,
  buildExecutiveDirection,
  buildExecutiveIdentity,
  shouldRefreshExecutiveDirection,
} from "./executive-direction.js";
import type {
  EmpireBootstrapContext,
  ExecutiveBriefing,
  ExecutiveContext,
  ExecutiveReasoningComposition,
  ExecutiveSelfAssessment,
  LoadedArtifact,
} from "./types.js";
import type { WatcherEventBatch } from "../watcher/types.js";

/**
 * Persistent executive direction + reasoning composition (Bootstrap extension).
 * Executive Briefing is a continuous strategic anchor — not startup-only.
 *
 * Downstream Layer 2: Executive Reflection (PEI-026) observes completed reasoning
 * cycles after response and feeds Candidate Organizational Knowledge → GK Approval.
 * See EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md §2.1 · §2.2.
 */
export class ExecutiveDirectionContext {
  private briefing: ExecutiveBriefing;
  private executiveContext: ExecutiveContext;
  private readonly reader: RepositoryReader;
  private artifacts: LoadedArtifact[];
  private readonly assessment: ExecutiveSelfAssessment;

  private constructor(
    briefing: ExecutiveBriefing,
    assessment: ExecutiveSelfAssessment,
    artifacts: LoadedArtifact[],
    repositoryRoot: string,
  ) {
    this.briefing = briefing;
    this.assessment = assessment;
    this.artifacts = artifacts;
    this.reader = new RepositoryReader(repositoryRoot);
    this.executiveContext = createEmptyExecutiveContext();
  }

  static fromBootstrap(bootstrap: EmpireBootstrapContext): ExecutiveDirectionContext {
    return new ExecutiveDirectionContext(
      bootstrap.executiveBriefing,
      bootstrap.executiveSelfAssessment,
      bootstrap.artifacts,
      bootstrap.repositoryRoot,
    );
  }

  getBriefing(): ExecutiveBriefing {
    return this.briefing;
  }

  getExecutiveContext(): ExecutiveContext {
    return this.executiveContext;
  }

  /** Refresh Executive Direction from authoritative repository state. */
  async refreshDirection(trigger: string): Promise<ExecutiveBriefing> {
    const input = await gatherExecutiveAssessmentInput(this.reader, this.artifacts);
    this.briefing = rebuildBriefingFromInput(input, this.assessment, trigger);
    return this.briefing;
  }

  /** Update ephemeral Executive Context (active conversation). */
  updateConversationContext(userMessage: string): ExecutiveContext {
    this.executiveContext = {
      sessionId: this.executiveContext.sessionId,
      turnCount: this.executiveContext.turnCount + 1,
      lastUserMessage: userMessage,
      conversationSummary: summarizeConversationTurn(userMessage),
      updatedAt: new Date().toISOString(),
    };
    return this.executiveContext;
  }

  /**
   * Internal reasoning pipeline:
   * Executive Briefing → Current Conversation → Executive Reasoning → Response
   */
  composeReasoningCycle(userMessage: string): ExecutiveReasoningComposition {
    const conversation = this.updateConversationContext(userMessage);

    return {
      composedAt: new Date().toISOString(),
      pipeline: [
        "executive_briefing",
        "current_conversation",
        "executive_reasoning",
        "response",
      ],
      briefingAnchor: this.briefing.narrative,
      identity: this.briefing.identity,
      direction: this.briefing.direction,
      executiveContext: conversation,
      currentConversation: userMessage,
      executiveReasoningNotes: [
        "Apply Supreme Directive and current objective before responding.",
        "Treat Executive Briefing as authoritative strategic anchor.",
        "Executive Context is ephemeral — do not treat as permanent memory.",
        "Lasting decisions require repository artifacts per EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md.",
      ],
    };
  }

  handleWatcherBatch(batch: WatcherEventBatch): Promise<void> {
    const refreshNeeded = batch.events.some((event) =>
      shouldRefreshExecutiveDirection(event),
    );
    if (!refreshNeeded) return Promise.resolve();
    return this.refreshDirection(`watcher:${batch.batchId}`).then(() => undefined);
  }

  setSessionId(sessionId: string): void {
    this.executiveContext = { ...this.executiveContext, sessionId };
  }

  syncArtifacts(artifacts: LoadedArtifact[]): void {
    this.artifacts = artifacts;
  }
}

function rebuildBriefingFromInput(
  input: ExecutiveAssessmentInput,
  assessment: ExecutiveSelfAssessment,
  trigger: string,
): ExecutiveBriefing {
  const identity = buildExecutiveIdentity(input);
  const direction = buildExecutiveDirection(input);
  return buildExecutiveBriefingDocument(identity, direction, input, assessment, trigger);
}

function createEmptyExecutiveContext(): ExecutiveContext {
  return {
    sessionId: null,
    turnCount: 0,
    lastUserMessage: null,
    conversationSummary: null,
    updatedAt: new Date().toISOString(),
  };
}

function summarizeConversationTurn(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length <= 240) return trimmed;
  return `${trimmed.slice(0, 237)}...`;
}

export function formatExecutiveReasoningForLlm(
  composition: ExecutiveReasoningComposition,
): string {
  return [
    "=== EXECUTIVE REASONING PIPELINE (internal) ===",
    "",
    "[1] EXECUTIVE BRIEFING — continuous strategic anchor",
    composition.briefingAnchor,
    "",
    "[2] EXECUTIVE CONTEXT — active conversation (ephemeral)",
    `Turn: ${composition.executiveContext.turnCount}`,
    composition.executiveContext.conversationSummary
      ? `Latest: ${composition.executiveContext.conversationSummary}`
      : "No prior turn in session",
    "",
    "[3] CURRENT CONVERSATION",
    composition.currentConversation,
    "",
    "[4] EXECUTIVE REASONING",
    ...composition.executiveReasoningNotes.map((note) => `- ${note}`),
    "",
    "Produce the user-facing response at stage [4] → response.",
  ].join("\n");
}
