/** T4-01 — Clarification questions when confidence is insufficient. */

import type { NaturalUxConversationConfiguration } from "./configuration.js";
import type { ClarificationQuestion, ClarificationStatus } from "./types.js";
import type { InterpretedUxIntent } from "./ux-intent-interpreter.js";
import type { RecognizedIntent } from "./intent-recognition-engine.js";
import { ConversationMetadataGenerator } from "./conversation-metadata-generator.js";
import { appendConversationLog } from "./conversation-logging.js";

export class ClarificationEngine {
  private readonly metadata = new ConversationMetadataGenerator();

  evaluate(input: {
    recognized: RecognizedIntent;
    interpreted: InterpretedUxIntent;
    userRequest: string;
    config: NaturalUxConversationConfiguration;
  }): {
    status: ClarificationStatus;
    questions: ClarificationQuestion[];
  } {
    if (!input.config.clarificationRulesEnabled) {
      return { status: "skipped", questions: [] };
    }

    const questions: ClarificationQuestion[] = [];
    const trimmed = input.userRequest.trim();

    if (trimmed.length < 8) {
      questions.push({
        questionId: this.metadata.buildQuestionId(),
        question: "Could you describe the UX change you want in more detail?",
        reason: "Request too short to interpret safely",
      });
    }

    if (input.recognized.confidence < input.config.clarificationConfidenceThreshold) {
      questions.push({
        questionId: this.metadata.buildQuestionId(),
        question:
          "Which area should we focus on — layout, component, navigation, workflow, or theme?",
        reason: "Intent confidence below clarification threshold",
      });
    }

    if (
      input.interpreted.requiresBuilder &&
      input.interpreted.referencedScreens.length === 0 &&
      input.interpreted.referencedComponents.length === 0 &&
      input.interpreted.referencedLayouts.length === 0
    ) {
      questions.push({
        questionId: this.metadata.buildQuestionId(),
        question: "Which screen, layout, or component should this change apply to?",
        reason: "Missing UX reference for builder request",
      });
    }

    if (questions.length === 0) {
      return { status: "not_required", questions: [] };
    }

    appendConversationLog({
      event: "clarification_request",
      level: "info",
      details: `Requesting ${questions.length} clarification(s)`,
    });

    return { status: "pending", questions };
  }
}
