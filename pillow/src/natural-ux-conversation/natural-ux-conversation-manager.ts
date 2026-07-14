/** T4-01 — Natural UX Conversation Manager — core conversation pipeline. */

import type { NaturalUxConversationConfiguration } from "./configuration.js";
import type {
  ConversationRunReport,
  ConversationSession,
  ConversationTurn,
} from "./types.js";
import { ConversationSessionManager } from "./conversation-session-manager.js";
import { IntentRecognitionEngine } from "./intent-recognition-engine.js";
import { UxIntentInterpreter } from "./ux-intent-interpreter.js";
import { ContextManager } from "./context-manager.js";
import { ConversationMemoryManager } from "./conversation-memory-manager.js";
import { ClarificationEngine } from "./clarification-engine.js";
import { ActionPlanningEngine } from "./action-planning-engine.js";
import { BuilderRequestGenerator } from "./builder-request-generator.js";
import { ConversationMetadataGenerator } from "./conversation-metadata-generator.js";
import { ConversationValidator } from "./conversation-validator.js";
import { appendConversationLog } from "./conversation-logging.js";
import { CONVERSATION_METADATA_VERSION } from "./paths.js";

export class NaturalUxConversationManager {
  private readonly sessions = new ConversationSessionManager();
  private readonly intentRecognition = new IntentRecognitionEngine();
  private readonly intentInterpreter = new UxIntentInterpreter();
  private readonly contextManager = new ContextManager();
  private readonly memory = new ConversationMemoryManager();
  private readonly clarification = new ClarificationEngine();
  private readonly actionPlanning = new ActionPlanningEngine();
  private readonly builderRequests = new BuilderRequestGenerator();
  private readonly metadata = new ConversationMetadataGenerator();
  private readonly validator = new ConversationValidator();

  converse(input: {
    userRequest: string;
    sessionId?: string;
    config: NaturalUxConversationConfiguration;
  }): ConversationRunReport {
    const started = Date.now();
    appendConversationLog({
      event: "conversation_start",
      level: "info",
      details: "Processing natural UX conversation turn",
    });

    let session = this.sessions.startSession(input.sessionId);
    session = this.memory.trimHistory(session, input.config);

    const recognized = this.intentRecognition.recognize(input.userRequest, input.config);
    const interpreted = this.intentInterpreter.interpret(input.userRequest, recognized);
    const context = this.contextManager.update({
      prior: session.context,
      interpreted,
      config: input.config,
    });

    if (
      this.contextManager.detectContextSwitch(
        session.context.lastIntentCategory,
        interpreted.category,
      )
    ) {
      context.notes.push("Context switch detected");
    }

    const clarification = this.clarification.evaluate({
      recognized,
      interpreted,
      userRequest: input.userRequest,
      config: input.config,
    });

    const actions = this.actionPlanning.plan(interpreted);
    const builderRequests = this.builderRequests.generate({
      interpreted,
      actions,
      clarificationStatus: clarification.status,
      config: input.config,
    });

    const conversationStatus =
      clarification.status === "pending"
        ? "awaiting_clarification"
        : builderRequests.some((r) => !r.requiresClarification)
          ? "planned"
          : "active";

    const turn: ConversationTurn = this.metadata.enrichTurn({
      conversationId: this.metadata.buildConversationId(),
      sessionId: session.sessionId,
      timestamp: new Date().toISOString(),
      userRequest: input.userRequest.slice(0, 2000),
      recognizedIntent: recognized.intent,
      intentCategory: recognized.category,
      conversationContext: context,
      referencedScreens: interpreted.referencedScreens,
      referencedLayouts: interpreted.referencedLayouts,
      referencedComponents: interpreted.referencedComponents,
      referencedWorkflows: interpreted.referencedWorkflows,
      generatedUxActions: actions,
      generatedBuilderRequests: builderRequests,
      clarificationStatus: clarification.status,
      clarificationQuestions: clarification.questions,
      conversationStatus,
      confidenceScore: recognized.confidence,
      metadataVersion: CONVERSATION_METADATA_VERSION,
    });

    session = this.sessions.appendTurn(session.sessionId, turn);
    const validation = this.validator.validate(turn, input.config);

    appendConversationLog({
      event: "conversation_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Turn ${validation.decision.toUpperCase()} · confidence=${Math.round(turn.confidenceScore * 100)}%`,
    });

    return {
      conversationRunReportId: this.metadata.buildRunReportId(),
      runTimestamp: new Date().toISOString(),
      session,
      latestTurn: turn,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: CONVERSATION_METADATA_VERSION,
    };
  }

  getActiveSession(): ConversationSession | null {
    return this.sessions.getActiveSession();
  }

  getActiveSessionCount(): number {
    return this.sessions.getActiveSessionCount();
  }

  endSession(sessionId: string): void {
    this.sessions.endSession(sessionId);
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
  }
}
