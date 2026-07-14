/** T4-04 — Interprets proposal requirements from T4-01/02/03 and explicit input. */

import type { NaturalUxConversationEngine } from "../natural-ux-conversation/engine.js";
import type { VoiceUxCommandsEngine } from "../voice-ux-commands/engine.js";
import type { ScreenAnnotationEngine } from "../screen-annotation/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { MultiProposalGeneratorConfiguration } from "./configuration.js";
import type { ProposalCategory, ProposalGenerationInput } from "./types.js";
import { appendProposalLog } from "./proposal-logging.js";

export type InterpretedProposalRequirements = {
  sourceConversationIntentId: string | null;
  sourceVoiceCommandId: string | null;
  sourceAnnotationId: string | null;
  sourcePointAndEditIntentId: string | null;
  targetScreenId: string | null;
  targetRouteOrViewId: string | null;
  targetComponentIds: string[];
  targetLayoutRegionIds: string[];
  targetNavigationNodeIds: string[];
  userRequestSummary: string;
  uxConcernSummary: string | null;
  designPreferenceSummary: string | null;
  suggestedCategories: ProposalCategory[];
  interpretConfidence: number;
};

const CATEGORY_KEYWORDS: Array<{ category: ProposalCategory; keywords: string[] }> = [
  { category: "layout_redesign", keywords: ["layout", "spacing", "grid", "align"] },
  { category: "component_redesign", keywords: ["component", "button", "input", "card"] },
  { category: "navigation_redesign", keywords: ["navigation", "menu", "nav", "breadcrumb"] },
  { category: "workflow_redesign", keywords: ["workflow", "steps", "process", "funnel"] },
  { category: "theme_redesign", keywords: ["theme", "color", "dark mode", "typography"] },
  { category: "accessibility_improvement", keywords: ["accessibility", "a11y", "contrast", "aria"] },
  {
    category: "visual_consistency_improvement",
    keywords: ["consistency", "inconsistent", "visual", "mismatch"],
  },
  { category: "dashboard_improvement", keywords: ["dashboard", "cockpit", "overview"] },
  { category: "form_improvement", keywords: ["form", "field", "validation"] },
  { category: "table_improvement", keywords: ["table", "grid", "rows", "columns"] },
  { category: "modal_improvement", keywords: ["modal", "dialog"] },
  { category: "drawer_improvement", keywords: ["drawer", "side panel"] },
  { category: "loading_state_improvement", keywords: ["loading", "spinner", "skeleton"] },
  { category: "empty_state_improvement", keywords: ["empty state", "no data", "empty"] },
  { category: "error_state_improvement", keywords: ["error", "failure", "retry"] },
];

