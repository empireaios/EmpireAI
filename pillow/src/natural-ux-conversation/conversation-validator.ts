/** T4-01 — Conversation output validation. */

import type { NaturalUxConversationConfiguration } from "./configuration.js";
import type {
  ConversationDecision,
  ConversationRunValidationReport,
  ConversationTurn,
} from "./types.js";
import { ConversationMetadataGenerator } from "./conversation-metadata-generator.js";
import { appendConversationLog } from "./conversation-logging.js";
import { CONVERSATION_METADATA_VERSION } from "./paths.js";

export class ConversationValidator {
  private readonly metadata = new ConversationMetadataGenerator();

  validate(
    turn: ConversationTurn | null,
    config: NaturalUxConversationConfiguration,
  ): ConversationRunValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.outputValidationEnabled || !config.validationRulesEnabled) {
      return this.buildReport("pass", turn, errors, warnings, started);
    }

    if (!turn) {
      errors.push("No conversation turn produced");
      return this.buildReport("fail", turn, errors, warnings, started);
    }

    if (!turn.userRequest || turn.userRequest.trim().length === 0) {
      errors.push("Empty user request");
    }
    if (!turn.recognizedIntent) {
      errors.push("Missing recognized intent");
    }
    if (turn.confidenceScore < 0 || turn.confidenceScore > 1) {
      errors.push("Confidence score out of range");
    }
    if (
      turn.clarificationStatus === "not_required" &&
      turn.confidenceScore < config.confidenceThreshold
    ) {
      warnings.push("Low confidence without clarification");
    }
    for (const request of turn.generatedBuilderRequests) {
      if (request.forwardedToCertifiedBuilder) {
        errors.push("Builder request must not execute changes directly");
      }
    }

    let decision: ConversationDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0 || turn.clarificationStatus === "pending") decision = "partial";

    appendConversationLog({
      event: "conversation_validation",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision.toUpperCase()}`,
    });

    return this.buildReport(decision, turn, errors, warnings, started);
  }

  private buildReport(
    decision: ConversationDecision,
    turn: ConversationTurn | null,
    errors: string[],
    warnings: string[],
    started: number,
  ): ConversationRunValidationReport {
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      turnsProcessed: turn ? 1 : 0,
      clarificationsRequested: turn?.clarificationQuestions.length ?? 0,
      builderRequestsGenerated: turn?.generatedBuilderRequests.length ?? 0,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CONVERSATION_METADATA_VERSION,
    };
  }
}
