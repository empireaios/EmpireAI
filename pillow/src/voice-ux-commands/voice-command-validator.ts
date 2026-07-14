/** T4-02 — Voice UX command output validation. */

import type { VoiceUxCommandsConfiguration } from "./configuration.js";
import type {
  VoiceCommandRunValidationReport,
  VoiceDecision,
  VoiceUxCommandRecord,
} from "./types.js";
import { VoiceCommandMetadataGenerator } from "./voice-command-metadata-generator.js";
import { appendVoiceCommandLog } from "./voice-command-logging.js";
import { VOICE_METADATA_VERSION } from "./paths.js";

export class VoiceCommandValidator {
  private readonly metadata = new VoiceCommandMetadataGenerator();

  validate(
    command: VoiceUxCommandRecord | null,
    config: VoiceUxCommandsConfiguration,
    extras?: {
      conversationLinked?: boolean;
      appliedChanges?: boolean;
      approvedChanges?: boolean;
    },
  ): VoiceCommandRunValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.outputValidationEnabled || !config.validationRulesEnabled) {
      return this.buildReport("pass", command, errors, warnings, started, extras);
    }

    if (!command) {
      errors.push("No voice command record produced");
      return this.buildReport("fail", command, errors, warnings, started, extras);
    }

    if (!command.transcribedText || command.transcribedText.trim().length === 0) {
      errors.push("Empty transcribed text");
    }
    if (!command.voiceCommandType) {
      errors.push("Missing voice command type");
    }
    if (command.confidenceScore < 0 || command.confidenceScore > 1) {
      errors.push("Confidence score out of range");
    }
    if (
      !command.clarificationRequirement &&
      command.transcriptionConfidence < config.transcriptionConfidenceThreshold
    ) {
      warnings.push("Low transcription confidence without clarification");
    }
    if (extras?.appliedChanges) {
      errors.push("Voice commands must not apply UX changes automatically");
    }
    if (extras?.approvedChanges) {
      errors.push("Voice commands must not approve changes automatically");
    }

    let decision: VoiceDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (
      warnings.length > 0 ||
      command.processingStatus === "awaiting_clarification"
    ) {
      decision = "partial";
    }

    appendVoiceCommandLog({
      event: "validation_results",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision.toUpperCase()}`,
    });

    return this.buildReport(decision, command, errors, warnings, started, extras);
  }

  private buildReport(
    decision: VoiceDecision,
    command: VoiceUxCommandRecord | null,
    errors: string[],
    warnings: string[],
    started: number,
    extras?: { conversationLinked?: boolean },
  ): VoiceCommandRunValidationReport {
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      commandsProcessed: command ? 1 : 0,
      clarificationsRequested: command?.clarificationQuestions.length ?? 0,
      conversationLinksCreated:
        extras?.conversationLinked || command?.linkedConversationRunId ? 1 : 0,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: VOICE_METADATA_VERSION,
    };
  }
}
