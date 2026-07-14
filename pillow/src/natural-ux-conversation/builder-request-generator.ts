/** T4-01 — Generates structured builder requests (does not execute changes). */

import type { NaturalUxConversationConfiguration } from "./configuration.js";
import type { BuilderRequest, ClarificationStatus } from "./types.js";
import type { InterpretedUxIntent } from "./ux-intent-interpreter.js";
import type { UxAction } from "./types.js";
import { ConversationMetadataGenerator } from "./conversation-metadata-generator.js";
import { appendConversationLog } from "./conversation-logging.js";

const CAPABILITY_MAP: Record<string, string[]> = {
  layout_modification: ["layout_refactoring", "frontend_builder"],
  component_modification: ["component_generator", "frontend_builder"],
  navigation_improvement: ["layout_refactoring", "frontend_builder"],
  workflow_improvement: ["frontend_builder", "layout_refactoring"],
  dashboard_improvement: ["layout_refactoring", "component_generator", "theme_builder"],
  form_improvement: ["component_generator", "frontend_builder"],
  table_improvement: ["component_generator", "frontend_builder"],
  card_improvement: ["component_generator", "theme_builder"],
  theme_request: ["theme_builder"],
  builder_request: [
    "frontend_builder",
    "component_generator",
    "layout_refactoring",
    "theme_builder",
  ],
};

export class BuilderRequestGenerator {
  private readonly metadata = new ConversationMetadataGenerator();

  generate(input: {
    interpreted: InterpretedUxIntent;
    actions: UxAction[];
    clarificationStatus: ClarificationStatus;
    config: NaturalUxConversationConfiguration;
  }): BuilderRequest[] {
    if (!input.config.builderRequestGenerationEnabled) return [];
    if (!input.interpreted.requiresBuilder) return [];
    if (input.clarificationStatus === "pending") {
      appendConversationLog({
        event: "builder_request_generation",
        level: "info",
        details: "Deferred builder request pending clarification",
      });
      return [
        {
          builderRequestId: this.metadata.buildBuilderRequestId(),
          requestType: "deferred_pending_clarification",
          summary: "Builder request deferred until clarification is answered",
          targetCapabilities: CAPABILITY_MAP[input.interpreted.category] ?? ["frontend_builder"],
          requiresClarification: true,
          forwardedToCertifiedBuilder: false,
        },
      ];
    }

    appendConversationLog({
      event: "builder_request_generation",
      level: "info",
      details: "Generating structured builder request (no direct execution)",
    });

    const capabilities =
      CAPABILITY_MAP[input.interpreted.category] ?? ["frontend_builder"];

    return [
      {
        builderRequestId: this.metadata.buildBuilderRequestId(),
        requestType: input.interpreted.category,
        summary: input.interpreted.summary,
        targetCapabilities: capabilities,
        requiresClarification: false,
        // Safety: never execute — only structure a request for certified builder systems
        forwardedToCertifiedBuilder: false,
      },
    ];
  }
}