export class ProposalRequirementInterpreter {
  interpret(input: {
    generationInput: ProposalGenerationInput;
    config: MultiProposalGeneratorConfiguration;
    naturalUxConversation: NaturalUxConversationEngine | null;
    voiceUxCommands: VoiceUxCommandsEngine | null;
    screenAnnotation: ScreenAnnotationEngine | null;
    uiStateMapper: UiStateMapperEngine | null;
  }): InterpretedProposalRequirements {
    appendProposalLog({
      event: "requirement_interpretation",
      level: "info",
      details: "Interpreting proposal requirements",
    });

    let sourceConversationIntentId = input.generationInput.sourceConversationIntentId ?? null;
    let sourceVoiceCommandId = input.generationInput.sourceVoiceCommandId ?? null;
    let sourceAnnotationId = input.generationInput.sourceAnnotationId ?? null;
    let sourcePointAndEditIntentId = input.generationInput.sourcePointAndEditIntentId ?? null;
    let targetScreenId = input.generationInput.targetScreenId ?? null;
    let targetRouteOrViewId = input.generationInput.targetRouteOrViewId ?? null;
    const targetComponentIds = new Set<string>();
    const targetLayoutRegionIds = new Set<string>();
    const targetNavigationNodeIds = new Set<string>();
    let userRequestSummary = "General UX redesign request";
    let uxConcernSummary: string | null = null;
    let designPreferenceSummary: string | null = null;
    const textParts: string[] = [];

    if (input.naturalUxConversation) {
      try {
        const report = input.naturalUxConversation.getLatestReport?.() ?? null;
        const turn = report?.latestTurn;
        if (turn) {
          sourceConversationIntentId =
            sourceConversationIntentId ?? turn.conversationId ?? null;
          userRequestSummary = turn.userRequest.slice(0, 200) || userRequestSummary;
          textParts.push(turn.userRequest, turn.recognizedIntent);
          for (const c of turn.referencedComponents) targetComponentIds.add(c);
          for (const l of turn.referencedLayouts) targetLayoutRegionIds.add(l);
          for (const s of turn.referencedScreens) {
            if (!targetScreenId) targetScreenId = s;
          }
        }
      } catch {
        /* ignore */
      }
    }

    if (input.voiceUxCommands) {
      try {
        const report = input.voiceUxCommands.getLatestReport?.() ?? null;
        const cmd = report?.latestCommand;
        if (cmd) {
          sourceVoiceCommandId = sourceVoiceCommandId ?? cmd.voiceCommandId;
          textParts.push(cmd.transcribedText, cmd.userRequestSummary, cmd.uxConcernSummary);
          uxConcernSummary = cmd.uxConcernSummary || uxConcernSummary;
          designPreferenceSummary = cmd.designPreferenceSummary ?? designPreferenceSummary;
          for (const c of cmd.referencedComponentIds) targetComponentIds.add(c);
          for (const r of cmd.referencedLayoutRegionIds) targetLayoutRegionIds.add(r);
          for (const n of cmd.referencedNavigationNodes) targetNavigationNodeIds.add(n);
          if (!targetScreenId) targetScreenId = cmd.currentScreenId;
          if (!targetRouteOrViewId) targetRouteOrViewId = cmd.currentRouteOrViewId;
        }
      } catch {
        /* ignore */
      }
    }

    if (input.screenAnnotation) {
      try {
        const report = input.screenAnnotation.getLatestReport?.() ?? null;
        const ann = report?.latestAnnotation;
        const intent = report?.latestIntent;
        if (ann) {
          sourceAnnotationId = sourceAnnotationId ?? ann.annotationId;
          textParts.push(ann.annotationText ?? "", ann.userInstructionSummary);
          for (const c of ann.referencedComponentIds) targetComponentIds.add(c);
          for (const r of ann.referencedLayoutRegionIds) targetLayoutRegionIds.add(r);
          for (const n of ann.referencedNavigationNodeIds) targetNavigationNodeIds.add(n);
          if (!targetScreenId) targetScreenId = ann.currentScreenId;
          if (!targetRouteOrViewId) targetRouteOrViewId = ann.currentRouteOrViewId;
        }
        if (intent) {
          sourcePointAndEditIntentId =
            sourcePointAndEditIntentId ?? intent.pointAndEditIntentId;
          textParts.push(intent.requestedEditSummary);
          uxConcernSummary = intent.uxConcernSummary ?? uxConcernSummary;
          designPreferenceSummary = intent.designPreferenceSummary ?? designPreferenceSummary;
          for (const c of intent.targetComponentIds) targetComponentIds.add(c);
          for (const r of intent.targetLayoutRegionIds) targetLayoutRegionIds.add(r);
          for (const n of intent.targetNavigationNodeIds) targetNavigationNodeIds.add(n);
        }
      } catch {
        /* ignore */
      }
    }

    if (input.uiStateMapper && !targetScreenId) {
      try {
        const state = input.uiStateMapper.getLatestState?.() ?? null;
        if (state?.screen) targetScreenId = state.screen.screenId;
      } catch {
        /* ignore */
      }
    }

    const combined = textParts.join(" ").toLowerCase();
    const suggested = new Set<ProposalCategory>(
      input.generationInput.preferredCategories ?? [],
    );

    if (input.config.proposalCategoryRulesEnabled) {
      for (const rule of CATEGORY_KEYWORDS) {
        if (!input.config.supportedProposalCategories.includes(rule.category)) continue;
        if (rule.keywords.some((k) => combined.includes(k))) suggested.add(rule.category);
      }
    }

    if (suggested.size === 0) {
      suggested.add("layout_redesign");
      suggested.add("component_redesign");
      suggested.add("theme_redesign");
    }

    const interpretConfidence = Math.min(
      0.95,
      0.4 + (textParts.length > 0 ? 0.2 : 0) + suggested.size * 0.05,
    );

    return {
      sourceConversationIntentId,
      sourceVoiceCommandId,
      sourceAnnotationId,
      sourcePointAndEditIntentId,
      targetScreenId,
      targetRouteOrViewId,
      targetComponentIds: [...targetComponentIds],
      targetLayoutRegionIds: [...targetLayoutRegionIds],
      targetNavigationNodeIds: [...targetNavigationNodeIds],
      userRequestSummary,
      uxConcernSummary,
      designPreferenceSummary,
      suggestedCategories: [...suggested],
      interpretConfidence,
    };
  }
}
