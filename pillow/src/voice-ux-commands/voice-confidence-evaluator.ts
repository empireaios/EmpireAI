/** T4-02 — Evaluates combined transcription + parse confidence. */

import type { VoiceUxCommandsConfiguration } from "./configuration.js";
import type { ParsedVoiceIntent } from "./voice-ux-intent-parser.js";

export type ConfidenceEvaluation = {
  transcriptionConfidence: number;
  parseConfidence: number;
  confidenceScore: number;
  transcriptionBelowThreshold: boolean;
  parseBelowThreshold: boolean;
};

export class VoiceConfidenceEvaluator {
  evaluate(input: {
    transcriptionConfidence: number;
    parsed: ParsedVoiceIntent;
    config: VoiceUxCommandsConfiguration;
  }): ConfidenceEvaluation {
    const transcriptionConfidence = Math.max(
      0,
      Math.min(1, input.transcriptionConfidence),
    );
    const parseConfidence = Math.max(0, Math.min(1, input.parsed.parseConfidence));
    // Weighted blend — transcription quality gates interpretation reliability
    const confidenceScore = Math.round(
      (transcriptionConfidence * 0.45 + parseConfidence * 0.55) * 1000,
    ) / 1000;

    return {
      transcriptionConfidence,
      parseConfidence,
      confidenceScore,
      transcriptionBelowThreshold:
        transcriptionConfidence < input.config.transcriptionConfidenceThreshold,
      parseBelowThreshold:
        parseConfidence < input.config.clarificationConfidenceThreshold,
    };
  }
}
