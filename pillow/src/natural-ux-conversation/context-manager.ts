/** T4-01 — Maintains conversational context across turns. */

import type { ConversationContext, ConversationTurn, IntentCategory } from "./types.js";
import type { InterpretedUxIntent } from "./ux-intent-interpreter.js";
import type { NaturalUxConversationConfiguration } from "./configuration.js";
import { appendConversationLog } from "./conversation-logging.js";

export class ContextManager {
  update(input: {
    prior: ConversationContext;
    interpreted: InterpretedUxIntent;
    config: NaturalUxConversationConfiguration;
  }): ConversationContext {
    if (!input.config.contextRetentionEnabled) {
      return {
        priorTurnCount: input.prior.priorTurnCount + 1,
        activeTopics: [input.interpreted.category],
        lastIntentCategory: input.interpreted.category,
        referencedScreenIds: input.interpreted.referencedScreens,
        referencedLayoutIds: input.interpreted.referencedLayouts,
        referencedComponentIds: input.interpreted.referencedComponents,
        referencedWorkflowIds: input.interpreted.referencedWorkflows,
        notes: ["Context retention disabled"],
      };
    }

    appendConversationLog({
      event: "context_update",
      level: "info",
      details: "Updating conversation context",
    });

    const mergeUnique = (a: string[], b: string[]) => [...new Set([...a, ...b])].slice(-20);
    const topics = mergeUnique(input.prior.activeTopics, [input.interpreted.category]);

    return {
      priorTurnCount: input.prior.priorTurnCount + 1,
      activeTopics: topics,
      lastIntentCategory: input.interpreted.category,
      referencedScreenIds: mergeUnique(
        input.prior.referencedScreenIds,
        input.interpreted.referencedScreens,
      ),
      referencedLayoutIds: mergeUnique(
        input.prior.referencedLayoutIds,
        input.interpreted.referencedLayouts,
      ),
      referencedComponentIds: mergeUnique(
        input.prior.referencedComponentIds,
        input.interpreted.referencedComponents,
      ),
      referencedWorkflowIds: mergeUnique(
        input.prior.referencedWorkflowIds,
        input.interpreted.referencedWorkflows,
      ),
      notes: [
        ...input.prior.notes.slice(-5),
        `Turn ${input.prior.priorTurnCount + 1}: ${input.interpreted.summary}`,
      ].slice(-10),
    };
  }

  detectContextSwitch(
    priorCategory: IntentCategory | null,
    nextCategory: IntentCategory,
  ): boolean {
    if (!priorCategory) return false;
    return priorCategory !== nextCategory;
  }
}
