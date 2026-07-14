/** T2-02 — Interaction standards intelligence. */

import type { DesignSystemComponent, InteractionStandard } from "./types.js";

export class InteractionStandardEngine {
  learn(components: DesignSystemComponent[]): InteractionStandard[] {
    const byFamily = new Map<string, DesignSystemComponent[]>();
    for (const component of components) {
      const list = byFamily.get(component.componentFamily) ?? [];
      list.push(component);
      byFamily.set(component.componentFamily, list);
    }

    return [...byFamily.entries()].map(([family, items]) => {
      const states = [...new Set(items.flatMap((c) => c.supportedStates))];
      const modes = [...new Set(items.flatMap((c) => c.interactionRules))];
      return {
        standardId: `interaction-${family}`,
        name: `${family} interaction standard`,
        componentFamily: family as InteractionStandard["componentFamily"],
        supportedStates: states,
        interactionModes: modes.length > 0 ? modes : ["default"],
      };
    });
  }
}
