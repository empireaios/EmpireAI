/** T4-02 — Normalizes transcribed voice text for intent parsing. */

export class VoiceCommandNormalizer {
  normalize(transcribedText: string): string {
    return transcribedText
      .replace(/\bum+\b/gi, "")
      .replace(/\buh+\b/gi, "")
      .replace(/\byou know\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }
}
