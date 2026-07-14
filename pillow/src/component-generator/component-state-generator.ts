/** T3-02 — Component state generation. */

import type { ComponentCategory, ComponentState } from "./types.js";
import type { ComponentGeneratorConfiguration } from "./configuration.js";
import { appendGenerationLog } from "./generation-logging.js";

export class ComponentStateGenerator {
  generate(
    componentName: string,
    category: ComponentCategory,
    config: ComponentGeneratorConfiguration,
  ): ComponentState[] {
    if (!config.stateRulesEnabled) return [];

    appendGenerationLog({
      event: "state_generation",
      level: "info",
      details: `Generating states for ${componentName}`,
    });

    const states: ComponentState[] = [
      { stateId: "idle", stateName: "idle", description: "Default ready state" },
    ];

    if (["button", "form", "input", "search_control"].includes(category)) {
      states.push(
        { stateId: "loading", stateName: "loading", description: "Async operation in progress" },
        { stateId: "disabled", stateName: "disabled", description: "Interaction blocked" },
      );
    }
    if (["loading_state", "empty_state", "error_state"].includes(category)) {
      states.push({
        stateId: "active",
        stateName: "active",
        description: "Displayed to user",
      });
    }
    if (category === "modal" || category === "drawer") {
      states.push(
        { stateId: "open", stateName: "open", description: "Overlay visible" },
        { stateId: "closed", stateName: "closed", description: "Overlay hidden" },
      );
    }

    return states;
  }
}
