/** T4-02 — Voice UX Command Manager — core voice intake pipeline. */

import type { ConversationRunReport } from "../natural-ux-conversation/types.js";
import type { NaturalUxConversationEngine } from "../natural-ux-conversation/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import type { VoiceUxCommandsConfiguration } from "./configuration.js";
import type {
  ProcessingStatus,
  VoiceCommandInput,
  VoiceCommandRunReport,
  VoiceCommandSession,
  VoiceUxCommandRecord,
} from "./types.js";
import { VoiceInputSessionManager } from "./voice-input-session-manager.js";
import { SpeechToTextAdapter } from "./speech-to-text-adapter.js";
import { VoiceCommandNormalizer } from "./voice-command-normalizer.js";
import { VoiceUxIntentParser } from "./voice-ux-intent-parser.js";
import { VoiceContextMapper } from "./voice-context-mapper.js";
import { VoiceConfidenceEvaluator } from "./voice-confidence-evaluator.js";
import { VoiceClarificationEngine } from "./voice-clarification-engine.js";
import { NaturalUxConversationConnector } from "./natural-ux-conversation-connector.js";
import { VoiceCommandMetadataGenerator } from "./voice-command-metadata-generator.js";
import { VoiceCommandValidator } from "./voice-command-validator.js";
import { appendVoiceCommandLog } from "./voice-command-logging.js";
import { VOICE_METADATA_VERSION } from "./paths.js";

export type VoiceUxCommandEngineBundle = {
  naturalUxConversation: NaturalUxConversationEngine | null;
  uiStateMapper: UiStateMapperEngine | null;
  recommendationEngine: RecommendationEngine | null;
  autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null;
};

export class VoiceUxCommandManager {
  private readonly sessions = new VoiceInputSessionManager();
  private readonly stt = new SpeechToTextAdapter();
  private readonly normalizer = new VoiceCommandNormalizer();
  private readonly intentParser = new VoiceUxIntentParser();
  private readonly contextMapper = new VoiceContextMapper();
  private readonly confidenceEvaluator = new VoiceConfidenceEvaluator();
  private readonly clarification = new VoiceClarificationEngine();
  private readonly conversationConnector = new NaturalUxConversationConnector();
  private readonly metadata = new VoiceCommandMetadataGenerator();
  private readonly validator = new VoiceCommandValidator();

  processCommand(input: {
    command: VoiceCommandInput;
    config: VoiceUxCommandsConfiguration;
    engines: VoiceUxCommandEngineBundle;
  }): VoiceCommandRunReport {
    const started = Date.now();
    appendVoiceCommandLog({
      event: "voice_ux_command_session_start",
      level: "info",
      details: "Processing voice UX command",
    });

    let session = this.sessions.startSession(input.command.sessionId);
    session = this.sessions.trimHistory(session, input.config.maxHistoryCommands);
    this.sessions.updateStatus(session.sessionId, "received");

    // 1. Speech-to-text (opaque audio refs only)
    const transcription = this.stt.transcribe(input.command, input.config);
    this.sessions.updateStatus(session.sessionId, "transcribed");

    // 2. Normalize
    const normalized = this.normalizer.normalize(transcription.transcribedText);

    // 3. Parse voice UX intent
    const parsed = this.intentParser.parse(normalized, input.config);
    this.sessions.updateStatus(session.sessionId, "interpreted");

    // 4. Map to T1 / T2 / T3 context
    const context = this.contextMapper.map({
      normalizedText: normalized,
      parsed,
      config: input.config,
      uiStateMapper: input.engines.uiStateMapper,
      recommendationEngine: input.engines.recommendationEngine,
      autonomousBuilderCertification: input.engines.autonomousBuilderCertification,
    });

    // 5. Confidence evaluation
    const confidence = this.confidenceEvaluator.evaluate({
      transcriptionConfidence: transcription.transcriptionConfidence,
      parsed,
      config: input.config,
    });

    // 6. Clarification when needed
    const clarification = this.clarification.evaluate({
      normalizedText: normalized,
      parsed,
      confidence,
      context,
      config: input.config,
    });

    // 7. Connect to T4-01 Natural UX Conversation (interpretation only)
    let conversationLink: {
      linked: boolean;
      conversationRunId: string | null;
      intentId: string | null;
      report: ConversationRunReport | null;
      error: string | null;
    } = {
      linked: false,
      conversationRunId: null,
      intentId: null,
      report: null,
      error: null,
    };
    if (!clarification.required) {
      conversationLink = this.conversationConnector.connect({
        transcribedText: normalized,
        sessionId: session.sessionId,
        naturalUxConversation: input.engines.naturalUxConversation,
      });
    }

    let processingStatus: ProcessingStatus = clarification.required
      ? "awaiting_clarification"
      : conversationLink.linked
        ? "linked"
        : "interpreted";
    if (conversationLink.linked) processingStatus = "completed";
    if (clarification.required) processingStatus = "awaiting_clarification";

    const record: VoiceUxCommandRecord = this.metadata.enrichRecord({
      voiceCommandId: this.metadata.buildCommandId(),
      timestamp: new Date().toISOString(),
      sessionId: session.sessionId,
      sourceAudioReference: transcription.sourceAudioReference,
      transcribedText: normalized,
      transcriptionConfidence: transcription.transcriptionConfidence,
      intentId: conversationLink.intentId,
      currentScreenId: context.currentScreenId,
      currentRouteOrViewId: context.currentRouteOrViewId,
      referencedComponentIds: context.referencedComponentIds,
      referencedLayoutRegionIds: context.referencedLayoutRegionIds,
      referencedNavigationNodes: context.referencedNavigationNodes,
      voiceCommandType: parsed.voiceCommandType,
      userRequestSummary: parsed.userRequestSummary,
      uxConcernSummary: parsed.uxConcernSummary,
      designPreferenceSummary: parsed.designPreferenceSummary,
      clarificationRequirement: clarification.requirement,
      clarificationQuestions: clarification.questions,
      linkedConversationRunId: conversationLink.conversationRunId,
      linkedUxFindingIds: context.linkedUxFindingIds,
      linkedBuilderCapabilities: context.linkedBuilderCapabilities,
      processingStatus,
      confidenceScore: confidence.confidenceScore,
      metadataVersion: VOICE_METADATA_VERSION,
    });

    session = this.sessions.appendCommand(session.sessionId, record);
    const validation = this.validator.validate(record, input.config, {
      conversationLinked: conversationLink.linked,
      appliedChanges: false,
      approvedChanges: false,
    });

    appendVoiceCommandLog({
      event: "voice_ux_command_session_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Command ${validation.decision.toUpperCase()} · type=${record.voiceCommandType} · confidence=${Math.round(record.confidenceScore * 100)}%`,
    });

    return {
      voiceCommandRunReportId: this.metadata.buildRunReportId(),
      runTimestamp: new Date().toISOString(),
      session,
      latestCommand: record,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: VOICE_METADATA_VERSION,
    };
  }

  getActiveSession(): VoiceCommandSession | null {
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
