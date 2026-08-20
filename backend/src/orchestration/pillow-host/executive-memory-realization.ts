/**
 * Domain-native realization of generalized lessons.
 * Memory influences reasoning; lesson text must not dump into final answers.
 */

import {
  detectScenarioDomain,
  stripSourceDomainSurfaceLanguage,
  isSourceDomainLanguageLeak,
} from "./executive-event-state.js";

export type LessonSurfaceTelemetry = {
  LESSON_RETRIEVED: boolean;
  LESSON_APPLIED: boolean;
  LESSON_TEXT_SURFACED: boolean;
};

export { detectScenarioDomain, isSourceDomainLanguageLeak };

const DOCTRINE_DUMP = /\*\*Event-state reading:\*\*[^\n]*/gi;
const LIVE_SURFACE =
  /\bI don't have verified sales-history evidence beyond realised orders[^.]*\./gi;

/**
 * Strip doctrine dumps and live sales-history surfaces from synthetic answers.
 * Instantiates principles without surfacing retrieved lesson prose.
 */
export function realizeDomainNativeMemorySurface(
  answer: string,
  userMessage: string,
  scopedSynthetic: boolean,
): { message: string; telemetry: LessonSurfaceTelemetry } {
  let out = String(answer || "");
  const telemetry: LessonSurfaceTelemetry = {
    LESSON_RETRIEVED: false,
    LESSON_APPLIED: false,
    LESSON_TEXT_SURFACED: false,
  };

  if (DOCTRINE_DUMP.test(out) || LIVE_SURFACE.test(out) || isSourceDomainLanguageLeak(out)) {
    telemetry.LESSON_RETRIEVED = true;
    telemetry.LESSON_TEXT_SURFACED = true;
  }
  DOCTRINE_DUMP.lastIndex = 0;
  LIVE_SURFACE.lastIndex = 0;

  out = stripSourceDomainSurfaceLanguage(out, userMessage);
  out = out.replace(DOCTRINE_DUMP, "").replace(LIVE_SURFACE, "").trim();

  if (scopedSynthetic && /\bsales-history|Event-state reading|realised orders remain/i.test(out)) {
    out = stripSourceDomainSurfaceLanguage(out, userMessage);
  }

  const stillLeaking = isSourceDomainLanguageLeak(out) || /\*\*Event-state reading:\*\*/i.test(out);
  telemetry.LESSON_TEXT_SURFACED = stillLeaking;
  telemetry.LESSON_APPLIED = telemetry.LESSON_RETRIEVED && !stillLeaking;

  return {
    message: out.replace(/\n{3,}/g, "\n\n").trim(),
    telemetry,
  };
}

export function isLessonDoctrineDump(text: string): boolean {
  return (
    /\*\*Event-state reading:\*\*/i.test(text) ||
    /\bA later refund, return, chargeback, compensation, SLA breach/i.test(text)
  );
}
