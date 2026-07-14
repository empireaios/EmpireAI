/** T2-05 — Form friction analysis. */

import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import { WorkflowMetadataGenerator } from "./workflow-metadata-generator.js";
import type { WorkflowFrictionPoint } from "./types.js";

export class FormFrictionAnalyzer {
  private readonly metadata = new WorkflowMetadataGenerator();

  analyze(
    events: InteractionEvent[],
    context: WorkflowContextModel | null,
    enabled: boolean,
  ): WorkflowFrictionPoint[] {
    if (!enabled) return [];
    const findings: WorkflowFrictionPoint[] = [];

    const formEvents = events.filter(
      (e) =>
        e.interactionType === "form_change" ||
        e.interactionType === "text_input" ||
        e.interactionType === "selection_change" ||
        e.interactionType === "checkbox_change",
    );

    if (formEvents.length === 0 && (context?.activeFormIds.length ?? 0) > 0) {
      findings.push({
        frictionId: this.metadata.buildFrictionId("missing_feedback"),
        category: "missing_feedback",
        description: "Active form detected without recorded interaction feedback",
        severity: "info",
        affectedScreens: context?.currentScreenId ? [context.currentScreenId] : [],
        affectedComponents: context?.activeFormIds ?? [],
        affectedNavigationNodes: [],
        evidenceRef: context?.contextId ?? "form-context",
        confidence: 0.55,
      });
    }

    const fieldIds = new Set(formEvents.map((e) => e.inputFieldId).filter(Boolean));
    if (fieldIds.size >= 6) {
      const screens = [...new Set(formEvents.map((e) => e.currentScreenId).filter(Boolean))] as string[];
      if (screens.length === 1) {
        findings.push({
          frictionId: this.metadata.buildFrictionId("confusing_field_grouping"),
          category: "confusing_field_grouping",
          description: `${fieldIds.size} form fields on single screen may overwhelm users`,
          severity: "warning",
          affectedScreens: screens,
          affectedComponents: [...fieldIds] as string[],
          affectedNavigationNodes: [],
          evidenceRef: context?.contextId ?? "form-events",
          confidence: 0.65,
        });
      } else {
        findings.push({
          frictionId: this.metadata.buildFrictionId("poor_form_sequence"),
          category: "poor_form_sequence",
          description: `Form input spans ${screens.length} screens — consider consolidating`,
          severity: "info",
          affectedScreens: screens,
          affectedComponents: [...fieldIds] as string[],
          affectedNavigationNodes: [],
          evidenceRef: context?.contextId ?? "form-events",
          confidence: 0.6,
        });
      }
    }

    return findings;
  }
}
