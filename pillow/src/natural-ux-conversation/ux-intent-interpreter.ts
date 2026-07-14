/** T4-01 — Interprets recognized intent into structured UX understanding. */

import type { IntentCategory } from "./types.js";
import type { RecognizedIntent } from "./intent-recognition-engine.js";
import { appendConversationLog } from "./conversation-logging.js";

export type InterpretedUxIntent = {
  category: IntentCategory;
  summary: string;
  referencedScreens: string[];
  referencedLayouts: string[];
  referencedComponents: string[];
  referencedWorkflows: string[];
  requiresBuilder: boolean;
  isQuestion: boolean;
};

const SCREEN_PATTERN = /\b(?:screen|page|view)\s+([a-z0-9_-]+)/gi;
const COMPONENT_PATTERN = /\b(?:component|button|modal|drawer|card|table|form)\s+([a-z0-9_-]+)/gi;
const LAYOUT_PATTERN = /\b(?:layout|region|sidebar|header|footer)\s+([a-z0-9_-]+)/gi;
const WORKFLOW_PATTERN = /\b(?:workflow|flow|journey)\s+([a-z0-9_-]+)/gi;

function extractMatches(text: string, pattern: RegExp): string[] {
  const results: string[] = [];
  const re = new RegExp(pattern.source, pattern.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match[1]) results.push(match[1].toLowerCase());
  }
  return [...new Set(results)];
}

export class UxIntentInterpreter {
  interpret(userRequest: string, recognized: RecognizedIntent): InterpretedUxIntent {
    appendConversationLog({
      event: "intent_interpretation",
      level: "info",
      details: `Interpreting intent category ${recognized.category}`,
    });

    const questionCategories: IntentCategory[] = [
      "ux_question",
      "design_question",
      "explanation_request",
      "analysis_request",
      "review_request",
    ];
    const builderCategories: IntentCategory[] = [
      "layout_modification",
      "component_modification",
      "navigation_improvement",
      "workflow_improvement",
      "dashboard_improvement",
      "form_improvement",
      "table_improvement",
      "card_improvement",
      "theme_request",
      "builder_request",
    ];

    return {
      category: recognized.category,
      summary: recognized.intent,
      referencedScreens: extractMatches(userRequest, SCREEN_PATTERN),
      referencedLayouts: extractMatches(userRequest, LAYOUT_PATTERN),
      referencedComponents: extractMatches(userRequest, COMPONENT_PATTERN),
      referencedWorkflows: extractMatches(userRequest, WORKFLOW_PATTERN),
      requiresBuilder: builderCategories.includes(recognized.category),
      isQuestion: questionCategories.includes(recognized.category),
    };
  }
}
