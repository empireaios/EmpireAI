/** T4-01 — Intent recognition from natural-language UX requests. */

import type { NaturalUxConversationConfiguration } from "./configuration.js";
import type { IntentCategory } from "./types.js";
import { appendConversationLog } from "./conversation-logging.js";

export type RecognizedIntent = {
  intent: string;
  category: IntentCategory;
  confidence: number;
  matchedKeywords: string[];
};

const INTENT_RULES: Array<{
  category: IntentCategory;
  keywords: string[];
  intentTemplate: string;
}> = [
  {
    category: "layout_modification",
    keywords: ["layout", "spacing", "align", "grid", "sidebar", "header", "footer", "rearrange"],
    intentTemplate: "Modify layout structure or spacing",
  },
  {
    category: "component_modification",
    keywords: ["component", "button", "input", "modal", "drawer", "badge", "toast", "widget"],
    intentTemplate: "Modify or improve a UI component",
  },
  {
    category: "navigation_improvement",
    keywords: ["navigation", "nav", "menu", "breadcrumb", "route", "tab bar", "sidebar nav"],
    intentTemplate: "Improve navigation experience",
  },
  {
    category: "workflow_improvement",
    keywords: ["workflow", "flow", "steps", "onboarding", "funnel", "process"],
    intentTemplate: "Improve user workflow",
  },
  {
    category: "dashboard_improvement",
    keywords: ["dashboard", "overview", "metrics", "kpi", "panel"],
    intentTemplate: "Improve dashboard presentation",
  },
  {
    category: "form_improvement",
    keywords: ["form", "field", "validation", "submit", "input group"],
    intentTemplate: "Improve form UX",
  },
  {
    category: "table_improvement",
    keywords: ["table", "grid view", "rows", "columns", "sorting", "filter table"],
    intentTemplate: "Improve table presentation",
  },
  {
    category: "card_improvement",
    keywords: ["card", "tile", "card layout"],
    intentTemplate: "Improve card presentation",
  },
  {
    category: "theme_request",
    keywords: ["theme", "color", "typography", "dark mode", "styling", "palette", "brand"],
    intentTemplate: "Request theme or styling change",
  },
  {
    category: "builder_request",
    keywords: ["build", "generate", "implement", "create frontend", "apply change"],
    intentTemplate: "Request certified builder implementation",
  },
  {
    category: "review_request",
    keywords: ["review", "audit", "check ux", "inspect"],
    intentTemplate: "Request UX review",
  },
  {
    category: "analysis_request",
    keywords: ["analyze", "analysis", "evaluate", "score", "assess"],
    intentTemplate: "Request UX analysis",
  },
  {
    category: "explanation_request",
    keywords: ["explain", "why", "how does", "what does", "clarify"],
    intentTemplate: "Request UX explanation",
  },
  {
    category: "design_question",
    keywords: ["design system", "pattern", "guideline", "best practice"],
    intentTemplate: "Ask a design question",
  },
  {
    category: "ux_question",
    keywords: ["ux", "usability", "accessibility", "experience"],
    intentTemplate: "Ask a UX question",
  },
  {
    category: "general_ux_discussion",
    keywords: ["improve", "better", "update", "change", "frontend", "ui"],
    intentTemplate: "General UX discussion",
  },
];

export class IntentRecognitionEngine {
  recognize(
    userRequest: string,
    config: NaturalUxConversationConfiguration,
  ): RecognizedIntent {
    appendConversationLog({
      event: "intent_recognition",
      level: "info",
      details: "Recognizing conversational UX intent",
    });

    if (!config.intentRecognitionRulesEnabled) {
      return {
        intent: "Intent recognition disabled",
        category: "general_ux_discussion",
        confidence: 0.3,
        matchedKeywords: [],
      };
    }

    const normalized = userRequest.toLowerCase();
    let best: RecognizedIntent = {
      intent: "General UX discussion",
      category: "general_ux_discussion",
      confidence: 0.35,
      matchedKeywords: [],
    };

    for (const rule of INTENT_RULES) {
      if (!config.supportedIntentCategories.includes(rule.category)) continue;
      const matched = rule.keywords.filter((k) => normalized.includes(k));
      if (matched.length === 0) continue;
      const confidence = Math.min(0.95, 0.45 + matched.length * 0.15);
      if (confidence > best.confidence) {
        best = {
          intent: rule.intentTemplate,
          category: rule.category,
          confidence,
          matchedKeywords: matched,
        };
      }
    }

    return best;
  }
}
