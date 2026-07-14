/** T4-02 — Voice command metadata and ID generation. */

import type { VoiceUxCommandRecord } from "./types.js";
import { VOICE_METADATA_VERSION } from "./paths.js";

export class VoiceCommandMetadataGenerator {
  buildCommandId(): string {
    return `vuc-cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildSessionId(): string {
    return `vuc-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRunReportId(): string {
    return `vuc-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `vuc-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildQuestionId(): string {
    return `vuc-q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichRecord(record: VoiceUxCommandRecord): VoiceUxCommandRecord {
    return { ...record, metadataVersion: VOICE_METADATA_VERSION };
  }
}
