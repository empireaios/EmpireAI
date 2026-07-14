/** T4-08 — Learns preferences from T4-01 conversation and T4-02 voice records. */

import type { NaturalUxConversationEngine } from "../natural-ux-conversation/engine.js";
import type { VoiceUxCommandsEngine } from "../voice-ux-commands/engine.js";
import type { PreferenceLearningConfiguration } from "./configuration.js";
import type { CollaborationPreferenceRecord, ExplicitEvidenceReference } from "./types.js";
import { PreferenceMetadataGenerator } from "./preference-metadata-generator.js";
import { appendPreferenceLog } from "./preference-logging.js";
import { PREFERENCE_METADATA_VERSION } from "./paths.js";

export class ConversationLearningEngine {
  private readonly metadata = new PreferenceMetadataGenerator();

  learn(input: {
    config: PreferenceLearningConfiguration;
    naturalUxConversation: NaturalUxConversationEngine | null;
    voiceUxCommands: VoiceUxCommandsEngine | null;
    version: string;
  }): CollaborationPreferenceRecord[] {
    appendPreferenceLog({
      event: "conversation_learning",
      level: "info",
      details: "Learning from conversation and voice records",
    });

    const preferences: CollaborationPreferenceRecord[] = [];
    const conversationIds: string[] = [];
    const evidence: ExplicitEvidenceReference[] = [];

    if (input.naturalUxConversation) {
      try {
        const report = input.naturalUxConversation.getLatestReport?.() ?? null;
        const turn = report?.latestTurn ?? null;
        if (turn) {
          conversationIds.push(turn.conversationId);
          evidence.push({
            evidenceId: this.metadata.buildEvidenceId(),
            evidenceType: "conversation_turn",
            sourceId: turn.conversationId,
            summary: `Conversation intent: ${turn.recognizedIntent}`,
            strength: "explicit",
          });
          preferences.push({
            preferenceId: this.metadata.buildPreferenceId(),
            timestamp: new Date().toISOString(),
            preferenceVersion: input.version,
            preferenceCategory: "conversation_preference",
            preferenceDescription: "Grand King collaboration via natural UX conversation",
            sourceApprovalIds: [],
            sourceProposalIds: [],
            sourceExplanationIds: [],
            sourceConversationIds: [turn.conversationId],
            sourceAnnotationIds: [],
            learnedBehaviorSummary: `Prefers ${turn.intentCategory} conversation intents for ${turn.recognizedIntent}`,
            confidenceScore: turn.confidenceScore,
            explicitEvidenceReferences: evidence,
            currentStatus: "learned",
            metadataVersion: PREFERENCE_METADATA_VERSION,
          });
          preferences.push({
            preferenceId: this.metadata.buildPreferenceId(),
            timestamp: new Date().toISOString(),
            preferenceVersion: input.version,
            preferenceCategory: "ux_discussion_preference",
            preferenceDescription: "UX discussion topics from conversation",
            sourceApprovalIds: [],
            sourceProposalIds: [],
            sourceExplanationIds: [],
            sourceConversationIds: [turn.conversationId],
            sourceAnnotationIds: [],
            learnedBehaviorSummary: `Discusses ${turn.intentCategory} UX topics with ${turn.generatedUxActions.length} action(s)`,
            confidenceScore: Math.max(0.5, turn.confidenceScore - 0.1),
            explicitEvidenceReferences: evidence,
            currentStatus: "learned",
            metadataVersion: PREFERENCE_METADATA_VERSION,
          });
        }
      } catch {
        appendPreferenceLog({
          event: "partial_learning_input",
          level: "warn",
          details: "Conversation data unavailable",
        });
      }
    }

    if (input.voiceUxCommands && input.config.learningScope !== "minimal") {
      try {
        const report = input.voiceUxCommands.getLatestReport?.() ?? null;
        const command = report?.latestCommand ?? null;
        if (command) {
          evidence.push({
            evidenceId: this.metadata.buildEvidenceId(),
            evidenceType: "voice_command",
            sourceId: command.voiceCommandId,
            summary: `Voice command: ${command.voiceCommandType}`,
            strength: "explicit",
          });
          preferences.push({
            preferenceId: this.metadata.buildPreferenceId(),
            timestamp: new Date().toISOString(),
            preferenceVersion: input.version,
            preferenceCategory: "voice_interaction_preference",
            preferenceDescription: "Grand King voice UX command patterns",
            sourceApprovalIds: [],
            sourceProposalIds: [],
            sourceExplanationIds: [],
            sourceConversationIds: conversationIds,
            sourceAnnotationIds: [],
            learnedBehaviorSummary: `Uses voice commands for ${command.voiceCommandType} interactions`,
            confidenceScore: command.confidenceScore,
            explicitEvidenceReferences: evidence,
            currentStatus: "learned",
            metadataVersion: PREFERENCE_METADATA_VERSION,
          });
        }
      } catch {
        appendPreferenceLog({
          event: "partial_learning_input",
          level: "warn",
          details: "Voice command data unavailable",
        });
      }
    }

    return preferences;
  }
}
