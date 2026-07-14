/** T4-06 — Synthesizes final design rationale from category generators. */

import type { ExplainDecisionsConfiguration } from "./configuration.js";
import type { ExplanationType } from "./types.js";

export class DesignRationaleEngine {
  synthesize(input: {
    explanationType: ExplanationType;
    proposalRationale: string;
    comparisonRationale: string;
    config: ExplainDecisionsConfiguration;
  }): string {
    const parts: string[] = [];

    switch (input.explanationType) {
      case "comparison_rationale":
        parts.push(input.comparisonRationale);
        break;
      case "tradeoff_explanation":
        parts.push("Tradeoff analysis across compared design options");
        parts.push(input.comparisonRationale);
        break;
      case "layout_rationale":
        parts.push("Layout rationale derived from proposal and comparison context");
        parts.push(input.proposalRationale);
        break;
      case "component_rationale":
        parts.push("Component rationale focuses on structure, states, and affordances");
        parts.push(input.proposalRationale);
        break;
      case "navigation_rationale":
        parts.push("Navigation rationale addresses wayfinding and route clarity");
        parts.push(input.proposalRationale);
        break;
      case "workflow_rationale":
        parts.push("Workflow rationale explains task efficiency improvements");
        parts.push(input.proposalRationale);
        break;
      case "theme_rationale":
        parts.push("Theme rationale covers visual language and design tokens");
        parts.push(input.proposalRationale);
        break;
      case "accessibility_rationale":
        parts.push("Accessibility rationale explains inclusive design considerations");
        parts.push(input.proposalRationale);
        break;
      case "visual_consistency_rationale":
        parts.push("Consistency rationale explains alignment with design system patterns");
        parts.push(input.proposalRationale);
        break;
      case "executive_preference_rationale":
        parts.push("Executive preference rationale links options to learned style alignment");
        parts.push(input.proposalRationale);
        break;
      case "ux_score_rationale":
        parts.push("UX score rationale explains measured experience quality signals");
        parts.push(input.comparisonRationale || input.proposalRationale);
        break;
      case "proposal_rationale":
      default:
        parts.push(input.proposalRationale);
        if (input.config.explanationDetailLevel !== "summary" && input.comparisonRationale) {
          parts.push(input.comparisonRationale);
        }
        break;
    }

    return parts.filter(Boolean).join("; ");
  }
}
