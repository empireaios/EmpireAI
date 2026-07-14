/** T4-04 — Extended category proposal generators (dashboard, form, table, states). */

import type { ProposalCategory } from "./types.js";
import type { InterpretedProposalRequirements } from "./proposal-requirement-interpreter.js";
import { type ProposalDraft, variantLabel } from "./proposal-generator-shared.js";

const EXTENDED_TEMPLATES: Record<
  Exclude<
    ProposalCategory,
    | "layout_redesign"
    | "component_redesign"
    | "navigation_redesign"
    | "workflow_redesign"
    | "theme_redesign"
    | "accessibility_improvement"
    | "visual_consistency_improvement"
  >,
  { title: string; change: string; benefit: string }
> = {
  dashboard_improvement: {
    title: "dashboard information hierarchy",
    change: "Reorganize dashboard widgets by executive priority and scan path",
    benefit: "Faster situational awareness for the Grand King",
  },
  form_improvement: {
    title: "form usability refinement",
    change: "Improve field grouping, inline validation, and submit affordances",
    benefit: "Fewer input errors and faster form completion",
  },
  table_improvement: {
    title: "table readability enhancement",
    change: "Improve column alignment, density controls, and row actions",
    benefit: "Easier scanning and comparison of tabular data",
  },
  card_improvement: {
    title: "card layout polish",
    change: "Standardize card headers, metadata placement, and action zones",
    benefit: "Clearer content cards with predictable interaction areas",
  },
  modal_improvement: {
    title: "modal interaction refinement",
    change: "Clarify modal titles, primary actions, and dismiss patterns",
    benefit: "Reduced modal fatigue and clearer decision points",
  },
  drawer_improvement: {
    title: "drawer navigation improvement",
    change: "Optimize drawer width, scroll behavior, and section anchors",
    benefit: "Better secondary navigation without losing main context",
  },
  loading_state_improvement: {
    title: "loading state clarity",
    change: "Replace generic spinners with skeleton layouts and progress hints",
    benefit: "Reduced perceived wait time and layout shift",
  },
  empty_state_improvement: {
    title: "empty state guidance",
    change: "Add actionable empty states with next-step guidance",
    benefit: "Users know what to do when no data is present",
  },
  error_state_improvement: {
    title: "error state recovery",
    change: "Improve error messaging with recovery actions and support context",
    benefit: "Faster recovery from failures without support escalation",
  },
};

export class ExtendedProposalGenerator {
  generate(
    category: keyof typeof EXTENDED_TEMPLATES,
    requirements: InterpretedProposalRequirements,
    variantIndex: number,
  ): ProposalDraft {
    const label = variantLabel(variantIndex);
    const template = EXTENDED_TEMPLATES[category];
    return {
      category,
      title: `${label} ${template.title}`,
      summary: `${label} option: ${template.change}`,
      proposedUxChange: template.change,
      expectedUxBenefit: template.benefit,
      scope: variantIndex === 2 ? "medium" : "small",
      riskNotes: null,
      confidence: 0.69 + variantIndex * 0.05,
      variantIndex,
    };
  }
}
