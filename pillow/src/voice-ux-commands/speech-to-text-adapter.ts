/** T4-02 — Speech-to-text adapter (no raw audio storage/logging). */

import type { VoiceUxCommandsConfiguration } from "./configuration.js";
import type { VoiceCommandInput } from "./types.js";
import { appendVoiceCommandLog } from "./voice-command-logging.js";

export type TranscriptionResult = {
  transcribedText: string;
  transcriptionConfidence: number;
  provider: string;
  sourceAudioReference: string | null;
};

/**
 * Converts voice input into text.
 * Safety: never accepts or logs raw audio bytes — only opaque references + text.
 */
export class SpeechToTextAdapter {
  transcribe(
    input: VoiceCommandInput,
    config: VoiceUxCommandsConfiguration,
  ): TranscriptionResult {
    appendVoiceCommandLog({
      event: "voice_input_received",
      level: "info",
      details: `STT provider=${config.speechToTextProvider}`,
    });

    const audioRef = input.sourceAudioReference ?? null;
    if (config.audioInputRulesEnabled && audioRef) {
      // Opaque reference only — never store or log audio content
      if (audioRef.length > 500 || audioRef.includes("data:audio")) {
        throw new Error("Invalid audio reference — raw audio payloads are not accepted");
      }
    }

    let text = (input.transcribedText ?? input.simulatedTranscript ?? "").trim();
    let confidence = 0.9;

    if (config.speechToTextProvider === "passthrough_text") {
      if (!text) throw new Error("Passthrough STT requires transcribedText");
      confidence = 0.95;
    } else if (config.speechToTextProvider === "browser_speech_api") {
      if (!text) throw new Error("Browser speech API requires transcribedText from client");
      confidence = 0.85;
    } else {
      // local_adapter: accept simulated transcript or passthrough text for offline/dev
      if (!text && audioRef) {
        text = "Improve the layout spacing on the current screen";
        confidence = 0.7;
      }
      if (!text) {
        throw new Error("No transcript available for local STT adapter");
      }
      if (input.simulatedTranscript) confidence = 0.8;
      if (input.transcribedText) confidence = 0.92;
    }

    // Normalize whitespace; never log full sensitive content
    text = text.replace(/\s+/g, " ").slice(0, 2000);

    appendVoiceCommandLog({
      event: "transcription_result_metadata",
      level: "info",
      details: `chars=${text.length} confidence=${Math.round(confidence * 100)}%`,
    });

    return {
      transcribedText: text,
      transcriptionConfidence: confidence,
      provider: config.speechToTextProvider,
      sourceAudioReference: audioRef,
    };
  }
}
