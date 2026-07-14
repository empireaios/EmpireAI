/** T4-02 — Clarification when voice confidence is insufficient. */

import type { VoiceUxCommandsConfiguration } from "./configuration.js";
import type { VoiceClarificationQuestion } from "./types.js";
import type { ConfidenceEvaluation } from "./voice-confidence-evaluator.js";
import type { ParsedVoiceIntent } from "./voice-ux-intent-parser.js";
import type { VoiceContextMapping } from "./voice-context-mapper.js";
import { VoiceCommandMetadataGenerator } from "./voice-command-metadata-generator.js";
import { appendVoiceCommandLog } from "./voice-command-logging.js";

export class VoiceClarificationEngine {
  private readonly metadata = new VoiceCommandMetadataGenerator();

  evaluate(input: {
    normalizedText: string;
    parsed: ParsedVoiceIntent;
    confidence: ConfidenceEvaluation;
    context: VoiceContextMapping;
    config: VoiceUxCommandsConfiguration;
  }): {
    required: boolean;
    requirement: string | null;
    questions: VoiceClarificationQuestion[];
  } {
    if (!input.config.clarificationRulesEnabled) {
      return { required: false, requirement: null, questions: [] };
    }

    const questions: VoiceClarificationQuestion[] = [];
    const trimmed = input.normalizedText.trim();

    if (trimmed.length < 8) {
      questions.push({
        questionId: this.metadata.buildQuestionId(),
        question: "Could you describe the UX change you want in more detail?",
        reason: "Partial or too-short voice command",
      });
    }

    if (input.confidence.transcriptionBelowThreshold) {
      questions.push({
        questionId: this.metadata.buildQuestionId(),
        question:
          "I may not have heard that clearly. Could you repeat the UX request?",
        reason: "Transcription confidence below threshold",
      });
    }

    if (input.confidence.parseBelowThreshold) {
      questions.push({
        questionId: this.metadata.buildQuestionId(),
        question:
          "Which area should we focus on — layout, component, navigation, workflow, or theme?",
        reason: "Voice intent confidence below clarification threshold",
      });
    }

    if (
      (input.parsed.voiceCommandType === "layout_change_request" ||
        input.parsed.voiceCommandType === "component_change_request") &&
      input.context.referencedComponentIds.length === 0 &&
      input.context.referencedLayoutRegionIds.length === 0 &&
      !input.context.currentScreenId
    ) {
      questions.push({
        questionId: this.metadata.buildQuestionId(),
        question: "Which screen, layout region, or component should this apply to?",
        reason: "Screen reference without exact component or region",
      });
    }

    if (questions.length === 0) {
      return { required: false, requirement: null, questions: [] };
    }

    appendVoiceCommandLog({
      event: "clarification_detection",
      level: "info",
      details: `Requesting ${questions.length} voice clarification(s)`,
    });

    return {
      required: true,
      requirement: questions.map((q) => q.reason).join("; "),
      questions,
    };
  }
}
