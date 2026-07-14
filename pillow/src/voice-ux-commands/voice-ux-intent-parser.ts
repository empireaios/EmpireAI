/** T4-02 — Parses normalized voice text into voice UX command types. */

import type { VoiceUxCommandsConfiguration } from "./configuration.js";
import type { VoiceCommandType } from "./types.js";
import { appendVoiceCommandLog } from "./voice-command-logging.js";

export type ParsedVoiceIntent = {
  voiceCommandType: VoiceCommandType;
  userRequestSummary: string;
  uxConcernSummary: string;
  designPreferenceSummary: string | null;
  parseConfidence: number;
  matchedKeywords: string[];
};

const PARSE_RULES: Array<{
  type: VoiceCommandType;
  keywords: string[];
  summary: string;
  concern: string;
  isPreference?: boolean;
}> = [
  {
    type: "ux_complaint",
    keywords: ["broken", "wrong", "hate", "annoying", "confusing", "frustrating", "bad"],
    summary: "Spoken UX complaint",
    concern: "User reported a UX problem",
  },
  {
    type: "design_preference",
    keywords: ["prefer", "like", "want it to", "make it feel", "style should"],
    summary: "Spoken design preference",
    concern: "User expressed a design preference",
    isPreference: true,
  },
  {
    type: "layout_change_request",
    keywords: ["layout", "spacing", "align", "grid", "sidebar", "rearrange", "move"],
    summary: "Spoken layout change request",
    concern: "Layout modification requested by voice",
  },
  {
    type: "component_change_request",
    keywords: ["button", "component", "modal", "input", "card", "table", "form"],
    summary: "Spoken component change request",
    concern: "Component modification requested by voice",
  },
  {
    type: "navigation_concern",
    keywords: ["navigation", "menu", "nav", "breadcrumb", "route", "lost"],
    summary: "Spoken navigation concern",
    concern: "Navigation UX concern raised by voice",
  },
  {
    type: "workflow_concern",
    keywords: ["workflow", "steps", "process", "onboarding", "funnel", "too many steps"],
    summary: "Spoken workflow concern",
    concern: "Workflow friction raised by voice",
  },
  {
    type: "accessibility_concern",
    keywords: ["accessibility", "a11y", "contrast", "screen reader", "keyboard", "aria"],
    summary: "Spoken accessibility concern",
    concern: "Accessibility issue raised by voice",
  },
  {
    type: "visual_consistency_concern",
    keywords: ["inconsistent", "consistency", "mismatch", "looks different", "visual"],
    summary: "Spoken visual consistency concern",
    concern: "Visual consistency issue raised by voice",
  },
  {
    type: "theme_preference",
    keywords: ["theme", "dark mode", "color", "palette", "typography", "brand"],
    summary: "Spoken theme preference",
    concern: "Theme or styling preference by voice",
    isPreference: true,
  },
  {
    type: "preview_request",
    keywords: ["preview", "show me", "let me see"],
    summary: "Spoken preview request",
    concern: "User requested a preview by voice",
  },
  {
    type: "validation_request",
    keywords: ["validate", "check", "verify", "test the ui"],
    summary: "Spoken validation request",
    concern: "User requested UI validation by voice",
  },
  {
    type: "ux_question",
    keywords: ["why", "how", "what", "explain", "question"],
    summary: "Spoken UX question",
    concern: "User asked a UX question by voice",
  },
  {
    type: "general_ux_discussion",
    keywords: ["improve", "better", "update", "change", "ux", "ui", "frontend"],
    summary: "General spoken UX discussion",
    concern: "General UX discussion via voice",
  },
];

export class VoiceUxIntentParser {
  parse(normalizedText: string, config: VoiceUxCommandsConfiguration): ParsedVoiceIntent {
    appendVoiceCommandLog({
      event: "voice_intent_parsing",
      level: "info",
      details: "Parsing voice UX intent",
    });

    if (!config.voiceCommandParsingRulesEnabled) {
      return {
        voiceCommandType: "general_ux_discussion",
        userRequestSummary: "Voice parsing disabled",
        uxConcernSummary: "Unable to parse — rules disabled",
        designPreferenceSummary: null,
        parseConfidence: 0.3,
        matchedKeywords: [],
      };
    }

    const lower = normalizedText.toLowerCase();
    let best: ParsedVoiceIntent = {
      voiceCommandType: "general_ux_discussion",
      userRequestSummary: normalizedText.slice(0, 200),
      uxConcernSummary: "General UX discussion via voice",
      designPreferenceSummary: null,
      parseConfidence: 0.35,
      matchedKeywords: [],
    };

    for (const rule of PARSE_RULES) {
      if (!config.supportedVoiceCommandTypes.includes(rule.type)) continue;
      const matched = rule.keywords.filter((k) => lower.includes(k));
      if (matched.length === 0) continue;
      const confidence = Math.min(0.95, 0.45 + matched.length * 0.15);
      if (confidence > best.parseConfidence) {
        best = {
          voiceCommandType: rule.type,
          userRequestSummary: rule.summary,
          uxConcernSummary: rule.concern,
          designPreferenceSummary: rule.isPreference ? normalizedText.slice(0, 200) : null,
          parseConfidence: confidence,
          matchedKeywords: matched,
        };
      }
    }

    return best;
  }
}
